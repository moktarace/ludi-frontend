import { Component, Input } from '@angular/core'
import { Show } from 'src/app/model'

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
})
export class ShowsComponent {

  public displayAllShows: boolean | undefined;

  @Input()
  public shows?: Show[] | null = []

  @Input()
  public highlightedShow?: Show | null = {}

  constructor() { }

  public showAllShows(): void {
    this.displayAllShows = true;
  }

}
