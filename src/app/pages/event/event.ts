import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatTabsModule } from "@angular/material/tabs";
import { map, Observable } from "rxjs";

import { AppEvent } from "../../core/models/event.model";
import { EventService } from "../../core/services/event.service";
import { PasswordDialogComponent } from "../password-dialog/password-dialog";

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
      <a mat-tab-link *ngFor="let link of navLinks"
         [routerLink]="['./', link.path]"
         [relativeTo]="route"
         routerLinkActive #rla="routerLinkActive"
         [active]="rla.isActive">{{ link.label }}</a>
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
    nav.mat-tab-nav-bar {
      margin-bottom: 16px;
      justify-content: center;
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
    public route: ActivatedRoute,  // deve essere public per template
    private router: Router,
    private dialog: MatDialog,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    if (!this.slug) {
      this.router.navigate(['/']);
      return;
    }

    this.event$ = this.eventService.getEventBySlug(this.slug).pipe(
      map((res: any) => res.data as AppEvent)
    );

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

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.hasAccess = true;
        // Forziamo il change detection per rendere disponibile il router-outlet
        this.cdr.detectChanges();
        // La navigazione alla gallery avverrà automaticamente grazie al redirectTo nella configurazione delle rotte
      }
    });
  }
}
