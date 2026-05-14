import { Show } from "../models/index.ts";

const shows: Record<string, Show> = {
  "grent-perez-fonda-2023": {
    id: "grent-perez-fonda-2023",
    title: "Grent Perez",
    date: "November 16, 2023",
    datetime: "2023-11-16",
    venue: "Fonda Theater",
    href: "/shows/grent-perez-fonda-2023.html"
  },
  "aespa-kia-forum-2025": {
    id: "aespa-kia-forum-2025",
    title: "aespa",
    date: "February 1, 2025",
    datetime: "2025-02-01",
    venue: "Kia Forum",
    href: "/shows/aespa-kia-forum-2025.html"
  }
};

function get(id: string): Show | undefined {
  return shows[id];
}

export default { get };
