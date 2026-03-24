import type { Author } from './author';

export interface Book {
  id: number;
  title: string;
  author_id: number;
  author?: Author;
  description: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  pdf_url?: string | null;
  audio_url?: string | null;
  total_pages: number;
  language: string | null;
  isbn?: string;
  publication_date?: string;
  viewers?: number;
  rating?: number;
  is_free?: boolean;
  categories?: {
    id: string;
    name: string;
    icon_name?: string;
  }[];
  reading_time?: string;
  created_at: string;
  updated_at: string;
} 