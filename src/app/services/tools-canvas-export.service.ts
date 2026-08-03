import { Injectable } from '@angular/core'

export type Html2Canvas = typeof import('html2canvas').default

export interface StagedExportElement {
  element: HTMLElement
  dispose: () => void
}

export interface CanvasPhoto {
  name: string
  src: string
}

@Injectable({ providedIn: 'root' })
export class ToolsCanvasExportService {
  public async loadRenderer(): Promise<Html2Canvas> {
    const module = await import('html2canvas')
    return module.default
  }

  public stageElement(source: HTMLElement, width: number, height: number): StagedExportElement {
    const wrapper = document.createElement('div')
    const element = source.cloneNode(true) as HTMLElement
    wrapper.setAttribute('aria-hidden', 'true')
    Object.assign(wrapper.style, {
      height: `${height}px`,
      left: '0',
      overflow: 'visible',
      pointerEvents: 'none',
      position: 'fixed',
      top: '0',
      width: `${width}px`,
      zIndex: '-2147483647',
    })
    Object.assign(element.style, {
      display: 'grid',
      flex: 'none',
      height: `${height}px`,
      margin: '0',
      transform: 'none',
      width: `${width}px`,
    })
    wrapper.appendChild(element)
    document.body.appendChild(wrapper)

    return {
      element,
      dispose: () => wrapper.remove(),
    }
  }

  public canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('Export impossible'))
      })
    })
  }

  public downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  public async waitForImages(element: HTMLElement): Promise<void> {
    const images = Array.from(element.querySelectorAll('img'))
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })
      }
      if (typeof image.decode === 'function' && image.naturalWidth > 0) {
        await image.decode().catch(() => undefined)
      }
    }))
  }

  public async composePhoto(
    overlayCanvas: HTMLCanvasElement,
    photo: CanvasPhoto,
    isCover: boolean,
    positionY: number = 0.5,
  ): Promise<HTMLCanvasElement> {
    const image = await this.loadImage(photo.src)
    const canvas = document.createElement('canvas')
    canvas.width = overlayCanvas.width
    canvas.height = overlayCanvas.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Impossible de préparer la photo du carrousel.')
    if (!image.naturalWidth || !image.naturalHeight || !canvas.width || !canvas.height) {
      throw new Error(`Dimensions invalides pour ${photo.name}.`)
    }

    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
    const sourceWidth = canvas.width / scale
    const sourceHeight = canvas.height / scale
    const sourceX = (image.naturalWidth - sourceWidth) / 2
    const safePositionY = Math.max(0, Math.min(positionY, 1))
    const sourceY = (image.naturalHeight - sourceHeight) * safePositionY
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

    if (isCover) {
      this.drawCoverGradient(context, canvas.width, canvas.height, 0.18, 0.08, 0.72)
      this.drawCoverGradient(context, canvas.width, canvas.height, 0.28, 0.08, 0.82)
    }
    context.drawImage(overlayCanvas, 0, 0)
    return canvas
  }

  public composeBaseBackground(overlayCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = this.createCanvasLike(overlayCanvas, 'Impossible de préparer le fond du carrousel.')
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, 'rgba(23, 18, 31, 0.96)')
    gradient.addColorStop(0.48, 'rgba(33, 21, 40, 0.96)')
    gradient.addColorStop(1, 'rgba(223, 47, 66, 0.92)')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(overlayCanvas, 0, 0)
    return canvas
  }

  public composeChampionshipBackground(overlayCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = this.createCanvasLike(overlayCanvas, 'Impossible de préparer le fond du championnat.')
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const stripes = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    const stops: Array<[number, string]> = [
      [0, '#09090c'], [0.36, '#09090c'], [0.361, '#df2f42'], [0.52, '#df2f42'],
      [0.521, '#fff8ed'], [0.57, '#fff8ed'], [0.571, '#101015'], [1, '#101015'],
    ]
    stops.forEach(([offset, color]) => stripes.addColorStop(offset, color))
    context.fillStyle = stripes
    context.fillRect(0, 0, canvas.width, canvas.height)

    const x = canvas.width * 0.18
    const y = canvas.height * 0.12
    const glow = context.createRadialGradient(x, y, 0, x, y, canvas.width * 0.62)
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.14)')
    glow.addColorStop(0.1, 'rgba(255, 255, 255, 0.14)')
    glow.addColorStop(0.11, 'rgba(255, 255, 255, 0)')
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = glow
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(overlayCanvas, 0, 0)
    return canvas
  }

  private createCanvasLike(source: HTMLCanvasElement, errorMessage: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = source.width
    canvas.height = source.height
    if (!canvas.width || !canvas.height || !canvas.getContext('2d')) throw new Error(errorMessage)
    return canvas
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Impossible de charger une image du carrousel.'))
      image.src = src
    })
  }

  private drawCoverGradient(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    topAlpha: number,
    middleAlpha: number,
    bottomAlpha: number,
  ): void {
    const gradient = context.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `rgba(23, 18, 31, ${topAlpha})`)
    gradient.addColorStop(0.44, `rgba(23, 18, 31, ${middleAlpha})`)
    gradient.addColorStop(1, `rgba(23, 18, 31, ${bottomAlpha})`)
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
  }
}
