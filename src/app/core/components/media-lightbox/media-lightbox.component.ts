// media-lightbox.component.ts
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-media-lightbox',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './media-lightbox.component.html',
  styleUrls: ['./media-lightbox.component.scss'],
})
export class MediaLightboxComponent {
  mediaList: any[] = [];
  currentIndex = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mediaList: any[]; currentIndex: number },
    public dialogRef: MatDialogRef<MediaLightboxComponent>
  ) {
    this.mediaList = data.mediaList;
    this.currentIndex = data.currentIndex;
  }

  get currentMedia() {
    return this.mediaList[this.currentIndex];
  }

  next() {
    if (this.currentIndex < this.mediaList.length - 1) {
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  close() {
    this.dialogRef.close();
  }

  async downloadMedia() {
    const media = this.currentMedia;
    if (!media.signedUrl) return;

    try {
      const response = await fetch(media.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      let filename = media.description || 'download';
      const lastSegment = media.signedUrl.split('/').pop()?.split('?')[0];
      const extMatch = lastSegment?.match(/\.(\w+)$/);
      const ext = extMatch ? extMatch[1] : 'file';

      link.href = url;
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore durante il download:', err);
    }
  }
}
