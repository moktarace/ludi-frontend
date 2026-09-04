import { Component } from '@angular/core'
import { ToolsCanvasExportService } from 'src/app/services/tools-canvas-export.service'
import { ToolsDraftService } from 'src/app/services/tools-draft.service'

type VoteCardFaceId = 'front' | 'back'

interface VoteCardColor {
  id: string
  label: string
  group: 'Classique' | 'Improvisem'
  color: string
  textColor: string
}

interface VoteCardFace {
  id: VoteCardFaceId
  sideLabel: string
  label: string
  color: VoteCardColor
}

interface VoteCardPhoto {
  src: string
}

interface PersistedVoteCardState {
  frontColorId?: string
  backColorId?: string
  frontLabel?: string
  backLabel?: string
}

interface RenderedVoteCardFace {
  canvas: HTMLCanvasElement
}

@Component({
  selector: 'app-vote-card-tool',
  templateUrl: './vote-card.component.html',
})
export class VoteCardComponent {
  private static STORAGE_KEY = 'ludi-tools-carton-vote'
  private static DESIGN_WIDTH = 2480
  private static DESIGN_HEIGHT = 3508
  private static EXPORT_WIDTH = 2480
  private static EXPORT_HEIGHT = 3508

  public readonly colors: VoteCardColor[] = [
    {
      id: 'yellow',
      label: 'Jaunes',
      group: 'Classique',
      color: '#ffd326',
      textColor: '#17121f',
    },
    {
      id: 'blue',
      label: 'Bleus',
      group: 'Classique',
      color: '#2563d9',
      textColor: '#fff8ed',
    },
    {
      id: 'black',
      label: 'Noirs',
      group: 'Improvisem',
      color: '#18181d',
      textColor: '#fff8ed',
    },
    {
      id: 'red',
      label: 'Rouges',
      group: 'Improvisem',
      color: '#df2f42',
      textColor: '#fff8ed',
    },
    {
      id: 'white',
      label: 'Blancs',
      group: 'Improvisem',
      color: '#fff8ed',
      textColor: '#17121f',
    },
  ]

  public readonly photos: VoteCardPhoto[] = [
    { src: 'assets/photo/cap01.jpeg' },
    { src: 'assets/photo/cap03.jpg' },
    { src: 'assets/photo/cap05.jpeg' },
    { src: 'assets/photo/cap06.jpeg' },
    { src: 'assets/photo/improvisem00.jpeg' },
    { src: 'assets/photo/improvisem02.jpeg' },
    { src: 'assets/photo/improvisem03.jpeg' },
    { src: 'assets/photo/improvisem04.jpeg' },
    { src: 'assets/photo/format01.jpg' },
    { src: 'assets/photo/ludi.jpeg' },
    { src: 'assets/photo/cap04.jpg' },
    { src: 'assets/photo/cap07.jpg' },
  ]

  public frontColorId = 'yellow'
  public backColorId = 'blue'
  public frontLabel = 'Jaunes'
  public backLabel = 'Bleus'
  public previewFaceId: VoteCardFaceId = 'front'
  public isExportingPng = false
  public isExportingPdf = false
  public actionMessage = ''
  public actionMessageType: 'success' | 'error' = 'success'
  private actionMessageTimer?: number

  constructor(
    private readonly canvasExport: ToolsCanvasExportService,
    private readonly drafts: ToolsDraftService,
  ) {
    this.restoreState()
  }

  public get voteCardFaces(): VoteCardFace[] {
    return [
      {
        id: 'front',
        sideLabel: 'Recto',
        label: this.frontLabel.trim() || this.frontColor.label,
        color: this.frontColor,
      },
      {
        id: 'back',
        sideLabel: 'Verso',
        label: this.backLabel.trim() || this.backColor.label,
        color: this.backColor,
      },
    ]
  }

  public get currentPreviewFace(): VoteCardFace {
    return this.voteCardFaces.find((face) => face.id === this.previewFaceId) || this.voteCardFaces[0]
  }

  public get frontColor(): VoteCardColor {
    return this.colorById(this.frontColorId, 'yellow')
  }

  public get backColor(): VoteCardColor {
    return this.colorById(this.backColorId, 'blue')
  }

  public get isBusy(): boolean {
    return this.isExportingPng || this.isExportingPdf
  }

