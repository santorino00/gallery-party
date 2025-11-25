import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QrCodeComponent } from '../../shared/components/qr-code/qr-code';
import { EventService } from '../../core/services/event.service';
import { AppEvent } from '../../core/models/event.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="event-list-header">
      <h2>Events</h2>
      <button mat-raised-button color="primary" routerLink="/admin/events/new">
        Create New Event
      </button>
    </div>

    <div *ngIf="events$ | async as events">
      <table mat-table [dataSource]="events" class="mat-elevation-z8">
        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Name </th>
        <td mat-cell *matCellDef="let event"> {{event.name}} </td>
      </ng-container>

      <!-- Slug Column -->
      <ng-container matColumnDef="slug">
        <th mat-header-cell *matHeaderCellDef> Slug </th>
        <td mat-cell *matCellDef="let event"> /{{event.slug}} </td>
      </ng-container>

      <!-- Date Column -->
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef> Date </th>
        <td mat-cell *matCellDef="let event"> {{event.event_date | date:'shortDate'}} </td>
      </ng-container>

      <!-- Actions Column -->
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef> Actions </th>
        <td mat-cell *matCellDef="let event">
          <button mat-icon-button color="primary" (click)="showQrCode(event)">
            <mat-icon>qr_code</mat-icon>
          </button>
          <button mat-icon-button color="accent" [routerLink]="['/admin/events/media', event.id]">
            <mat-icon>photo_library</mat-icon>
          </button>
          <button mat-icon-button [routerLink]="['/admin/events/edit', event.id]">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteEvent(event.id)">
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .event-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
    }
    button[mat-icon-button] {
      margin-right: 8px;
    }
  `]
})
export class EventListComponent implements OnInit {
  events$: Observable<AppEvent[]> = of([]);
  displayedColumns: string[] = ['name', 'slug', 'date', 'actions'];

  constructor(
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.events$ = this.eventService.getEvents().pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        return response.data as AppEvent[];
      }),
      catchError(err => {
        this.snackBar.open(`Error loading events: ${err.message}`, 'Close', { duration: 5000 });
        return of([]); // Ritorna un array vuoto in caso di errore
      })
    );
  }

  deleteEvent(id: string): void {
    if (confirm('Are you sure you want to delete this event? All its media will be lost.')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.snackBar.open('Event deleted successfully', 'Close', { duration: 3000 });
          this.loadEvents(); // Refresh the list
        },
        error: (error) => {
          this.snackBar.open(`Error deleting event: ${error.message}`, 'Close', { duration: 5000 });
        }
      });
    }
  }

  showQrCode(event: AppEvent): void {
    const eventUrl = `${window.location.origin}/${event.slug}`;
    this.dialog.open(QrCodeComponent, {
      data: {
        value: eventUrl,
        eventName: event.name
      }
    });
  }
}
