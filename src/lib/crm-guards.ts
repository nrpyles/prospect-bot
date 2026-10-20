import type {AuditResult} from './crm-types.ts';

export function candidateReviewInput(input: unknown): unknown {
  if (input && typeof input === 'object' && 'accept' in input && input.accept === false) return {accept: false};
  return input;
}

export function prospectPatchInput(input: unknown): unknown {
  if (input && typeof input === 'object' && 'city' in input && typeof input.city === 'string' && !input.city.trim()) {
    const {city: _unknownCity, ...knownFields} = input;
    return knownFields;
  }
  return input;
}

// Optional form URLs must accept a blank string. Refinements must not throw:
// a native URL parsing exception otherwise aborts the entire prospect save.
export function isOptionalHttpUrl(value: string): boolean {
  if (value === '') return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch { return false; }
}

export function hasUnresolvedDelivery(intents: readonly {state: string}[]): boolean {
  return intents.some(intent => intent.state === 'unknown' || intent.state === 'sending');
}

function websiteKey(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    url.hash = '';
    return url.href;
  } catch { return value.trim(); }
}

export function websiteChanged(previous: string | null | undefined, next: string | null | undefined): boolean {
  return websiteKey(previous) !== websiteKey(next);
}

export function auditMatchesWebsite(audit: AuditResult, website: string | null | undefined): boolean {
  return audit.websiteUrl !== undefined && !websiteChanged(audit.websiteUrl, website);
}

export function canContactProspect(prospect: {status: string; outreachDisposition?: string | null}): boolean {
  return prospect.status !== 'Not Interested' && (prospect.outreachDisposition ?? 'active') === 'active';
}
