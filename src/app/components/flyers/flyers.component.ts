import { Component, Input } from "@angular/core";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { Show } from "src/app/model";
import jsPDF from "jspdf";

@Component({
  selector: "app-flyers",
  templateUrl: "./flyers.component.html",
})
export class FlyerComponent {
  
  private static DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { hour12: false, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });


  @Input()
  public show: Show | undefined = {};
  

  constructor() {}

  public generate() {
    const recto: HTMLElement =
      document.getElementById("flyers-recto") || new HTMLElement();
    const verso: HTMLElement =
      document.getElementById("flyers-verso") || new HTMLElement();
    const name = "LUDI " + this.show?.name;
    let pdf = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: [15, 15],
    });
    recto.style.display = "block";
    verso.style.display = "block";

    html2canvas(recto).then((canvas) => {
      const rectoImg = canvas.toDataURL("image/png");
      pdf.addImage(rectoImg, "PNG", 0, 0, 15, 15);
      pdf.addPage();
      html2canvas(verso).then((canvas) => {
        const versoImg = canvas.toDataURL("image/png");
        recto.style.display = "none";
        verso.style.display = "none";
        pdf.addImage(versoImg, "PNG", 0, 0, 15, 15);
        pdf.save(name);
      });
    });
  }

  public get isFree() {
    return !this.show?.price
  }

  public get formattedDate(): string | undefined {
    if (!this.show?.date) {
      return 'Date à venir';
    }
    return FlyerComponent.DATE_FORMATTER.format(new Date(this.show.date * 1000));
  }
}
