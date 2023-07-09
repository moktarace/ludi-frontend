import { Component, Input } from '@angular/core'
import { Show } from 'src/app/model'

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
})
export class ToolsComponent {

  @Input()
  public shows?: Show[] | null = [];

  @Input()
  public highlightedShow?: Show | null = {}
  
  constructor() { }

}
