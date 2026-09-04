import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component'
import { ShowCardComponent } from './components/shows/event/show-card.component'
import { ShowReservationButtonsComponent } from './components/shows/event//utility/show-reservation-buttons.component'
import { FooterComponent } from './components/footer/footer.component'
import { HeaderComponent } from './components/header/header.component'
import { WhoComponent } from './components/who/who.component'
import { ShowsListComponent } from './components/shows/event//shows-list.component';
import { ShowsComponent } from './components/shows/shows.component';
import { NoShowsComponent } from './components/no-shows/no-shows.component';
import { FormatComponent } from './components/format/format.component';
import { ToolsComponent } from './components/tools/tools.component';
import { VoteCardComponent } from './components/tools/vote-card/vote-card.component';
import { JoinUsComponent } from './components/join-us/join-us.component';
import { ProgrammationAdminComponent } from './components/programmation-admin/programmation-admin.component';
import { PlanningComponent } from './components/planning/planning.component';
import { PrivateToolsHomeComponent } from './components/private-tools-home/private-tools-home.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { GalaxyComponent } from './components/galaxy/galaxy.component';

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
    FormatComponent,
    JoinUsComponent,
    ToolsComponent,
    VoteCardComponent,
    ProgrammationAdminComponent,
    PlanningComponent,
    PrivateToolsHomeComponent,
    LegalNoticeComponent,
    GalaxyComponent,
    ShowReservationButtonsComponent
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule { }
