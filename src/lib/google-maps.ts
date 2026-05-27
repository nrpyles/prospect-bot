/**
 * Google Maps Places API client — minimal wrapper around
 * Text Search + Place Details. Equivalent to the Python
 * search_google_maps() in prospect-finder-v2.py.
 *
 * Uses the legacy /place/textsearch and /place/details endpoints
 * to match the existing prospect-bot behavior.
 */

export type GooglePlace = {
  name: string;
  placeId: string;
  rating: number;
  reviewCount: number;
  phone: string;
  website: string;
  address: string;
  businessStatus?: string;
};

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

const DETAIL_FIELDS = [
  "name",
  "formatted_phone_number",
  "website",
  "formatted_address",
  "rating",
  "user_ratings_total",
  "business_status",
].join(",");

type TextSearchResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    place_id: string;
    rating?: number;
  }>;
};

type DetailsResponse = {
  status: string;
  error_message?: string;
  result?: {
    name?: string;
    formatted_phone_number?: string;
    website?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    business_status?: string;
  };
};

export class GoogleMapsError extends Error {
  constructor(message: string, public readonly apiStatus?: string) {
    super(message);
    this.name = "GoogleMapsError";
  }
}

export async function searchPlaces(opts: {
  apiKey: string;
  query: string;
  location: string;
  maxResults?: number;
  minRating?: number;
}): Promise<GooglePlace[]> {
  const { apiKey, query, location, maxResults = 10, minRating = 3.5 } = opts;

  const url = new URL(TEXT_SEARCH_URL);
  url.searchParams.set("query", `${query} in ${location}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("type", "establishment");

  const resp = await fetch(url.toString());
  const data = (await resp.json()) as TextSearchResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new GoogleMapsError(
      data.error_message ?? `Google Maps API status: ${data.status}`,
      data.status,
    );
  }

  const results = (data.results ?? []).slice(0, maxResults).filter((r) => (r.rating ?? 0) >= minRating);

  const places: GooglePlace[] = [];
  for (const result of results) {
    try {
      const place = await fetchPlaceDetails(apiKey, result.place_id);
      if (place && place.businessStatus !== "CLOSED_PERMANENTLY") {
        places.push(place);
      }
      await sleep(300); // be polite to the API
    } catch {
      // skip individual failures rather than aborting the run
      continue;
    }
  }
  return places;
}

async function fetchPlaceDetails(apiKey: string, placeId: string): Promise<GooglePlace | null> {
  const url = new URL(DETAILS_URL);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", DETAIL_FIELDS);
  url.searchParams.set("key", apiKey);

  const resp = await fetch(url.toString());
  const data = (await resp.json()) as DetailsResponse;

  if (data.status !== "OK" || !data.result) return null;
  const r = data.result;

  return {
    name: r.name ?? "",
    placeId,
    rating: r.rating ?? 0,
    reviewCount: r.user_ratings_total ?? 0,
    phone: r.formatted_phone_number ?? "",
    website: r.website ?? "",
    address: r.formatted_address ?? "",
    businessStatus: r.business_status,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
