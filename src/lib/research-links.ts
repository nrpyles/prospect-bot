/**
 * Build Google research URLs for a prospect so users can vet a lead
 * before reaching out (Maps card, GBP, website, plain Google search).
 */
import type { Prospect } from "./mock-prospects";

export type ResearchLink = {
  key: string;
  label: string;
  href: string;
  external: boolean;
};

export function buildResearchLinks(prospect: Prospect, placeId?: string | null): ResearchLink[] {
  const links: ResearchLink[] = [];

  // 1. Google Maps card — best when we have a placeId
  if (placeId) {
    links.push({
      key: "maps",
      label: "Google Maps",
      href: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      external: true,
    });
  } else {
    const q = encodeURIComponent(`${prospect.name} ${prospect.city}`);
    links.push({
      key: "maps",
      label: "Google Maps",
      href: `https://www.google.com/maps/search/?api=1&query=${q}`,
      external: true,
    });
  }

  // 2. Plain Google search — for owner name lookup, news mentions, etc.
  const q = encodeURIComponent(`${prospect.name} ${prospect.city}`);
  links.push({
    key: "search",
    label: "Google Search",
    href: `https://www.google.com/search?q=${q}`,
    external: true,
  });

  // 3. Their website if we have it
  if (prospect.website) {
    const url = prospect.website.startsWith("http")
      ? prospect.website
      : `https://${prospect.website}`;
    links.push({
      key: "website",
      label: "Their website",
      href: url,
      external: true,
    });
  }

  // 4. LinkedIn company search — useful for owner/decision-maker research
  const liQuery = encodeURIComponent(`${prospect.name} ${prospect.city}`);
  links.push({
    key: "linkedin",
    label: "LinkedIn",
    href: `https://www.linkedin.com/search/results/companies/?keywords=${liQuery}`,
    external: true,
  });

  // 5. Facebook business search
  const fbQuery = encodeURIComponent(prospect.name);
  links.push({
    key: "facebook",
    label: "Facebook",
    href: `https://www.facebook.com/search/pages/?q=${fbQuery}`,
    external: true,
  });

  return links;
}
