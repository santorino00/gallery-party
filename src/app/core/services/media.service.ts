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

            const relativePath = fullUrl.replace(
              `https://bhmvthaeksqmncwjhkid.supabase.co/storage/v1/object/public/${BUCKET_NAME}/`,
              ''
            );

            // URL ORIGINALE (funziona per tutti)
            const { data: signedData } = await this.supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(relativePath, SIGNED_URL_EXPIRES);

            // rileva il tipo dal nome del file
            const ext = relativePath.split('.').pop()?.toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
            const isVideo = ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);

            let thumbUrl = null;

            // SE È UN’IMMAGINE → genera thumbnail
            if (isImage) {
              const { data: signedThumb } = await this.supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(relativePath, SIGNED_URL_EXPIRES, {
                  transform: {
                    width: 300,
                    quality: 60,
                  },
                });

              thumbUrl = signedThumb?.signedUrl ?? null;
            }

            // SE È UN VIDEO → nessuna trasformazione (Supabase non può)
            if (isVideo) {
              thumbUrl = null; // puoi lasciarlo null o generare uno snapshot
            }

            return {
              ...item,
              signedUrl: signedData?.signedUrl ?? null,
              thumbUrl,
              type: isVideo ? 'video' : 'photo',
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