  public selectColor(faceId: VoteCardFaceId, color: VoteCardColor): void {
    if (faceId === 'front') {
      this.frontColorId = color.id
      this.frontLabel = color.label
    } else {
      this.backColorId = color.id
      this.backLabel = color.label
    }
    this.persistState()
  }

  public selectPreview(faceId: VoteCardFaceId): void {
    this.previewFaceId = faceId
  }

  public persistState(): void {
    const state: PersistedVoteCardState = {
      frontColorId: this.frontColorId,
      backColorId: this.backColorId,
      frontLabel: this.frontLabel,
      backLabel: this.backLabel,
    }
    this.drafts.writeJson(VoteCardComponent.STORAGE_KEY, state)
  }

  public async exportPngs(): Promise<void> {
    if (this.isBusy) {
      return
    }

    this.isExportingPng = true
    try {
      const files = await this.createPngFiles()
      for (const file of files) {
        this.canvasExport.downloadBlob(file, file.name)
        await this.wait(140)
      }
      this.showActionMessage('Les deux faces A4 ont été téléchargées en PNG haute définition.')
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Export PNG impossible.'), 'error')
    } finally {
      this.isExportingPng = false
    }
  }

  public async exportPdf(): Promise<void> {
    if (this.isBusy) {
      return
    }

    this.isExportingPdf = true
    try {
      const pdf = await this.createPdfBlob()
      this.canvasExport.downloadBlob(pdf, `${this.fileNameBase}-recto-verso.pdf`)
      this.showActionMessage('PDF A4 recto verso téléchargé : imprime-le à taille réelle, bord long.')
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Export PDF impossible.'), 'error')
    } finally {
      this.isExportingPdf = false
    }
  }

  private async createPngFiles(): Promise<File[]> {
    const { logo, mosaic } = await this.prepareExportAssets()
    const renderedFaces = await this.createFaceCanvases(logo, mosaic)
    const files: File[] = []
    const faces = this.voteCardFaces
    for (let index = 0; index < faces.length; index += 1) {
      const face = faces[index]
      const blob = this.canvasExport.canvasToPngBlob(renderedFaces[index].canvas)
      files.push(new File([blob], `${this.fileNameBase}-${face.id}.png`, { type: 'image/png' }))
      await this.wait(80)
    }
    this.releaseCanvases(renderedFaces)
    return files
  }

  private async createPdfBlob(): Promise<Blob> {
    const { logo, mosaic } = await this.prepareExportAssets()
    const renderedFaces = await this.createFaceCanvases(logo, mosaic)
    const pages = []
    for (const rendered of renderedFaces) {
      pages.push(await this.canvasExport.canvasToJpegPage(rendered.canvas))
      await this.wait(80)
    }
    const pdf = this.canvasExport.jpegPagesToA4Pdf(pages)
    this.releaseCanvases(renderedFaces)
    return pdf
  }

  private async prepareExportAssets(): Promise<{ logo: HTMLImageElement; mosaic: HTMLCanvasElement }> {
    const fontReady = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready
    await (fontReady || Promise.resolve())
    const [logo, mosaic] = await Promise.all([
      this.loadImage('assets/logo/logo.png', 'Impossible de charger le logo LUDI.'),
      this.createPhotoMosaic(),
    ])
    return { logo, mosaic }
  }

  private async createFaceCanvases(
    logo: HTMLImageElement,
    mosaic: HTMLCanvasElement,
  ): Promise<RenderedVoteCardFace[]> {
    const renderedFaces: RenderedVoteCardFace[] = []
    for (const face of this.voteCardFaces) {
      const canvas = document.createElement('canvas')
      this.drawVoteCardFace(canvas, face, logo, mosaic)
      renderedFaces.push({ canvas: this.snapshotCanvas(canvas) })
      canvas.width = 1
      canvas.height = 1
      await this.wait(80)
    }
    mosaic.width = 1
    mosaic.height = 1
    return renderedFaces
  }

