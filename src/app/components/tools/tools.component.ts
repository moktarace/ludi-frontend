import { Component, ElementRef, HostListener, Input, QueryList, ViewChild, ViewChildren } from '@angular/core'
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
type SocialReelMediaKind = 'image' | 'video'
type SocialReelMediaOrientation = 'portrait' | 'landscape'
type SocialReelSlideKind = 'content' | 'insert' | 'punchline' | 'dates'

interface SocialReelTextPart {
  text: string
  highlighted: boolean
}

interface SocialReelMedia {
  id: string
  name: string
  kind: SocialReelMediaKind
  src: string
  objectUrl?: string
  file: File
  previewSrc?: string
  previewFailed?: boolean
  orientation?: SocialReelMediaOrientation
  element?: HTMLImageElement | HTMLVideoElement
  ready?: boolean
  error?: string
}

interface SocialReelSlide {
  id: string
  kind: SocialReelSlideKind
  text: string
  parts: SocialReelTextPart[]
  media?: SocialReelMedia
  index: number
}

interface PersistedSocialReelState {
  text?: string
  duration?: number
  includeDates?: boolean
}

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

interface PersistedToolsDraftState {
  selectedFormat?: VisualFormat
  selectedMode?: VisualMode
  selectedShowId?: string
  selectedToneValue?: string
  customPoster?: string
  customBackgroundTintEnabled?: boolean
  customQrLink?: string
  showQrCode?: boolean
  isPosterHidden?: boolean
  printLogoPlacement?: CarouselPlacement
  printLogoSize?: CarouselLogoSize
  visualTagline?: string
  visualTaglinePlacement?: VisualTaglinePlacement
  customCarouselLogo?: string
  carouselLogoPlacement?: CarouselPlacement
  carouselLogoSize?: CarouselLogoSize
  carouselTextPlacement?: CarouselPlacement
  carouselCoverText?: string
  selectedPedagogyTemplateId?: string
  pedagogySlides?: PedagogySlide[]
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
  private static SOCIAL_REEL_STORAGE_KEY = 'ludi-tools-reel-slideshow'
  private static DRAFT_STORAGE_KEY = 'ludi-tools-draft'
  private static SOCIAL_REEL_WIDTH = 1080
  private static SOCIAL_REEL_HEIGHT = 1920
  private static SOCIAL_REEL_FRAME_RATE = 24
  private static SOCIAL_REEL_INSERT_SECONDS = 2.2
  private static SOCIAL_REEL_PUNCHLINE_SECONDS = 1.35
  private static SOCIAL_REEL_DEFAULT_TEXT = [
    "Ils ont dit que c'etait juste une soiree d'impro.",
    '[[Mauvaise nouvelle.]]',
    "Puis quelqu'un a annonce *un match a enjeu*.",
    "Depuis, le campus vit dans une ambiance de finale de Ligue des Champions sans VAR.",
    '!! LES POINTS SONT RÉELS.',
    "Prochaine étape : venir vérifier ça en salle.",
  ].join('\n\n')
  private static SOCIAL_REEL_LEGACY_DEFAULT_TEXTS = [
    [
      "Ils ont dit que c'etait juste une soiree d'impro.",
      "Puis quelqu'un a annonce *un match a enjeu*.",
      "Depuis, le campus vit dans une ambiance de finale de Ligue des Champions sans VAR.",
    ].join('\n\n'),
    [
      "Ils ont dit que c'etait juste une soiree d'impro.",
      '[[Mauvaise nouvelle.]]',
      "Puis quelqu'un a annonce *un match a enjeu*.",
      '!! LES POINTS SONT RÉELS.',
      "Depuis, le campus vit dans une ambiance de finale de Ligue des Champions sans VAR.",
    ].join('\n\n'),
  ]

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

  @ViewChild('socialReelDatesSlide')
  public socialReelDatesSlideRef?: ElementRef<HTMLElement>

  private socialReelLogoImage?: HTMLImageElement

