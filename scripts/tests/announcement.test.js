const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const compiled = ts.transpileModule(fs.readFileSync('src/app/components/tools/tools.component.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText
const exportsObject = {}
const revoked = []
const documentStub = {}
const angular = new Proxy({}, { get: () => () => () => undefined })
vm.runInNewContext(compiled, {
  exports: exportsObject, Intl, Date, File, Blob, AbortController, document: documentStub, window: { setTimeout, clearTimeout }, URL: { createObjectURL: () => 'blob:imported', revokeObjectURL: url => revoked.push(url) },
  require: name => name === '@angular/core' ? angular : {},
})
function component() {
  return Object.assign(Object.create(exportsObject.ToolsComponent.prototype), {
    visualTagline: '', selectedFormat: 'post', selectedMode: 'show', customBackgroundVideo: 'blob:test',
    customBackgroundVideoPreview: {}, visualVideoReady: true, visualVideoError: '',
    backgroundRevision: 0, visualTones: [{ value: 'red', customBackgroundRgb: '223 47 66' }],
    selectedToneValue: 'red', scheduleDraftSave() {},
  })
}
test('video changes the post proportions without changing its show layout', () => {
  const c = component()
  assert.equal(c.hasVideoBackground, true)
  assert.equal(c.usesPrintShowLayout, true)
  assert.match(c.visualClass, /visual-preview-post/)
  assert.match(c.visualClass, /visual-has-video-background/)
  assert.equal(c.exportLabel, 'Préparer le MP4')
})
test('A2 retains the print layout and PNG export when a video is stored', () => {
  const c = component(); c.selectedFormat = 'poster'
  assert.equal(c.hasVideoBackground, false)
  assert.equal(c.usesPrintShowLayout, true)
  assert.doesNotMatch(c.visualClass, /visual-has-video-background/)
  assert.equal(c.exportLabel, 'Télécharger le PNG')
  assert.equal(c.visualBackgroundImage, null)
  c.selectedFormat = 'post'
  assert.equal(c.hasVideoBackground, true)
})
test('removing the video revokes its preview and generated file and restores PNG', () => {
  const c = component(); c.preparedVisualVideoObjectUrl = 'blob:output'; c.preparedVisualVideo = {}
  c.resetBackground()
  assert.equal(c.customBackgroundVideo, undefined)
  assert.equal(c.customBackgroundVideoPreview, undefined)
  assert.equal(c.preparedVisualVideo, undefined)
  assert.equal(c.visualVideoReady, false)
  assert.equal(c.exportLabel, 'Télécharger le PNG')
  assert.ok(revoked.includes('blob:test'))
  assert.ok(revoked.includes('blob:output'))
})
test('image backgrounds keep the original rendering and PNG label', () => {
  const c = component(); c.customBackgroundVideo = undefined; c.customBackground = 'data:image/png;base64,abc'
  c.customBackgroundTintEnabled = false
  assert.equal(c.exportLabel, 'Télécharger le PNG')
  assert.equal(c.visualBackgroundImage, 'url("data:image/png;base64,abc")')
  assert.doesNotMatch(c.visualClass, /visual-has-video-background/)
})
test('download and share cannot start concurrent exports', async () => {
  const c = component(); c.visualCanvas = {}; c.createVisualFile = () => assert.fail('must not generate twice')
  c.isSharing = true; await c.exportVisual()
  c.isSharing = false; c.isExporting = true; await c.shareVisual()
})
test('prepared video sharing invokes sharing directly from the user action', async () => {
  const c = component(); c.preparedVisualVideo = new File(['test'], 'test.mp4', {type:'video/mp4'})
  let called = false
  c.shareFiles = files => { called = true; assert.equal(files[0], c.preparedVisualVideo); return Promise.resolve() }
  const action = c.sharePreparedVisualVideo()
  assert.equal(called, true, 'no rendering or asynchronous preparation before Web Share')
  await action
  assert.equal(c.isSharing, false)
})
test('late draft restoration does not replace a newly selected background', async () => {
  const c = component(); c.backgroundRevision = 1; c.customBackground = 'new-image'
  c.drafts = { readMedia: async () => ({customBackground:'old-image', customBackgroundVideoFile:new File(['x'],'old.mp4')}) }
  c.setBackgroundVideo = () => assert.fail('old video must not overwrite the current selection')
  await c.restoreDraftMediaState()
  assert.equal(c.customBackground, 'new-image')
  assert.equal(c.mediaDraftRestored, true)
})
test('unreadable preview disables video export with a visible explanation', () => {
  const c = component(); c.onBackgroundVideoError()
  assert.equal(c.visualVideoReady, false)
  assert.match(c.visualVideoError, /Impossible de lire/)
})


test('cancellation while a logo is loading releases the export preparation', async () => {
  const c = component()
  c.canvasExport = { waitForImages: () => new Promise(() => {}) }
  const controller = new AbortController()
  const task = c.waitForVisualVideoImages({}, controller.signal)
  controller.abort()
  await assert.rejects(task, /annulé/)
})


for (const [name, type] of [
  ['IMG_1234.MOV', 'video/quicktime'],
  ['iphone.mov', ''],
  ['iphone.MoV', 'application/octet-stream'],
  ['upload', 'video/quicktime'],
  ['upload', 'video/x-quicktime'],
  ['clip.MP4', 'video/mp4'],
]) {
  test(`imports ${name} (${type || 'no MIME'}) and waits for decoding`, () => {
    const c = component()
    c.formats = [{value:'post'}, {value:'poster'}]
    c.selectedFormat = 'poster'
    c.sanitizer = { bypassSecurityTrustUrl: url => url }
    const file = new File(['fixture'], name, { type })
    const input = { files: [file], value: 'selected' }
    c.updateBackground({ target: input })
    assert.equal(c.customBackgroundVideoFile, file)
    assert.equal(c.selectedFormat, 'post')
    assert.equal(c.customBackgroundVideoPreview, 'blob:imported')
    assert.equal(c.visualVideoReady, false, 'filename/MIME acceptance does not imply decodability')
    assert.equal(c.hasVideoBackground, true)
    assert.equal(input.value, '')
    c.onBackgroundVideoReady({target:{getAttribute:()=>c.customBackgroundVideo,duration:2,videoWidth:1920}})
    assert.equal(c.visualVideoReady, true)
  })
}

test('an undecodable MOV keeps export disabled and explains the codec issue', () => {
  const c = component()
  c.onBackgroundVideoError()
  assert.equal(c.visualVideoReady, false)
  assert.match(c.visualVideoError, /codec/)
})

test('unrelated file types do not replace the current background', () => {
  const c = component()
  let message = ''
  c.showActionMessage = text => { message = text }
  c.updateBackground({target:{files:[new File(['text'], 'file.txt', {type:'text/plain'})],value:'selected'}})
  assert.equal(c.customBackgroundVideo, 'blob:test')
  assert.match(message, /MP4 ou MOV/)
})


function coverComponent() {
  const c = component()
  const draws = []
  const canvas = { width: 0, height: 0, getContext: () => ({drawImage: (...args) => draws.push(args)}) }
  documentStub.createElement = () => canvas
  const video = {readyState:4,videoWidth:1920,videoHeight:1080}
  c.visualCanvas = {nativeElement:{querySelector:()=>video,getBoundingClientRect:()=>({width:420,height:746.6667})}}
  let disposed = false
  c.canvasExport = {
    stageElement: () => ({element:{classList:{add:name=>assert.equal(name,'visual-cover-frame')}},dispose:()=>{disposed=true}}),
    canvasToBlob: async () => new Blob(['png'], {type:'image/png'}),
  }
  c.fileNameBase = () => 'ludi-test'
  c.showActionMessage = () => {}
  c.sanitizer = {bypassSecurityTrustUrl:url=>url}
  return {c, draws, canvas, video, disposed:()=>disposed}
}

test('cover freezes a single video frame before rendering and returns a separate PNG', async () => {
  const {c,draws,canvas,video,disposed} = coverComponent()
  const overlay = {}
  c.renderVisualVideoOverlay = async () => {
    assert.equal(draws.length,1)
    assert.equal(draws[0][0],video)
    return overlay
  }
  await c.prepareVisualCover()
  assert.equal(canvas.width,1080)
  assert.equal(canvas.height,1920)
  assert.ok(draws[0][1]<0, 'landscape frame is cropped to fill portrait')
  assert.equal(draws[1][0],overlay)
  assert.equal(c.preparedVisualCover.type,'image/png')
  assert.equal(c.preparedVisualCover.name,'ludi-test-couverture.png')
  assert.equal(c.preparedVisualVideo,undefined)
  assert.equal(c.isExporting,false)
  assert.ok(disposed())
})

test('cancelled cover preparation releases the staged view and publishes no result', async () => {
  const {c,disposed} = coverComponent()
  c.renderVisualVideoOverlay = async () => { c.cancelVisualVideoExport(); return {} }
  await c.prepareVisualCover()
  assert.equal(c.preparedVisualCover,undefined)
  assert.equal(c.isCoverExporting,false)
  assert.ok(disposed())
})

test('cover waits for a decoded frame and cannot run during an export', async () => {
  const {c,video} = coverComponent()
  c.renderVisualVideoOverlay = () => assert.fail('must not render')
  video.readyState=0
  await c.prepareVisualCover()
  assert.equal(c.preparedVisualCover,undefined)
  video.readyState=4; c.isExporting=true
  await c.prepareVisualCover()
  assert.equal(c.preparedVisualCover,undefined)
})
