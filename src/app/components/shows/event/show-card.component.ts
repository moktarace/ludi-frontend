import { Input, Component } from '@angular/core'
import { Show } from '../../../model'

@Component({
  selector: 'app-show-card',
  templateUrl: './show-card.component.html',
})
export class ShowCardComponent {

  private static SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { weekday: "long", month: "long", day: "numeric" });
  private static TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });

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
  public variant: 'primary' | 'compact' = 'compact';
  
  constructor() { }

  public get isFree() {
    return !this.show?.price
  }

  public get formattedDate(): string | undefined {
    if (!this.show?.date) {
      return 'Date à venir';
    }
    return ShowCardComponent.SHORT_DATE_FORMATTER.format(new Date(this.show.date * 1000));
  }

  public get formattedTime(): string | undefined {
    if (!this.show?.date) {
      return undefined;
    }

    return ShowCardComponent.TIME_FORMATTER
      .format(new Date(this.show.date * 1000))
      .replace(/(\d{2}):(\d{2})/, '$1h $2');
  }

  public get priceLabel(): string {
    if (!this.show?.price) {
      return 'Entrée gratuite';
    }

    return this.show.reducedPrice
      ? `${this.show.price} € / ${this.show.reducedPrice} €`
      : `${this.show.price} €`;
  }

  public get isKitLogo(): boolean {
    return Boolean(this.show?.logoLink?.includes('/kit/') || this.show?.logoLink?.includes('logo/kit/'))
  }

}
