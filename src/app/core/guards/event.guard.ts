import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';

export const eventGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const router = inject(Router);
  const slug = route.parent?.paramMap.get('slug');
  const sessionKey = `event_access_${slug}`;
  const hasAccess = localStorage.getItem(sessionKey) === 'true';

  if (hasAccess) {
    return true;
  } else {
    // Redirect to the access page using createUrlTree for better reliability
    if (slug) {
      return router.createUrlTree(['/', slug, 'access']);
    }
    // Fallback to home if the slug is not available for some reason
    return router.createUrlTree(['/']);
  }
};
