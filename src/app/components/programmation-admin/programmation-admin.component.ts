import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Show } from 'src/app/model'
import { environment } from 'src/environments/environment'

type DateFilter = 'all' | 'future' | 'past'
type PublishFilter = 'all' | 'published' | 'draft'
type HighlightFilter = 'all' | 'highlighted'
type SortMode = 'date-asc' | 'date-desc' | 'name-asc' | 'updated'

interface AdminSession {
  authenticated: boolean
  csrfToken: string
}

@Component({
  selector: 'app-programmation-admin',
  templateUrl: './programmation-admin.component.html',
})
export class ProgrammationAdminComponent implements OnInit {
  private readonly endpoint = environment.url

  public shows: Show[] = []
  public selectedShowIds = new Set<string>()
  public password = ''
  public csrfToken = ''
  public search = ''
  public dateFilter: DateFilter = 'all'
  public publishFilter: PublishFilter = 'all'
  public highlightFilter: HighlightFilter = 'all'
  public sortMode: SortMode = 'date-desc'
  public bulkLocation = ''
  public reviveShowId = ''
  public reviveDateValue = ''
  public keepRevivalLinks = false
  public isAuthenticated = false
  public isLoading = true
  public isSaving = false
  public message = ''
  public error = ''

  constructor(private http: HttpClient) {}

  public ngOnInit(): void {
    this.refreshSession()
  }

  public get filteredShows(): Show[] {
    const term = this.search.trim().toLowerCase()
    const now = Math.floor(Date.now() / 1000)
    const filtered = this.shows.filter((show) => {
      const matchesSearch = !term || [
        show.name,
        show.location,
        show.shortDescription,
        show.description,
      ].some((value) => String(value || '').toLowerCase().includes(term))

      const matchesDate = this.dateFilter === 'all'
        || (this.dateFilter === 'future' && (show.date || 0) >= now)
        || (this.dateFilter === 'past' && (show.date || 0) < now)

      const matchesPublish = this.publishFilter === 'all'
        || (this.publishFilter === 'published' && show.isPublished)
        || (this.publishFilter === 'draft' && !show.isPublished)

      const matchesHighlight = this.highlightFilter === 'all'
        || (this.highlightFilter === 'highlighted' && show.isHighlighted)

      return matchesSearch && matchesDate && matchesPublish && matchesHighlight
    })

    return [...filtered].sort((a, b) => {
      if (this.sortMode === 'date-asc') {
        return (a.date || 0) - (b.date || 0)
      }
      if (this.sortMode === 'date-desc') {
        return (b.date || 0) - (a.date || 0)
      }
      if (this.sortMode === 'name-asc') {
        return String(a.name || '').localeCompare(String(b.name || ''))
      }
      return this.shows.indexOf(a) - this.shows.indexOf(b)
    })
  }

  public get selectedShows(): Show[] {
    return this.shows.filter((show) => this.selectedShowIds.has(this.showKey(show)))
  }

  public get selectedCount(): number {
    return this.selectedShows.length
  }

  public get areAllVisibleSelected(): boolean {
    const visible = this.filteredShows
    return Boolean(visible.length) && visible.every((show) => this.selectedShowIds.has(this.showKey(show)))
  }

  public get revivalCandidates(): Show[] {
    const now = Math.floor(Date.now() / 1000)
    return this.shows
      .filter((show) => (show.date || 0) < now)
      .sort((a, b) => (b.date || 0) - (a.date || 0))
  }

  public get selectedRevivalShow(): Show | undefined {
    return this.shows.find((show) => this.showKey(show) === this.reviveShowId)
  }

  public login(): void {
    this.error = ''
    this.http.post<AdminSession>(
      `${this.endpoint}?action=login`,
      { password: this.password },
      { withCredentials: true }
    ).subscribe({
      next: (session) => {
        this.password = ''
        this.applySession(session)
        this.loadShows()
      },
      error: () => {
        this.error = 'Connexion impossible'
      },
    })
  }

  public logout(): void {
    this.http.post(
      `${this.endpoint}?action=logout`,
      {},
      { headers: this.authHeaders, withCredentials: true }
    ).subscribe({
      next: () => {
        this.isAuthenticated = false
        this.csrfToken = ''
        this.shows = []
        this.selectedShowIds.clear()
      },
    })
  }

  public addShow(): void {
    const nextId = Date.now()
    this.shows = [
      {
        id: `show-${nextId}`,
        name: 'Nouvelle date',
        date: Math.floor(Date.now() / 1000),
        location: '',
        description: '',
        shortDescription: '',
        price: 0,
        reducedPrice: 0,
        freeForStudents: false,
        imgLink: '',
        logoLink: '',
        reservationLink: '',
        isPublished: false,
        isHighlighted: false,
      },
      ...this.shows,
    ]
  }

  public duplicateShow(show: Show): void {
    this.shows = [
      {
        ...show,
        id: `show-${Date.now()}`,
        name: `${show.name || 'Date'} - copie`,
        isPublished: false,
        isHighlighted: false,
      },
      ...this.shows,
    ]
  }

  public prepareRevival(show: Show): void {
    this.reviveShowId = this.showKey(show)
    this.reviveDateValue = this.nextRevivalDateInputValue(show)
  }

