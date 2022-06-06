import { OnInit, Component } from '@angular/core'
import { Show } from './model'
import { LudiService } from './services/ludi.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  public shows$!: Observable<Show[] | undefined>

  constructor(private ludiService: LudiService) {}

  public ngOnInit(): void {
    this.shows$ = this.ludiService.show()
  }

}
