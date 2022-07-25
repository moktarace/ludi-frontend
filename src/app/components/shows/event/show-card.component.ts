import { Input, Component } from '@angular/core'
import { Show } from '../../../model'

@Component({
  selector: 'app-show-card',
  templateUrl: './show-card.component.html',
})
export class ShowCardComponent {

  private static DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { hour12: false, weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  private static SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { hour12: false, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

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
  public isHighlighted: boolean | undefined;

  @Input()
  public showDetails: boolean = true;

  constructor() { }

  public get isFree() {
    return !this.show?.price
  }

  public get formattedDate(): string | undefined {
    if (!this.show?.date) {
      return 'Date à venir';
    }
    if (this.showDetails) {
      return ShowCardComponent.DATE_FORMATTER.format(new Date(this.show.date * 1000));
    }
    return ShowCardComponent.SHORT_DATE_FORMATTER.format(new Date(this.show.date * 1000));
  }

}
