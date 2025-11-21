import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { PasswordDialogComponent } from '../password-dialog/password-dialog';
import { EventService } from '../../core/services/event.service';
import { AppEvent } from '../../core/models/event.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatDialogModule,
    MatTabsModule
  ],
  template: `
    <div *ngIf="event$ | async as event">
      <header class="event-header">
        <h1>{{ event.name }}</h1>
        <p>{{ event.description }}</p>
      </header>

      <nav mat-tab-nav-bar>
        <a mat-tab-link
           *ngFor="let link of navLinks"
           [routerLink]="link.path"
           routerLinkActive #rla="routerLinkActive"
           [active]="rla.isActive">
          {{link.label}}
        </a>
      </nav>

      <div *ngIf="hasAccess">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .event-header {
      padding: 24px;
      text-align: center;
      background: #f5f5f5;
    }
  `]
})
export class EventComponent implements OnInit {
  slug!: string;
  event$!: Observable<AppEvent>;
  hasAccess = false;
  navLinks = [
    { path: 'gallery', label: 'Gallery' },
    { path: 'upload', label: 'Upload' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    if (!this.slug) {
      this.router.navigate(['/']); // Redirect if no slug
      return;
    }

    this.event$ = this.eventService.getEventBySlug(this.slug).pipe(map(res => res.data as AppEvent));
    this.checkAccess();
  }

  checkAccess(): void {
    const sessionKey = `event_access_${this.slug}`;
    if (localStorage.getItem(sessionKey) === 'true') {
      this.hasAccess = true;
    } else {
      this.openPasswordDialog();
    }
  }

  openPasswordDialog(): void {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '350px',
      disableClose: true,
      data: { slug: this.slug }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.hasAccess = true;
        // Navigate to the gallery after successful password entry
        this.router.navigate(['/', this.slug, 'gallery']);
      } else {
        // Optional: handle incorrect password case, maybe show an error
        // For now, the dialog handles re-tries. If they close it, they are stuck.
      }
    });
  }
}
