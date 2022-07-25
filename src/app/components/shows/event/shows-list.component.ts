import { Input, Component } from '@angular/core'
import { Show } from '../../../model'

@Component({
    selector: 'app-shows-list',
    templateUrl: './shows-list.component.html',
})
export class ShowsListComponent {

    private static SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { hour12: false, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    @Input()
    public shows?: Show[] | null = []

    constructor() { }

    public isFree(show: Show): boolean {
        return !show?.price
    }

    public formattedDate(show: Show): string | undefined {
        if (!show?.date) {
            return undefined;
        }
        return ShowsListComponent.SHORT_DATE_FORMATTER.format(new Date(show.date * 1000));
    }

}
