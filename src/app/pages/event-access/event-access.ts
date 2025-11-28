import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordDialogComponent } from '../password-dialog/password-dialog';

@Component({
  selector: 'app-event-access',
  standalone: true,
  template: '',
})
export class EventAccessComponent implements OnInit {
  private slug: string;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
  }

  ngOnInit(): void {
    if (!this.slug) {
      this.router.navigate(['/']);
      return;
    }
    this.openPasswordDialog();
  }

  private openPasswordDialog(): void {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '350px',
      disableClose: true,
      data: { slug: this.slug },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // L'utente ha inserito la password corretta
        this.router.navigate(['/', this.slug, 'gallery']);
      } else {
        // L'utente ha chiuso il dialogo, forse mostriamo un messaggio
        // o semplicemente lo lasciamo sulla pagina vuota.
        // Per ora, lo rimandiamo alla home.
        this.router.navigate(['/']);
      }
    });
  }
}
