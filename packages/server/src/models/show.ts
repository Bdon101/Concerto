export interface Show {
  id: string;
  title: string;
  date: string;
  datetime: string;
  venue: string;
  href: string;
  artistName?: string;
  songs?: string[];
  memoryText?: string;
  rating?: number;
}
