const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const compiled = ts.transpileModule(fs.readFileSync('src/app/services/tools-video-export.service.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText

function harness(config = {}) {
  const tracks = [{ kind: 'video', stopped: false, stop() { this.stopped = true } }]
  const draws = []
  const timers = new Map()
  let video, canvas, recorder, timerId = 0
  const document = new EventTarget()
  document.hidden = !!config.hidden
  document.createElement = (tag) => {
    if (tag === 'video') {
      video = {
        duration: config.duration === undefined ? 1 : config.duration,
        videoWidth: 1920, videoHeight: 1080, currentTime: 0, paused: true,
        setAttribute() {}, removeAttribute() { this.src = '' },
        load() {
          if (!this.src || config.stallLoad) return
          queueMicrotask(() => config.loadError ? this.onerror?.() : this.onloadeddata?.())
        },
        play() {
          if (config.playError) return Promise.reject(new Error('blocked'))
          this.paused = false
          config.onPlay?.()
          return Promise.resolve()
        },
        pause() { this.paused = true },
      }
      return video
    }
    canvas = { width: 0, height: 0,
      getContext: () => ({ drawImage: (...args) => draws.push(args) }),
      captureStream: () => ({ getTracks: () => tracks }),
    }
    if (config.noCapture) delete canvas.captureStream
    return canvas
  }
  class Recorder {
    static isTypeSupported(type) { return config.unsupported ? false : config.plainOnly ? type === 'video/mp4' : true }
    constructor(stream, options) {
      if (config.constructorError) throw new Error('encoder unavailable')
      recorder = this
      this.stream = stream
      this.options = options
      this.state = 'inactive'
    }
    start() {
      if (config.startError) throw new Error('start failed')
      this.state = 'recording'
    }
    stop() {
      this.state = 'inactive'
      if (config.stopHangs) return
      queueMicrotask(() => {
        if (!config.empty) this.ondataavailable?.({ data: new Blob(['mp4']) })
        this.onstop?.()
      })
    }
  }
  const exports = {}
  const sandbox = {
    exports, require: () => ({ Injectable: () => (target) => target }),
    document, Blob, Error, MediaRecorder: Recorder,
    window: {
      setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id },
      clearTimeout: (id) => timers.delete(id),
    },
    requestAnimationFrame: (callback) => setTimeout(() => {
      if (config.stallPlay || video.paused) return
      video.currentTime += 0.5
      if (video.currentTime >= video.duration) video.onended?.()
      else callback()
    }, 1),
    cancelAnimationFrame: clearTimeout,
  }
  vm.runInNewContext(compiled, sandbox)
  return {
    service: new exports.ToolsVideoExportService(), overlay: { width: 1080, height: 1920 }, tracks, draws,
    document, get video() { return video }, get canvas() { return canvas }, get recorder() { return recorder }, timers,
  }
}

test('MP4 keeps 9:16 dimensions, cover crop, overlay and video-only stream', async () => {
  const h = harness()
  const progress = []
  const blob = await h.service.createSilentMp4('blob:test', h.overlay, { onProgress: p => progress.push(p) })
  assert.equal(blob.type, 'video/mp4')
  assert.ok(blob.size)
  assert.equal(h.canvas.width, 1080)
  assert.equal(h.canvas.height, 1920)
  assert.deepEqual(h.recorder.stream.getTracks().map(t => t.kind), ['video'])
  assert.ok(h.draws[0][1] < 0, 'landscape video is centered and cropped')
  assert.equal(h.draws[1][0], h.overlay)
  assert.equal(progress.at(-1), 100)
  assert.equal(h.video.muted, true)
  assert.equal(h.video.playsInline, true)
  assert.ok(h.tracks.every(t => t.stopped))
  assert.equal(h.timers.size, 0)
})

test('Safari plain MP4 MIME fallback is accepted', async () => {
  const h = harness({ plainOnly: true })
  await h.service.createSilentMp4('blob:test', h.overlay)
  assert.equal(h.recorder.options.mimeType, 'video/mp4')
})

for (const [name, config, pattern] of [
  ['unsupported encoder', { unsupported: true }, /navigateur/],
  ['corrupt video', { loadError: true }, /Impossible de lire/],
  ['invalid duration', { duration: Infinity }, /durée/],
  ['missing canvas capture', { noCapture: true }, /disponible/],
  ['recorder construction failure', { constructorError: true }, /encoder/],
  ['recorder start failure', { startError: true }, /start failed/],
  ['playback denied', { playError: true }, /démarrer/],
  ['hidden tab', { hidden: true }, /visible/],
  ['empty output', { empty: true }, /vide/],
]) {
  test(name + ' rejects cleanly and releases resources', async () => {
    const h = harness(config)
    await assert.rejects(h.service.createSilentMp4('blob:test', h.overlay), pattern)
    if (h.recorder || config.constructorError) assert.ok(h.tracks.every(t => t.stopped))
    assert.equal(h.timers.size, 0)
  })
}

test('cancellation while loading cleans the timeout and media source', async () => {
  const h = harness({ stallLoad: true })
  const controller = new AbortController()
  const task = h.service.createSilentMp4('blob:test', h.overlay, { signal: controller.signal })
  controller.abort()
  await assert.rejects(task, /annulé/)
  assert.equal(h.video.src, '')
  assert.equal(h.timers.size, 0)
})

test('cancellation during playback stops the encoder and tracks', async () => {
  const controller = new AbortController()
  const h = harness({ onPlay: () => controller.abort() })
  await assert.rejects(h.service.createSilentMp4('blob:test', h.overlay, { signal: controller.signal }), /annulé/)
  assert.ok(h.tracks.every(t => t.stopped))
  assert.equal(h.timers.size, 0)
})

test('encoder finalization timeout releases the busy state', async () => {
  const h = harness({ stopHangs: true })
  const task = h.service.createSilentMp4('blob:test', h.overlay)
  await new Promise(resolve => setTimeout(resolve, 20))
  const finalization = [...h.timers.values()].find(t => t.delay === 10000)
  assert.ok(finalization)
  finalization.callback()
  await assert.rejects(task, /finalisation/)
  assert.ok(h.tracks.every(t => t.stopped))
  assert.equal(h.timers.size, 0)
})


test('an encoder that stops early rejects instead of returning a truncated video', async () => {
  const h = harness({ stallPlay: true })
  const task = h.service.createSilentMp4('blob:test', h.overlay)
  await new Promise(resolve => setTimeout(resolve, 5))
  h.recorder.state = 'inactive'
  h.recorder.onstop()
  await assert.rejects(task, /avant la fin/)
  assert.ok(h.tracks.every(t => t.stopped))
})

test('backgrounding during export rejects and cleans up', async () => {
  const h = harness({ stallPlay: true })
  const task = h.service.createSilentMp4('blob:test', h.overlay)
  await new Promise(resolve => setTimeout(resolve, 5))
  h.document.hidden = true
  h.document.dispatchEvent(new Event('visibilitychange'))
  await assert.rejects(task, /visible/)
  assert.ok(h.tracks.every(t => t.stopped))
  assert.equal(h.timers.size, 0)
})
