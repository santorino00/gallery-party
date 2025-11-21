import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AppEvent } from '../models/event.model';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.supabase;
  }

  // Admin: Get all events
  getEvents() {
    return from(this.supabase.from('events').select('*'));
  }

  // Admin: Get a single event by ID
  getEventById(id: string) {
    return from(this.supabase.from('events').select('*').eq('id', id).single());
  }

  // Admin: Get a single event by Slug
  getEventBySlug(slug: string) {
    return from(this.supabase.from('events').select('id, name, slug, description, event_date').eq('slug', slug).single());
  }

  // Admin: Create a new event
  createEvent(event: AppEvent) {
    // Il password_hash dovrebbe essere gestito da un trigger/rpc su Supabase per sicurezza,
    // ma per questo progetto lo gestiamo qui.
    // In un progetto reale, la password non dovrebbe mai arrivare così al DB.
    // L'hashing avverrà tramite l'estensione pgcrypto direttamente in Supabase
    // per non esporre mai la password in chiaro.
    // Per ora, assumiamo che l'hash venga creato da una funzione serverless o da un hook.
    // Per semplicità qui, passiamo la password e l'hash lo fa il DB.
    // Creerò una funzione per fare questo.
    const { password, ...eventData } = event;
    // La funzione `create_event_with_hashed_password` andrà creata in Supabase.
    return from(this.supabase.rpc('create_event_with_hashed_password', {
      p_slug: eventData.slug,
      p_name: eventData.name,
      p_password: password,
      p_description: eventData.description,
      p_event_date: eventData.event_date
    }));
  }

  // Admin: Update an event
  updateEvent(id: string, event: Partial<AppEvent>) {
    return from(this.supabase.from('events').update(event).eq('id', id));
  }

  // Admin: Delete an event
  deleteEvent(id: string) {
    return from(this.supabase.from('events').delete().eq('id', id));
  }

  // Guest: Validate event password
  validatePassword(slug: string, password: string) {
    return from(
      this.supabase.rpc('validate_event_password', {
        p_slug: slug,
        p_password: password,
      })
    );
  }
}
