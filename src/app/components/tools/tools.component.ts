import { Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core'
import { isPrivateAccessUnlocked, PRIVATE_ACCESS_CODE, unlockPrivateAccess } from 'src/app/config/private-access'
import { Show } from 'src/app/model'

type VisualFormat = 'post' | 'story' | 'reel' | 'poster'
type VisualMode = 'show' | 'week' | 'month'
type CarouselPlacement = 'top' | 'center' | 'bottom'
type CarouselLogoSize = 's' | 'm' | 'l' | 'xl'
type VisualTaglinePlacement = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right'
type LegacyLogoPickerTarget = 'poster' | 'carousel'
type Html2Canvas = typeof import('html2canvas').default
type ChampionshipSlideId = 'match' | 'standings' | 'dates'

interface CarouselPhoto {
  id: string
  name: string
  src: string
}

interface PresetLogo {
  label: string
  src: string
}

interface VisualTone {
  label: string
  value: string
  accent: string
  accentRgb: string
  taglineAccent: string
  customBackgroundRgb: string
}

interface PedagogySlide {
  eyebrow: string
  title: string
  text: string
  image?: string
}

interface PedagogyTemplate {
  id: string
  label: string
  caption: string
  slides: PedagogySlide[]
}

interface ChampionshipTeam {
  id: string
  name: string
  label: string
  color: string
  textColor: string
  points: number
  faults: number
  faultsList: string
}

interface ChampionshipMatch {
  id: string
  label: string
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
}

interface ChampionshipStanding extends ChampionshipTeam {
  wins: number
  losses: number
  draws: number
  scored: number
  conceded: number
  difference: number
  rank: number
}

interface PersistedChampionshipState {
  title?: string
  edition?: string
  selectedMatchId?: string
  teams?: ChampionshipTeam[]
  matches?: ChampionshipMatch[]
}

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  private static REEL_DURATION_MS = 7000
  private static REEL_FRAME_RATE = 12
  private static CAROUSEL_MAX_PHOTOS = 19
  private static PEDAGOGY_MAX_CONTENT_SLIDES = 18
  private static CHAMPIONSHIP_STORAGE_KEY = 'ludi-tools-championnat-improvisem'

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

  @ViewChildren('carouselSlide')
  public carouselSlides?: QueryList<ElementRef<HTMLElement>>

  @ViewChildren('pedagogySlide')
  public pedagogySlidesRef?: QueryList<ElementRef<HTMLElement>>

  @ViewChildren('championshipSlide')
  public championshipSlidesRef?: QueryList<ElementRef<HTMLElement>>

  public readonly formats: { label: string; value: VisualFormat }[] = [
    { label: 'Post', value: 'post' },
    { label: 'Story', value: 'story' },
    { label: 'Reel', value: 'reel' },
    { label: 'Affiche A2', value: 'poster' },
  ]

  public readonly modes: { label: string; value: VisualMode }[] = [
    { label: 'Spectacle', value: 'show' },
    { label: 'Semaine', value: 'week' },
    { label: 'Mois', value: 'month' },
  ]

  public readonly presetLogos: PresetLogo[] = [
    { label: 'Improvisem', src: 'assets/logo/kit/improvisem.png' },
    { label: 'Match', src: 'assets/logo/kit/match.png' },
    { label: 'Ludidée', src: 'assets/logo/kit/ludidee.png' },
    { label: 'Catch', src: 'assets/logo/kit/catch.png' },
    { label: "Cours d'essai", src: 'assets/logo/kit/essai.png' },
    { label: 'Top Ten', src: 'assets/logo/kit/cercle.png' },
  ]

  public readonly legacyLogos: PresetLogo[] = [
    { label: 'À la manière ludienne', src: 'assets/logo/kit/legacy/a-la-maniere-ludienne.png' },
    { label: "Avez-vous déjà vu un spectacle d'impro", src: 'assets/logo/kit/legacy/avez-vous-deja-vu-un-spectacle-dimpro.png' },
    { label: "Championnat étudiant d'impro", src: 'assets/logo/kit/legacy/championnat-etudiant-dimpro.png' },
    { label: 'Comment faire péter une histoire dans la minute', src: 'assets/logo/kit/legacy/comment-faire-peter-une-histoire-dans-la-minute.png' },
    { label: 'El Día del Muerto', src: 'assets/logo/kit/legacy/el-dia-del-muerto.png' },
    { label: 'Face à Face', src: 'assets/logo/kit/legacy/face-a-face.png' },
    { label: 'Festival de la LUDI', src: 'assets/logo/kit/legacy/festival-de-la-ludi.png' },
    { label: 'Festival de si si LUDI', src: 'assets/logo/kit/legacy/festival-de-si-si-ludi.png' },
    { label: 'Impro & Faits Divers', src: 'assets/logo/kit/legacy/impro-et-faits-divers.png' },
    { label: 'Impro Football Club', src: 'assets/logo/kit/legacy/impro-football-club.png' },
    { label: 'Improv on the Corner', src: 'assets/logo/kit/legacy/improv-on-the-corner.png' },
    { label: "L'étrange Noël de la LUDI", src: 'assets/logo/kit/legacy/letrange-noel-de-la-ludi.png' },
    { label: "L'impro fait sa rentrée", src: 'assets/logo/kit/legacy/limpro-fait-sa-rentree.png' },
    { label: 'La crim ne paie pas', src: 'assets/logo/kit/legacy/la-crim-ne-paie-pas.png' },
    { label: "La LUDI face à la Guilde de l'Improbable", src: 'assets/logo/kit/legacy/la-ludi-face-a-la-guilde-de-limprobable.png' },
    { label: 'Le Cercle des menteurs fieffés', src: 'assets/logo/kit/legacy/le-cercle-des-menteurs-fieffes.png' },
    { label: 'Le dernier festival de la LUDI', src: 'assets/logo/kit/legacy/le-dernier-festival-de-la-ludi.png' },
    { label: "Le dernier festival de la LUDI (pour l'instant)", src: 'assets/logo/kit/legacy/le-dernier-festival-de-la-ludi-pour-linstant.png' },
    { label: 'Le Voyage exquis', src: 'assets/logo/kit/legacy/le-voyage-exquis.png' },
    { label: 'Les Inédits de la LUDI', src: 'assets/logo/kit/legacy/les-inedits-de-la-ludi.png' },
    { label: 'Les Ludiens du Père Noël', src: 'assets/logo/kit/legacy/les-ludiens-du-pere-noel.png' },
    { label: 'Les Pirates du Midi', src: 'assets/logo/kit/legacy/les-pirates-du-midi.png' },
    { label: 'Love & Improv', src: 'assets/logo/kit/legacy/love-and-improv.png' },
    { label: "Maman, j'ai raté l'impro", src: 'assets/logo/kit/legacy/maman-jai-rate-limpro.png' },
    { label: "Match d'impro", src: 'assets/logo/kit/legacy/match-dimpro.png' },
    { label: 'Match des Pioupioux', src: 'assets/logo/kit/legacy/match-des-pioupioux.png' },
    { label: 'Menu Maxi Best Of', src: 'assets/logo/kit/legacy/menu-maxi-best-of.png' },
    { label: 'Milla Palace & Vincent Las Vegas', src: 'assets/logo/kit/legacy/milla-palace-et-vincent-las-vegas.png' },
    { label: 'Objectif LIQA', src: 'assets/logo/kit/legacy/objectif-liqa.png' },
    { label: 'Objectif LUDI', src: 'assets/logo/kit/legacy/objectif-ludi.png' },
    { label: 'Old School vs New School', src: 'assets/logo/kit/legacy/old-school-vs-new-school.png' },
    { label: 'Question pour Impro', src: 'assets/logo/kit/legacy/question-pour-impro.png' },
    { label: 'Toulouse + Suisse', src: 'assets/logo/kit/legacy/toulouse-suisse.png' },
    { label: "Voyage au centre de l'impro", src: 'assets/logo/kit/legacy/voyage-au-centre-de-limpro.png' },
  ]

  public readonly visualTones: VisualTone[] = [
    {
      label: 'Rouge LUDI',
      value: 'ludi-red',
      accent: '#df2f42',
      accentRgb: '223 47 66',
      taglineAccent: '#ff6f9f',
      customBackgroundRgb: '223 47 66',
    },
    {
      label: 'Prune',
      value: 'plum',
      accent: '#7a315f',
      accentRgb: '122 49 95',
      taglineAccent: '#ff73d4',
      customBackgroundRgb: '122 49 95',
    },
    {
      label: 'Vert scène',
      value: 'stage-green',
      accent: '#5cb52e',
      accentRgb: '92 181 46',
      taglineAccent: '#b9ff45',
      customBackgroundRgb: '92 181 46',
    },
    {
      label: 'Orange affiche',
      value: 'poster-orange',
      accent: '#d96b35',
      accentRgb: '217 107 53',
      taglineAccent: '#ffbd3d',
      customBackgroundRgb: '217 107 53',
    },
    {
      label: 'Turquoise nuit',
      value: 'night-turquoise',
      accent: '#00a99a',
      accentRgb: '0 169 154',
      taglineAccent: '#4dffe7',
      customBackgroundRgb: '0 169 154',
    },
    {
      label: 'Jaune projecteur',
      value: 'spotlight-yellow',
      accent: '#f0b92e',
      accentRgb: '240 185 46',
      taglineAccent: '#fff04d',
      customBackgroundRgb: '240 185 46',
    },
    {
      label: 'Toulouse',
      value: 'toulouse',
      accent: '#e04f7a',
      accentRgb: '224 79 122',
      taglineAccent: '#ff5fa8',
      customBackgroundRgb: '224 79 122',
    },
  ]

  public readonly pedagogyTemplates: PedagogyTemplate[] = [
    {
      id: 'match',
      label: "C'est quoi un match d'impro ?",
      caption: "Petit mode d'emploi avant de venir voir un match d'impro à la LUDI.",
      slides: [
        {
          eyebrow: 'Impro 101',
          title: "C'est quoi un match d'impro ?",
          text: "Deux équipes montent sur scène. Personne ne connaît l'histoire à l'avance.",
        },
        {
          eyebrow: 'Le principe',
          title: 'Une contrainte, zéro filet',
          text: "L'arbitre annonce un thème, une durée, parfois une catégorie. Les joueur·euse·s inventent tout en direct.",
        },
        {
          eyebrow: 'Le public',
          title: 'Tu votes',
          text: "À la fin de chaque improvisation, le public choisit l'équipe qui l'a embarqué.",
        },
        {
          eyebrow: 'La soirée',
          title: 'Ça rit, ça tente, ça surprend',
          text: "Un match peut être drôle, absurde, touchant, chaotique. C'est vivant, donc ça ne se rejoue jamais pareil.",
        },
        {
          eyebrow: 'À Toulouse',
          title: 'Viens voir ça en vrai',
          text: "La LUDI joue toute l'année à Toulouse. Prochaine date sur luditoulouse.org.",
        },
      ],
    },
    {
      id: 'first-time',
      label: 'Première fois à la LUDI',
      caption: "Tu n'as jamais vu d'impro ? Voilà comment se passe une soirée LUDI.",
      slides: [
        {
          eyebrow: 'Première fois',
          title: 'Tu peux venir sans rien connaître',
          text: "Pas besoin d'avoir déjà vu de l'impro. Tu t'installes, le spectacle fait le reste.",
        },
        {
          eyebrow: 'Avant le show',
          title: 'On arrive, on se pose',
          text: "La plupart des spectacles se jouent à Paul Sabatier, souvent au CAP ou autour du campus.",
        },
        {
          eyebrow: 'Pendant',
          title: 'Tout est inventé devant toi',
          text: "Les comédien·ne·s construisent les scènes avec les contraintes du moment et l'énergie du public.",
        },
        {
          eyebrow: 'Ambiance',
          title: "C'est simple et vivant",
          text: "Tu peux rire fort, voter, réagir, découvrir une équipe. L'impro aime le public présent.",
        },
        {
          eyebrow: 'On se voit ?',
          title: 'Prochaines dates',
          text: "Toutes les infos sont sur luditoulouse.org et sur @luditoulouse.",
        },
      ],
    },
    {
      id: 'why-impro',
      label: "Pourquoi venir voir de l'impro ?",
      caption: "Quelques bonnes raisons de venir voir du théâtre d'impro à Toulouse.",
      slides: [
        {
          eyebrow: 'Pourquoi venir ?',
          title: "Parce que c'est vivant",
          text: "Chaque spectacle existe une seule fois. Ce que tu vois ce soir-là ne reviendra pas pareil.",
        },
        {
          eyebrow: 'Sur scène',
          title: "L'histoire se fabrique en direct",
          text: "Les personnages, les enjeux, les accidents et les grandes idées naissent sous tes yeux.",
        },
        {
          eyebrow: 'Dans la salle',
          title: 'Le public compte',
          text: "Ton énergie change la soirée. À la LUDI, la salle fait partie du spectacle.",
        },
        {
          eyebrow: 'À Toulouse',
          title: 'Une troupe historique',
          text: "Depuis 1997, la LUDI joue, forme et fait circuler l'impro à Toulouse et ailleurs.",
        },
        {
          eyebrow: 'À bientôt',
          title: 'Viens essayer',
          text: "Choisis une date, réserve si besoin, et laisse-toi surprendre.",
        },
      ],
    },
    {
      id: 'catch',
      label: "C'est quoi un catch d'impro ?",
      caption: "Le catch d'impro, c'est une soirée intense, théâtrale et très joueuse.",
      slides: [
        {
          eyebrow: 'Format',
          title: "C'est quoi un catch d'impro ?",
          text: "Des duos, des personnages, une énergie de ring, et des impros qui partent très vite.",
        },
        {
          eyebrow: 'Sur scène',
          title: 'Deux binômes entrent en jeu',
          text: "Chaque duo défend son univers avec du jeu, de la mauvaise foi théâtrale et beaucoup d'écoute.",
        },
        {
          eyebrow: 'Règles',
          title: 'Des contraintes très visibles',
          text: "L'arbitre ou le maître de cérémonie lance les thèmes et garde la tension du spectacle.",
        },
        {
          eyebrow: 'Public',
          title: 'Tu choisis ton camp',
          text: "Le public encourage, réagit, vote, et fait monter la température.",
        },
        {
          eyebrow: 'À voir',
          title: "C'est du théâtre en direct",
          text: "Drôle, physique, imprévisible. Bref : parfait pour découvrir l'impro autrement.",
        },
      ],
    },
  ]

  public selectedFormat: VisualFormat = 'post'
  public selectedMode: VisualMode = 'show'
  public selectedShowId: string = ''
  public selectedToneValue = this.visualTones[0].value
  public customPoster?: string
  public customBackground?: string
  public customBackgroundTintEnabled = true
  public customQrLink = ''
  public showQrCode = false
  public isPosterHidden = false
  public printLogoPlacement: CarouselPlacement = 'center'
  public printLogoSize: CarouselLogoSize = 'm'
  public visualTagline = ''
  public visualTaglinePlacement: VisualTaglinePlacement = 'bottom-right'
  public accessCode = ''
  public accessError = ''
  public isUnlocked = isPrivateAccessUnlocked()
  public isExporting = false
  public isSharing = false
  public carouselPhotos: CarouselPhoto[] = []
  public customCarouselLogo?: string
  public carouselLogoPlacement: CarouselPlacement = 'top'
  public carouselLogoSize: CarouselLogoSize = 'm'
  public carouselTextPlacement: CarouselPlacement = 'bottom'
  public carouselCoverText = 'MERCI'
  public isCarouselDragActive = false
  public isCarouselExporting = false
  public carouselPreviewIndex = 0
  public isLegacyLogoPickerOpen = false
  public legacyLogoPickerTarget: LegacyLogoPickerTarget = 'poster'
  public selectedPedagogyTemplateId = this.pedagogyTemplates[0].id
  public pedagogySlides: PedagogySlide[] = this.clonePedagogySlides(this.pedagogyTemplates[0])
  public pedagogyPreviewIndex = 0
  public isPedagogyExporting = false
  public championshipTitle = 'Championnat Improvisem'
  public championshipEdition = 'Bouclier Improvisem'
  public championshipTeams: ChampionshipTeam[] = [
    {
      id: 'yellow',
      name: 'Equipe Jaune',
      label: 'Jaune',
      color: '#ffd326',
      textColor: '#17121f',
      points: 3,
      faults: 2,
      faultsList: 'Cabotinage solaire; Accessoire imaginaire non homologue',
    },
    {
      id: 'black',
      name: 'Equipe Noire',
      label: 'Noir',
      color: '#18181d',
      textColor: '#fff8ed',
      points: 2,
      faults: 4,
      faultsList: "Refus d'obstacle; Regard arbitral beaucoup trop intense",
    },
    {
      id: 'red',
      name: 'Equipe Rouge',
      label: 'Rouge',
      color: '#df2f42',
      textColor: '#fff8ed',
      points: 4,
      faults: 1,
      faultsList: 'Jeu dangereusement charismatique',
    },
    {
      id: 'white',
      name: 'Equipe Blanche',
      label: 'Blanc',
      color: '#fff8ed',
      textColor: '#17121f',
      points: 1,
      faults: 3,
      faultsList: 'Mime de porte discutable; Propulsion narrative non declaree',
    },
  ]
  public championshipMatches: ChampionshipMatch[] = [
    { id: 'match-1', label: 'Match 1', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-2', label: 'Match 2', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-3', label: 'Match 3', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-4', label: 'Match 4', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-5', label: 'Match 5', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-6', label: 'Match 6', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'small-final', label: 'Petite finale', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'big-final', label: 'Grande finale', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
  ]
  public selectedChampionshipMatchId = this.championshipMatches[0].id
  public championshipPreviewIndex = 0
  public isChampionshipExporting = false

  constructor() {
    this.restoreChampionshipState()
  }

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
    return show?.logoLink || 'assets/logo/logo.png'
  }

  public get visualClass(): string {
    const customClass = this.hasCustomOptions && this.customBackground ? ' visual-has-custom-background' : ''
    return `visual-preview visual-preview-${this.selectedFormat} visual-mode-${this.selectedMode}${customClass}`
  }

  public get availableModes(): { label: string; value: VisualMode }[] {
    if (this.isShowOnlyFormat) {
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

  public get isA2Format(): boolean {
    return this.selectedFormat === 'poster'
  }

  public get isLargeShowFormat(): boolean {
    return this.isA2Format
  }

  public get usesPrintShowLayout(): boolean {
    return this.selectedMode === 'show' && (this.isPostFormat || this.isLargeShowFormat)
  }

  public get isShowOnlyFormat(): boolean {
    return this.isReelFormat || this.isLargeShowFormat
  }

  public get isQrCapableFormat(): boolean {
    return this.isPostFormat || this.isLargeShowFormat
  }

  public get printLogoClass(): string {
    if (!this.usesPrintShowLayout) {
      return ''
    }

    return `visual-print-logo visual-print-logo-${this.printLogoPlacement} visual-print-logo-${this.printLogoSize}`
  }

  public get visualTaglineText(): string {
    return this.visualTagline.trim()
  }

  public get showVisualTagline(): boolean {
    return this.isShowVisual && Boolean(this.visualTaglineText)
  }

  public get visualTaglineClass(): string {
    const logoPlacement = this.usesPrintShowLayout ? this.printLogoPlacement : 'center'
    return `visual-tagline visual-tagline-${this.visualTaglinePlacement} visual-tagline-logo-${logoPlacement}`
  }

  public get hasCustomOptions(): boolean {
    return this.isPostFormat || this.isLargeShowFormat || ((this.selectedFormat === 'story' || this.isReelFormat) && this.selectedMode === 'show')
  }

  public get showPoster(): boolean {
    return this.selectedMode === 'show' && !(this.hasCustomOptions && this.isPosterHidden)
  }

  public get visualBackgroundImage(): string | null {
    if (!this.hasCustomOptions || !this.customBackground) {
      return null
    }

    if (!this.customBackgroundTintEnabled) {
      return `url("${this.customBackground}")`
    }

    return `linear-gradient(145deg, rgb(23 18 31 / 72%) 0%, rgb(33 21 40 / 72%) 48%, rgb(${this.selectedTone.customBackgroundRgb} / 58%) 100%), url("${this.customBackground}")`
  }

  public get selectedTone(): VisualTone {
    return this.visualTones.find((tone) => tone.value === this.selectedToneValue) || this.visualTones[0]
  }

  public get visualAccent(): string {
    return this.selectedTone.accent
  }

  public get visualAccentRgb(): string {
    return this.selectedTone.accentRgb
  }

  public get visualTaglineAccent(): string {
    return this.selectedTone.taglineAccent
  }

  public get qrLink(): string {
    const customLink = this.customQrLink.trim()
    if (customLink) {
      return customLink
    }

    return this.selectedShow?.reservationLink || 'https://luditoulouse.org'
  }

  public get qrCodeImage(): string {
    if (!this.isQrCapableFormat || !this.isShowVisual || !this.showQrCode || !this.qrLink) {
      return ''
    }

    const url = encodeURIComponent(this.qrLink)
    const size = this.isLargeShowFormat ? 900 : 220
    return `https://quickchart.io/qr?text=${url}&size=${size}&margin=1&ecLevel=M&format=png`
  }

  public get exportLabel(): string {
    if (this.isExporting) {
      return this.isReelFormat ? 'Export vidéo...' : 'Export en cours...'
    }

    return this.isReelFormat ? 'Télécharger le Reel' : 'Télécharger le PNG'
  }

  public get shareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager'
  }

  public get carouselPhotoSlides(): CarouselPhoto[] {
    return this.carouselPhotos.slice(1)
  }

  public get carouselCoverPhoto(): CarouselPhoto | undefined {
    return this.carouselPhotos[0]
  }

  public get carouselSlideCount(): number {
    if (!this.carouselPhotos.length) {
      return 0
    }

    return this.carouselPhotos.length + 1
  }

  public get carouselExportLabel(): string {
    return this.isCarouselExporting ? 'Export du carrousel...' : 'Télécharger le carrousel'
  }

  public get carouselShareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager le carrousel'
  }

  public get carouselAgendaShows(): Show[] {
    const start = new Date(this.periodBaseDate)
    start.setHours(0, 0, 0, 0)

    return this.sortedShows
      .filter((show) => {
        if (!show.date) {
          return false
        }

        const date = new Date(show.date * 1000)
        return date >= start
      })
      .slice(0, 4)
  }

  public get carouselLogo(): string {
    if (this.customCarouselLogo) {
      return this.customCarouselLogo
    }

    return this.selectedShow?.logoLink || 'assets/logo/logo.png'
  }

  public get carouselLogoClass(): string {
    return `carousel-cover-logo carousel-placement-${this.carouselLogoPlacement} carousel-logo-${this.carouselLogoSize}`
  }

  public get carouselTextClass(): string {
    return `carousel-cover-text carousel-placement-${this.carouselTextPlacement}`
  }

  public get carouselPreviewPhoto(): CarouselPhoto | undefined {
    if (this.carouselPreviewIndex === 0) {
      return this.carouselCoverPhoto
    }

    return this.carouselPhotoSlides[this.carouselPreviewIndex - 1]
  }

  public get isCarouselCoverPreview(): boolean {
    return this.carouselPreviewIndex === 0
  }

  public get isCarouselDatesPreview(): boolean {
    return this.carouselPreviewIndex === Math.max(this.carouselSlideCount - 1, 1)
  }

  public get canGoToPreviousCarouselSlide(): boolean {
    return this.carouselPreviewIndex > 0
  }

  public get canGoToNextCarouselSlide(): boolean {
    return this.carouselPreviewIndex < this.carouselSlideCount - 1
  }

  public get selectedPedagogyTemplate(): PedagogyTemplate {
    return this.pedagogyTemplates.find((template) => template.id === this.selectedPedagogyTemplateId) || this.pedagogyTemplates[0]
  }

  public get pedagogySlideCount(): number {
    return this.pedagogySlides.length
  }

  public get pedagogyTotalSlideCount(): number {
    return this.pedagogySlideCount + 1
  }

  public get canAddPedagogySlide(): boolean {
    return this.pedagogySlides.length < ToolsComponent.PEDAGOGY_MAX_CONTENT_SLIDES
  }

  public get currentPedagogySlide(): PedagogySlide {
    return this.pedagogySlides[this.pedagogyPreviewIndex] || this.pedagogySlides[0]
  }

  public get isPedagogyDatesPreview(): boolean {
    return this.pedagogyPreviewIndex === this.pedagogyTotalSlideCount - 1
  }

  public get canGoToPreviousPedagogySlide(): boolean {
    return this.pedagogyPreviewIndex > 0
  }

  public get canGoToNextPedagogySlide(): boolean {
    return this.pedagogyPreviewIndex < this.pedagogyTotalSlideCount - 1
  }

  public get pedagogyExportLabel(): string {
    return this.isPedagogyExporting ? 'Export du carrousel...' : 'Télécharger le carrousel'
  }

  public get pedagogyShareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager le carrousel'
  }

  public get championshipExportLabel(): string {
    return this.isChampionshipExporting ? 'Gravure en PNG...' : 'Télécharger les 2 slides'
  }

  public get championshipShareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager les slides'
  }

  public get championshipStandings(): ChampionshipStanding[] {
    const standingByTeam = new Map<string, ChampionshipStanding>()

    for (const team of this.championshipTeams) {
      standingByTeam.set(team.id, {
        ...team,
        wins: 0,
        losses: 0,
        draws: 0,
        scored: 0,
        conceded: 0,
        difference: 0,
        rank: 0,
      })
    }

    for (const match of this.completedPlayedChampionshipMatches) {
      const teamA = standingByTeam.get(match.teamAId)
      const teamB = standingByTeam.get(match.teamBId)
      if (!teamA || !teamB) {
        continue
      }

      teamA.scored += this.safeScore(match.scoreA)
      teamA.conceded += this.safeScore(match.scoreB)
      teamB.scored += this.safeScore(match.scoreB)
      teamB.conceded += this.safeScore(match.scoreA)

      if (this.safeScore(match.scoreA) > this.safeScore(match.scoreB)) {
        teamA.wins += 1
        teamB.losses += 1
      } else if (this.safeScore(match.scoreA) < this.safeScore(match.scoreB)) {
        teamB.wins += 1
        teamA.losses += 1
      } else {
        teamA.draws += 1
        teamB.draws += 1
      }
    }

    return Array.from(standingByTeam.values())
      .map((team) => ({ ...team, difference: team.scored - team.conceded }))
      .sort((a, b) => (
        b.points - a.points ||
        b.wins - a.wins ||
        b.difference - a.difference ||
        b.scored - a.scored ||
        a.faults - b.faults ||
        a.name.localeCompare(b.name)
      ))
      .map((team, index) => ({ ...team, rank: index + 1 }))
  }

  public get selectedChampionshipMatch(): ChampionshipMatch {
    return (
      this.championshipMatches.find((match) => match.id === this.selectedChampionshipMatchId) ||
      this.championshipMatches[0]
    )
  }

  public get selectedChampionshipMatchIndex(): number {
    return Math.max(
      this.championshipMatches.findIndex((match) => match.id === this.selectedChampionshipMatch.id),
      0
    )
  }

  public get playedChampionshipMatches(): ChampionshipMatch[] {
    return this.championshipMatches.slice(0, this.selectedChampionshipMatchIndex + 1)
  }

  public get completedPlayedChampionshipMatches(): ChampionshipMatch[] {
    return this.playedChampionshipMatches.filter((match) => this.isCompleteChampionshipMatch(match))
  }

  public get upcomingChampionshipMatches(): ChampionshipMatch[] {
    return this.championshipMatches.slice(this.selectedChampionshipMatchIndex + 1)
  }

  public get selectedMatchTeamA(): ChampionshipTeam {
    return this.teamById(this.selectedChampionshipMatch.teamAId)
  }

  public get selectedMatchTeamB(): ChampionshipTeam {
    return this.teamById(this.selectedChampionshipMatch.teamBId)
  }

  public get selectedMatchWinner(): ChampionshipStanding | undefined {
    return this.getMatchWinner(this.selectedChampionshipMatch)
  }

  public get selectedMatchLoser(): ChampionshipStanding | undefined {
    return this.getMatchLoser(this.selectedChampionshipMatch)
  }

  public get championshipWinner(): ChampionshipStanding {
    return this.selectedMatchWinner || this.championshipStandings[0]
  }

  public get championshipRunnerUp(): ChampionshipStanding | undefined {
    const finalLoser = this.getMatchLoser(this.bigFinalMatch)
    return finalLoser || this.championshipStandings[1]
  }

  public get smallFinalMatch(): ChampionshipMatch {
    return this.championshipMatches.find((match) => match.id === 'small-final') || this.championshipMatches[6]
  }

  public get bigFinalMatch(): ChampionshipMatch {
    return this.championshipMatches.find((match) => match.id === 'big-final') || this.championshipMatches[7]
  }

  public get canGoToPreviousChampionshipSlide(): boolean {
    return this.championshipPreviewIndex > 0
  }

  public get canGoToNextChampionshipSlide(): boolean {
    return this.championshipPreviewIndex < 2
  }

  public get isChampionshipRecapPreview(): boolean {
    return this.championshipPreviewIndex === 0
  }

  public get isChampionshipStandingsPreview(): boolean {
    return this.championshipPreviewIndex === 1
  }

  public get isChampionshipDatesPreview(): boolean {
    return this.championshipPreviewIndex === 2
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
      return 'Gratuit pour tou·te·s'
    }

    return show.reducedPrice
      ? `${show.price} € / ${show.reducedPrice} €`
      : `${show.price} €`
  }

  public selectFormat(format: VisualFormat): void {
    this.selectedFormat = format

    if (this.isA2Format) {
      this.showQrCode = true
    }

    if (!this.isQrCapableFormat) {
      this.showQrCode = false
    }

    if (this.isShowOnlyFormat) {
      this.selectedMode = 'show'
    }
  }

  public selectMode(mode: VisualMode): void {
    this.selectedMode = mode

    if (this.isA2Format) {
      this.showQrCode = true
    }

    if (!this.isQrCapableFormat) {
      this.showQrCode = false
    }
  }

  public updatePoster(event: Event): void {
    this.readImage(event, (image) => {
      this.customPoster = image
      this.isPosterHidden = false
    })
  }

  public selectPresetPoster(logo: PresetLogo): void {
    this.customPoster = logo.src
    this.isPosterHidden = false
  }

  public openLegacyLogoPicker(target: LegacyLogoPickerTarget): void {
    this.legacyLogoPickerTarget = target
    this.isLegacyLogoPickerOpen = true
  }

  public selectLegacyLogo(logo: PresetLogo): void {
    if (this.legacyLogoPickerTarget === 'carousel') {
      this.selectPresetCarouselLogo(logo)
    } else {
      this.selectPresetPoster(logo)
    }
    this.isLegacyLogoPickerOpen = false
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

  public resetQrLink(): void {
    this.customQrLink = ''
  }

  public updateCarouselLogo(event: Event): void {
    this.readImage(event, (image) => {
      this.customCarouselLogo = image
    })
  }

  public selectPresetCarouselLogo(logo: PresetLogo): void {
    this.customCarouselLogo = logo.src
  }

  public resetCarouselLogo(): void {
    this.customCarouselLogo = undefined
  }

  public allowCarouselDrop(event: DragEvent): void {
    event.preventDefault()
    this.isCarouselDragActive = true
  }

  public leaveCarouselDrop(event: DragEvent): void {
    event.preventDefault()
    this.isCarouselDragActive = false
  }

  public handleCarouselDrop(event: DragEvent): void {
    event.preventDefault()
    this.isCarouselDragActive = false
    this.addCarouselFiles(event.dataTransfer?.files)
  }

  public updateCarouselPhotos(event: Event): void {
    const input = event.target as HTMLInputElement
    this.addCarouselFiles(input.files)
    input.value = ''
  }

  public removeCarouselPhoto(photo: CarouselPhoto): void {
    this.carouselPhotos = this.carouselPhotos.filter((item) => item.id !== photo.id)
  }

  public clearCarouselPhotos(): void {
    this.carouselPhotos = []
    this.carouselPreviewIndex = 0
  }

  public photoBackground(photo: CarouselPhoto): string {
    return `linear-gradient(180deg, rgb(23 18 31 / 18%) 0%, rgb(23 18 31 / 8%) 44%, rgb(23 18 31 / 72%) 100%), url("${photo.src}")`
  }

  public carouselPhotoBackground(photo: CarouselPhoto): string {
    return `url("${photo.src}")`
  }

  public previousCarouselSlide(): void {
    if (this.canGoToPreviousCarouselSlide) {
      this.carouselPreviewIndex -= 1
    }
  }

  public nextCarouselSlide(): void {
    if (this.canGoToNextCarouselSlide) {
      this.carouselPreviewIndex += 1
    }
  }

  public selectCarouselPreview(index: number): void {
    this.carouselPreviewIndex = index
  }

  public selectPedagogyTemplate(templateId: string): void {
    this.selectedPedagogyTemplateId = templateId
    this.pedagogySlides = this.clonePedagogySlides(this.selectedPedagogyTemplate)
    this.pedagogyPreviewIndex = 0
  }

  public previousPedagogySlide(): void {
    if (this.canGoToPreviousPedagogySlide) {
      this.pedagogyPreviewIndex -= 1
    }
  }

  public nextPedagogySlide(): void {
    if (this.canGoToNextPedagogySlide) {
      this.pedagogyPreviewIndex += 1
    }
  }

  public selectPedagogyPreview(index: number): void {
    this.pedagogyPreviewIndex = index
  }

  public addPedagogySlide(): void {
    if (!this.canAddPedagogySlide) {
      return
    }

    this.pedagogySlides = [
      ...this.pedagogySlides,
      {
        eyebrow: 'À compléter',
        title: 'Nouvelle slide',
        text: 'Ajoute ici le message de cette slide.',
      },
    ]
    this.pedagogyPreviewIndex = this.pedagogySlides.length - 1
  }

  public removePedagogySlide(index: number): void {
    if (this.pedagogySlides.length <= 1) {
      return
    }

    this.pedagogySlides = this.pedagogySlides.filter((slide, slideIndex) => slideIndex !== index)
    this.pedagogyPreviewIndex = Math.min(this.pedagogyPreviewIndex, this.pedagogyTotalSlideCount - 1)
  }

  public pedagogySlideClass(slide: PedagogySlide, index: number = this.pedagogyPreviewIndex): string {
    const density = this.pedagogyTextLength(slide) > 190 ? 'dense' : this.pedagogyTextLength(slide) > 135 ? 'compact' : 'regular'
    const imageClass = slide.image ? ' pedagogy-slide-with-image' : ''
    const imagePlacementClass = slide.image && index % 2 === 1 ? ' pedagogy-slide-image-left' : ''
    return `carousel-slide pedagogy-slide pedagogy-slide-${density}${imageClass}${imagePlacementClass}`
  }

  public updatePedagogySlideImage(event: Event, index: number): void {
    this.readImage(event, (image) => {
      this.pedagogySlides = this.pedagogySlides.map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, image } : slide
      ))
    })
  }

  public removePedagogySlideImage(index: number): void {
    this.pedagogySlides = this.pedagogySlides.map((slide, slideIndex) => {
      if (slideIndex !== index) {
        return slide
      }

      const { image, ...slideWithoutImage } = slide
      return slideWithoutImage
    })
  }

  public teamById(teamId: string): ChampionshipTeam {
    return this.championshipTeams.find((team) => team.id === teamId) || {
      id: '',
      name: 'Equipe à choisir',
      label: 'A choisir',
      color: '#fff8ed',
      textColor: '#17121f',
      points: 0,
      faults: 0,
      faultsList: '',
    }
  }

  public standingById(teamId: string): ChampionshipStanding {
    return this.championshipStandings.find((team) => team.id === teamId) || this.championshipStandings[0]
  }

  public faultItems(team: ChampionshipTeam): string[] {
    return team.faultsList
      .split(/[;\n]/)
      .map((fault) => fault.trim())
      .filter(Boolean)
  }

  public matchWinnerLabel(match: ChampionshipMatch): string {
    if (!this.isCompleteChampionshipMatch(match)) {
      return 'Duel pas encore revele'
    }

    const winner = this.getMatchWinner(match)
    if (!winner) {
      return 'Egalite dramatique'
    }

    return `${winner.label} rafle le rideau`
  }

  public selectChampionshipPreview(index: number): void {
    this.championshipPreviewIndex = Math.max(0, Math.min(index, 2))
  }

  public previousChampionshipSlide(): void {
    if (this.canGoToPreviousChampionshipSlide) {
      this.championshipPreviewIndex -= 1
    }
  }

  public nextChampionshipSlide(): void {
    if (this.canGoToNextChampionshipSlide) {
      this.championshipPreviewIndex += 1
    }
  }

  public syncChampionshipFinalsFromStandings(): void {
    const standings = this.championshipStandings
    if (standings.length < 4) {
      return
    }

    this.championshipMatches = this.championshipMatches.map((match) => {
      if (match.id === 'small-final') {
        return { ...match, teamAId: standings[2].id, teamBId: standings[3].id }
      }

      if (match.id === 'big-final') {
        return { ...match, teamAId: standings[0].id, teamBId: standings[1].id }
      }

      return match
    })
    this.persistChampionshipState()
  }

  public addChampionshipMatch(): void {
    const index = this.championshipMatches.length + 1
    const id = `match-${Date.now()}`
    this.championshipMatches = [
      ...this.championshipMatches,
      {
        id,
        label: `Match ${index}`,
        teamAId: '',
        teamBId: '',
        scoreA: 0,
        scoreB: 0,
      },
    ]
    this.selectedChampionshipMatchId = id
    this.persistChampionshipState()
  }

  public removeChampionshipMatch(match: ChampionshipMatch): void {
    if (this.championshipMatches.length <= 1) {
      return
    }

    const removedIndex = this.championshipMatches.findIndex((item) => item.id === match.id)
    this.championshipMatches = this.championshipMatches.filter((item) => item.id !== match.id)

    if (this.selectedChampionshipMatchId === match.id) {
      const nextIndex = Math.min(Math.max(removedIndex, 0), this.championshipMatches.length - 1)
      this.selectedChampionshipMatchId = this.championshipMatches[nextIndex].id
    }
    this.persistChampionshipState()
  }

  public persistChampionshipState(): void {
    try {
      const state: PersistedChampionshipState = {
        title: this.championshipTitle,
        edition: this.championshipEdition,
        selectedMatchId: this.selectedChampionshipMatchId,
        teams: this.championshipTeams,
        matches: this.championshipMatches,
      }
      localStorage.setItem(ToolsComponent.CHAMPIONSHIP_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      // Local storage can be unavailable in private browsing or prerender-like contexts.
    }
  }

  public unlockTools(): void {
    if (this.accessCode.trim() === PRIVATE_ACCESS_CODE) {
      this.isUnlocked = true
      this.accessError = ''
      unlockPrivateAccess()
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

  private restoreChampionshipState(): void {
    try {
      const rawState = localStorage.getItem(ToolsComponent.CHAMPIONSHIP_STORAGE_KEY)
      if (!rawState) {
        return
      }

      const state = JSON.parse(rawState) as PersistedChampionshipState

      if (typeof state.title === 'string') {
        this.championshipTitle = state.title
      }

      if (typeof state.edition === 'string') {
        this.championshipEdition = state.edition
      }

      if (Array.isArray(state.teams)) {
        const savedTeams = new Map(state.teams.map((team) => [team.id, team]))
        this.championshipTeams = this.championshipTeams.map((team) => ({
          ...team,
          ...savedTeams.get(team.id),
          id: team.id,
          color: team.color,
          textColor: team.textColor,
        }))
      }

      if (Array.isArray(state.matches) && state.matches.length) {
        this.championshipMatches = state.matches
          .filter((match) => match && typeof match.id === 'string')
          .map((match, index) => ({
            id: match.id || `match-${index + 1}`,
            label: String(match.label || `Match ${index + 1}`),
            teamAId: String(match.teamAId || ''),
            teamBId: String(match.teamBId || ''),
            scoreA: this.safeScore(match.scoreA),
            scoreB: this.safeScore(match.scoreB),
          }))
      }

      if (
        typeof state.selectedMatchId === 'string' &&
        this.championshipMatches.some((match) => match.id === state.selectedMatchId)
      ) {
        this.selectedChampionshipMatchId = state.selectedMatchId
      } else {
        this.selectedChampionshipMatchId = this.championshipMatches[0]?.id || ''
      }
    } catch (error) {
      try {
        localStorage.removeItem(ToolsComponent.CHAMPIONSHIP_STORAGE_KEY)
      } catch (storageError) {
        // Nothing to clean up when local storage itself is unavailable.
      }
    }
  }

  private async addCarouselFiles(files?: FileList | null): Promise<void> {
    if (!files) {
      return
    }

    const availableSlots = ToolsComponent.CAROUSEL_MAX_PHOTOS - this.carouselPhotos.length
    if (availableSlots <= 0) {
      return
    }

    const batchId = Date.now()
    const photos = await Promise.all(
      Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots)
      .map(async (file, index) => ({
        id: `${batchId}-${index}-${file.name}`,
        name: file.name,
        src: await this.readFileAsDataUrl(file),
      }))
    )

    this.carouselPhotos = [...this.carouselPhotos, ...photos]
    this.carouselPreviewIndex = Math.min(this.carouselPreviewIndex, this.carouselSlideCount - 1)
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.readAsDataURL(file)
    })
  }

  private clonePedagogySlides(template: PedagogyTemplate): PedagogySlide[] {
    return template.slides.map((slide) => ({ ...slide }))
  }

  private pedagogyTextLength(slide: PedagogySlide): number {
    return `${slide.eyebrow} ${slide.title} ${slide.text}`.length
  }

  public async exportVisual(): Promise<void> {
    if (!this.visualCanvas || this.isExporting) {
      return
    }

    this.isExporting = true

    try {
      const file = await this.createVisualFile()
      this.downloadBlob(file, file.name)
    } catch (error) {
      throw error
    } finally {
      this.isExporting = false
    }
  }

  public async exportCarousel(): Promise<void> {
    if (!this.carouselSlides?.length || this.isCarouselExporting) {
      return
    }

    this.isCarouselExporting = true

    try {
      const files = await this.createCarouselFiles()
      for (const file of files) {
        this.downloadBlob(file, file.name)
        await this.wait(140)
      }
    } finally {
      this.isCarouselExporting = false
    }
  }

  public async shareVisual(): Promise<void> {
    if (this.isSharing || !this.visualCanvas) {
      return
    }

    this.isSharing = true

    try {
      const file = await this.createVisualFile()
      await this.shareFiles([file], 'Visuel LUDI')
    } finally {
      this.isSharing = false
    }
  }

  public async shareCarousel(): Promise<void> {
    if (this.isSharing || !this.carouselSlides?.length) {
      return
    }

    this.isSharing = true

    try {
      const files = await this.createCarouselFiles()
      await this.shareFiles(files, 'Carrousel LUDI')
    } finally {
      this.isSharing = false
    }
  }

  public async exportPedagogyCarousel(): Promise<void> {
    if (!this.pedagogySlidesRef?.length || this.isPedagogyExporting) {
      return
    }

    this.isPedagogyExporting = true

    try {
      const files = await this.createPedagogyFiles()
      for (const file of files) {
        this.downloadBlob(file, file.name)
        await this.wait(140)
      }
    } finally {
      this.isPedagogyExporting = false
    }
  }

  public async sharePedagogyCarousel(): Promise<void> {
    if (this.isSharing || !this.pedagogySlidesRef?.length) {
      return
    }

    this.isSharing = true

    try {
      const files = await this.createPedagogyFiles()
      await this.shareFiles(files, 'Carrousel pédagogique LUDI')
    } finally {
      this.isSharing = false
    }
  }

  public async exportChampionshipSlides(): Promise<void> {
    if (!this.championshipSlidesRef?.length || this.isChampionshipExporting) {
      return
    }

    this.isChampionshipExporting = true

    try {
      const files = await this.createChampionshipFiles()
      for (const file of files) {
        this.downloadBlob(file, file.name)
        await this.wait(140)
      }
    } finally {
      this.isChampionshipExporting = false
    }
  }

  public async shareChampionshipSlides(): Promise<void> {
    if (this.isSharing || !this.championshipSlidesRef?.length) {
      return
    }

    this.isSharing = true

    try {
      const files = await this.createChampionshipFiles()
      await this.shareFiles(files, 'Resultats Championnat Improvisem')
    } finally {
      this.isSharing = false
    }
  }

  private async createVisualFile(): Promise<File> {
    if (!this.visualCanvas) {
      throw new Error('Aucun visuel à exporter')
    }

    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default

    if (this.isReelFormat) {
      return new File([await this.createReelBlob(html2canvas)], this.exportFileName, {
        type: 'video/webm',
      })
    }

    const preview = this.visualCanvas.nativeElement
    preview.classList.add('visual-export-frame')

    try {
      await this.wait(40)
      const rect = preview.getBoundingClientRect()
      const canvas = await html2canvas(preview, {
        allowTaint: false,
        backgroundColor: null,
        height: Math.ceil(rect.height),
        scale: this.exportScale,
        useCORS: true,
        width: Math.ceil(rect.width),
        windowHeight: Math.ceil(rect.height),
        windowWidth: Math.ceil(rect.width),
      })

      return new File([await this.canvasToBlob(canvas)], this.exportFileName, {
        type: 'image/png',
      })
    } finally {
      preview.classList.remove('visual-export-frame')
    }
  }

  private async createCarouselFiles(): Promise<File[]> {
    if (!this.carouselSlides?.length) {
      return []
    }

    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const slides = this.carouselSlides.toArray()
    const files: File[] = []
    const baseFileName = this.fileNameBase('carrousel-apres-spectacle')

    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index].nativeElement
      const canvas = await html2canvas(slide, {
        allowTaint: false,
        backgroundColor: null,
        scale: 1080 / slide.clientWidth,
        useCORS: true,
      })
      const fileName = `${baseFileName}-${String(index + 1).padStart(2, '0')}.png`
      files.push(new File([await this.canvasToBlob(canvas)], fileName, { type: 'image/png' }))
    }

    return files
  }

  private async createPedagogyFiles(): Promise<File[]> {
    if (!this.pedagogySlidesRef?.length) {
      return []
    }

    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const slides = this.pedagogySlidesRef.toArray()
    const files: File[] = []
    const baseFileName = this.fileNameBase(`carrousel-pedagogique-${this.selectedPedagogyTemplate.id}`)

    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index].nativeElement
      const canvas = await html2canvas(slide, {
        allowTaint: false,
        backgroundColor: null,
        scale: 1080 / slide.clientWidth,
        useCORS: true,
      })
      const fileName = `${baseFileName}-${String(index + 1).padStart(2, '0')}.png`
      files.push(new File([await this.canvasToBlob(canvas)], fileName, { type: 'image/png' }))
    }

    return files
  }

  private async createChampionshipFiles(): Promise<File[]> {
    if (!this.championshipSlidesRef?.length) {
      return []
    }

    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const slides = this.championshipSlidesRef.toArray().slice(0, 3)
    const files: File[] = []
    const baseFileName = this.fileNameBase(`championnat-improvisem-${this.slugify(this.championshipTitle)}`)

    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index].nativeElement
      const canvas = await html2canvas(slide, {
        allowTaint: false,
        backgroundColor: null,
        scale: 1080 / slide.clientWidth,
        useCORS: true,
      })
      const slideName: ChampionshipSlideId = index === 0 ? 'match' : index === 1 ? 'standings' : 'dates'
      const fileName = `${baseFileName}-${slideName}.png`
      files.push(new File([await this.canvasToBlob(canvas)], fileName, { type: 'image/png' }))
    }

    return files
  }

  private async shareFiles(files: File[], title: string): Promise<void> {
    const nav = navigator as Navigator & {
      canShare?: (data: { files?: File[] }) => boolean
      share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>
    }

    if (nav.canShare?.({ files }) && nav.share) {
      await nav.share({
        files,
        title,
        text: '@luditoulouse',
      })
      return
    }

    for (const file of files) {
      this.downloadBlob(file, file.name)
      await this.wait(140)
    }
  }

  private async exportReel(html2canvas: Html2Canvas): Promise<void> {
    this.downloadBlob(await this.createReelBlob(html2canvas), this.exportFileName)
  }

  private async createReelBlob(html2canvas: Html2Canvas): Promise<Blob> {
    if (!this.visualCanvas) {
      throw new Error('Aucun reel à exporter')
    }

    const width = 1080
    const height = 1920
    const recorderCanvas = document.createElement('canvas')
    recorderCanvas.width = width
    recorderCanvas.height = height

    const context = recorderCanvas.getContext('2d')
    if (!context) {
      throw new Error('Impossible de préparer le canvas du reel')
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
    const previewRect = preview.getBoundingClientRect()

    const snapshot = await html2canvas(preview, {
      allowTaint: false,
      backgroundColor: null,
      height: Math.ceil(previewRect.height),
      scale: this.exportScale,
      useCORS: true,
      width: Math.ceil(previewRect.width),
      windowHeight: Math.ceil(previewRect.height),
      windowWidth: Math.ceil(previewRect.width),
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
    return new Blob(chunks, { type: mimeType })
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

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, duration))
  }

  private get exportFileName(): string {
    const extension = this.isReelFormat ? 'webm' : 'png'
    const base = this.fileNameBase(this.visualExportKind)
    return `${base}-${this.selectedFormat}.${extension}`
  }

  private get visualExportKind(): string {
    if (this.selectedMode === 'show') {
      return 'spectacle'
    }

    return this.selectedMode === 'week' ? 'dates-semaine' : 'dates-mois'
  }

  private fileNameBase(kind: string): string {
    const show = this.selectedMode === 'show' || kind.includes('spectacle')
      ? this.selectedShow
      : undefined
    const parts = ['ludi', kind]
    const showName = show?.name ? this.slugify(show.name) : ''
    const date = show?.date
      ? this.fileDate(new Date(show.date * 1000))
      : (!kind.includes('pedagogique') ? this.fileDate(this.periodBaseDate) : '')

    if (showName) {
      parts.push(showName)
    }

    if (date) {
      parts.push(date)
    }

    return parts.filter(Boolean).join('-')
  }

  private getMatchWinner(match: ChampionshipMatch): ChampionshipStanding | undefined {
    if (!this.isCompleteChampionshipMatch(match)) {
      return undefined
    }

    if (this.safeScore(match.scoreA) === this.safeScore(match.scoreB)) {
      return undefined
    }

    return this.safeScore(match.scoreA) > this.safeScore(match.scoreB)
      ? this.standingById(match.teamAId)
      : this.standingById(match.teamBId)
  }

  private getMatchLoser(match: ChampionshipMatch): ChampionshipStanding | undefined {
    if (!this.isCompleteChampionshipMatch(match)) {
      return undefined
    }

    if (this.safeScore(match.scoreA) === this.safeScore(match.scoreB)) {
      return undefined
    }

    return this.safeScore(match.scoreA) < this.safeScore(match.scoreB)
      ? this.standingById(match.teamAId)
      : this.standingById(match.teamBId)
  }

  private safeScore(score: number): number {
    return Number.isFinite(Number(score)) ? Number(score) : 0
  }

  private isCompleteChampionshipMatch(match: ChampionshipMatch): boolean {
    return Boolean(
      match.teamAId &&
      match.teamBId &&
      match.teamAId !== match.teamBId &&
      this.championshipTeams.some((team) => team.id === match.teamAId) &&
      this.championshipTeams.some((team) => team.id === match.teamBId)
    )
  }

  private fileDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private get exportScale(): number {
    if (this.isPostFormat) {
      return 1080 / 420
    }

    if (this.isA2Format) {
      return 4961 / 420
    }

    return 1920 / 600
  }
}
