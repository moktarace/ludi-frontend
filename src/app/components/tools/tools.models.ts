export type VisualFormat = 'post' | 'story' | 'reel' | 'poster'
export type VisualMode = 'show' | 'week' | 'month'
export type CarouselPlacement = 'top' | 'center' | 'bottom'
export type CarouselLogoSize = 's' | 'm' | 'l' | 'xl'
export type VisualTaglinePlacement = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right'
export type LegacyLogoPickerTarget = 'poster' | 'carousel'
export type MobileToolSection = 'visual' | 'carousel' | 'pedagogy' | 'reel' | 'championship'
export type ChampionshipSlideId = 'match' | 'standings' | 'dates'
export type SocialReelMediaKind = 'image' | 'video'
export type SocialReelMediaOrientation = 'portrait' | 'landscape'
export type SocialReelSlideKind = 'content' | 'insert' | 'punchline' | 'dates'

export interface SocialReelTextPart {
  text: string
  highlighted: boolean
}

export interface SocialReelMedia {
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

export interface SocialReelSlide {
  id: string
  kind: SocialReelSlideKind
  text: string
  parts: SocialReelTextPart[]
  media?: SocialReelMedia
  index: number
}

export interface PersistedSocialReelState {
  text?: string
  duration?: number
  includeDates?: boolean
}

export interface CarouselPhoto {
  id: string
  name: string
  src: string
}

export interface PresetLogo {
  label: string
  src: string
}

export interface VisualTone {
  label: string
  value: string
  accent: string
  accentRgb: string
  taglineAccent: string
  customBackgroundRgb: string
}

export interface PedagogySlide {
  eyebrow: string
  title: string
  text: string
  image?: string
}

export interface PedagogyTemplate {
  id: string
  label: string
  caption: string
  slides: PedagogySlide[]
}

export interface ChampionshipTeam {
  id: string
  name: string
  label: string
  color: string
  textColor: string
  points: number
  faults: number
  faultsList: string
}

export interface ChampionshipMatch {
  id: string
  label: string
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
}

export interface ChampionshipStanding extends ChampionshipTeam {
  wins: number
  losses: number
  draws: number
  scored: number
  conceded: number
  difference: number
  rank: number
}

export interface PersistedChampionshipState {
  title?: string
  edition?: string
  selectedMatchId?: string
  teams?: ChampionshipTeam[]
  matches?: ChampionshipMatch[]
}

export interface PersistedToolsDraftState {
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

export interface PersistedToolsMediaState {
  customPoster?: string
  customBackground?: string
  customCarouselLogo?: string
  carouselPhotos?: CarouselPhoto[]
  pedagogySlides?: PedagogySlide[]
  socialReelFiles?: File[]
}