  public readonly formats: { label: string; value: VisualFormat }[] = [
    { label: 'Post', value: 'post' },
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
  public socialReelText = ToolsComponent.SOCIAL_REEL_DEFAULT_TEXT
  public socialReelMedia: SocialReelMedia[] = []
  public socialReelPreviewIndex = 0
  public socialReelSecondsPerSlide = 4
  public socialReelIncludeDates = true
  public isSocialReelExporting = false
  public socialReelError = ''
  public actionMessage = ''
  public actionMessageType: 'success' | 'error' = 'success'
  private draftSaveTimer?: number
  private actionMessageTimer?: number

  constructor() {
    this.restoreDraftState()
    this.restoreChampionshipState()
    this.restoreSocialReelState()
  }

  @HostListener('input')
  @HostListener('change')
  @HostListener('click')
  public scheduleDraftSave(): void {
    window.clearTimeout(this.draftSaveTimer)
    this.draftSaveTimer = window.setTimeout(() => this.persistDraftState(), 120)
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

  public get socialReelAgendaShows(): Show[] {
    return this.carouselAgendaShows.slice(0, 3)
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
    return this.isChampionshipExporting ? 'Gravure en PNG...' : 'Télécharger les slides'
  }

  public get championshipShareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager les slides'
  }

  public get socialReelSlides(): SocialReelSlide[] {
    const paragraphs = this.socialReelText
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    let mediaIndex = 0
    const contentSlides: SocialReelSlide[] = (paragraphs.length ? paragraphs : ["Ajoute ton texte, une idee par paragraphe."])
      .map((rawText, index) => {
        const insertText = this.socialReelInsertText(rawText)
        const punchlineText = this.socialReelPunchlineText(rawText)
        const isInsert = Boolean(insertText)
        const isPunchline = Boolean(punchlineText)
        const text = insertText || punchlineText || rawText
        const media = !isInsert && !isPunchline && this.socialReelMedia.length
          ? this.socialReelMedia[mediaIndex % this.socialReelMedia.length]
          : undefined

        if (!isInsert && !isPunchline) {
          mediaIndex += 1
        }

        return {
          id: `reel-slide-${index}`,
          kind: isInsert ? 'insert' : isPunchline ? 'punchline' : 'content',
          text,
          parts: this.parseSocialReelText(text),
          media,
          index,
        }
      })

    return [
      ...contentSlides,
      {
        id: 'reel-dates',
        kind: 'dates',
        text: 'Prochaines dates',
        parts: [{ text: 'Prochaines dates', highlighted: false }],
        index: contentSlides.length,
      },
    ]
  }

  public get socialReelContentSlideCount(): number {
    return Math.max(1, this.socialReelSlides.filter((slide) => slide.kind !== 'dates').length)
  }

  public get socialReelSlideCount(): number {
    return this.socialReelSlides.length
  }

  public get socialReelCurrentSlide(): SocialReelSlide {
    return this.socialReelSlides[Math.min(this.socialReelPreviewIndex, this.socialReelSlideCount - 1)] || this.socialReelSlides[0]
  }

  public get isSocialReelDatesPreview(): boolean {
    return this.socialReelCurrentSlide?.id === 'reel-dates'
  }

  public get isSocialReelInsertPreview(): boolean {
    return this.socialReelCurrentSlide?.kind === 'insert'
  }

  public get isSocialReelPunchlinePreview(): boolean {
    return this.socialReelCurrentSlide?.kind === 'punchline'
  }

  public get isSocialReelTextCardPreview(): boolean {
    return this.isSocialReelInsertPreview || this.isSocialReelPunchlinePreview
  }

  public get socialReelCurrentInsertWords(): string[] {
    return this.socialReelInsertWords(this.socialReelCurrentSlide?.text || '')
  }

  public get canGoToPreviousSocialReelSlide(): boolean {
    return this.socialReelPreviewIndex > 0
  }

  public get canGoToNextSocialReelSlide(): boolean {
    return this.socialReelPreviewIndex < this.socialReelSlideCount - 1
  }

  public get socialReelExportLabel(): string {
    return this.isSocialReelExporting ? 'Generation du reel...' : 'Télécharger le reel muet'
  }

  public get socialReelShareLabel(): string {
    return this.isSharing ? 'Préparation...' : 'Partager le reel'
  }

  public get socialReelCaption(): string {
    const firstSlide = this.socialReelSlides.find((slide) => slide.id !== 'reel-dates')
    return `${this.cleanSocialReelMarkup(firstSlide?.text || 'Reel LUDI')}\n\n@luditoulouse`
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

    return ToolsComponent.FULL_DATE_FORMATTER.format(new Date(show.date * 1000)).replace(/(\d{2}):(\d{2})/, '$1h $2')
  }

  public priceLabel(show: Show): string {
    if (!show.price) {
      return 'Entrée gratuite'
    }

    return show.reducedPrice
      ? `${show.price} € / ${show.reducedPrice} €`
      : `${show.price} €`
  }

  public selectFormat(format: VisualFormat): void {
    if (!this.formats.some((item) => item.value === format)) {
      format = 'post'
    }

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

  public updateSocialReelText(value: string): void {
    this.socialReelText = value
    this.socialReelPreviewIndex = Math.min(this.socialReelPreviewIndex, this.socialReelSlideCount - 1)
    this.persistSocialReelState()
  }

  public updateSocialReelSeconds(value: number): void {
    this.socialReelSecondsPerSlide = Math.max(2, Math.min(Number(value) || 4, 9))
    this.persistSocialReelState()
  }

  public updateSocialReelIncludeDates(value: boolean): void {
    this.socialReelIncludeDates = true
    this.socialReelPreviewIndex = Math.min(this.socialReelPreviewIndex, this.socialReelSlideCount - 1)
    this.persistSocialReelState()
  }

  public async updateSocialReelMedia(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    this.socialReelError = ''

    const acceptedFiles = files.filter((file) => this.isSupportedSocialReelFile(file))
    const rejectedCount = files.length - acceptedFiles.length
    if (rejectedCount) {
      this.socialReelError = `${rejectedCount} fichier(s) ignores: utilise JPG, PNG, GIF, WebP, MP4, MOV/M4V ou WebM.`
    }

    try {
      const media = await Promise.all(acceptedFiles.map((file) => this.createSocialReelMedia(file)))
      this.socialReelMedia = [...this.socialReelMedia, ...media].slice(0, 20)
    } catch (error) {
      this.socialReelError = error instanceof Error ? error.message : 'Impossible de charger un media.'
    } finally {
      input.value = ''
    }
  }

  public removeSocialReelMedia(media: SocialReelMedia): void {
    if (media.objectUrl) {
      URL.revokeObjectURL(media.objectUrl)
    }
    this.socialReelMedia = this.socialReelMedia.filter((item) => item.id !== media.id)
  }

  public clearSocialReelMedia(): void {
    for (const media of this.socialReelMedia) {
      if (media.objectUrl) {
        URL.revokeObjectURL(media.objectUrl)
      }
    }
    this.socialReelMedia = []
  }

  public socialReelMediaClass(media?: SocialReelMedia): string {
    if (!media || media.kind !== 'image') {
      return ''
    }

    return media.orientation === 'landscape'
      ? 'social-reel-media-landscape'
      : 'social-reel-media-portrait'
  }

  public markSocialReelMediaError(media?: SocialReelMedia): void {
    if (!media) {
      return
    }

    if (media.kind === 'video' && media.previewSrc) {
      media.previewFailed = true
      return
    }

    media.error = `${media.name} ne peut pas etre lu par le navigateur.`
    this.socialReelError = media.error
  }

  public playSocialReelPreviewVideo(event: Event): void {
    const video = event.target as HTMLVideoElement
    video.muted = true
    video.loop = true
    video.playsInline = true
    const playPromise = video.play()
    if (playPromise) {
      playPromise.catch(() => {
        // The export still works; some browsers require a user gesture for preview playback.
      })
    }
  }

  public socialReelMediaLabel(media?: SocialReelMedia): string {
    if (!media) {
      return 'Fond LUDI par defaut'
    }

    return media.kind === 'video' ? `Video: ${media.name}` : `Image: ${media.name}`
  }

  public selectSocialReelPreview(index: number): void {
    this.socialReelPreviewIndex = Math.max(0, Math.min(index, this.socialReelSlideCount - 1))
  }

  public previousSocialReelSlide(): void {
    if (this.canGoToPreviousSocialReelSlide) {
      this.socialReelPreviewIndex -= 1
    }
  }

  public nextSocialReelSlide(): void {
    if (this.canGoToNextSocialReelSlide) {
      this.socialReelPreviewIndex += 1
    }
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
    const standing = this.championshipStandings.find((team) => team.id === teamId)
    if (standing) {
      return standing
    }

    return {
      ...this.teamById(teamId),
      wins: 0,
      losses: 0,
      draws: 0,
      scored: 0,
      conceded: 0,
      difference: 0,
      rank: 0,
    }
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

  private persistDraftState(): void {
    try {
      const state: PersistedToolsDraftState = {
        selectedFormat: this.selectedFormat,
        selectedMode: this.selectedMode,
        selectedShowId: this.selectedShowId,
        selectedToneValue: this.selectedToneValue,
        customPoster: this.persistableAsset(this.customPoster),
        customBackgroundTintEnabled: this.customBackgroundTintEnabled,
        customQrLink: this.customQrLink,
        showQrCode: this.showQrCode,
        isPosterHidden: this.isPosterHidden,
        printLogoPlacement: this.printLogoPlacement,
        printLogoSize: this.printLogoSize,
        visualTagline: this.visualTagline,
        visualTaglinePlacement: this.visualTaglinePlacement,
        customCarouselLogo: this.persistableAsset(this.customCarouselLogo),
        carouselLogoPlacement: this.carouselLogoPlacement,
        carouselLogoSize: this.carouselLogoSize,
        carouselTextPlacement: this.carouselTextPlacement,
        carouselCoverText: this.carouselCoverText,
        selectedPedagogyTemplateId: this.selectedPedagogyTemplateId,
        pedagogySlides: this.pedagogySlides.map((slide) => ({
          ...slide,
          image: this.persistableAsset(slide.image),
        })),
      }
      window.localStorage.setItem(ToolsComponent.DRAFT_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // The tools remain usable when storage is unavailable or full.
    }
  }

  private restoreDraftState(): void {
    try {
      const stored = window.localStorage.getItem(ToolsComponent.DRAFT_STORAGE_KEY)
      if (!stored) {
        return
      }

      const state = JSON.parse(stored) as PersistedToolsDraftState
      const formats: VisualFormat[] = ['post', 'story', 'reel', 'poster']
      const modes: VisualMode[] = ['show', 'week', 'month']
      const placements: CarouselPlacement[] = ['top', 'center', 'bottom']
      const logoSizes: CarouselLogoSize[] = ['s', 'm', 'l', 'xl']
      const taglinePlacements: VisualTaglinePlacement[] = [
        'top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right',
      ]

      if (state.selectedFormat && formats.includes(state.selectedFormat)) this.selectedFormat = state.selectedFormat
      if (state.selectedMode && modes.includes(state.selectedMode)) this.selectedMode = state.selectedMode
      if (typeof state.selectedShowId === 'string') this.selectedShowId = state.selectedShowId
      if (state.selectedToneValue && this.visualTones.some((tone) => tone.value === state.selectedToneValue)) this.selectedToneValue = state.selectedToneValue
      if (typeof state.customPoster === 'string') this.customPoster = state.customPoster
      if (typeof state.customBackgroundTintEnabled === 'boolean') this.customBackgroundTintEnabled = state.customBackgroundTintEnabled
      if (typeof state.customQrLink === 'string') this.customQrLink = state.customQrLink
      if (typeof state.showQrCode === 'boolean') this.showQrCode = state.showQrCode
      if (typeof state.isPosterHidden === 'boolean') this.isPosterHidden = state.isPosterHidden
      if (state.printLogoPlacement && placements.includes(state.printLogoPlacement)) this.printLogoPlacement = state.printLogoPlacement
      if (state.printLogoSize && logoSizes.includes(state.printLogoSize)) this.printLogoSize = state.printLogoSize
      if (typeof state.visualTagline === 'string') this.visualTagline = state.visualTagline
      if (state.visualTaglinePlacement && taglinePlacements.includes(state.visualTaglinePlacement)) this.visualTaglinePlacement = state.visualTaglinePlacement
      if (typeof state.customCarouselLogo === 'string') this.customCarouselLogo = state.customCarouselLogo
      if (state.carouselLogoPlacement && placements.includes(state.carouselLogoPlacement)) this.carouselLogoPlacement = state.carouselLogoPlacement
      if (state.carouselLogoSize && logoSizes.includes(state.carouselLogoSize)) this.carouselLogoSize = state.carouselLogoSize
      if (state.carouselTextPlacement && placements.includes(state.carouselTextPlacement)) this.carouselTextPlacement = state.carouselTextPlacement
      if (typeof state.carouselCoverText === 'string') this.carouselCoverText = state.carouselCoverText
      if (state.selectedPedagogyTemplateId && this.pedagogyTemplates.some((template) => template.id === state.selectedPedagogyTemplateId)) {
        this.selectedPedagogyTemplateId = state.selectedPedagogyTemplateId
      }
      if (Array.isArray(state.pedagogySlides) && state.pedagogySlides.length) {
        this.pedagogySlides = state.pedagogySlides.slice(0, ToolsComponent.PEDAGOGY_MAX_CONTENT_SLIDES)
      }
    } catch {
      // Ignore corrupted or unavailable drafts.
    }
  }

  private persistableAsset(asset?: string): string | undefined {
    return asset && !asset.startsWith('data:') && !asset.startsWith('blob:') ? asset : undefined
  }

  private showActionMessage(message: string, type: 'success' | 'error' = 'success'): void {
    window.clearTimeout(this.actionMessageTimer)
    this.actionMessage = message
    this.actionMessageType = type
    this.actionMessageTimer = window.setTimeout(() => {
      this.actionMessage = ''
    }, 5000)
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.name !== 'AbortError' ? error.message : fallback
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
      this.showActionMessage(`Visuel téléchargé : ${file.name}`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Téléchargement du visuel impossible.'), 'error')
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
      this.showActionMessage(`${files.length} image${files.length > 1 ? 's' : ''} téléchargée${files.length > 1 ? 's' : ''}.`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Téléchargement du carrousel impossible.'), 'error')
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
      this.showActionMessage('Visuel prêt à être partagé.')
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Partage du visuel annulé ou impossible.'), 'error')
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
      this.showActionMessage(`${files.length} image${files.length > 1 ? 's' : ''} prête${files.length > 1 ? 's' : ''} à être partagée${files.length > 1 ? 's' : ''}.`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Partage du carrousel annulé ou impossible.'), 'error')
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
      this.showActionMessage(`${files.length} slide${files.length > 1 ? 's' : ''} téléchargée${files.length > 1 ? 's' : ''}.`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Téléchargement du carrousel pédagogique impossible.'), 'error')
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
      this.showActionMessage(`${files.length} slide${files.length > 1 ? 's' : ''} prête${files.length > 1 ? 's' : ''} à être partagée${files.length > 1 ? 's' : ''}.`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Partage du carrousel pédagogique annulé ou impossible.'), 'error')
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
      this.showActionMessage(`${files.length} slide${files.length > 1 ? 's' : ''} Improvisem téléchargée${files.length > 1 ? 's' : ''}.`)
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Téléchargement des slides Improvisem impossible.'), 'error')
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
      this.showActionMessage('Slides Improvisem prêtes à être partagées.')
    } catch (error) {
      this.showActionMessage(this.errorMessage(error, 'Partage des slides Improvisem annulé ou impossible.'), 'error')
    } finally {
      this.isSharing = false
    }
  }

  public async exportSocialReel(): Promise<void> {
    if (this.isSocialReelExporting) {
      return
    }

    this.isSocialReelExporting = true
    this.socialReelError = ''

    try {
      const file = await this.createSocialReelFile()
      this.downloadBlob(file, file.name)
      this.showActionMessage(`Reel téléchargé : ${file.name}`)
    } catch (error) {
      this.socialReelError = error instanceof Error ? error.message : 'Export impossible'
      this.showActionMessage(this.socialReelError, 'error')
    } finally {
      this.isSocialReelExporting = false
    }
  }

  public async shareSocialReel(): Promise<void> {
    if (this.isSharing || this.isSocialReelExporting) {
      return
    }

    this.isSharing = true
    this.socialReelError = ''

    try {
      const file = await this.createSocialReelFile()
      await this.shareFiles([file], 'Reel LUDI')
      this.showActionMessage('Reel prêt à être partagé.')
    } catch (error) {
      this.socialReelError = error instanceof Error ? error.message : 'Partage impossible'
      this.showActionMessage(this.socialReelError, 'error')
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
      await this.waitForImages(preview)
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
      await this.waitForImages(slide)
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

  private async createSocialReelFile(): Promise<File> {
    const blob = await this.createSocialReelBlob()
    const fileName = `${this.fileNameBase('reel-ludi-slideshow')}.webm`
    return new File([blob], fileName, { type: blob.type || 'video/webm' })
  }

  private async createSocialReelBlob(): Promise<Blob> {
    const slides = this.socialReelSlides
    if (!slides.length) {
      throw new Error('Ajoute au moins un paragraphe.')
    }

    await this.prepareSocialReelMedia(slides)
    const fontReady = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    await Promise.all([
      this.loadSocialReelAsset('assets/logo/logo.png').then((image) => {
        this.socialReelLogoImage = image
      }),
      fontReady || Promise.resolve(),
    ])
    const datesSnapshot = await this.createSocialReelDatesSnapshot(html2canvas)

    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Impossible de preparer le canvas video.')
    }

    const stream = canvas.captureStream(ToolsComponent.SOCIAL_REEL_FRAME_RATE)
    const mimeType = this.socialReelMimeType()
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

    recorder.start()

    const frameDelay = 1000 / ToolsComponent.SOCIAL_REEL_FRAME_RATE
    for (const slide of slides) {
      const media = slide.media?.ready ? slide.media : undefined
      if (media?.kind === 'video') {
        await this.resetSocialReelVideo(media)
      }

      const framesPerSlide = Math.ceil(this.socialReelSlideSeconds(slide) * ToolsComponent.SOCIAL_REEL_FRAME_RATE)
      for (let frame = 0; frame < framesPerSlide; frame += 1) {
        const progress = frame / Math.max(framesPerSlide - 1, 1)
        this.drawSocialReelFrame(context, slide, progress, datesSnapshot)
        await this.wait(frameDelay)
      }
    }

    recorder.stop()
    await stopped

    for (const media of this.socialReelMedia) {
      if (media.kind === 'video' && media.element instanceof HTMLVideoElement) {
        media.element.pause()
      }
    }

    return new Blob(chunks, { type: mimeType })
  }

  private async prepareSocialReelMedia(slides: SocialReelSlide[]): Promise<void> {
    const media = Array.from(new Set(slides.map((slide) => slide.media).filter(Boolean))) as SocialReelMedia[]
    await Promise.all(media.map((item) => this.loadSocialReelMedia(item)))
  }

  private loadSocialReelMedia(media: SocialReelMedia): Promise<void> {
    if (media.ready) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      if (media.kind === 'image') {
        const image = new Image()
        image.onload = () => {
          media.element = image
          media.orientation = image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait'
          media.ready = true
          resolve()
        }
        image.onerror = () => {
          media.error = 'Image illisible'
          resolve()
        }
        image.src = media.src
        return
      }

      const video = document.createElement('video')
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.preload = 'auto'
      video.onloadeddata = () => {
        media.element = video
        media.previewSrc = this.createSocialReelVideoPreview(video)
        media.ready = true
        resolve()
      }
      video.onerror = () => {
        media.error = 'Video illisible'
        resolve()
      }
      video.src = media.src
      video.load()
    })
  }

  private loadSocialReelAsset(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Asset reel introuvable: ${src}`))
      image.src = src
    })
  }

  private createSocialReelVideoPreview(video: HTMLVideoElement): string | undefined {
    if (!video.videoWidth || !video.videoHeight) {
      return undefined
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (!context) {
        return undefined
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.82)
    } catch {
      return undefined
    }
  }

  private async resetSocialReelVideo(media: SocialReelMedia): Promise<void> {
    if (!(media.element instanceof HTMLVideoElement)) {
      return
    }

    const video = media.element
    video.muted = true
    video.loop = true
    video.currentTime = 0
    try {
      await video.play()
    } catch {
      // Muted videos generally autoplay; if the browser blocks it, the current frame is still drawn.
    }
  }

  private drawSocialReelFrame(
    context: CanvasRenderingContext2D,
    slide: SocialReelSlide,
    progress: number,
    datesSnapshot?: HTMLCanvasElement
  ): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT
    const isDates = slide.id === 'reel-dates'
    const isInsert = slide.kind === 'insert'
    const isPunchline = slide.kind === 'punchline'

    context.clearRect(0, 0, width, height)
    this.drawSocialReelBackground(context, slide, progress)

    if (isPunchline) {
      this.drawSocialReelBrand(context)
      this.drawSocialReelPunchline(context, slide, progress)
      this.drawSocialReelProgress(context, slide.index, progress)
      return
    }

    if (isInsert) {
      this.drawSocialReelBrand(context)
      this.drawSocialReelInsert(context, slide, progress)
      this.drawSocialReelProgress(context, slide.index, progress)
      return
    }

    context.fillStyle = isDates
      ? 'rgba(23, 18, 31, 0.74)'
      : 'rgba(7, 7, 10, 0.38)'
    context.fillRect(0, 0, width, height)

    const gradient = context.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)')
    gradient.addColorStop(0.36, 'rgba(0, 0, 0, 0.04)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.84)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    this.drawSocialReelBrand(context)

    if (isDates) {
      if (datesSnapshot) {
        this.drawSocialReelDatesSnapshot(context, datesSnapshot)
      } else {
        this.drawSocialReelDates(context)
      }
    } else {
      this.drawSocialReelText(context, slide, progress)
      this.drawSocialReelProgress(context, slide.index, progress)
    }
  }

  private async createSocialReelDatesSnapshot(html2canvas: Html2Canvas): Promise<HTMLCanvasElement | undefined> {
    const slide = this.socialReelDatesSlideRef?.nativeElement
    if (!slide) {
      return undefined
    }

    await this.wait(40)
    return html2canvas(slide, {
      allowTaint: false,
      backgroundColor: null,
      scale: 1080 / slide.clientWidth,
      useCORS: true,
    })
  }

  private drawSocialReelDatesSnapshot(
    context: CanvasRenderingContext2D,
    snapshot: HTMLCanvasElement
  ): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT

    context.fillStyle = '#17121f'
    context.fillRect(0, 0, width, height)

    const scale = Math.min(width / snapshot.width, height / snapshot.height)
    const drawWidth = snapshot.width * scale
    const drawHeight = snapshot.height * scale
    const offsetX = (width - drawWidth) / 2
    const offsetY = (height - drawHeight) / 2
    context.drawImage(snapshot, offsetX, offsetY, drawWidth, drawHeight)
  }

  private drawSocialReelBackground(
    context: CanvasRenderingContext2D,
    slide: SocialReelSlide,
    progress: number
  ): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT
    const element = slide.media?.ready ? slide.media.element : undefined

    if (slide.kind === 'punchline') {
      context.fillStyle = progress < 0.12 ? '#fff8ed' : '#df2f42'
      context.fillRect(0, 0, width, height)

      context.fillStyle = progress < 0.12 ? '#df2f42' : '#050505'
      context.beginPath()
      context.moveTo(0, height * (0.2 + progress * 0.12))
      context.lineTo(width, height * 0.02)
      context.lineTo(width, height)
      context.lineTo(0, height * (0.82 - progress * 0.08))
      context.closePath()
      context.fill()
      return
    }

    if (slide.kind === 'insert') {
      context.fillStyle = '#050505'
      context.fillRect(0, 0, width, height)

      const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.72)
      glow.addColorStop(0, 'rgba(255, 248, 237, 0.08)')
      glow.addColorStop(0.42, 'rgba(223, 47, 66, 0.035)')
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
      return
    }

    if (
      element instanceof HTMLImageElement ||
      element instanceof HTMLVideoElement
    ) {
      const sourceWidth = element instanceof HTMLVideoElement ? element.videoWidth : element.naturalWidth
      const sourceHeight = element instanceof HTMLVideoElement ? element.videoHeight : element.naturalHeight
      if (sourceWidth && sourceHeight) {
        const shouldTravel = element instanceof HTMLImageElement && sourceWidth / sourceHeight > width / height
        if (shouldTravel) {
          const scale = height / sourceHeight
          const drawWidth = sourceWidth * scale
          const travel = Math.max(drawWidth - width, 0)
          const offsetX = -travel * progress
          context.drawImage(element, offsetX, 0, drawWidth, height)
          return
        }

        const scale = Math.max(width / sourceWidth, height / sourceHeight) * (1 + progress * 0.075)
        const drawWidth = sourceWidth * scale
        const drawHeight = sourceHeight * scale
        const offsetX = (width - drawWidth) / 2
        const offsetY = (height - drawHeight) / 2 - progress * 34
        context.drawImage(element, offsetX, offsetY, drawWidth, drawHeight)
        return
      }
    }

    const gradient = context.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#17121f')
    gradient.addColorStop(0.42, '#df2f42')
    gradient.addColorStop(1, '#f0b92e')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = 'rgba(255, 248, 237, 0.08)'
    context.font = '900 360px "The Bold Font", Arial, sans-serif'
    context.textBaseline = 'alphabetic'
    context.fillText('LUDI', -38 + progress * 18, 1160)

    context.fillStyle = 'rgba(23, 18, 31, 0.22)'
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(width, height * 0.2)
    context.lineTo(width, height)
    context.lineTo(0, height * 0.78)
    context.closePath()
    context.fill()
  }

  private drawSocialReelBrand(context: CanvasRenderingContext2D): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const boxSize = 70
    const x = width - boxSize - 54
    const y = 54

    context.save()
    context.fillStyle = 'rgba(255, 248, 237, 0.94)'
    context.beginPath()
    this.drawCanvasRoundRect(context, x, y, boxSize, boxSize, 10)
    context.fill()

    if (this.socialReelLogoImage) {
      context.drawImage(this.socialReelLogoImage, x + 13, y + 13, 44, 44)
    }
    context.restore()
  }

  private drawSocialReelText(
    context: CanvasRenderingContext2D,
    slide: SocialReelSlide,
    progress: number
  ): void {
    const lines = this.socialReelTextLines(context, slide.parts, 910, 92)
    const lineHeight = 92
    const totalHeight = lines.length * lineHeight
    const startY = Math.max(520, 1508 - totalHeight)
    const textProgress = Math.min(1, Math.max(0, (progress - 0.08) / 0.68))

    context.save()
    context.textBaseline = 'alphabetic'
    context.font = '900 92px "The Bold Font", Arial, sans-serif'

    lines.forEach((line, lineIndex) => {
      const y = startY + lineIndex * lineHeight
      let x = 76
      const runs: { text: string; highlighted: boolean; x: number; width: number }[] = []

      for (const part of line) {
        const width = context.measureText(part.text).width
        const lastRun = runs[runs.length - 1]
        if (lastRun && lastRun.highlighted === part.highlighted) {
          lastRun.text += part.text
          lastRun.width += width
        } else {
          runs.push({ text: part.text, highlighted: part.highlighted, x, width })
        }

        x += width
      }

      for (const run of runs) {
        if (run.highlighted) {
          const markerProgress = Math.min(1, Math.max(0, (textProgress - lineIndex * 0.055) / 0.45))
          context.fillStyle = '#df2f42'
          context.beginPath()
          this.drawCanvasRoundRect(
            context,
            run.x - 10,
            y - 70,
            (run.width + 20) * markerProgress,
            82,
            8
          )
          context.fill()
        }
      }

      for (const run of runs) {
        context.fillStyle = '#fff8ed'
        context.fillText(run.text, run.x, y)
      }
    })

    context.restore()
  }

  private drawSocialReelInsert(
    context: CanvasRenderingContext2D,
    slide: SocialReelSlide,
    progress: number
  ): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT
    const textProgress = Math.min(1, Math.max(0, (progress - 0.08) / 0.72))
    const scale = 0.98 + Math.min(1, progress / 0.5) * 0.02
    const words = this.socialReelInsertWords(slide.text)
    const lines = this.socialReelInsertWordLines(context, words, 850, 112)
    const visibleWords = Math.min(words.length, Math.ceil(words.length * textProgress))
    const lineHeight = 126
    const totalHeight = lines.length * lineHeight
    const startY = height / 2 - totalHeight / 2 + 88
    let wordIndex = 0

    context.save()
    context.translate(width / 2, height / 2)
    context.scale(scale, scale)
    context.translate(-width / 2, -height / 2)
    context.textBaseline = 'alphabetic'
    context.font = '700 112px Georgia, "Times New Roman", serif'
    context.textAlign = 'left'

    lines.forEach((line, lineIndex) => {
      const y = startY + lineIndex * lineHeight
      const lineWidth = this.socialReelInsertLineWidth(context, line)
      let x = width / 2 - lineWidth / 2

      line.forEach((word) => {
        const isVisible = wordIndex < visibleWords
        const wordWidth = context.measureText(word).width
        if (isVisible) {
          const wordProgress = Math.min(1, Math.max(0, (textProgress * words.length - wordIndex) / 0.85))
          context.save()
          context.globalAlpha = wordProgress
          context.translate(x + wordWidth / 2, y)
          context.scale(0.98 + wordProgress * 0.02, 0.98 + wordProgress * 0.02)
          context.fillStyle = '#fff8ed'
          context.fillText(word, -wordWidth / 2, 0)
          context.restore()
        }
        x += wordWidth + context.measureText(' ').width
        wordIndex += 1
      })
    })

    context.restore()
  }

  private drawSocialReelPunchline(
    context: CanvasRenderingContext2D,
    slide: SocialReelSlide,
    progress: number
  ): void {
    const width = ToolsComponent.SOCIAL_REEL_WIDTH
    const height = ToolsComponent.SOCIAL_REEL_HEIGHT
    const flashProgress = progress < 0.12 ? 1 - progress / 0.12 : 0
    const textProgress = Math.min(1, Math.max(0, (progress - 0.04) / 0.16))
    const shake = progress < 0.2 ? Math.sin(progress * 210) * 8 : 0
    const fontSize = this.socialReelPunchlineFontSize(context, slide.text)
    const lines = this.socialReelTextLines(
      context,
      [{ text: slide.text, highlighted: false }],
      940,
      fontSize
    )
    const lineHeight = fontSize * 0.88
    const totalHeight = lines.length * lineHeight
    const startY = height / 2 - totalHeight / 2 + fontSize * 0.74

    context.save()
    context.translate(width / 2 + shake, height / 2)
    context.scale(0.92 + textProgress * 0.1, 0.92 + textProgress * 0.1)
    context.translate(-width / 2, -height / 2)
    context.textBaseline = 'alphabetic'
    context.font = `900 ${fontSize}px "The Bold Font", Arial, sans-serif`
    context.textAlign = 'center'
    context.fillStyle = '#fff8ed'

    lines.forEach((line, lineIndex) => {
      const text = line.map((part) => part.text).join('')
      context.fillText(text, width / 2, startY + lineIndex * lineHeight)
    })

    if (flashProgress > 0) {
      context.globalAlpha = flashProgress * 0.72
      context.fillStyle = '#fff8ed'
      context.fillRect(0, 0, width, height)
    }

    context.restore()
  }

  private drawSocialReelProgress(context: CanvasRenderingContext2D, index: number, progress: number): void {
    const slides = this.socialReelContentSlideCount
    const gap = 12
    const width = (972 - gap * Math.max(slides - 1, 0)) / slides
    const y = 1788

    for (let itemIndex = 0; itemIndex < slides; itemIndex += 1) {
      const x = 54 + itemIndex * (width + gap)
      context.fillStyle = 'rgba(255, 248, 237, 0.28)'
      context.fillRect(x, y, width, 9)
      if (itemIndex < index) {
        context.fillStyle = '#fff8ed'
        context.fillRect(x, y, width, 9)
      }
      if (itemIndex === index) {
        context.fillStyle = '#ffde3f'
        context.fillRect(x, y, width * progress, 9)
      }
    }
  }

  private drawSocialReelDates(context: CanvasRenderingContext2D): void {
    context.save()
    context.fillStyle = '#17121f'
    context.fillRect(0, 0, ToolsComponent.SOCIAL_REEL_WIDTH, ToolsComponent.SOCIAL_REEL_HEIGHT)

    const background = context.createLinearGradient(0, 0, ToolsComponent.SOCIAL_REEL_WIDTH, ToolsComponent.SOCIAL_REEL_HEIGHT)
    background.addColorStop(0, 'rgba(23, 18, 31, 0.96)')
    background.addColorStop(0.5, 'rgba(33, 21, 40, 0.96)')
    background.addColorStop(1, 'rgba(223, 47, 66, 0.92)')
    context.fillStyle = background
    context.fillRect(0, 0, ToolsComponent.SOCIAL_REEL_WIDTH, ToolsComponent.SOCIAL_REEL_HEIGHT)

    if (this.socialReelLogoImage) {
      context.drawImage(this.socialReelLogoImage, 76, 76, 110, 110)
    }

    context.fillStyle = '#f0b92e'
    context.font = '900 42px Arial, sans-serif'
    context.textBaseline = 'top'
    context.fillText('PROCHAINES DATES', 640, 112)

    const shows = this.socialReelAgendaShows
    if (!shows.length) {
      context.fillStyle = '#fff8ed'
      context.font = '800 58px Arial, sans-serif'
      this.drawWrappedSocialReelLine(context, 'Toutes les dates arrivent bientot sur luditoulouse.org.', 76, 620, 880, 76)
      return
    }

    let y = 500
    for (const show of shows) {
      context.fillStyle = '#ffde3f'
      context.font = '900 34px Arial, sans-serif'
      context.fillText(this.formattedDate(show).toUpperCase(), 76, y)

      context.fillStyle = '#fff8ed'
      context.font = '900 56px Arial, sans-serif'
      this.drawWrappedSocialReelLine(context, (show.name || 'Spectacle LUDI').toUpperCase(), 76, y + 52, 920, 64, 2)

      context.fillStyle = 'rgba(255, 248, 237, 0.76)'
      context.font = '700 30px Arial, sans-serif'
      context.fillText(show.location || 'Toulouse', 76, y + 206)

      context.fillStyle = 'rgba(255, 248, 237, 0.88)'
      context.font = '900 26px Arial, sans-serif'
      context.fillText(this.priceLabel(show).toUpperCase(), 76, y + 246)

      context.fillStyle = 'rgba(255, 248, 237, 0.24)'
      context.fillRect(76, y + 314, 928, 2)
      y += 360
    }

    context.fillStyle = '#fff8ed'
    context.font = '900 34px Arial, sans-serif'
    context.fillText('@luditoulouse', 76, 1774)
    context.fillText('luditoulouse.org', 740, 1774)
    context.restore()
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

  private async waitForImages(element: HTMLElement): Promise<void> {
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

  private parseSocialReelText(text: string): SocialReelTextPart[] {
    const parts: SocialReelTextPart[] = []
    const matcher = /\*([^*]+)\*/g
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = matcher.exec(text)) !== null) {
      if (match.index > cursor) {
        parts.push({ text: text.slice(cursor, match.index), highlighted: false })
      }

      parts.push({ text: match[1], highlighted: true })
      cursor = matcher.lastIndex
    }

    if (cursor < text.length) {
      parts.push({ text: text.slice(cursor), highlighted: false })
    }

    return parts.length ? parts : [{ text, highlighted: false }]
  }

  private cleanSocialReelMarkup(text: string): string {
    return this.socialReelInsertText(text)?.replace(/\*([^*]+)\*/g, '$1').trim()
      || this.socialReelPunchlineText(text)?.replace(/\*([^*]+)\*/g, '$1').trim()
      || text.replace(/\*([^*]+)\*/g, '$1').trim()
  }

  private socialReelInsertText(text: string): string | undefined {
    const match = text.trim().match(/^\[\[\s*(.+?)\s*\]\]$/s)
    return match?.[1]?.trim() || undefined
  }

  private socialReelPunchlineText(text: string): string | undefined {
    const match = text.trim().match(/^!!\s*(.+)$/s)
    return match?.[1]?.trim() || undefined
  }

  private socialReelSlideSeconds(slide: SocialReelSlide): number {
    if (slide.kind === 'punchline') {
      return ToolsComponent.SOCIAL_REEL_PUNCHLINE_SECONDS
    }

    return slide.kind === 'insert'
      ? ToolsComponent.SOCIAL_REEL_INSERT_SECONDS
      : this.socialReelSecondsPerSlide
  }

  private socialReelInsertWords(text: string): string[] {
    return text.trim().split(/\s+/).filter(Boolean)
  }

  private socialReelInsertWordLines(
    context: CanvasRenderingContext2D,
    words: string[],
    maxWidth: number,
    fontSize: number
  ): string[][] {
    context.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`
    const lines: string[][] = []
    let line: string[] = []

    for (const word of words) {
      const candidate = [...line, word]
      if (line.length && this.socialReelInsertLineWidth(context, candidate) > maxWidth) {
        lines.push(line)
        line = [word]
      } else {
        line = candidate
      }
    }

    if (line.length) {
      lines.push(line)
    }

    return lines.slice(0, 6)
  }

  private socialReelInsertLineWidth(context: CanvasRenderingContext2D, line: string[]): number {
    if (!line.length) {
      return 0
    }

    const spaceWidth = context.measureText(' ').width
    return line.reduce((total, word) => total + context.measureText(word).width, 0)
      + spaceWidth * (line.length - 1)
  }

  private socialReelPunchlineFontSize(context: CanvasRenderingContext2D, text: string): number {
    for (const size of [190, 176, 160, 144, 128, 112]) {
      const lines = this.socialReelTextLines(
        context,
        [{ text, highlighted: false }],
        940,
        size
      )
      if (lines.length <= 5) {
        return size
      }
    }

    return 104
  }

  private socialReelTextLines(
    context: CanvasRenderingContext2D,
    parts: SocialReelTextPart[],
    maxWidth: number,
    fontSize: number
  ): SocialReelTextPart[][] {
    context.font = `900 ${fontSize}px "The Bold Font", Arial, sans-serif`
    const tokens = parts.flatMap((part) => (
      part.text.split(/(\s+)/).filter(Boolean).map((text) => ({
        text: text.toUpperCase(),
        highlighted: part.highlighted,
      }))
    ))
    const lines: SocialReelTextPart[][] = []
    let line: SocialReelTextPart[] = []
    let lineWidth = 0

    for (const token of tokens) {
      const tokenWidth = context.measureText(token.text).width
      if (line.length && lineWidth + tokenWidth > maxWidth) {
        lines.push(line)
        line = []
        lineWidth = 0
      }

      line.push(token)
      lineWidth += tokenWidth
    }

    if (line.length) {
      lines.push(line)
    }

    return lines.slice(0, 8)
  }

  private drawWrappedSocialReelLine(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 4
  ): void {
    const words = text.split(/\s+/).filter(Boolean)
    let line = ''
    let lineIndex = 0

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, y + lineIndex * lineHeight)
        line = word
        lineIndex += 1
        if (lineIndex >= maxLines) {
          return
        }
      } else {
        line = testLine
      }
    }

    if (line && lineIndex < maxLines) {
      context.fillText(line, x, y + lineIndex * lineHeight)
    }
  }

  private drawCanvasRoundRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const safeRadius = Math.min(radius, width / 2, height / 2)
    context.moveTo(x + safeRadius, y)
    context.lineTo(x + width - safeRadius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
    context.lineTo(x + width, y + height - safeRadius)
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
    context.lineTo(x + safeRadius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
    context.lineTo(x, y + safeRadius)
    context.quadraticCurveTo(x, y, x + safeRadius, y)
  }

  private async createSocialReelMedia(file: File): Promise<SocialReelMedia> {
    const kind = this.socialReelFileKind(file)
    if (!kind) {
      throw new Error(`Format non supporte: ${file.name}`)
    }

    const src = kind === 'image'
      ? await this.readFileAsDataUrl(file)
      : URL.createObjectURL(file)
    const media: SocialReelMedia = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      kind,
      src,
      objectUrl: kind === 'video' ? src : undefined,
      file,
    }

    if (kind === 'image') {
      const image = new Image()
      image.onload = () => {
        media.orientation = image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait'
      }
      image.src = media.src
    }

    return media
  }

  private isSupportedSocialReelFile(file: File): boolean {
    return Boolean(this.socialReelFileKind(file))
  }

  private socialReelFileKind(file: File): SocialReelMediaKind | undefined {
    const name = file.name.toLowerCase()

    if (
      file.type.startsWith('image/') &&
      !/\.(heic|heif|avif|tiff?)$/i.test(name)
    ) {
      return 'image'
    }

    if (/\.(gif|jpe?g|png|webp)$/i.test(name)) {
      return 'image'
    }

    if (file.type.startsWith('video/')) {
      return 'video'
    }

    if (/\.(mp4|mov|m4v|webm)$/i.test(name)) {
      return 'video'
    }

    return undefined
  }

  private socialReelMimeType(): string {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      return 'video/webm;codecs=vp9'
    }

    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      return 'video/webm;codecs=vp8'
    }

    return 'video/webm'
  }

  private persistSocialReelState(): void {
    try {
      const state: PersistedSocialReelState = {
        text: this.socialReelText,
        duration: this.socialReelSecondsPerSlide,
        includeDates: this.socialReelIncludeDates,
      }
      window.localStorage.setItem(ToolsComponent.SOCIAL_REEL_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Local storage can be unavailable in private browsing; the generator still works.
    }
  }

  private restoreSocialReelState(): void {
    try {
      const stored = window.localStorage.getItem(ToolsComponent.SOCIAL_REEL_STORAGE_KEY)
      if (!stored) {
        return
      }

      const state = JSON.parse(stored) as PersistedSocialReelState
      if (typeof state.text === 'string') {
        this.socialReelText = ToolsComponent.SOCIAL_REEL_LEGACY_DEFAULT_TEXTS.includes(state.text)
          ? ToolsComponent.SOCIAL_REEL_DEFAULT_TEXT
          : state.text
      }
      if (typeof state.duration === 'number') {
        this.socialReelSecondsPerSlide = Math.max(2, Math.min(state.duration, 9))
      }
      this.socialReelIncludeDates = true
    } catch {
      // Ignore corrupted drafts.
    }
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
