"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapPin, Search, ExternalLink, Star } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { QUALITY_COLORS, STATUS_COLORS, type WorkspaceMode } from "@/lib/pipeline";
import { buildResearchLinks } from "@/lib/research-links";
import { qualifyProspect, BAND_COLOR } from "@/lib/qualification";

export function ProspectCard({
  prospect,
  onClick,
  isDragOverlay = false,
  workspaceMode = "agency",
}: {
  prospect: Prospect;
  onClick?: () => void;
  isDragOverlay?: boolean;
  workspaceMode?: WorkspaceMode;
}) {
  const sortable = useSortable({ id: prospect.id, disabled: isDragOverlay });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const statusColor = STATUS_COLORS[prospect.status];
  const qualityColor = QUALITY_COLORS[prospect.quality];
  const fit = qualifyProspect(prospect, workspaceMode);
  const fitColor = BAND_COLOR[fit.band];
  const links = buildResearchLinks(prospect, prospect.googlePlaceId);
  const mapsLink = links.find((l) => l.key === "maps");
  const searchLink = links.find((l) => l.key === "search");
  const websiteLink = links.find((l) => l.key === "website");

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={onClick}
      className={`group relative cursor-grab overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 card-lift active:cursor-grabbing ${
        isDragOverlay
          ? "rotate-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-[color:var(--color-accent)]"
          : "hover:border-[color:var(--color-accent-ring)]"
      }`}
    >
      {/* Status stripe */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: statusColor }}
      />

      {/* Name + fit badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-sm font-bold leading-tight text-foreground">
          {prospect.name}
        </div>
        <div
          className="flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: `color-mix(in srgb, ${fitColor} 18%, transparent)`,
            color: fitColor,
          }}
          title={fit.headline}
        >
          <span className="mono-stat">{fit.score}</span>
          <span className="hidden sm:inline">FIT</span>
        </div>
      </div>

      {/* Rating + reviews row */}
      {(prospect.rating || (prospect.reviewCount ?? 0) > 0) && (
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[color:var(--color-foreground-dim)]">
          {prospect.rating && (
            <span className="mono-stat flex items-center gap-0.5 text-[color:var(--color-status-followup)]">
              <Star className="h-3 w-3 fill-current" />
              {prospect.rating}
            </span>
          )}
          {(prospect.reviewCount ?? 0) > 0 && (
            <span className="mono-tag">{prospect.reviewCount} REVIEWS</span>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
        >
          {prospect.industry}
        </span>
        <span className="rounded-md bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-foreground-dim)]">
          {prospect.city}
        </span>
      </div>

      {/* Quality only (reviews moved up to the rating row) */}
      <div className="mt-3 flex items-center justify-between">
        <span className="mono-tag flex items-center gap-1.5" style={{ color: qualityColor }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: qualityColor }} />
          {prospect.quality}
        </span>
      </div>

      {/* Deal value */}
      {prospect.valueCents != null && prospect.valueCents > 0 && (
        <div className="mono-stat mt-3 border-t border-[color:var(--color-border)] pt-3 text-sm text-[color:var(--color-status-won)]">
          ${(prospect.valueCents / 100).toLocaleString()}
        </div>
      )}

      {/* Quick research links — visible on hover only */}
      <div className="mt-3 -mb-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {mapsLink && (
          <a
            href={mapsLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            title="Open in Google Maps"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-background text-[color:var(--color-foreground-dim)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            <MapPin className="h-3.5 w-3.5" />
          </a>
        )}
        {searchLink && (
          <a
            href={searchLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            title="Search on Google"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-background text-[color:var(--color-foreground-dim)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            <Search className="h-3.5 w-3.5" />
          </a>
        )}
        {websiteLink && (
          <a
            href={websiteLink.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            title="Visit website"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-background text-[color:var(--color-foreground-dim)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
