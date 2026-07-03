import { DOCUMENT } from "@angular/common";
import { OnInit, Component, HostListener, Inject } from "@angular/core";
import { Show } from "./model";
import { LudiService } from "./services/ludi.service";
import { Observable, tap } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  private static TOOLS_HASH = "#kit-reseaux";
  private static PROGRAMMATION_ADMIN_HASH = "#programmation-admin";
  private static PLANNING_HASH = "#planning";
  private static PRIVATE_TOOLS_HOME_HASH = "#outils-ludi";
  private static LEGAL_NOTICE_HASH = "#mentions-legales";

  static LOADING_TEXT: string[] = [
    "Caucus en cours",
    "Les mains plus haut, on compte les cartons",
    "BA-BE-BI-BO-BU",
    "JM, c'est le meilleur parrain",
    "La Chaise : meilleure improvisatrice",
    "Astuce : bossez votre cristallisation",
    "3 2 1 IMPRO !",
    "Il a pensé à parler du chapeau ??",
    "Et c'est une convergence, UNE CONVERGEEEEENCE 🎶",
    "Joueurs en quiconque quiconce !  Bref, un sur deux...",
    "Arbitre c’est un... Métier !",
    "Préparation du pacing",
  ];

  public shows$!: Observable<Show[] | undefined>;
  public highlightedShow: Show | undefined;
  public isLoaded: boolean | undefined;
  public isToolsPage = false;
  public isProgrammationAdminPage = false;
  public isPlanningPage = false;
  public isPrivateToolsHomePage = false;
  public isLegalNoticePage = false;
  public loadingText: String;
  private eventsJsonLdScriptId = "ludi-events-json-ld";

  constructor(
    private ludiService: LudiService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.loadingText =
      AppComponent.LOADING_TEXT[
        Math.floor(Math.random() * AppComponent.LOADING_TEXT.length)
      ];
  }

  public ngOnInit(): void {
    this.updateToolsPage();

    this.shows$ = this.ludiService.show().pipe(
      tap((shows) => {
        this.isLoaded = true;
        this.highlightedShow =
          shows.filter((s) => s.isHighlighted)[0] || shows[0];
        shows.filter((s) => s.id !== this.highlightedShow?.id);
        this.updateEventsJsonLd(shows);
        this.scrollToCurrentAnchor();
      })
    );
  }

  @HostListener("window:hashchange")
  public updateToolsPage(): void {
    const hash = window.location.hash;
    this.isToolsPage = hash === AppComponent.TOOLS_HASH;
    this.isProgrammationAdminPage = hash === AppComponent.PROGRAMMATION_ADMIN_HASH;
    this.isPlanningPage = hash === AppComponent.PLANNING_HASH;
    this.isPrivateToolsHomePage = hash === AppComponent.PRIVATE_TOOLS_HOME_HASH;
    this.isLegalNoticePage = hash === AppComponent.LEGAL_NOTICE_HASH;
    this.scrollToCurrentAnchor();
  }

  private scrollToCurrentAnchor(): void {
    const id = window.location.hash.replace(/^#/, "");

    if (!id) {
      return;
    }

    if (this.isToolsPage || this.isProgrammationAdminPage || this.isPlanningPage || this.isPrivateToolsHomePage || this.isLegalNoticePage) {
      window.setTimeout(() => window.scrollTo({ top: 0 }));
      return;
    }

    const scrollToAnchor = () => {
      document.getElementById(decodeURIComponent(id))?.scrollIntoView({ block: "start" });
    };

    [0, 150, 450, 900].forEach((delay) => {
      window.setTimeout(scrollToAnchor, delay);
    });
  }

  private updateEventsJsonLd(shows: Show[] | undefined): void {
    const existingScript = this.document.getElementById(this.eventsJsonLdScriptId);

    if (existingScript) {
      existingScript.remove();
    }

    const events = this.buildEventStructuredData(shows);

    if (!events.length) {
      return;
    }

    const script = this.document.createElement("script");
    script.id = this.eventsJsonLdScriptId;
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": events,
    });

    this.document.head.appendChild(script);
  }

  private buildEventStructuredData(shows: Show[] | undefined): Record<string, unknown>[] {
    const now = Math.floor(Date.now() / 1000);

    return [...(shows || [])]
      .filter((show) => Boolean(show.isPublished !== false && show.name && show.date && show.date >= now))
      .sort((a, b) => (a.date || 0) - (b.date || 0))
      .slice(0, 10)
      .map((show) => this.showToEventStructuredData(show));
  }

  private showToEventStructuredData(show: Show): Record<string, unknown> {
    const startDate = new Date((show.date || 0) * 1000).toISOString();
    const event: Record<string, unknown> = {
      "@type": "Event",
      "@id": `https://luditoulouse.org/#event-${encodeURIComponent(String(show.id || show.date || show.name))}`,
      "name": `${show.name} - impro à Toulouse`,
      "description": this.eventDescription(show),
      "startDate": startDate,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "url": show.reservationLink || "https://luditoulouse.org/",
      "location": {
        "@type": "Place",
        "name": show.location || "Toulouse",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Toulouse",
          "addressRegion": "Occitanie",
          "addressCountry": "FR",
        },
      },
      "organizer": {
        "@id": "https://luditoulouse.org/#ludi",
      },
      "performer": {
        "@id": "https://luditoulouse.org/#ludi",
      },
      "offers": this.eventOffer(show),
    };

    const image = this.absoluteUrl(show.logoLink);

    if (image) {
      event["image"] = [image];
    }

    return event;
  }

  private eventDescription(show: Show): string {
    const description = (show.shortDescription || show.description || "").trim();

    if (description) {
      return description;
    }

    return `Spectacle de théâtre d'improvisation à Toulouse avec la LUDI.`;
  }

  private eventOffer(show: Show): Record<string, unknown> {
    const price = typeof show.price === "number" ? show.price : 0;
    const url = show.reservationLink || "https://luditoulouse.org/";

    return {
      "@type": "Offer",
      "url": url,
      "price": price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
    };
  }

  private absoluteUrl(url: string | undefined): string | undefined {
    if (!url) {
      return undefined;
    }

    if (/^https?:\/\//.test(url)) {
      return url;
    }

    return `https://luditoulouse.org/${url.replace(/^\//, "")}`;
  }
}
