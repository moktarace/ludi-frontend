import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Show } from './../model';

@Injectable({ providedIn: 'root' })
export class LudiService {

  constructor(private http: HttpClient) { }

  public show(): Observable<Show[]> {
    return this.http.get<Show[]>(environment.url);
  }

}
