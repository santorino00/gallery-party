import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MediaService } from '../../core/services/media.service';
import { EventService } from '../../core/services/event.service';
import { Media } from '../../core/models/media.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule
  ],
  template: `
    <div class="gallery-container">
      <div *ngIf="(media$ | async)?.length === 0" class="no-media">
        <h2>No photos or videos yet!</h2>
        <p>Be the first to upload something.</p>
      </div>

      <mat-grid-list cols="4" rowHeight="1:1" gutterSize="16px">
        <mat-grid-tile *ngFor="let media of media$ | async">
          <mat-card class="media-card">
            <img mat-card-image [src]="media.signedUrl" [alt]="media.description">
            <mat-card-header>
              <mat-card-subtitle>{{ media.description }}</mat-card-subtitle>
            </mat-card-header>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .gallery-container {
      padding: 24px;
    }
    .no-media {
      text-align: center;
      padding: 48px;
    }
    .media-card {
      width: 100%;
      height: 100%;
    }
    .media-card img {
      object-fit: cover;
      height: 80%; /* Adjust to show description */
    }
  `]
})
export class GalleryComponent implements OnInit {
  media$!: Observable<Media[]>;
  private eventId!: string;

  constructor(
    private route: ActivatedRoute,
    private mediaService: MediaService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    // We need to get the event ID from the slug
    this.media$ = this.route.parent!.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug')!;
        return this.eventService.getEventBySlug(slug);
      }),
      switchMap(eventRes => {
        if (eventRes.error) throw eventRes.error;
        this.eventId = eventRes.data.id;
        return this.mediaService.getMediaForEvent(this.eventId)
      }),
      map((mediaRes: any) => {
        return mediaRes;
      })
    );
  }
}
