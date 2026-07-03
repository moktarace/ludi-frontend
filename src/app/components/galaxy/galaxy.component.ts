import { Component } from '@angular/core'

interface DescendantLeague {
  label: string
  logo?: string
  href?: string
  initials: string
  position: string
}

@Component({
  selector: 'app-galaxy',
  templateUrl: './galaxy.component.html',
})
export class GalaxyComponent {
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
  ]
}
