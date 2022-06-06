import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'
import { filter, map, mapTo, Observable, of } from 'rxjs'
import { environment } from 'src/environments/environment';
import { Show } from './../model'
import { show } from './ludi.service.mock-data'

@Injectable({ providedIn: 'root' })
export class LudiService {
  
  constructor(private http: HttpClient) { }
  
  public show(): Observable<Show[]> {
    if (environment.url) {
      return this.http.get<Show[]>(environment.url);
    }
      return of(show);
  }

}
