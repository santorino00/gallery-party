import { Routes } from '@angular/router';
import { EventComponent } from './pages/event/event';
import { GalleryComponent } from './pages/gallery/gallery';
import { UploadComponent } from './pages/upload/upload';
import { eventGuard } from './core/guards/event.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: ':slug',
    component: EventComponent,
    children: [
      { path: '', redirectTo: 'gallery', pathMatch: 'full' },
      { path: 'gallery', component: GalleryComponent, canActivate: [eventGuard] },
      { path: 'upload', component: UploadComponent, canActivate: [eventGuard] },
    ],
  },
];
