import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '', // Le rotte pubbliche sono alla radice
    loadChildren: () => import('./public.routes').then(m => m.PUBLIC_ROUTES)
  },
  // Aggiungeremo una wildcard route per le pagine non trovate
  {
    path: '**',
    redirectTo: '/admin', // o una pagina 404 dedicata
    pathMatch: 'full'
  }
];
