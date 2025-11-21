import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

// Questo servizio di "sessione" andrà creato
// import { EventSessionService } from '../services/event-session.service';

export const eventGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const router = inject(Router);
  // const sessionService = inject(EventSessionService);
  const slug = route.paramMap.get('slug');

  // Logica temporanea con localStorage, verrà sostituita da un servizio
  const sessionKey = `event_access_${slug}`;
  const hasAccess = localStorage.getItem(sessionKey) === 'true';

  if (hasAccess) {
    return true;
  } else {
    // Se non ha accesso, lo rimandiamo alla pagina dell'evento
    // dove gli verrà chiesta la password.
    if (slug) {
       router.navigate([`/${slug}`]);
    } else {
       router.navigate(['/']);
    }
    return false;
  }
};
