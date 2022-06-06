import { Input, Component } from '@angular/core'
import { Show } from '../../../model'

@Component({
  selector: 'app-show-reservation-buttons',
  templateUrl: './show-reservation-buttons.component.html',
})
export class ShowReservationButtonsComponent {
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

  @Input()
  public isLogged: boolean | null = false

  constructor() {}

  public get isFree() {
    return !this.show?.price
  }

  public get locationLink() {
    if (!this.show?.location) {
      return '#'
    }
    return 'https://maps.google.com/?q=' + this.show?.location
  }
}
