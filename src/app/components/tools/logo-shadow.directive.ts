import { Directive, ElementRef, HostListener, Input, OnChanges } from '@angular/core'

/** Rasterize the alpha-based shadow so html2canvas exports it like the preview. */
@Directive({ selector: 'img[logoShadow]' })
export class LogoShadowDirective implements OnChanges {
  @Input() logoShadow = false
  @Input() logoShadowSrc = ''
  private renderedSource = ''
  private static cache = new Map<string, string>()

  constructor(private readonly element: ElementRef<HTMLImageElement>) {}

  public ngOnChanges(): void {
    this.renderedSource = ''
    this.element.nativeElement.src = this.logoShadowSrc
    if (this.element.nativeElement.complete) this.renderShadow()
  }

  @HostListener('load')
  public renderShadow(): void {
    const image = this.element.nativeElement
    const isInstitutionalLogo = /(?:^|\/)assets\/logo\/(?:logo|ut3|cvec)\.png(?:[?#]|$)/.test(this.logoShadowSrc)
    if (isInstitutionalLogo || !this.logoShadow || !image.naturalWidth || image.src === this.renderedSource) return
    let source = LogoShadowDirective.cache.get(this.logoShadowSrc)
    if (!source) {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.round(image.naturalWidth * scale)
      canvas.height = Math.round(image.naturalHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) return
      // Leave transparent room around the silhouette to avoid clipping the shadow.
      const padding = Math.min(canvas.width, canvas.height) * 0.06
      context.shadowColor = 'rgba(0, 0, 0, 0.85)'
      context.shadowBlur = padding * 0.5
      context.shadowOffsetY = padding * 0.25
      context.drawImage(image, canvas.width * 0.06, canvas.height * 0.06, canvas.width * 0.88, canvas.height * 0.88)
      try {
        source = canvas.toDataURL('image/png')
      } catch {
        return
      }
      // Bound memory use when users upload many different logos.
      if (LogoShadowDirective.cache.size >= 32) LogoShadowDirective.cache.clear()
      LogoShadowDirective.cache.set(this.logoShadowSrc, source)
    }
    this.renderedSource = source
    image.src = source
  }
}
