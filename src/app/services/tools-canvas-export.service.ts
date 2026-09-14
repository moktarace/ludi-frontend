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

export interface PdfJpegPage {
  bytes: Uint8Array
  width: number
  height: number
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

  public canvasToPngBlob(canvas: HTMLCanvasElement): Blob {
    const encoded = canvas.toDataURL('image/png').split(',')[1]
    if (!encoded) {
      throw new Error('Export PNG impossible')
    }
    const binary = window.atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: 'image/png' })
  }

  public downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Give Safari time to consume the download before releasing its backing Blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  public async canvasesToA4Pdf(canvases: HTMLCanvasElement[]): Promise<Blob> {
    const pages: PdfJpegPage[] = []
    for (const canvas of canvases) {
      pages.push(await this.canvasToJpegPage(canvas))
    }
    return this.jpegPagesToA4Pdf(pages)
  }

  public async canvasToJpegPage(canvas: HTMLCanvasElement): Promise<PdfJpegPage> {
    return {
      bytes: await this.canvasToJpegBytes(canvas),
      width: canvas.width,
      height: canvas.height,
    }
  }

  public jpegPagesToA4Pdf(pages: PdfJpegPage[]): Blob {
    if (!pages.length) {
      throw new Error('Aucune page à placer dans le PDF.')
    }

    const pageWidth = 595.28
    const pageHeight = 841.89
    const encoder = new TextEncoder()
    const encode = (value: string): Uint8Array => encoder.encode(value)
    const objects: Uint8Array[] = []
    const pageObjectNumbers: number[] = []

    objects[1] = encode('<< /Type /Catalog /Pages 2 0 R >>')

    for (let index = 0; index < pages.length; index += 1) {
      const pageObjectNumber = 3 + index * 3
      const imageObjectNumber = pageObjectNumber + 1
      const contentObjectNumber = pageObjectNumber + 2
      const page = pages[index]
      pageObjectNumbers.push(pageObjectNumber)

      objects[pageObjectNumber] = encode([
        '<< /Type /Page',
        '/Parent 2 0 R',
        `/MediaBox [0 0 ${pageWidth} ${pageHeight}]`,
        `/Resources << /XObject << /Im0 ${imageObjectNumber} 0 R >> >>`,
        `/Contents ${contentObjectNumber} 0 R`,
        '>>',
      ].join(' '))

      objects[imageObjectNumber] = this.concatBytes([
        encode([
          '<< /Type /XObject /Subtype /Image',
          `/Width ${page.width}`,
          `/Height ${page.height}`,
          '/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',
          `/Length ${page.bytes.length} >>\nstream\n`,
        ].join(' ')),
        page.bytes,
        encode('\nendstream'),
      ])

      const drawImage = encode(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`)
      objects[contentObjectNumber] = encode(`<< /Length ${drawImage.length} >>\nstream\n${new TextDecoder().decode(drawImage)}endstream`)
    }

    objects[2] = encode(`<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`)

    const header = encode('%PDF-1.4\n%LUDI\n')
    const body: Uint8Array[] = [header]
    const offsets: number[] = [0]
    let byteOffset = header.length

    for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
      const objectHeader = encode(`${objectNumber} 0 obj\n`)
      const objectFooter = encode('\nendobj\n')
      offsets[objectNumber] = byteOffset
      body.push(objectHeader, objects[objectNumber], objectFooter)
      byteOffset += objectHeader.length + objects[objectNumber].length + objectFooter.length
    }

    const xrefOffset = byteOffset
    const xrefRows = offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('')
    const trailer = encode([
      `xref\n0 ${objects.length}\n`,
      '0000000000 65535 f \n',
      xrefRows,
      `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n`,
      `startxref\n${xrefOffset}\n%%EOF`,
    ].join(''))
    body.push(trailer)

    return new Blob(body, { type: 'application/pdf' })
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

  private async canvasToJpegBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result)
          return
        }
        reject(new Error('Impossible de préparer une page du PDF.'))
      }, 'image/jpeg', 0.98)
    })
    return new Uint8Array(await blob.arrayBuffer())
  }

  private concatBytes(chunks: Uint8Array[]): Uint8Array {
    const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
    const merged = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return merged
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
