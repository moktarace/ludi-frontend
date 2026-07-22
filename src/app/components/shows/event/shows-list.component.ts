import { Input, Component } from '@angular/core'
import { Show } from '../../../model'

interface ShowMonthGroup {
    label: string;
    shows: Show[];
}

@Component({
    selector: 'app-shows-list',
    templateUrl: './shows-list.component.html',
})
export class ShowsListComponent {

    private static SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { hour12: false, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    private static MONTH_FORMATTER = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
    private static WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    private static DAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });
    private static TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });

    private currentShows: Show[] = [];

    @Input()
    public set shows(shows: Show[] | null | undefined) {
        this.currentShows = shows || [];
        this.monthGroups = this.buildMonthGroups(this.currentShows);
    }

    public get shows(): Show[] {
        return this.currentShows;
    }

    @Input()
    public displayLocation?: boolean = true;

    @Input()
    public agendaMode = false;

    public monthGroups: ShowMonthGroup[] = [];

    constructor() { }

    public isFree(show: Show): boolean {
        return !show?.price
    }

    public formattedDate(show: Show): string | undefined {
        if (!show?.date) {
            return undefined;
        }
        return ShowsListComponent.SHORT_DATE_FORMATTER.format(new Date(show.date * 1000)).replace(/(\d{2}):(\d{2})/, '$1h $2');
    }

    public retrieveMainLink(show: Show): string {
        return show?.reservationLink || '';
    }

    public formattedWeekday(show: Show): string {
        return this.formatDatePart(show, ShowsListComponent.WEEKDAY_FORMATTER).replace('.', '');
    }

    public formattedDay(show: Show): string {
        return this.formatDatePart(show, ShowsListComponent.DAY_FORMATTER);
    }

    public formattedTime(show: Show): string {
        return this.formatDatePart(show, ShowsListComponent.TIME_FORMATTER)
            .replace(/(\d{2}):(\d{2})/, '$1h $2');
    }

    public dateTimeAttribute(show: Show): string | undefined {
        return show.date ? new Date(show.date * 1000).toISOString() : undefined;
    }

    public priceLabel(show: Show): string {
        if (!show.price) {
            return 'Entrée gratuite';
        }

        return show.reducedPrice
            ? `${show.price} € / ${show.reducedPrice} €`
            : `${show.price} €`;
    }

    private buildMonthGroups(shows: Show[]): ShowMonthGroup[] {
        const groups = new Map<string, ShowMonthGroup>();

        shows.forEach((show) => {
            if (!show.date) {
                return;
            }

            const date = new Date(show.date * 1000);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.shows.push(show);
                return;
            }

            groups.set(key, {
                label: ShowsListComponent.MONTH_FORMATTER.format(date),
                shows: [show],
            });
        });

        return Array.from(groups.values());
    }

    private formatDatePart(show: Show, formatter: Intl.DateTimeFormat): string {
        if (!show.date) {
            return '';
        }

        return formatter.format(new Date(show.date * 1000));
    }

}