  public prepareSelectedRevival(): void {
    const source = this.selectedRevivalShow
    this.reviveDateValue = source ? this.nextRevivalDateInputValue(source) : ''
  }

  public reviveSelectedShow(): void {
    const source = this.selectedRevivalShow
    if (!source || !this.reviveDateValue) {
      return
    }

    this.reviveShow(source, this.reviveDateValue)
  }

  public reviveShow(show: Show, dateValue?: string): void {
    const nextDateValue = dateValue || this.nextRevivalDateInputValue(show)
    const timestamp = Math.floor(new Date(nextDateValue).getTime() / 1000)
    const revivedShow: Show = {
      ...show,
      id: `show-${Date.now()}`,
      date: timestamp,
      reservationLink: this.keepRevivalLinks ? show.reservationLink : '',
      isPublished: false,
      isHighlighted: false,
    }

    this.shows = [revivedShow, ...this.shows]
    this.selectedShowIds.clear()
    this.search = String(revivedShow.name || '')
    this.dateFilter = 'all'
    this.publishFilter = 'draft'
    this.sortMode = 'updated'
    this.reviveShowId = this.showKey(revivedShow)
    this.reviveDateValue = this.dateInputValue(revivedShow)
    this.message = 'Date repêchée en brouillon'
    this.error = ''
  }

  public removeShow(show: Show): void {
    this.selectedShowIds.delete(this.showKey(show))
    this.shows = this.shows.filter((item) => item !== show)
  }

  public toggleShowSelection(show: Show, checked: boolean): void {
    const key = this.showKey(show)
    if (checked) {
      this.selectedShowIds.add(key)
      return
    }
    this.selectedShowIds.delete(key)
  }

  public toggleVisibleSelection(checked: boolean): void {
    this.filteredShows.forEach((show) => this.toggleShowSelection(show, checked))
  }

  public clearSelection(): void {
    this.selectedShowIds.clear()
  }

  public bulkSetPublished(value: boolean): void {
    this.selectedShows.forEach((show) => show.isPublished = value)
  }

  public bulkSetHighlighted(value: boolean): void {
    this.selectedShows.forEach((show) => show.isHighlighted = value)
  }

  public bulkSetFreeForStudents(value: boolean): void {
    this.selectedShows.forEach((show) => show.freeForStudents = value)
  }

  public bulkApplyLocation(): void {
    const location = this.bulkLocation.trim()
    if (!location) {
      return
    }
    this.selectedShows.forEach((show) => show.location = location)
    this.bulkLocation = ''
  }

  public bulkRemoveSelected(): void {
    this.shows = this.shows.filter((show) => !this.selectedShowIds.has(this.showKey(show)))
    this.clearSelection()
  }

  public save(): void {
    this.isSaving = true
    this.error = ''
    this.message = ''

    this.http.post<Show[]>(
      `${this.endpoint}?action=admin`,
      this.shows,
      { headers: this.authHeaders, withCredentials: true }
    ).subscribe({
      next: (shows) => {
        this.shows = shows
        this.selectedShowIds.clear()
        this.message = 'Dates sauvegardées'
        this.isSaving = false
      },
      error: () => {
        this.error = 'Sauvegarde impossible'
        this.isSaving = false
      },
    })
  }

  public dateInputValue(show: Show): string {
    if (!show.date) {
      return ''
    }

    return this.dateToInputValue(new Date(show.date * 1000))
  }

  private dateToInputValue(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  private nextRevivalDateInputValue(show: Show): string {
    const nextDate = show.date ? new Date(show.date * 1000) : new Date()
    const now = new Date()
    do {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    } while (nextDate.getTime() <= now.getTime())
    return this.dateToInputValue(nextDate)
  }

  public updateDate(show: Show, value: string): void {
    show.date = value ? Math.floor(new Date(value).getTime() / 1000) : undefined
  }

  public showKey(show: Show): string {
    return String(show.id || this.shows.indexOf(show))
  }

  public trackShow(index: number, show: Show): string | number {
    return show.id || index
  }

  private refreshSession(): void {
    this.http.get<AdminSession>(
      `${this.endpoint}?action=session`,
      { withCredentials: true }
    ).subscribe({
      next: (session) => {
        this.applySession(session)
        if (session.authenticated) {
          this.loadShows()
          return
        }
        this.isLoading = false
      },
      error: () => {
        this.isLoading = false
      },
    })
  }

  private loadShows(): void {
    this.isLoading = true
    this.http.get<Show[]>(
      `${this.endpoint}?action=admin`,
      { headers: this.authHeaders, withCredentials: true }
    ).subscribe({
      next: (shows) => {
        this.shows = shows
        this.selectedShowIds.clear()
        this.isLoading = false
      },
      error: () => {
        this.error = 'Chargement impossible'
        this.isLoading = false
      },
    })
  }

  private applySession(session: AdminSession): void {
    this.isAuthenticated = session.authenticated
    this.csrfToken = session.csrfToken
  }

  private get authHeaders(): HttpHeaders {
    return this.csrfToken ? new HttpHeaders({ 'X-CSRF-Token': this.csrfToken }) : new HttpHeaders()
  }
}
