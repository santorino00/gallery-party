export interface Media {
  id?: string;
  event_id: string;
  url: string;
  type: 'photo' | 'video';
  description?: string;
  created_at?: string;
  signedUrl?: string
}
