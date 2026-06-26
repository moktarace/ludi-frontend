import { Component, ElementRef, Input, ViewChild } from '@angular/core'
import { Show } from 'src/app/model'

type VisualFormat = 'post' | 'story' | 'reel'
type VisualMode = 'show' | 'week' | 'month'
type Html2Canvas = typeof import('html2canvas').default

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  private static ACCESS_CODE = 'ludi1997'
  private static ACCESS_STORAGE_KEY = 'ludi-tools-unlocked'
  private static REEL_DURATION_MS = 7000
  private static REEL_FRAME_RATE = 12

  private static DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  private static FULL_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  @Input()
  public shows?: Show[] | null = []

  @Input()
  public highlightedShow?: Show | null = {}

  @ViewChild('visualCanvas')
  public visualCanvas?: ElementRef<HTMLElement>

  public readonly formats: { label: string; value: VisualFormat }[] = [
    { label: 'Post', value: 'post' },
    { label: 'Story', value: 'story' },
    { label: 'Reel', value: 'reel' },
  ]

  public readonly modes: { label: string; value: VisualMode }[] = [
    { label: 'Spectacle', value: 'show' },
    { label: 'Semaine', value: 'week' },
    { label: 'Mois', value: 'month' },
  ]

  public selectedFormat: VisualFormat = 'post'
  public selectedMode: VisualMode = 'show'
  public selectedShowId: string = ''
  public customPoster?: string
  public customBackground?: string
  public isPosterHidden = false
  public accessCode = ''
  public accessError = ''
  public isUnlocked = localStorage.getItem(ToolsComponent.ACCESS_STORAGE_KEY) === 'true'
  public isExporting = false

  public get sortedShows(): Show[] {
    return [...(this.shows || [])].sort((a, b) => (a.date || 0) - (b.date || 0))
  }

  public get selectedShow(): Show | undefined {
    const shows = this.sortedShows
    if (!shows.length) {
      return undefined
    }

    return (
      shows.find((show) => this.showId(show) === this.selectedShowId) ||
      this.highlightedShow ||
      shows[0]
    )
  }

  public get visualShows(): Show[] {
    if (this.selectedMode === 'show') {
      return this.selectedShow ? [this.selectedShow] : []
    }

    const range = this.periodRange
    return this.sortedShows.filter((show) => {
      if (!show.date) {
        return false
      }

      const date = new Date(show.date * 1000)
      return date >= range.start && date < range.end
    })
  }

  public get visualTitle(): string {
    if (this.selectedMode === 'show') {
      return this.selectedShow?.name || 'Spectacle LUDI'
    }

    if (this.selectedMode === 'week') {
      return 'Les dates de la semaine'
    }

    return 'Les dates du mois'
  }

  public get visualSubtitle(): string {
    if (this.selectedMode === 'show') {
      return 'Théâtre d’improvisation à Toulouse'
    }

    const range = this.periodRange
    const start = ToolsComponent.DATE_FORMATTER.format(range.start)
    const end = ToolsComponent.DATE_FORMATTER.format(new Date(range.end.getTime() - 1))
    return `${start} - ${end}`
  }

  public get visualPoster(): string {
    if (this.hasCustomOptions && this.customPoster) {
      return this.customPoster
    }

    const show = this.visualShows[0] || this.selectedShow
    return show?.imgLink || show?.logoLink || 'assets/logo/logo.png'
  }

  public get visualClass(): string {
    const customClass = this.hasCustomOptions && this.customBackground ? ' visual-has-custom-background' : ''
    return `visual-preview visual-preview-${this.selectedFormat} visual-mode-${this.selectedMode}${customClass}`
  }

  public get availableModes(): { label: string; value: VisualMode }[] {
    if (this.isReelFormat) {
      return this.modes.filter((mode) => mode.value === 'show')
    }

    return this.modes
  }

  public get isShowVisual(): boolean {
    return this.selectedMode === 'show'
  }

  public get isPostFormat(): boolean {
    return this.selectedFormat === 'post'
  }

  public get isReelFormat(): boolean {
    return this.selectedFormat === 'reel'
  }

  public get hasCustomOptions(): boolean {
    return this.isPostFormat || ((this.selectedFormat === 'story' || this.isReelFormat) && this.selectedMode === 'show')
  }

  public get showPoster(): boolean {
    return this.selectedMode === 'show' && !(this.hasCustomOptions && this.isPosterHidden)
  }

  public get visualBackgroundImage(): string | null {
    if (!this.hasCustomOptions || !this.customBackground) {
      return null
    }

    return `linear-gradient(145deg, rgb(23 18 31 / 72%) 0%, rgb(33 21 40 / 72%) 48%, rgb(223 47 66 / 58%) 100%), url("${this.customBackground}")`
  }

  public get exportLabel(): string {
    if (this.isExporting) {
      return this.isReelFormat ? 'Export vidéo...' : 'Export en cours...'
    }

    return this.isReelFormat ? 'Télécharger le Reel' : 'Télécharger le PNG'
  }

  private get periodBaseDate(): Date {
    const now = Date.now()
    const future = this.sortedShows.find((show) => show.date && show.date * 1000 >= now)
    const first = future || this.sortedShows[0]
    return first?.date ? new Date(first.date * 1000) : new Date()
  }

  private get periodRange(): { start: Date; end: Date } {
    const base = this.periodBaseDate
    if (this.selectedMode === 'month') {
      const start = new Date(base.getFullYear(), base.getMonth(), 1)
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 1)
      return { start, end }
    }

    const start = new Date(base)
    const day = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  }

  public showId(show: Show): string {
    return String(show.id || show.name || '')
  }

  public formattedDate(show: Show): string {
    if (!show.date) {
      return 'Date à venir'
    }

    return ToolsComponent.FULL_DATE_FORMATTER.format(new Date(show.date * 1000))
  }

  public priceLabel(show: Show): string {
    if (!show.price) {
      return 'Participation libre'
    }

    return show.reducedPrice
      ? `${show.price} euros / ${show.reducedPrice} euros réduit`
      : `${show.price} euros`
  }

  public selectFormat(format: VisualFormat): void {
    this.selectedFormat = format

    if (this.isReelFormat) {
      this.selectedMode = 'show'
    }
  }

  public updatePoster(event: Event): void {
    this.readImage(event, (image) => {
      this.customPoster = image
      this.isPosterHidden = false
    })
  }

  public updateBackground(event: Event): void {
    this.readImage(event, (image) => {
      this.customBackground = image
    })
  }

  public removePoster(): void {
    this.customPoster = undefined
    this.isPosterHidden = true
  }

  public resetPoster(): void {
    this.customPoster = undefined
    this.isPosterHidden = false
  }

  public resetBackground(): void {
    this.customBackground = undefined
  }

  public unlockTools(): void {
    if (this.accessCode.trim() === ToolsComponent.ACCESS_CODE) {
      this.isUnlocked = true
      this.accessError = ''
      localStorage.setItem(ToolsComponent.ACCESS_STORAGE_KEY, 'true')
      return
    }

    this.accessError = 'Code incorrect'
  }

  private readImage(event: Event, callback: (image: string) => void): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result)
      }
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  public async exportVisual(): Promise<void> {
    if (!this.visualCanvas || this.isExporting) {
      return
    }

    this.isExporting = true

    try {
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default

      if (this.isReelFormat) {
        await this.exportReel(html2canvas)
        this.isExporting = false
        return
      }

      const canvas = await html2canvas(this.visualCanvas.nativeElement, {
        allowTaint: false,
        backgroundColor: null,
        scale: this.exportScale,
        useCORS: true,
      })

      canvas.toBlob((blob) => {
        if (!blob) {
          this.isExporting = false
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = this.exportFileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
        this.isExporting = false
      })
    } catch (error) {
      this.isExporting = false
      throw error
    }
  }

  private async exportReel(html2canvas: Html2Canvas): Promise<void> {
    if (!this.visualCanvas) {
      return
    }

    const width = 1080
    const height = 1920
    const recorderCanvas = document.createElement('canvas')
    recorderCanvas.width = width
    recorderCanvas.height = height

    const context = recorderCanvas.getContext('2d')
    if (!context) {
      return
    }

    const stream = recorderCanvas.captureStream(ToolsComponent.REEL_FRAME_RATE)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size) {
        chunks.push(event.data)
      }
    }

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })

    const preview = this.visualCanvas.nativeElement
    preview.classList.add('visual-export-frame')
    await this.wait(80)

    const snapshot = await html2canvas(preview, {
      allowTaint: false,
      backgroundColor: null,
      scale: this.exportScale,
      useCORS: true,
    })
    preview.classList.remove('visual-export-frame')

    recorder.start()

    const frameCount = Math.ceil(ToolsComponent.REEL_DURATION_MS / (1000 / ToolsComponent.REEL_FRAME_RATE))
    const frameDelay = 1000 / ToolsComponent.REEL_FRAME_RATE
    for (let frame = 0; frame < frameCount; frame += 1) {
      const progress = frame / Math.max(frameCount - 1, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const scale = 1 + easedProgress * 0.055
      const fadeOpacity = Math.max(0, 1 - progress / 0.16)
      const drawWidth = width * scale
      const drawHeight = height * scale
      const offsetX = (width - drawWidth) / 2
      const offsetY = (height - drawHeight) / 2 - easedProgress * 14

      context.clearRect(0, 0, width, height)
      context.drawImage(snapshot, offsetX, offsetY, drawWidth, drawHeight)

      if (fadeOpacity > 0) {
        context.fillStyle = `rgba(23, 18, 31, ${fadeOpacity})`
        context.fillRect(0, 0, width, height)
      }

      await this.wait(frameDelay)
    }

    recorder.stop()
    await stopped
    this.downloadBlob(new Blob(chunks, { type: mimeType }), this.exportFileName)
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, duration))
  }

  private get exportFileName(): string {
    const mode = this.selectedMode === 'show' ? 'spectacle' : this.selectedMode
    const extension = this.isReelFormat ? 'webm' : 'png'
    return `ludi-${mode}-${this.selectedFormat}.${extension}`
  }

  private get exportScale(): number {
    return this.selectedFormat === 'post' ? 1080 / 420 : 1920 / 600
  }
}
