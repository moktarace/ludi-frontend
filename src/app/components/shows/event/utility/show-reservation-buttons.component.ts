import { Input, Component } from '@angular/core'
import { Show } from '../../../../model'

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
  public socialLink: boolean | null = true;

  @Input()
  public outline: boolean | null = true;

  constructor() { }
}
