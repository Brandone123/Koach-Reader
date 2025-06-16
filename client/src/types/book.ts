export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url?: string;
  cover_image?: string;
  pdf_url?: string;
  audio_url?: string;
  total_pages: number;
  language: string;
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
  created_at: string;
  updated_at: string;
} 