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
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MediaLightboxComponent } from '../../core/components/media-lightbox/media-lightbox.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, MatGridListModule, MatCardModule, MatIconModule],
  template: `
    <div class="gallery-container">
      <div *ngIf="(media$ | async)?.length === 0" class="no-media">
        <h2>No photos or videos yet!</h2>
        <p>Be the first to upload something.</p>
      </div>

      <div *ngIf="media$ | async as mediaList">
        <mat-grid-list cols="4" rowHeight="1:1" gutterSize="16px">
          <mat-grid-tile *ngFor="let media of mediaList; let i = index">
            <mat-card class="media-card">
              <!-- Immagine -->
              <img
                *ngIf="media.type === 'photo'"
                mat-card-image
                [src]="media.thumbUrl || media.signedUrl"
                [alt]="media.description"
                loading="lazy"
                (click)="openLightbox(mediaList, i)"
              />

              <!-- Video -->
              <video
                *ngIf="media.type === 'video'"
                [src]="media.signedUrl"
                controls
                muted
                style="width: 100%; height: 100%; object-fit: cover;"
                (click)="openLightbox(mediaList, i)"
              ></video>

              <mat-card-header>
                <mat-card-subtitle>{{ media.description }}</mat-card-subtitle>
              </mat-card-header>
            </mat-card>
          </mat-grid-tile>
        </mat-grid-list>
      </div>
    </div>
  `,
  styles: [
    `
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
    `,
  ],
})
export class GalleryComponent implements OnInit {
  media$!: Observable<Media[]>;
  private eventId!: string;

  constructor(
    private route: ActivatedRoute,
    private mediaService: MediaService,
    private eventService: EventService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // We need to get the event ID from the slug
    this.media$ = this.route.parent!.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug')!;
        return this.eventService.getEventBySlug(slug);
      }),
      switchMap((eventRes) => {
        if (eventRes.error) throw eventRes.error;
        this.eventId = eventRes.data.id;
        return this.mediaService.getMediaForEvent(this.eventId);
      }),
      map((mediaRes: any) => {
        return mediaRes;
      })
    );
  }

  async downloadMedia(media: any) {
    if (!media.signedUrl) return;

    try {
      // Scarica il file come blob
      const response = await fetch(media.signedUrl);
      if (!response.ok) throw new Error('Errore durante il download');

      const blob = await response.blob();

      // Crea URL temporaneo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Estrazione corretta dell'estensione
      // Usa il path del file originale senza query string
      let filename = media.description || 'download';
      const pathParts = media.signedUrl.split('/'); // prende l'ultimo segmento
      const lastSegment = pathParts[pathParts.length - 1].split('?')[0]; // rimuove query string
      const extMatch = lastSegment.match(/\.(\w+)$/);
      const ext = extMatch ? extMatch[1] : 'file';

      link.href = url;
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libera memoria
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore durante il download:', err);
    }
  }

  openLightbox(mediaList: any[], index: number) {
    this.dialog.open(MediaLightboxComponent, {
      data: { mediaList, currentIndex: index },
      panelClass: 'custom-dialog-container',
      maxWidth: '100vw',
      maxHeight: '100vh',
      hasBackdrop: true,
      backdropClass: 'backdrop-dark',
    });
  }
}
