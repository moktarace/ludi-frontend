import { Component } from '@angular/core'
import { isPrivateAccessUnlocked, PRIVATE_ACCESS_CODE, unlockPrivateAccess } from 'src/app/config/private-access'

interface PrivateToolEntry {
  title: string
  intent: string
  description: string
  access: string
  href: string
  priority?: boolean
}

@Component({
  selector: 'app-private-tools-home',
  templateUrl: './private-tools-home.component.html',
})
export class PrivateToolsHomeComponent {
  public accessCode = ''
  public accessError = ''
  public isUnlocked = isPrivateAccessUnlocked()

  public readonly tools: PrivateToolEntry[] = [
    {
      title: 'Planning spectacle',
      intent: 'Je dois savoir quoi faire et quand',
      description: 'La timeline conseillée pour suivre une date de spectacle sans oublier les étapes importantes.',
      access: 'Accès adhérent·e',
      href: '#planning',
      priority: true,
    },
    {
      title: 'Kit réseaux',
      intent: 'Je dois créer un visuel',
      description: 'Posts, stories, affiches, banderoles, carrousels et rappels de dates cohérents avec la charte LUDI.',
      access: 'Accès adhérent·e',
      href: '#kit-reseaux',
    },
    {
      title: 'Gestion des dates',
      intent: 'Je dois modifier ce qui apparaît sur le site',
      description: 'Dates, lieux, horaires, tarifs, logos, publication et liens de réservation. Réservé aux personnes du bureau.',
      access: 'Accès bureau',
      href: '#programmation-admin',
    },
  ]

  public unlockToolsHome(): void {
    if (this.accessCode.trim() === PRIVATE_ACCESS_CODE) {
      this.isUnlocked = true
      this.accessError = ''
      unlockPrivateAccess()
      return
    }

    this.accessError = 'Code incorrect'
  }
}
