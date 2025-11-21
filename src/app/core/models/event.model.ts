export interface AppEvent {
  id?: string;
  slug: string;
  name: string;
  password_hash?: string; // Solo per la creazione
  password?: string; // Per il form
  description?: string;
  event_date?: string;
  created_at?: string;
}
