import { Routes } from '@angular/router';
import { EventComponent } from './pages/event/event';
import { GalleryComponent } from './pages/gallery/gallery';
import { UploadComponent } from './pages/upload/upload';
import { eventGuard } from './core/guards/event.guard';
import { EventAccessComponent } from './pages/event-access/event-access';

export const PUBLIC_ROUTES: Routes = [
  {
    path: ':slug/access',
    component: EventAccessComponent,
  },
  {
    path: ':slug',
    component: EventComponent,
    canActivateChild: [eventGuard],
    children: [
      { path: '', redirectTo: 'gallery', pathMatch: 'full' },
      { path: 'gallery', component: GalleryComponent },
      { path: 'upload', component: UploadComponent },
    ],
  },
];
