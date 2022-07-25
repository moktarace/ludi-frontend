import { OnInit, Component } from "@angular/core";
import { Show } from "./model";
import { LudiService } from "./services/ludi.service";
import { Observable, tap } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  static LOADING_TEXT: string[] = [
    "Caucus en cours",
    "Les mains plus haut, on compte les cartons",
    "BA-BE-BI-BO-BU",
    "JM était le meilleur parrain",
    "3 2 1 IMPRO !",
    "Joueurs en quiconque quiconce !  Bref, un sur deux...",
    "Arbitre c’est un... Métier !",
    "Préparation du pacing",
  ];

  public shows$!: Observable<Show[] | undefined>;
  public highlightedShow: Show | undefined;
  public isLoaded: boolean | undefined;
  public loadingText: String;

  constructor(private ludiService: LudiService) {
    this.loadingText =
      AppComponent.LOADING_TEXT[
        Math.floor(Math.random() * AppComponent.LOADING_TEXT.length)
      ];
  }

  public ngOnInit(): void {
    this.shows$ = this.ludiService.show().pipe(
      tap((shows) => {
        this.isLoaded = true;
        this.highlightedShow =
          shows.filter((s) => s.isHighlighted)[0] || shows[0];
        shows.filter((s) => s.id !== this.highlightedShow?.id);
      })
    );
  }
}
