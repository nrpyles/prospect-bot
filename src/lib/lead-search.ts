/**
 * Lead search orchestration — combines Google Maps search with
 * website quality scoring to produce a list of qualified prospects.
 *
 * This is the TS equivalent of prospect-finder-v2.py::run().
 */
import { checkWebsiteQuality } from "./scoring";
import { searchPlaces, GoogleMapsError } from "./google-maps";
import type { Prospect } from "./mock-prospects";
import type { Industry, Quality } from "./pipeline";

export type SearchConfig = {
  apiKey: string;
  cities: string[];
  industries: string[]; // human-readable, e.g. "Roofing"
  industryQueries?: Record<string, string>; // maps "Roofing" → "roofing company"
  minRating?: number;
  qualityFilter?: Quality[]; // only include these qualities
  maxResultsPerQuery?: number;
  existingNames?: Set<string>; // skip duplicates by name (lower-cased)
};

export type SearchProgress = {
  city: string;
  industry: string;
  found: number;
  added: number;
  skippedDup: number;
  skippedGood: number;
};

export type SearchResult = {
  prospects: Prospect[];
  stats: {
    citiesSearched: number;
    industriesSearched: number;
    totalFound: number;
    totalAdded: number;
    totalSkippedDup: number;
    totalSkippedGood: number;
  };
  errors: string[];
};

const DEFAULT_QUALITY_FILTER: Quality[] = ["No Website", "Terrible", "Outdated"];

const DEFAULT_INDUSTRY_QUERY_MAP: Record<string, string> = {
  Roofing: "roofing company",
  HVAC: "HVAC company",
  Fencing: "fence company",
  Plumbing: "plumbing company",
  Landscaping: "landscaping company",
  "Garage Doors": "garage door company",
  "Auto Detailing": "auto detailing",
  "Med Spa": "med spa",
  Dentist: "dentist",
  "Pest Control": "pest control",
  Concrete: "concrete company",
  "Pool Builder": "pool builder",
  Painting: "painting company",
  Electrical: "electrical contractor",
  "Tree Service": "tree service",
  "Pressure Washing": "pressure washing",
  Flooring: "flooring company",
  "Window Cleaning": "window cleaning",
  Moving: "moving company",
  "Junk Removal": "junk removal",
};

export async function runLeadSearch(
  config: SearchConfig,
  onProgress?: (p: SearchProgress) => void,
): Promise<SearchResult> {
  const {
    apiKey,
    cities,
    industries,
    industryQueries = DEFAULT_INDUSTRY_QUERY_MAP,
    minRating = 3.5,
    qualityFilter = DEFAULT_QUALITY_FILTER,
    maxResultsPerQuery = 10,
    existingNames = new Set<string>(),
  } = config;

  const prospects: Prospect[] = [];
  const errors: string[] = [];
  let totalFound = 0;
  let totalAdded = 0;
  let totalSkippedDup = 0;
  let totalSkippedGood = 0;

  for (const city of cities) {
    for (const industry of industries) {
      const query = industryQueries[industry] ?? industry.toLowerCase();
      let found = 0;
      let added = 0;
      let skippedDup = 0;
      let skippedGood = 0;

      try {
        const places = await searchPlaces({
          apiKey,
          query,
          location: city,
          maxResults: maxResultsPerQuery,
          minRating,
        });

        for (const place of places) {
          found += 1;
          totalFound += 1;

          const nameKey = place.name.trim().toLowerCase();
          if (existingNames.has(nameKey)) {
            skippedDup += 1;
            totalSkippedDup += 1;
            continue;
          }

          const score = await checkWebsiteQuality(place.website);

          if (!qualityFilter.includes(score.quality)) {
            skippedGood += 1;
            totalSkippedGood += 1;
            continue;
          }

          const cityShort = city.split(",")[0].trim();
          const prospect: Prospect = {
            id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: place.name,
            industry: industry as Industry,
            city: cityShort,
            phone: place.phone || undefined,
            website: place.website || undefined,
            quality: score.quality,
            qualityIssues: score.issues,
            rating: place.rating ? String(place.rating) : undefined,
            reviewCount: place.reviewCount || undefined,
            googlePlaceId: place.placeId,
            address: place.address || undefined,
            status: "New Lead",
            source: "Google Maps Bot",
            createdAt: new Date().toISOString().slice(0, 10),
          };

          prospects.push(prospect);
          existingNames.add(nameKey);
          added += 1;
          totalAdded += 1;
        }
      } catch (err) {
        if (err instanceof GoogleMapsError) {
          errors.push(`${city} / ${industry}: ${err.message}`);
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${city} / ${industry}: ${msg}`);
        }
      }

      onProgress?.({ city, industry, found, added, skippedDup, skippedGood });
    }
  }

  return {
    prospects,
    stats: {
      citiesSearched: cities.length,
      industriesSearched: industries.length,
      totalFound,
      totalAdded,
      totalSkippedDup,
      totalSkippedGood,
    },
    errors,
  };
}
