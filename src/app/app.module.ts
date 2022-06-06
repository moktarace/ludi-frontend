import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { ShowCardComponent } from './components/event/show-card.component'
import { ShowReservationButtonsComponent } from './components/event/utility/show-reservation-buttons.component'
import { FooterComponent } from './components/footer/footer.component'
import { HeaderComponent } from './components/header/header.component'
import { PartnersComponent } from './components/partners/partners.component'
import { WhoComponent } from './components/who/who.component'

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    WhoComponent,
    PartnersComponent,
    ShowCardComponent,
    ShowReservationButtonsComponent
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule { }
