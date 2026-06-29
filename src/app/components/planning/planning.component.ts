import { Component, Input } from '@angular/core'
import { isPrivateAccessUnlocked, PRIVATE_ACCESS_CODE, unlockPrivateAccess } from 'src/app/config/private-access'
import { Show } from 'src/app/model'

interface PlanningAction {
  step: string
  title: string
  note?: string
  link?: string
  linkLabel?: string
  external?: boolean
  completion?: 'logo' | 'details' | 'reservation' | 'published'
}

interface PlanningPeriod {
  eyebrow: string
  title: string
  offsetDays?: number
  actions: PlanningAction[]
}

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
})
export class PlanningComponent {
  private static DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  @Input()
  public shows?: Show[] | null = []

  public accessCode = ''
  public accessError = ''
  public selectedShowId = ''
  public isUnlocked = isPrivateAccessUnlocked()

  public readonly periods: PlanningPeriod[] = [
    {
      eyebrow: 'Dès que la date tombe',
      title: 'Poser l’identité du spectacle',
      actions: [
        {
          step: '1',
          title: 'Créer le logo du spectacle',
          note: "C'est la seule vraie pièce à produire en amont : il faut le dessiner ou le faire dessiner, puis l'ajouter à la date.",
          completion: 'logo',
        },
        {
          step: '2a',
          title: 'Vérifier les informations déjà saisies',
          note: 'La date existe déjà : on contrôle juste nom, lieu, horaire, tarif, lien de réservation et statut.',
          link: '#programmation-admin',
          linkLabel: 'Contrôler la date',
          completion: 'details',
        },
        {
          step: '2b',
          title: 'Préparer le lien de réservation si le spectacle est payant',
          note: 'À faire pour les spectacles au CAP ou quand une jauge doit être suivie.',
          link: 'https://www.helloasso.com/',
          linkLabel: 'Ouvrir HelloAsso',
          external: true,
          completion: 'reservation',
        },
      ],
    },
    {
      eyebrow: 'J - 14 minimum',
      title: 'Mettre la communication en circulation',
      offsetDays: -14,
      actions: [
        {
          step: '1',
          title: 'Publier ou vérifier la date sur le site',
          note: 'La date doit être claire, publiée, et cohérente avec le logo.',
          link: '#programmation-admin',
          linkLabel: 'Vérifier la date',
          completion: 'published',
        },
        {
          step: '2a',
          title: 'Décliner le visuel pour le format de publication',
          note: 'Post, story, affiche A2 ou banderole : le kit réseaux sert surtout ici, juste avant de publier.',
          link: '#kit-reseaux',
          linkLabel: 'Générer les visuels',
        },
        {
          step: '2b',
          title: 'Publier le post d’annonce',
          note: 'Utiliser le format spectacle ou le post agenda selon le rythme du mois.',
          link: '#kit-reseaux',
          linkLabel: 'Créer le post',
        },
        {
          step: '2c',
          title: 'Préparer les stories d’annonce',
          note: 'Story spectacle, rappel du mois ou rappel de la semaine selon le calendrier.',
          link: '#kit-reseaux',
          linkLabel: 'Créer les stories',
        },
        {
          step: '3',
          title: 'Envoyer les visuels pour les panneaux de Paul Sab',
          note: 'Surtout utile pour les spectacles au CAP et les événements campus.',
        },
      ],
    },
    {
      eyebrow: 'Semaine du spectacle',
      title: 'Relancer sans saturer',
      offsetDays: -7,
      actions: [
        {
          step: '1a',
          title: 'Créer un rappel des dates de la semaine',
          note: 'Utile si plusieurs événements LUDI se suivent.',
          link: '#kit-reseaux',
          linkLabel: 'Créer le rappel',
        },
        {
          step: '1b',
          title: 'Préparer un post ou une story avec les joueur·euse·s',
          note: 'À faire si le casting est connu et que les photos sont prêtes.',
          link: '#kit-reseaux',
          linkLabel: 'Ouvrir les outils',
        },
        {
          step: '2',
          title: 'Vérifier les infos finales',
          note: 'Lieu, heure, tarif, lien de réservation, QR code et visuel publié.',
          link: '#programmation-admin',
          linkLabel: 'Contrôler la fiche',
        },
      ],
    },
    {
      eyebrow: 'Pendant et après',
      title: 'Capitaliser sur le spectacle',
      offsetDays: 0,
      actions: [
        {
          step: '1',
          title: 'Confirmer la personne bénévole photo',
          note: "La personne qui s'est proposée pour les photos prend en main l'appareil, shoote le spectacle, trie et dépose les photos sur l'espace membre.",
        },
        {
          step: '2',
          title: 'Récupérer une sélection courte de photos publiables',
          note: 'Garder les meilleures images pour éviter un carrousel trop long ou redondant.',
        },
        {
          step: '3',
          title: 'Créer le carrousel de remerciement',
          note: 'Première slide merci, photos du spectacle, puis rappel des prochaines dates.',
          link: '#kit-reseaux',
          linkLabel: 'Créer le carrousel',
        },
        {
          step: '4',
          title: 'Lire les stats et ajuster la suite',
          note: 'Instagram, billetterie, caisse, remplissage de salle : on garde ce qui marche.',
        },
      ],
    },
  ]

