import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { ShowCardComponent } from './components/shows/event/show-card.component'
import { ShowReservationButtonsComponent } from './components/shows/event//utility/show-reservation-buttons.component'
import { FooterComponent } from './components/footer/footer.component'
import { HeaderComponent } from './components/header/header.component'
import { PartnersComponent } from './components/partners/partners.component'
import { WhoComponent } from './components/who/who.component'
import { ShowsListComponent } from './components/shows/event//shows-list.component';
import { HighlightedShowCardComponent } from './components/shows/event/highlighted-show-card.component';
import { ShowsComponent } from './components/shows/shows.component';
import { MonthlyComponent } from './components/monthly/monthly.component';
import { NoShowsComponent } from './components/no-shows/no-shows.component';
import { FlyerComponent } from './components/flyers/flyers.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ShowsComponent,
    WhoComponent,
    PartnersComponent,
    ShowCardComponent,
    NoShowsComponent,
    ShowsListComponent,
    FlyerComponent,
    HighlightedShowCardComponent,
    MonthlyComponent,
    ShowReservationButtonsComponent
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule { }
