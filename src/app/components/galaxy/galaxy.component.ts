import { Component, ElementRef, HostListener, OnDestroy } from '@angular/core'

interface DescendantLeague {
  label: string
  logo?: string
  href?: string
  initials: string
  position: string
  isSecret?: boolean
}

interface GalaxyParticle {
  style: Record<string, string>
}

@Component({
  selector: 'app-galaxy',
  templateUrl: './galaxy.component.html',
})
export class GalaxyComponent implements OnDestroy {
  public readonly stars: GalaxyParticle[] = this.createStars(34)

  public twinkles: GalaxyParticle[] = []

  private readonly particleTimers: Array<ReturnType<typeof setTimeout>> = []

  public readonly leagues: DescendantLeague[] = [
    {
      label: 'IMPROCIBO',
      initials: 'IC',
      href: 'https://www.facebook.com/improcibo.lapage/',
      logo: 'assets/galaxy/improcibo.jpg',
      position: 'galaxy-fruit-13',
    },
    {
      label: 'LA BRIQUE',
      initials: 'LB',
      logo: 'assets/galaxy/la-brique.png',
      href: 'https://labriquedetoulouse.fr/',
      position: 'galaxy-fruit-2',
    },
    {
      label: 'LES ACIDES ANIMÉS',
      initials: 'AA',
      logo: 'assets/galaxy/acides.png',
      href: "https://www.facebook.com/LesAcidesAnimes",
      position: 'galaxy-fruit-3',
    },
    {
      label: 'COMPAGNIE BONJOUR',
      initials: 'CB',
      logo: 'assets/galaxy/compagnie-bonjour.webp',
      href : "https://www.instagram.com/lacompagniebonjour",
      position: 'galaxy-fruit-4',
    },
    {
      label: "L'INDEX",
      initials: 'IX',
      logo: 'assets/galaxy/lindex.jpg',
      href : "https://lindex-toulouse.fr/",
      position: 'galaxy-fruit-5',
    },
    {
      label: 'LA BAF',
      initials: 'BA',
      logo: 'assets/galaxy/baf.jpg',
      href: "https://www.instagram.com/la_baf_impro",
      position: 'galaxy-fruit-12',
    },
    {
      label: 'THE BLACK STORIES',
      initials: 'BS',
      logo: 'assets/galaxy/the-black-stories.png',
      href: "https://blackstoriesimpro.com/",
      position: 'galaxy-fruit-7',
    },
    {
      label: 'LES PAULETTE',
      initials: 'LP',
      href: 'https://www.instagram.com/lespaulette/',
      logo: 'assets/galaxy/les-paulette.png',
      position: 'galaxy-fruit-8',
    },
    {
      label: "L'AMICALE DES COPAINES",
      initials: 'AC',
      logo: 'assets/galaxy/amicale-des-copaines.jpg',
      href: 'https://www.facebook.com/lamicaledescopaines',
      position: 'galaxy-fruit-9',
    },
    {
      label: 'LES CANAILLES',
      initials: 'LC',
      logo: 'assets/galaxy/canailles.jpeg',
      href: 'https://www.instagram.com/lescanaillesimpro/',
      position: 'galaxy-fruit-10',
    },
    {
      label: 'TIMY',
      initials: 'TY',
      href: 'https://www.instagram.com/timy_impro/',
      logo: 'assets/galaxy/timy.jpg',
      position: 'galaxy-fruit-11',
    },
    {
      label: 'CASE LUDIQUE',
      initials: 'CL',
      position: 'galaxy-fruit-15',
      isSecret: true,
    },
  ]

  public constructor(private readonly elementRef: ElementRef<HTMLElement>) {
    this.scheduleTwinkle()
  }

  public ngOnDestroy(): void {
    this.particleTimers.forEach((timer) => clearTimeout(timer))
  }

  @HostListener('window:deviceorientation', ['$event'])
  public onDeviceOrientation(event: DeviceOrientationEvent): void {
    if (event.beta === null || event.gamma === null) {
      return
    }

    this.setGalaxyMotion(event.gamma / 18, event.beta / 24)
  }

  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    this.setGalaxyMotion((event.clientX / window.innerWidth - 0.5) * 1.4, (event.clientY / window.innerHeight - 0.5) * 1.2)
  }

  private setGalaxyMotion(rawX: number, rawY: number): void {
    const x = Math.max(-1, Math.min(1, rawX))
    const y = Math.max(-1, Math.min(1, rawY))
    const style = this.elementRef.nativeElement.style

    style.setProperty('--galaxy-gyro-x', `${(x * 0.9).toFixed(2)}rem`)
    style.setProperty('--galaxy-gyro-y', `${(y * 0.7).toFixed(2)}rem`)
    style.setProperty('--galaxy-tilt-x', `${(-y * 1.1).toFixed(2)}deg`)
    style.setProperty('--galaxy-tilt-y', `${(x * 1.3).toFixed(2)}deg`)
  }

  private createStars(count: number): GalaxyParticle[] {
    return Array.from({ length: count }, () => ({
      style: {
        left: `${this.randomBetween(4, 96).toFixed(1)}%`,
        top: `${this.randomBetween(6, 90).toFixed(1)}%`,
        '--galaxy-star-size': `${this.randomBetween(0.08, 0.28).toFixed(2)}rem`,
        '--galaxy-star-drift-duration': `${this.randomBetween(7.5, 18).toFixed(2)}s`,
        '--galaxy-star-drift-x': `${this.randomBetween(-0.22, 0.22).toFixed(2)}rem`,
        '--galaxy-star-drift-y': `${this.randomBetween(-0.24, 0.24).toFixed(2)}rem`,
        '--galaxy-star-opacity': `${this.randomBetween(0.1, 0.34).toFixed(2)}`,
      },
    }))
  }

  private createTwinkle(): GalaxyParticle {
    return {
      style: {
        left: `${this.randomBetween(4, 96).toFixed(1)}%`,
        top: `${this.randomBetween(6, 90).toFixed(1)}%`,
        '--galaxy-twinkle-size': `${this.randomBetween(0.45, 1.15).toFixed(2)}rem`,
        '--galaxy-twinkle-duration': `${this.randomBetween(0.7, 1.45).toFixed(2)}s`,
        '--galaxy-twinkle-rotate': `${this.randomBetween(-40, 40).toFixed(1)}deg`,
      },
    }
  }

  private scheduleTwinkle(): void {
    const timer = setTimeout(() => {
      const twinkle = this.createTwinkle()
      this.twinkles = [...this.twinkles, twinkle]

      this.particleTimers.push(setTimeout(() => {
        this.twinkles = this.twinkles.filter((item) => item !== twinkle)
      }, this.randomBetween(900, 1600)))

      this.scheduleTwinkle()
    }, this.randomBetween(180, 950))

    this.particleTimers.push(timer)
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}
