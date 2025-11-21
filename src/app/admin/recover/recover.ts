import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="recover-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recover Password</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Enter your email address and we will send you a link to reset your password.</p>
          <form [formGroup]="recoverForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" required>
              <mat-error *ngIf="recoverForm.get('email')?.hasError('required')">Email is required.</mat-error>
              <mat-error *ngIf="recoverForm.get('email')?.hasError('email')">Please enter a valid email.</mat-error>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="recoverForm.invalid">Send Reset Link</button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <a routerLink="/admin/login">Back to Login</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .recover-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    mat-card {
      width: 400px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class RecoverComponent {
  recoverForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.recoverForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.recoverForm.invalid) {
      return;
    }
    try {
      const { email } = this.recoverForm.value;
      const { error } = await this.authService.recoverPassword(email);
      if (error) {
        throw error;
      }
      this.snackBar.open('Password recovery link sent. Please check your email.', 'Close', { duration: 5000 });
    } catch (error: any) {
      this.snackBar.open(error.message, 'Close', { duration: 5000 });
    }
  }
}
