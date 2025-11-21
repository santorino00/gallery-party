import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../core/services/event.service';
import { AppEvent } from '../../core/models/event.model';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ isEditMode ? 'Edit Event' : 'Create New Event' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
          <mat-form-field>
            <mat-label>Event Name</mat-label>
            <input matInput formControlName="name">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Event Slug</mat-label>
            <input matInput formControlName="slug" placeholder="e.g., wedding-john-doe">
            <mat-hint>This will be the URL for your event (e.g., /wedding-john-doe)</mat-hint>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password">
            <mat-hint>Password for guests to access the event.</mat-hint>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Event Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="event_date">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description"></textarea>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="eventForm.invalid">
            {{ isEditMode ? 'Save Changes' : 'Create Event' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 600px;
      margin: 24px auto;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    mat-form-field {
      margin-bottom: 16px;
    }
  `]
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  private eventId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      password: [''], // Required only on creation
      event_date: [null],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.isEditMode = true;
      this.eventForm.get('password')?.clearValidators();
      this.loadEventData(this.eventId);
    } else {
      this.eventForm.get('password')?.setValidators(Validators.required);
    }
  }

  loadEventData(id: string): void {
    this.eventService.getEventById(id).subscribe({
      next: ({ data, error }) => {
        if (error) throw error;
        if (data) {
          this.eventForm.patchValue(data);
        }
      },
      error: (err) => this.snackBar.open(err.message, 'Close')
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      return;
    }

    const eventData: AppEvent = this.eventForm.value;
    const operation = this.isEditMode && this.eventId
      ? this.eventService.updateEvent(this.eventId, eventData)
      : this.eventService.createEvent(eventData);

    operation.subscribe({
      next: () => {
        this.snackBar.open(`Event ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/events']);
      },
      error: (err: any) => this.snackBar.open(`Error: ${err.message}`, 'Close', { duration: 5000 })
    });
  }
}
