import { Input, Component, Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent {

  @Output()
  public click:EventEmitter<any> = new EventEmitter();

  constructor() { }


  public onClick() {
    this.click.emit(true);
  }
}
