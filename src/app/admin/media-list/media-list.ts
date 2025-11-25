import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MediaService } from '../../core/services/media.service';
import { EventService } from '../../core/services/event.service';
import { Media } from '../../core/models/media.model';
import { AppEvent } from '../../core/models/event.model';

@Component({
  selector: 'app-media-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatGridListModule
  ],
  template: `
    <div *ngIf="event$ | async as event" class="media-list-header">
      <h2>Media for {{ event.name }}</h2>
      <button mat-flat-button routerLink="/admin/events">Back to Events</button>
    </div>

    <mat-grid-list cols="4" rowHeight="250px" gutterSize="16px" *ngIf="media$ | async as mediaList">
      <mat-grid-tile *ngIf="mediaList.length === 0">
        <p>No media has been uploaded for this event yet.</p>
      </mat-grid-tile>

      <mat-grid-tile *ngFor="let media of mediaList" [style.background-image]="'url(' + media.url + ')'" class="media-tile">
        <mat-grid-tile-footer>
           <div class="media-actions">
            <span>{{ media.description }}</span>
            <span class="spacer"></span>
            <button mat-icon-button color="warn" (click)="deleteMedia(media)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-grid-tile-footer>
      </mat-grid-tile>
    </mat-grid-list>
  `,
  styles: [`
    .media-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .media-tile {
      background-size: cover;
      background-position: center;
    }
    .media-actions {
        width: 100%;
        display: flex;
        align-items: center;
    }
    .spacer {
        flex: 1 1 auto;
    }
  `]
})
export class MediaListComponent implements OnInit {
  eventId!: string;
  event$!: Observable<AppEvent>;
  media$!: Observable<Media[]>;

  constructor(
    private route: ActivatedRoute,
    private mediaService: MediaService,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId')!;
    if (this.eventId) {
      this.event$ = this.eventService.getEventById(this.eventId).pipe(map(res => res.data as AppEvent));
      this.loadMedia();
    }
  }

  loadMedia(): void {
    this.media$ = this.mediaService.getMediaForEvent(this.eventId).pipe(
      map(mediaRes => {
        if (mediaRes) throw mediaRes;
        return mediaRes as Media[];
      })
    );
  }

  async deleteMedia(media: Media): Promise<void> {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await this.mediaService.deleteMedia(media);
        this.snackBar.open('Media deleted successfully', 'Close', { duration: 3000 });
        this.loadMedia(); // Refresh
      } catch (error: any) {
        this.snackBar.open(`Error: ${error.message}`, 'Close', { duration: 5000 });
      }
    }
  }
}
