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
import { WhoComponent } from './components/who/who.component'
import { ShowsListComponent } from './components/shows/event//shows-list.component';
import { HighlightedShowCardComponent } from './components/shows/event/highlighted-show-card.component';
import { ShowsComponent } from './components/shows/shows.component';
import { NoShowsComponent } from './components/no-shows/no-shows.component';
import { FormatComponent } from './components/format/format.component';
import { ToolsComponent } from './components/tools/tools.component';
import { JoinUsComponent } from './components/join-us/join-us.component';
import { ProgrammationAdminComponent } from './components/programmation-admin/programmation-admin.component';
import { PlanningComponent } from './components/planning/planning.component';
import { PrivateToolsHomeComponent } from './components/private-tools-home/private-tools-home.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ShowsComponent,
    WhoComponent,
    ShowCardComponent,
    NoShowsComponent,
    ShowsListComponent,
    HighlightedShowCardComponent,
    FormatComponent,
    JoinUsComponent,
    ToolsComponent,
    ProgrammationAdminComponent,
    PlanningComponent,
    PrivateToolsHomeComponent,
    LegalNoticeComponent,
    ShowReservationButtonsComponent
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule { }
