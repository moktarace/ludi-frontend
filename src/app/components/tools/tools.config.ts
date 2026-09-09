import { ChampionshipMatch, ChampionshipTeam, PresetLogo, VisualFormat, VisualMode, VisualTone } from './tools.models'

export const VISUAL_FORMATS: { label: string; value: VisualFormat }[] = [
  { label: 'Post', value: 'post' },
  { label: 'Affiche A2', value: 'poster' },
]

export const VISUAL_MODES: { label: string; value: VisualMode }[] = [
  { label: 'Spectacle', value: 'show' },
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' },
]

export const PRESET_LOGOS: PresetLogo[] = [
  { label: 'Improvisem', src: 'assets/logo/kit/improvisem.png' },
  { label: 'Match', src: 'assets/logo/kit/match.png' },
  { label: 'Ludidée', src: 'assets/logo/kit/ludidee.png' },
  { label: 'Catch Impro', src: 'assets/logo/kit/catch.png' },
  { label: "Cours d'essai", src: 'assets/logo/kit/essai.png' },
  { label: 'Top Ten', src: 'assets/logo/kit/cercle.png' },
]

export const LEGACY_LOGOS: PresetLogo[] = [
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

export const VISUAL_TONES: VisualTone[] = [
  { label: 'Rouge LUDI', value: 'ludi-red', accent: '#df2f42', accentRgb: '223 47 66', taglineAccent: '#ff6f9f', customBackgroundRgb: '223 47 66' },
  { label: 'Prune', value: 'plum', accent: '#7a315f', accentRgb: '122 49 95', taglineAccent: '#ff73d4', customBackgroundRgb: '122 49 95' },
  { label: 'Vert scène', value: 'stage-green', accent: '#5cb52e', accentRgb: '92 181 46', taglineAccent: '#b9ff45', customBackgroundRgb: '92 181 46' },
  { label: 'Orange affiche', value: 'poster-orange', accent: '#d96b35', accentRgb: '217 107 53', taglineAccent: '#ffbd3d', customBackgroundRgb: '217 107 53' },
  { label: 'Turquoise nuit', value: 'night-turquoise', accent: '#00a99a', accentRgb: '0 169 154', taglineAccent: '#4dffe7', customBackgroundRgb: '0 169 154' },
  { label: 'Jaune projecteur', value: 'spotlight-yellow', accent: '#f0b92e', accentRgb: '240 185 46', taglineAccent: '#fff04d', customBackgroundRgb: '240 185 46' },
  { label: 'Toulouse', value: 'toulouse', accent: '#e04f7a', accentRgb: '224 79 122', taglineAccent: '#ff5fa8', customBackgroundRgb: '224 79 122' },
]

export function createInitialChampionshipTeams(): ChampionshipTeam[] {
  return [
    { id: 'yellow', name: 'Equipe Jaune', label: 'Jaune', color: '#ffd326', textColor: '#17121f', points: 3, faults: 2, faultsList: 'Cabotinage solaire; Accessoire imaginaire non homologue' },
    { id: 'black', name: 'Equipe Noire', label: 'Noir', color: '#18181d', textColor: '#fff8ed', points: 2, faults: 4, faultsList: "Refus d'obstacle; Regard arbitral beaucoup trop intense" },
    { id: 'red', name: 'Equipe Rouge', label: 'Rouge', color: '#df2f42', textColor: '#fff8ed', points: 4, faults: 1, faultsList: 'Jeu dangereusement charismatique' },
    { id: 'white', name: 'Equipe Blanche', label: 'Blanc', color: '#fff8ed', textColor: '#17121f', points: 1, faults: 3, faultsList: 'Mime de porte discutable; Propulsion narrative non declaree' },
  ]
}

export function createInitialChampionshipMatches(): ChampionshipMatch[] {
  return [
    { id: 'match-1', label: 'Match 1', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-2', label: 'Match 2', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-3', label: 'Match 3', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-4', label: 'Match 4', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-5', label: 'Match 5', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'match-6', label: 'Match 6', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'small-final', label: 'Petite finale', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
    { id: 'big-final', label: 'Grande finale', teamAId: '', teamBId: '', scoreA: 0, scoreB: 0 },
  ]
}