  public get sortedShows(): Show[] {
    return [...(this.shows || [])]
      .filter((show) => typeof show.date === 'number')
      .sort((a, b) => (a.date || 0) - (b.date || 0))
  }

  public get selectedShow(): Show | undefined {
    return this.sortedShows.find((show) => this.showId(show) === this.selectedShowId) || this.nextShow
  }

  public get nextShow(): Show | undefined {
    const now = Math.floor(Date.now() / 1000)
    return this.sortedShows.find((show) => (show.date || 0) >= now) || this.sortedShows[0]
  }

  public showId(show: Show): string {
    return String(show.id || show.date)
  }

  public unlockPlanning(): void {
    if (this.accessCode.trim() === PRIVATE_ACCESS_CODE) {
      this.isUnlocked = true
      this.accessError = ''
      unlockPrivateAccess()
      return
    }

    this.accessError = 'Code incorrect'
  }

  public showDate(show?: Show): string {
    if (!show) {
      return 'Aucun spectacle sélectionné'
    }

    if (!show.date) {
      return 'Date à compléter'
    }

    return PlanningComponent.DATE_FORMATTER.format(new Date(show.date * 1000))
  }

  public dueLabel(period: PlanningPeriod): string {
    return period.eyebrow
  }

  public dueDateLabel(period: PlanningPeriod): string {
    const show = this.selectedShow
    if (!show?.date || typeof period.offsetDays !== 'number') {
      return 'À faire dès que possible'
    }

    const dueDate = new Date(show.date * 1000)
    dueDate.setDate(dueDate.getDate() + period.offsetDays)

    return PlanningComponent.DATE_FORMATTER.format(dueDate)
  }

  public isActionComplete(action: PlanningAction): boolean {
    const show = this.selectedShow
    if (!show || !action.completion) {
      return false
    }

    if (action.completion === 'logo') {
      return Boolean(show.logoLink && !show.logoLink.includes('noimg'))
    }

    if (action.completion === 'details') {
      return Boolean(show.name && show.location && show.date && typeof show.price === 'number')
    }

    if (action.completion === 'reservation') {
      const isPaid = Boolean((show.price || 0) > 0 || (show.reducedPrice || 0) > 0)
      return !isPaid || Boolean(show.reservationLink?.trim())
    }

    if (action.completion === 'published') {
      return show.isPublished === true
    }

    return false
  }

  public isActionVerifiable(action: PlanningAction): boolean {
    return Boolean(action.completion)
  }

  public actionClass(action: PlanningAction): string {
    const classes = []
    if (this.isActionVerifiable(action)) {
      classes.push('planning-action-verifiable')
    }
    if (this.isActionComplete(action)) {
      classes.push('planning-action-complete')
    }
    return classes.join(' ')
  }

  public isPeriodComplete(period: PlanningPeriod): boolean {
    return period.actions.length > 0 && period.actions.every((action) => this.isActionComplete(action))
  }

  public periodStatus(period: PlanningPeriod): string {
    const show = this.selectedShow
    if (!show?.date || typeof period.offsetDays !== 'number') {
      return 'À prévoir'
    }

    const dueTime = (show.date + period.offsetDays * 86400) * 1000
    const now = Date.now()
    if (now > show.date * 1000) {
      return 'Passé'
    }

    return now > dueTime ? 'À faire maintenant' : 'À venir'
  }

  public periodStatusClass(period: PlanningPeriod): string {
    return this.periodStatus(period).toLowerCase().replace(/\s+/g, '-').replace('à', 'a')
  }
}
