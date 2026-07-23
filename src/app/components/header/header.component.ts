import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input()
  public compact = false;

  public get title(): string {
    if (window.screen.width < 1000) {
      return "LA LUDI DE TOULOUSE";
    }
    return "LIGUE UNIVERSITAIRE D'IMPROVISATION DE TOULOUSE";
  }
}
