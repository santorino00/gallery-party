import { Routes } from '@angular/router';
import { LoginComponent } from './admin/login/login';
import { RecoverComponent } from './admin/recover/recover';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { EventListComponent } from './admin/event-list/event-list';
import { EventFormComponent } from './admin/event-form/event-form';
import { MediaListComponent } from './admin/media-list/media-list';

// Qui andrà l'AuthGuard
import { authGuard } from './core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'recover', component: RecoverComponent },
  {
    path: '',
    component: DashboardComponent, // Un layout per l'admin
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'events', pathMatch: 'full' },
      { path: 'events', component: EventListComponent },
      { path: 'events/new', component: EventFormComponent },
      { path: 'events/edit/:id', component: EventFormComponent },
      { path: 'events/media/:eventId', component: MediaListComponent },
    ],
  },
];
