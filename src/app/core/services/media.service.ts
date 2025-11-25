import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, map, mergeMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Media } from '../models/media.model';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'event-media';

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.supabase;
  }

  // Get all media for a specific event
  getMediaForEvent(eventId: string) {
    const BUCKET_NAME = 'event-media';
    const SIGNED_URL_EXPIRES = 60 * 60; // 1 ora in secondi

    return from(
      this.supabase
        .from('media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
    ).pipe(
      mergeMap(async (res: any) => {
        if (res.error) throw res.error;

        const mediaWithSignedUrls = await Promise.all(
          res.data.map(async (item: any) => {
            const fullUrl = item.url;
            // bucket = 'event-media'

            // rimuovi il prefisso pubblico
            const relativePath = fullUrl.replace(
              `https://bhmvthaeksqmncwjhkid.supabase.co/storage/v1/object/public/${BUCKET_NAME}/`,
              ''
            );

            const { data: signedData, error } = await this.supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(relativePath, SIGNED_URL_EXPIRES);

            if (error) {
              console.error('Errore generando signed URL:', error);
              return { ...item, signedUrl: null };
            }

            return {
              ...item,
              signedUrl: signedData.signedUrl,
            };
          })
        );

        return mediaWithSignedUrls;
      })
    );
  }

  // Upload a file to Supabase Storage
  async uploadFile(file: File, eventSlug: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${eventSlug}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    // Costruiamo l'URL pubblico
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

    return publicUrl;
  }

  // Save media metadata to the database
  saveMediaMetadata(media: Omit<Media, 'id'>) {
    return from(this.supabase.from('media').insert([media]));
  }

  // Delete media (metadata and file from storage)
  async deleteMedia(media: Media) {
    // 1. Delete the file from storage
    const urlParts = media.url.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(this.BUCKET_NAME) + 1).join('/');

    const { error: storageError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Potremmo decidere di non procedere se l'eliminazione del file fallisce
    }

    // 2. Delete the metadata from the database
    const { error: dbError } = await this.supabase.from('media').delete().eq('id', media.id);

    if (dbError) {
      throw dbError;
    }
  }
}
