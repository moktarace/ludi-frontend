import { Injectable } from '@angular/core'

export type Html2Canvas = typeof import('html2canvas').default

export interface StagedExportElement {
  element: HTMLElement
  dispose: () => void
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
}
