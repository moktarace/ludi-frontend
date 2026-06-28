import { Component, Input } from '@angular/core'
import { Show } from 'src/app/model'

@Component({
  selector: 'app-format',
  templateUrl: './format.component.html',
})
export class FormatComponent {

  @Input()
  public shows?: Show[] | null = [];

  constructor() { }

  public get capShows(): Show[] {
    return this.shows?.filter(s => s.location?.toLowerCase().includes("cap")) || [];
  }


  public get improvisemShows(): Show[] {
    return this.shows?.filter(s => s.name?.toLowerCase().includes("improvisem")) || [];
  }

  public get catchShows(): Show[] {
    return this.shows?.filter(s => s.name?.toLowerCase().includes("catch")) || [];
  }
}
