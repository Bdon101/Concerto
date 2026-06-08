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
  photos?: string[];
  coverImage?: string;
  // Set server-side from the JWT; optional here so client create payloads
  // (which never supply it) remain valid against this interface.
  ownerUsername?: string;
  // Usernames granted read-only access via an accepted share request.
  sharedWith?: string[];
}
