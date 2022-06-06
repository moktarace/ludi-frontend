import { Input, Component } from '@angular/core'
import { Show } from '../../model'

@Component({
  selector: 'app-show-card',
  templateUrl: './show-card.component.html',
})
export class ShowCardComponent {
  @Input()
  public show?: Show | null = {
    date: undefined,
    name: '',
    description: '',
    location: '',
    id: '',
    price: 0,
    reducedPrice: 0,
  }
  constructor() {}

  public get isFree() {
    return !this.show?.price
  }

  public get formattedDate():string | undefined {
    if (!this.show?.date) {
      return undefined;
    }
    return new Date(this.show.date * 1000).toLocaleString("fr-Fr");
  }

  public get locationLink():string {
    if (!this.show?.location) {
      return '#'
    }
    return 'https://maps.google.com/?q=' + this.show?.location
  }
}
