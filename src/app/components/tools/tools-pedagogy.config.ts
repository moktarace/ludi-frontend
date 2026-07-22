import { PedagogyTemplate } from './tools.models'

export const PEDAGOGY_TEMPLATES: PedagogyTemplate[] = [
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

