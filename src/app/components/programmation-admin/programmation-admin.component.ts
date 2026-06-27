import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Show } from 'src/app/model'
import { environment } from 'src/environments/environment'

type DateFilter = 'all' | 'future' | 'past'
type PublishFilter = 'all' | 'published' | 'draft'
type HighlightFilter = 'all' | 'highlighted'
type SortMode = 'date-asc' | 'date-desc' | 'name-asc' | 'updated'
type MediaField = 'logoLink'
type ShowField = 'isPublished' | 'isHighlighted' | 'freeForStudents'

interface AdminSession {
  authenticated: boolean
  csrfToken: string
}

interface MediaItem {
  label: string
  url: string
  kind: 'logo' | 'upload'
}

interface MediaLibrary {
  kitLogos: MediaItem[]
  uploads: MediaItem[]
}

@Component({
  selector: 'app-programmation-admin',
  templateUrl: './programmation-admin.component.html',
})
export class ProgrammationAdminComponent implements OnInit {
  private static ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  private readonly endpoint = environment.url

  public shows: Show[] = []
  public selectedShowIds = new Set<string>()
  public password = ''
  public csrfToken = ''
  public search = ''
  public dateFilter: DateFilter = 'future'
  public publishFilter: PublishFilter = 'all'
  public highlightFilter: HighlightFilter = 'all'
  public sortMode: SortMode = 'date-desc'
  public bulkLocation = ''
  public mediaLibrary: MediaLibrary = { kitLogos: [], uploads: [] }
  public uploadingMediaKey = ''
  public isAuthenticated = false
  public isLoading = true
  public isSaving = false
  public hasUnsavedChanges = false
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

  public get publishedCount(): number {
    return this.shows.filter((show) => show.isPublished).length
  }

  public get futureCount(): number {
    const now = Math.floor(Date.now() / 1000)
    return this.shows.filter((show) => (show.date || 0) >= now).length
  }

  public get hasActiveFilters(): boolean {
    return Boolean(this.search.trim())
      || this.dateFilter !== 'future'
      || this.publishFilter !== 'all'
      || this.highlightFilter !== 'all'
      || this.sortMode !== 'date-desc'
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
        this.loadMedia()
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
        this.mediaLibrary = { kitLogos: [], uploads: [] }
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
        logoLink: '',
        reservationLink: '',
        isPublished: false,
        isHighlighted: false,
      },
      ...this.shows,
    ]
    this.markUnsaved()
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
    this.markUnsaved()
  }

  public removeShow(show: Show): void {
    this.selectedShowIds.delete(this.showKey(show))
    this.shows = this.shows.filter((item) => item !== show)
    this.markUnsaved()
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
    this.markUnsaved()
  }

  public bulkSetHighlighted(value: boolean): void {
    this.selectedShows.forEach((show) => show.isHighlighted = value)
    this.markUnsaved()
  }

  public bulkSetFreeForStudents(value: boolean): void {
    this.selectedShows.forEach((show) => show.freeForStudents = value)
    this.markUnsaved()
  }

  public bulkApplyLocation(): void {
    const location = this.bulkLocation.trim()
    if (!location) {
      return
    }
    this.selectedShows.forEach((show) => show.location = location)
    this.bulkLocation = ''
    this.markUnsaved()
  }

  public bulkRemoveSelected(): void {
    this.shows = this.shows.filter((show) => !this.selectedShowIds.has(this.showKey(show)))
    this.clearSelection()
    this.markUnsaved()
  }

  public resetFilters(): void {
    this.search = ''
    this.dateFilter = 'future'
    this.publishFilter = 'all'
    this.highlightFilter = 'all'
    this.sortMode = 'date-desc'
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
        this.hasUnsavedChanges = false
        this.loadMedia()
      },
      error: () => {
        this.error = 'Sauvegarde impossible'
        this.isSaving = false
      },
    })
  }

  public selectShowMedia(show: Show, field: MediaField, url: string): void {
    show[field] = url
    this.markUnsaved()
  }

  public async uploadShowMedia(event: Event, show: Show, field: MediaField): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) {
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.error = 'Utilise une image JPEG ou PNG'
      return
    }

    const key = `${this.showKey(show)}-${field}`
    this.uploadingMediaKey = key
    this.error = ''
    this.message = ''

    try {
      const compressed = await this.compressImage(file)
      this.http.post<MediaItem>(
        `${this.endpoint}?action=upload`,
        compressed,
        { headers: this.authHeaders, withCredentials: true }
      ).subscribe({
        next: (media) => {
          show[field] = media.url
          this.uploadingMediaKey = ''
          this.message = 'Image ajoutée'
          this.markUnsaved()
          this.loadMedia()
        },
        error: () => {
          this.uploadingMediaKey = ''
          this.error = "Upload impossible"
        },
      })
    } catch (error) {
      this.uploadingMediaKey = ''
      this.error = "Impossible de préparer l'image"
    }
  }

  public isUploadingMedia(show: Show, field: MediaField): boolean {
    return this.uploadingMediaKey === `${this.showKey(show)}-${field}`
  }

  public clearShowMedia(show: Show, field: MediaField): void {
    show[field] = ''
    this.markUnsaved()
  }

  public markUnsaved(): void {
    this.hasUnsavedChanges = true
    this.message = ''
  }

  public dateInputValue(show: Show): string {
    if (!show.date) {
      return ''
    }

    return this.dateToInputValue(new Date(show.date * 1000))
  }

  public adminDateLabel(show: Show): string {
    if (!show.date) {
      return 'Date à renseigner'
    }

    return ProgrammationAdminComponent.ADMIN_DATE_FORMATTER.format(new Date(show.date * 1000))
  }

  public isPastShow(show: Show): boolean {
    return Boolean(show.date) && (show.date || 0) < Math.floor(Date.now() / 1000)
  }

  public toggleShowFlag(show: Show, field: ShowField): void {
    show[field] = !show[field]
    this.markUnsaved()
  }

  private dateToInputValue(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  public updateDate(show: Show, value: string): void {
    show.date = value ? Math.floor(new Date(value).getTime() / 1000) : undefined
    this.markUnsaved()
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
          this.loadMedia()
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
        this.hasUnsavedChanges = false
        this.isLoading = false
      },
      error: () => {
        this.error = 'Chargement impossible'
        this.isLoading = false
      },
    })
  }

  private loadMedia(): void {
    this.http.get<MediaLibrary>(
      `${this.endpoint}?action=media`,
      { headers: this.authHeaders, withCredentials: true }
    ).subscribe({
      next: (mediaLibrary) => {
        this.mediaLibrary = mediaLibrary
      },
    })
  }

  private compressImage(file: File): Promise<{ fileName: string; mimeType: string; dataUrl: string }> {
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const maxDimension = 2400
    const quality = 0.88

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => {
        const image = new Image()
        image.onerror = () => reject(new Error('Image invalide'))
        image.onload = () => {
          const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
          const width = Math.max(1, Math.round(image.naturalWidth * ratio))
          const height = Math.max(1, Math.round(image.naturalHeight * ratio))
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Canvas indisponible'))
            return
          }

          context.drawImage(image, 0, 0, width, height)
          resolve({
            fileName: file.name,
            mimeType: outputType,
            dataUrl: canvas.toDataURL(outputType, outputType === 'image/jpeg' ? quality : undefined),
          })
        }
        image.src = String(reader.result || '')
      }
      reader.readAsDataURL(file)
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
