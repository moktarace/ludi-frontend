import { Component, Input } from "@angular/core";
import { Show } from "src/app/model";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { COLORS } from "html2canvas/dist/types/css/types/color";

@Component({
  selector: "app-monthly",
  templateUrl: "./monthly.component.html",
})
export class MonthlyComponent {
  private static COLORS: string[] = [
    "#ffde59",
    "#A0CC64",
    "#f991c0",
    "#59b8ff",
    "#d8ff86"
  ];

  private static DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  });

  private static SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
    hour12: false,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  public _shows: Show[] = [];

  public title: string;

  public color: string;

  constructor() {
    let date = new Date();
    this.title = MonthlyComponent.DATE_FORMATTER.format(date);
    this.color = MonthlyComponent.COLORS[date.getMonth() % MonthlyComponent.COLORS.length];
  }

  @Input()
  public get shows(): Show[] {
    return this._shows;
  }

  public set shows(value: Show[]) {
    this._shows = value.filter(
      (value) =>
        new Date((value.date || 0) * 1000).getMonth() === new Date().getMonth()
    );
  }

  public generate() {
    let node: HTMLElement =
      document.getElementById("monthly") || new HTMLElement();
    node.style.display = "block";
    html2canvas(node).then((canvas) => {
      saveAs(canvas.toDataURL("image/png"), "LUDI " + this.title);
      node.style.display = "none";
    });
  }

  public formattedDate(show: Show): string | undefined {
    if (!show?.date) {
      return undefined;
    }
    return MonthlyComponent.SHORT_DATE_FORMATTER.format(
      new Date(show.date * 1000)
    );
  }
}
