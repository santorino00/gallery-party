import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.supabase = this.supabaseService.supabase;
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.currentUser.next(session.user);
      } else {
        this.currentUser.next(null);
      }
    });
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  async signIn(credentials: { email: string; password: string }) {
    return this.supabase.auth.signInWithPassword(credentials);
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/admin/login']);
  }

  async recoverPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email);
  }
}