  private snapshotCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const source = canvas.getContext('2d', { willReadFrequently: true })
    if (!source) {
      throw new Error('Impossible de finaliser le carton de vote.')
    }
    const pixels = source.getImageData(0, 0, canvas.width, canvas.height)
    const snapshot = document.createElement('canvas')
    snapshot.width = canvas.width
    snapshot.height = canvas.height
    const context = snapshot.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!context) {
      throw new Error('Impossible de finaliser le carton de vote.')
    }
    context.putImageData(pixels, 0, 0)
    return snapshot
  }

  private releaseCanvases(renderedFaces: RenderedVoteCardFace[]): void {
    renderedFaces.forEach(({ canvas }) => {
      canvas.width = 1
      canvas.height = 1
    })
  }

  private drawVoteCardFace(
    canvas: HTMLCanvasElement,
    face: VoteCardFace,
    logo: HTMLImageElement,
    mosaic: HTMLCanvasElement,
  ): void {
    canvas.width = VoteCardComponent.EXPORT_WIDTH
    canvas.height = VoteCardComponent.EXPORT_HEIGHT
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!context) {
      throw new Error('Impossible de préparer le carton de vote.')
    }

    context.scale(
      VoteCardComponent.EXPORT_WIDTH / VoteCardComponent.DESIGN_WIDTH,
      VoteCardComponent.EXPORT_HEIGHT / VoteCardComponent.DESIGN_HEIGHT,
    )
    const width = VoteCardComponent.DESIGN_WIDTH
    const height = VoteCardComponent.DESIGN_HEIGHT
    const ink = '#17121f'
    const paper = '#fff8ed'
    const gold = '#e6b54a'

    context.fillStyle = face.color.color
    context.fillRect(0, 0, width, height)

    context.save()
    context.globalAlpha = 0.18
    context.globalCompositeOperation = 'multiply'
    context.drawImage(mosaic, 0, 0)
    context.restore()

    const shade = context.createLinearGradient(0, 0, width, height)
    shade.addColorStop(0, 'rgba(255, 255, 255, 0.035)')
    shade.addColorStop(0.55, 'rgba(255, 255, 255, 0)')
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.12)')
    context.fillStyle = shade
    context.fillRect(0, 0, width, height)

    context.save()
    context.globalAlpha = 0.07
    context.fillStyle = face.color.textColor
    context.translate(1400, 2920)
    context.rotate(-0.11)
    context.font = '900 980px system-ui, sans-serif'
    context.textAlign = 'center'
    context.fillText('LUDI', 0, 0)
    context.restore()

    context.save()
    context.globalAlpha = 0.14
    context.fillStyle = face.color.textColor
    context.beginPath()
    context.arc(225, 1630, 205, 0, Math.PI * 2)
    context.fill()
    context.restore()

    const logoSize = 470
    const logoX = 90
    const logoY = 80
    context.drawImage(logo, logoX, logoY, logoSize, logoSize)

    context.save()
    context.translate(width / 2, 1580)
    context.rotate(-0.025)
    const eyebrow = 'MON VOTE VA AUX'
    context.font = '1000 118px system-ui, sans-serif'
    const eyebrowWidth = context.measureText(eyebrow).width + 180
    context.fillStyle = face.color.textColor
    context.fillRect(-eyebrowWidth / 2, -112, eyebrowWidth, 166)
    context.fillStyle = face.color.color
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(eyebrow, 0, -24)
    context.restore()

    context.save()
    context.translate(width / 2, 2110)
    context.rotate(-0.035)
    const label = face.label.toLocaleUpperCase('fr-FR')
    const fontSize = this.fitTextSize(context, label, 2100, face.label.length > 10 ? 390 : 520)
    context.font = `900 ${fontSize}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = 'rgba(0, 0, 0, 0.17)'
    context.fillText(label, 34, 38)
    context.fillStyle = face.color.textColor
    context.fillText(label, 0, 0)
    context.restore()

    context.save()
    context.globalAlpha = 0.24
    context.strokeStyle = face.color.textColor
    context.lineWidth = 34
    context.beginPath()
    context.arc(1995, 2180, 245, 0, Math.PI * 2)
    context.stroke()
    context.lineWidth = 48
    context.beginPath()
    context.moveTo(1865, 2180)
    context.lineTo(1965, 2285)
    context.lineTo(2140, 2070)
    context.stroke()
    context.restore()

    const footerY = 2920
    context.fillStyle = ink
    context.fillRect(0, footerY, width, height - footerY)
    context.fillStyle = gold
    context.fillRect(0, footerY, width, 24)

    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = paper
    context.font = '900 52px system-ui, sans-serif'
    context.fillText('RETROUVEZ TOUTES NOS DATES SUR', width / 2, 3055)
    context.fillStyle = gold
    context.font = '1000 112px system-ui, sans-serif'
    context.fillText('luditoulouse.org', width / 2, 3200)

    this.drawInstagramIcon(context, 910, 3390, 76, paper)
    context.textAlign = 'left'
    context.fillStyle = paper
    context.font = '900 62px system-ui, sans-serif'
    context.fillText('@luditoulouse', 980, 3392)
  }

  private fitTextSize(context: CanvasRenderingContext2D, text: string, maxWidth: number, initialSize: number): number {
    let size = initialSize
    while (size > 180) {
      context.font = `900 ${size}px system-ui, sans-serif`
      if (context.measureText(text).width <= maxWidth) {
        return size
      }
      size -= 12
    }
    return size
  }

  private drawInstagramIcon(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
  ): void {
    context.save()
    context.translate(x, y)
    context.strokeStyle = color
    context.fillStyle = color
    context.lineWidth = 12
    const half = size / 2
    context.strokeRect(-half, -half, size, size)
    context.beginPath()
    context.arc(0, 0, size * 0.23, 0, Math.PI * 2)
    context.stroke()
    context.beginPath()
    context.arc(size * 0.29, -size * 0.29, size * 0.065, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  private async createPhotoMosaic(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    canvas.width = VoteCardComponent.DESIGN_WIDTH
    canvas.height = 2920
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) {
      throw new Error('Impossible de préparer la mosaïque de photos.')
    }
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    const columns = 3
    const rows = Math.ceil(this.photos.length / columns)
    const tileWidth = canvas.width / columns
    const tileHeight = canvas.height / rows

    for (let index = 0; index < this.photos.length; index += 1) {
      const photo = this.photos[index]
      const image = await this.loadImage(photo.src, 'Impossible de charger une photo de la mosaïque.')
      this.drawCoverImage(
        context,
        image,
        (index % columns) * tileWidth,
        Math.floor(index / columns) * tileHeight,
        tileWidth,
        tileHeight,
      )
      image.src = ''
    }

    return canvas
  }

  private drawCoverImage(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    const scale = Math.max(width / sourceWidth, height / sourceHeight)
    const renderedWidth = sourceWidth * scale
    const renderedHeight = sourceHeight * scale
    context.drawImage(
      image,
      x + (width - renderedWidth) / 2,
      y + (height - renderedHeight) / 2,
      renderedWidth,
      renderedHeight,
    )
  }

  private loadImage(src: string, errorMessage: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(errorMessage))
      image.src = src
    })
  }

  private restoreState(): void {
    const state = this.drafts.readJson<PersistedVoteCardState>(VoteCardComponent.STORAGE_KEY)
    if (!state) {
      return
    }

    if (typeof state.frontColorId === 'string' && this.colors.some((color) => color.id === state.frontColorId)) {
      this.frontColorId = state.frontColorId
    }
    if (typeof state.backColorId === 'string' && this.colors.some((color) => color.id === state.backColorId)) {
      this.backColorId = state.backColorId
    }
    if (typeof state.frontLabel === 'string') {
      this.frontLabel = this.pluralizeTeamLabel(state.frontLabel).slice(0, 22)
    }
    if (typeof state.backLabel === 'string') {
      this.backLabel = this.pluralizeTeamLabel(state.backLabel).slice(0, 22)
    }
  }

  private pluralizeTeamLabel(value: string): string {
    const plurals: Record<string, string> = {
      jaune: 'Jaunes',
      bleu: 'Bleus',
      noir: 'Noirs',
      rouge: 'Rouges',
      blanc: 'Blancs',
    }
    return plurals[value.trim().toLocaleLowerCase('fr-FR')] || value
  }

  private colorById(colorId: string, fallbackId: string): VoteCardColor {
    return this.colors.find((color) => color.id === colorId)
      || this.colors.find((color) => color.id === fallbackId)
      || this.colors[0]
  }

  private get fileNameBase(): string {
    const today = new Date()
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')
    return `ludi-carton-vote-${this.slugify(this.frontLabel)}-${this.slugify(this.backLabel)}-${date}`
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'equipe'
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, duration))
  }

  private showActionMessage(message: string, type: 'success' | 'error' = 'success'): void {
    window.clearTimeout(this.actionMessageTimer)
    this.actionMessage = message
    this.actionMessageType = type
    this.actionMessageTimer = window.setTimeout(() => {
      this.actionMessage = ''
    }, 6000)
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.name !== 'AbortError' ? error.message : fallback
  }
}
