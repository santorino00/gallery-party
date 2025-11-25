import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';

export const eventGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const router = inject(Router);
  const slug = route.paramMap.get('slug');
  const sessionKey = `event_access_${slug}`;
  const hasAccess = localStorage.getItem(sessionKey) === 'true';

  if (hasAccess) {
    return true;
  } else {
    // Torna alla pagina di accesso senza loop
    return router.parseUrl(`/${slug}/access`);
  }
};
