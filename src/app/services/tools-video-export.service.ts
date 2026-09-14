import { Injectable } from '@angular/core'

export interface VideoExportOptions {
  signal?: AbortSignal
  onProgress?: (percent: number) => void
}

@Injectable({ providedIn: 'root' })
export class ToolsVideoExportService {
  public supportedMimeType(): string | undefined {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined
    return ['video/mp4;codecs=avc1.420028', 'video/mp4;codecs=avc1', 'video/mp4']
      .find((type) => MediaRecorder.isTypeSupported(type))
  }

  public async createSilentMp4(source: string, overlay: HTMLCanvasElement, options: VideoExportOptions = {}): Promise<Blob> {
    const mimeType = this.supportedMimeType()
    if (!mimeType) throw new Error('Ce navigateur ne permet pas l’export MP4. Utilise une version récente de Chrome ou Safari.')
    if (!overlay.width || !overlay.height) throw new Error('Dimensions du visuel invalides.')
    const video = document.createElement('video')
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    let stream: MediaStream | undefined
    let recorder: MediaRecorder | undefined
    let frame = 0
    const cancelled = (): Error => new Error('Export vidéo annulé.')
    try {
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: Error): void => {
          window.clearTimeout(timeout)
          options.signal?.removeEventListener('abort', abort)
          video.onloadeddata = null
          video.onerror = null
          error ? reject(error) : resolve()
        }
        const abort = (): void => finish(cancelled())
        const timeout = window.setTimeout(() => finish(new Error('Chargement de la vidéo trop long. Réessaie avec un autre MP4.')), 30000)
        options.signal?.addEventListener('abort', abort, { once: true })
        if (options.signal?.aborted) { abort(); return }
        video.onloadeddata = () => finish()
        video.onerror = () => finish(new Error('Impossible de lire ce MP4. Vérifie son encodage vidéo.'))
        video.src = source
        video.load()
      })
      if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
        throw new Error('La vidéo ne contient pas de durée ou d’image valide.')
      }
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const context = canvas.getContext('2d')
      if (!context || typeof canvas.captureStream !== 'function') throw new Error('L’export vidéo n’est pas disponible dans ce navigateur.')
      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
      const width = video.videoWidth * scale
      const height = video.videoHeight * scale
      const draw = (): void => {
        context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
        context.drawImage(overlay, 0, 0, canvas.width, canvas.height)
      }
      draw()
      // Capture only the canvas: no audio track from the imported file is added.
      stream = canvas.captureStream(30)
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
      const activeRecorder = recorder
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      await new Promise<void>((resolve, reject) => {
        let failure: Error | undefined
        let stopping = false
        let stopTimeout: number | undefined
        const cleanup = (): void => {
          window.clearTimeout(timeout)
          window.clearTimeout(stopTimeout)
          cancelAnimationFrame(frame)
          document.removeEventListener('visibilitychange', visibilityChanged)
          options.signal?.removeEventListener('abort', abort)
          video.onended = null
          video.onerror = null
          activeRecorder.onstop = null
          activeRecorder.onerror = null
        }
        const finish = (): void => {
          cleanup()
          failure ? reject(failure) : resolve()
        }
        const stop = (error?: Error): void => {
          failure = failure || error
          if (stopping) return
          stopping = true
          video.pause()
          cancelAnimationFrame(frame)
          if (activeRecorder.state === 'inactive') { finish(); return }
          // A broken encoder must not leave the UI permanently busy.
          stopTimeout = window.setTimeout(() => {
            failure = failure || new Error('La finalisation du MP4 a échoué. Réessaie.')
            finish()
          }, 10000)
          try { activeRecorder.stop() } catch { failure = failure || new Error('L’enregistrement MP4 a échoué.'); finish() }
        }
        const abort = (): void => stop(cancelled())
        const visibilityChanged = (): void => {
          if (document.hidden) stop(new Error('Export interrompu : garde cet onglet visible et relance l’export.'))
        }
        const timeout = window.setTimeout(() => stop(new Error('La lecture de la vidéo a été interrompue. Relance l’export.')), video.duration * 1000 + 30000)
        document.addEventListener('visibilitychange', visibilityChanged)
        options.signal?.addEventListener('abort', abort, { once: true })
        activeRecorder.onstop = () => {
          if (!stopping) failure = new Error('L’enregistrement s’est arrêté avant la fin de la vidéo.')
          finish()
        }
        activeRecorder.onerror = () => stop(new Error('L’enregistrement MP4 a échoué.'))
        video.onerror = () => stop(new Error('La lecture du MP4 a échoué.'))
        video.onended = () => stop()
        let lastProgress = -1
        const render = (): void => {
          if (stopping) return
          try {
            draw()
            const progress = Math.min(99, Math.floor(video.currentTime / video.duration * 100))
            if (progress !== lastProgress) { lastProgress = progress; options.onProgress?.(progress) }
            frame = requestAnimationFrame(render)
          } catch { stop(new Error('Impossible de composer la vidéo.')) }
        }
        try {
          if (options.signal?.aborted) { abort(); return }
          if (document.hidden) { visibilityChanged(); return }
          activeRecorder.start(1000)
          video.play().then(render).catch(() => stop(new Error('Impossible de démarrer la vidéo. Relance l’export.')))
        } catch (error) { stop(error instanceof Error ? error : new Error('Export MP4 impossible.')) }
      })
      const blob = new Blob(chunks, { type: 'video/mp4' })
      if (!blob.size) throw new Error('Le fichier vidéo exporté est vide.')
      options.onProgress?.(100)
      return blob
    } finally {
      cancelAnimationFrame(frame)
      video.pause()
      video.removeAttribute('src')
      video.load()
      try { if (recorder && recorder.state !== 'inactive') recorder.stop() } finally {
        stream?.getTracks().forEach((track) => track.stop())
      }
    }
  }
}
