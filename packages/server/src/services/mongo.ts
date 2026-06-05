import mongoose from "mongoose";
import dotenv from "dotenv";

mongoose.set("debug", true);
dotenv.config();

function getMongoURI(dbname: string) {
  let connection_string = `mongodb://localhost:27017/${dbname}`;
  const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER } = process.env;

  if (MONGO_USER && MONGO_PWD && MONGO_CLUSTER) {
    console.log(
      "Connecting to MongoDB at",
      `mongodb+srv://${MONGO_USER}:<password>@${MONGO_CLUSTER}/${dbname}`
    );
    const pwd = encodeURIComponent(MONGO_PWD);
    connection_string = `mongodb+srv://${MONGO_USER}:${pwd}@${MONGO_CLUSTER}/${dbname}?retryWrites=true&w=majority`;
  } else {
    console.log("Connecting to MongoDB at ", connection_string);
  }
  return connection_string;
}

export function connect(dbname: string) {
  mongoose
    .connect(getMongoURI(dbname))
    .then(() => seedIfEmpty())
    .catch((error) => console.log(error));
}

// --- Seed data --------------------------------------------------------------
// Inserted on first boot (when each collection is empty). For shows we also
// run a backfill migration if existing docs predate the artistName / songs /
// memoryText fields. Idempotent: rerunning is safe.

const ARTISTS = [
  {
    id: "aespa",
    name: "aespa",
    description:
      "K-pop group in my concert archive. Saw them at Kia Forum on their 2025 SYNK: PARALLEL LINE tour."
  },
  {
    id: "grent-perez",
    name: "Grent Perez",
    description:
      "Singer-songwriter in my concert archive. Caught a Fonda Theater show with a Lyn Lapid surprise feature."
  }
];

const VENUES = [
  { id: "kia-forum",     name: "Kia Forum",     city: "Inglewood, CA" },
  { id: "fonda-theater", name: "Fonda Theater", city: "Los Angeles, CA" }
];

const SHOW_BACKFILL: Record<
  string,
  { artistName: string; songs: string[]; memoryText: string }
> = {
  "aespa-kia-forum-2025": {
    artistName: "aespa",
    songs: ["Drama", "Black Mamba", "Next Level", "Spicy", "Supernova"],
    memoryText:
      "My friends and I COULD NOT BREATHE back to back Hold on Tight into Live My Life into We Go had to be one of my life's peak moments. And as a bonus Luka Doncic got traded to the Lakers in that moment."
  },
  "grent-perez-fonda-2023": {
    artistName: "Grent Perez",
    songs: ["Cherry Wine", "Old With You", "Clementine", "Confusing Girl", "Everest"],
    memoryText:
      "Such a great concert, time of life was easygoing, and amazing set. He even brought out Lyn Lapid and we got to be the first to hear their new Room For You song. We also got in trouble with some security because one of my friends brought a camera in but we also made some new friends that helped cover for us."
  }
};

const SHOWS = [
  {
    id: "aespa-kia-forum-2025",
    title: "aespa",
    date: "February 1, 2025",
    datetime: "2025-02-01",
    venue: "Kia Forum",
    href: "/app/shows/aespa-kia-forum-2025",
    ...SHOW_BACKFILL["aespa-kia-forum-2025"]
  },
  {
    id: "grent-perez-fonda-2023",
    title: "Grent Perez",
    date: "November 16, 2023",
    datetime: "2023-11-16",
    venue: "Fonda Theater",
    href: "/app/shows/grent-perez-fonda-2023",
    ...SHOW_BACKFILL["grent-perez-fonda-2023"]
  }
];

async function seedIfEmpty() {
  const ArtistModel = mongoose.model("Artist");
  const VenueModel = mongoose.model("Venue");
  const ShowModel = mongoose.model("Show");

  if ((await ArtistModel.countDocuments()) === 0) {
    await ArtistModel.insertMany(ARTISTS);
    console.log(`Seeded ${ARTISTS.length} artists`);
  }

  if ((await VenueModel.countDocuments()) === 0) {
    await VenueModel.insertMany(VENUES);
    console.log(`Seeded ${VENUES.length} venues`);
  }

  if ((await ShowModel.countDocuments()) === 0) {
    await ShowModel.insertMany(SHOWS);
    console.log(`Seeded ${SHOWS.length} shows`);
  } else {
    // Backfill: existing show docs that predate the new optional fields
    // get their artistName / songs / memoryText populated once. The
    // `songs: { $exists: false }` guard makes this safe to rerun and
    // safe across user edits via the show-edit form.
    for (const [id, fields] of Object.entries(SHOW_BACKFILL)) {
      const res = await ShowModel.updateOne(
        { id, songs: { $exists: false } },
        { $set: fields }
      );
      if (res.modifiedCount > 0) {
        console.log(`Backfilled show ${id} with songs/memory/artistName`);
      }
    }
  }
}
