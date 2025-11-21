import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>Event Access</h2>
    <mat-dialog-content>
      <p>Please enter the password to view and upload media.</p>
      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="fill">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" required>
          <mat-error *ngIf="passwordForm.get('password')?.hasError('required')">Password is required.</mat-error>
        </mat-form-field>
        <mat-error *ngIf="errorMessage">{{ errorMessage }}</mat-error>
      </form>
      <mat-progress-bar mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="passwordForm.invalid || isLoading" (click)="onSubmit()">
        Enter
      </button>
    </mat-dialog-actions>
  `
})
export class PasswordDialogComponent {
  passwordForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    public dialogRef: MatDialogRef<PasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { slug: string }
  ) {
    this.passwordForm = this.fb.group({
      password: ['', Validators.required]
    });
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const password = this.passwordForm.value.password;

    this.eventService.validatePassword(this.data.slug, password).subscribe({
      next: ({ data, error }) => {
        this.isLoading = false;
        if (error) throw error;

        if (data === true) {
          // Password is correct
          localStorage.setItem(`event_access_${this.data.slug}`, 'true');
          this.dialogRef.close(true);
        } else {
          // Password is incorrect
          this.errorMessage = 'Incorrect password. Please try again.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'An unexpected error occurred. Please try again.';
        console.error(err);
      }
    });
  }
}
