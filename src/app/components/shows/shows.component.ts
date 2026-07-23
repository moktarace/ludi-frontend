import { Component, Input } from '@angular/core'
import { Show } from 'src/app/model'

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
})
export class ShowsComponent {

  private static readonly FEATURED_SHOWS_COUNT = 4;
  private static readonly UPCOMING_SHOWS_BATCH_SIZE = 6;

  public visibleUpcomingShowsCount = ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE;
  public featuredShows: Show[] = [];
  public upcomingShows: Show[] = [];
  public displayedUpcomingShows: Show[] = [];

  private currentShows: Show[] = [];
  private currentHighlightedShow?: Show | null;

  @Input()
  public set shows(shows: Show[] | null | undefined) {
    this.currentShows = shows || [];
    this.rebuildShowCollections();
  }

  @Input()
  public set highlightedShow(show: Show | null | undefined) {
    this.currentHighlightedShow = show;
    this.rebuildShowCollections();
  }

  public get primaryShow(): Show | undefined {
    return this.featuredShows[0];
  }

  public get secondaryShows(): Show[] {
    return this.featuredShows.slice(1);
  }

  public get remainingUpcomingShowsCount(): number {
    return Math.max(this.upcomingShows.length - this.visibleUpcomingShowsCount, 0);
  }

  public get nextUpcomingShowsCount(): number {
    return Math.min(
      this.remainingUpcomingShowsCount,
      ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE
    );
  }

  public get canCollapseUpcomingShows(): boolean {
    return this.visibleUpcomingShowsCount > ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE;
  }

  public get isUpcomingExpanded(): boolean {
    return this.visibleUpcomingShowsCount > ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE;
  }

  public showMoreShows(): void {
    this.visibleUpcomingShowsCount = Math.min(
      this.visibleUpcomingShowsCount + ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE,
      this.upcomingShows.length
    );
    this.updateDisplayedUpcomingShows();
  }

  public collapseShows(): void {
    this.visibleUpcomingShowsCount = ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE;
    this.updateDisplayedUpcomingShows();
  }

  private rebuildShowCollections(): void {
    const highlightedShow = this.currentHighlightedShow
      ? this.currentShows.find((show) => this.isSameShow(show, this.currentHighlightedShow as Show))
      : undefined;
    const primaryShow = highlightedShow || this.currentShows[0];
    const otherShows = primaryShow
      ? this.currentShows.filter((show) => !this.isSameShow(show, primaryShow))
      : [];

    this.featuredShows = primaryShow
      ? [primaryShow, ...otherShows.slice(0, ShowsComponent.FEATURED_SHOWS_COUNT - 1)]
      : [];
    this.upcomingShows = [...this.currentShows];
    this.visibleUpcomingShowsCount = ShowsComponent.UPCOMING_SHOWS_BATCH_SIZE;
    this.updateDisplayedUpcomingShows();
  }

  private updateDisplayedUpcomingShows(): void {
    this.displayedUpcomingShows = this.upcomingShows.slice(0, this.visibleUpcomingShowsCount);
  }

  private isSameShow(firstShow: Show, secondShow: Show): boolean {
    if (firstShow.id !== undefined && secondShow.id !== undefined) {
      return String(firstShow.id) === String(secondShow.id);
    }

    return firstShow === secondShow;
  }

}
