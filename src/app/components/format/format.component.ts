import { Component, Input } from '@angular/core'
import { range } from 'rxjs';
import { Show } from 'src/app/model'

@Component({
  selector: 'app-format',
  templateUrl: './format.component.html',
})
export class FormatComponent {

  @Input()
  public shows?: Show[] | null = [];

  public capImgs =  [...Array(10)].map((n, index) => `/assets/photo/cap${(index + 1).toString().padStart(2, '0')}.jpg`);
  public catchImgs = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/900/500`);
  public improvisemImgs = [...Array(12)].map((n, index) => `/assets/photo/improvisem${(index + 1).toString().padStart(2, '0')}.jpg`);

  
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
