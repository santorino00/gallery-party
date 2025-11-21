import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    QRCodeComponent
  ],
  template: `
    <h2 mat-dialog-title>QR Code for {{ data.eventName }}</h2>
    <mat-dialog-content class="qr-code-container">
      <qrcode
        [qrdata]="data.value"
        [width]="256"
        [errorCorrectionLevel]="'L'">
      </qrcode>
      <p>Scan this code to access the event page.</p>
      <p><strong>URL:</strong> <a [href]="data.value" target="_blank">{{ data.value }}</a></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px;
    }
    .qr-code-container p {
      margin-top: 16px;
    }
    .qr-code-container a {
      word-break: break-all;
    }
  `]
})
export class QrCodeComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { value: string, eventName: string }
  ) {}
}
