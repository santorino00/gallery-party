import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MediaService } from '../../core/services/media.service';
import { EventService } from '../../core/services/event.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="upload-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Upload a Photo or Video</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
            <input type="file" (change)="onFileSelected($event)" #fileInput>

            <mat-form-field appearance="fill">
              <mat-label>Description (optional)</mat-label>
              <input matInput formControlName="description">
            </mat-form-field>

            <mat-progress-bar [value]="uploadProgress" *ngIf="isUploading"></mat-progress-bar>

            <button mat-raised-button color="primary" type="submit" [disabled]="uploadForm.invalid || !selectedFile || isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    mat-card {
      width: 500px;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    input[type="file"] {
      margin-bottom: 16px;
    }
    mat-form-field {
      width: 100%;
    }
    mat-progress-bar {
      margin: 16px 0;
    }
  `]
})
export class UploadComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0; // Per ora non implemento il progresso reale, solo uno stato on/off
  private eventId!: string;
  private eventSlug!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private mediaService: MediaService,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.fb.group({
      description: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.eventSlug = params.get('slug')!;
        return this.eventService.getEventBySlug(this.eventSlug);
      })
    ).subscribe(res => {
      if (res.data) {
        this.eventId = res.data.id;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  async onSubmit() {
    if (!this.selectedFile || !this.eventId) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 50; // Fake progress

    try {
      // 1. Upload file to Storage
      const fileUrl = await this.mediaService.uploadFile(this.selectedFile, this.eventSlug);

      // 2. Save metadata to Database
      const fileType = this.selectedFile.type.startsWith('video') ? 'video' : 'photo';

      this.mediaService.saveMediaMetadata({
        event_id: this.eventId,
        url: fileUrl,
        type: fileType,
        description: this.uploadForm.value.description
      }).subscribe({
        next: () => {
          this.isUploading = false;
          this.uploadProgress = 100;
          this.snackBar.open('File uploaded successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/', this.eventSlug, 'gallery']);
        },
        error: (err) => { throw err; }
      });

    } catch (error: any) {
      this.isUploading = false;
      this.snackBar.open(`Upload failed: ${error.message}`, 'Close', { duration: 5000 });
    }
  }
}
