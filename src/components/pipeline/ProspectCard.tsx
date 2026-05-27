"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapPin, Search, ExternalLink, Star } from "lucide-react";
import type { Prospect } from "@/lib/mock-prospects";
import { QUALITY_COLORS, STATUS_COLORS } from "@/lib/pipeline";
import { buildResearchLinks } from "@/lib/research-links";

export function ProspectCard({
  prospect,
  onClick,
  isDragOverlay = false,
}: {
  prospect: Prospect;
  onClick?: () => void;
  isDragOverlay?: boolean;
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

      {/* Name + rating */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold leading-tight text-foreground">{prospect.name}</div>
        {prospect.rating && (
          <div className="mono-stat flex items-center gap-0.5 text-[11px] text-[color:var(--color-status-followup)]">
            <Star className="h-3 w-3 fill-current" />
            {prospect.rating}
          </div>
        )}
      </div>

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

      {/* Quality */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className="mono-tag flex items-center gap-1.5"
          style={{ color: qualityColor }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: qualityColor }}
          />
          {prospect.quality}
        </span>
        {prospect.reviewCount != null && prospect.reviewCount > 0 && (
          <span className="mono-tag text-[color:var(--color-foreground-muted)]">
            {prospect.reviewCount} REVIEWS
          </span>
        )}
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
