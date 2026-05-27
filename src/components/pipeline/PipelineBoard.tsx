"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { Prospect } from "@/lib/mock-prospects";
import { STAGES, getDefaultStatusForStage, type Stage } from "@/lib/pipeline";
import { ProspectCard } from "./ProspectCard";

/**
 * dnd-kit generates auto-incremented accessibility IDs that don't match between
 * SSR and client hydration, causing a React hydration warning. We avoid this by
 * mounting the DndContext only after the first client render.
 */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function PipelineBoard({
  prospects,
  onProspectClick,
  onStatusChange,
}: {
  prospects: Prospect[];
  onProspectClick: (prospect: Prospect) => void;
  onStatusChange: (prospectId: string, newStatus: ReturnType<typeof getDefaultStatusForStage>) => void;
}) {
  const isMounted = useIsMounted();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeProspect = useMemo(
    () => prospects.find((p) => p.id === activeId) ?? null,
    [activeId, prospects],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStage = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const stage of STAGES) map.set(stage.key, []);
    for (const p of prospects) {
      const stage = STAGES.find((s) => s.statuses.includes(p.status));
      if (stage) map.get(stage.key)!.push(p);
    }
    return map;
  }, [prospects]);

  // Render a static (non-draggable) version during SSR / before hydration to
  // avoid the dnd-kit aria-describedby hydration mismatch.
  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => (
          <StaticStageColumn
            key={stage.key}
            stage={stage}
            prospects={byStage.get(stage.key) ?? []}
            onProspectClick={onProspectClick}
          />
        ))}
      </div>
    );
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeProspect = prospects.find((p) => p.id === active.id);
    if (!activeProspect) return;

    // Dropped on a column directly
    const overId = String(over.id);
    let targetStageKey = STAGES.find((s) => s.key === overId)?.key;

    // Dropped on another card — find that card's stage
    if (!targetStageKey) {
      const overProspect = prospects.find((p) => p.id === overId);
      if (overProspect) {
        targetStageKey = STAGES.find((s) => s.statuses.includes(overProspect.status))?.key;
      }
    }

    if (!targetStageKey) return;

    const currentStage = STAGES.find((s) => s.statuses.includes(activeProspect.status));
    if (currentStage?.key === targetStageKey) return; // no stage change

    onStatusChange(activeProspect.id, getDefaultStatusForStage(targetStageKey));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage.key}
            stage={stage}
            prospects={byStage.get(stage.key) ?? []}
            onProspectClick={onProspectClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect ? <ProspectCard prospect={activeProspect} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Pre-hydration version of StageColumn — same layout, no dnd-kit. */
function StaticStageColumn({
  stage,
  prospects,
  onProspectClick,
}: {
  stage: Stage;
  prospects: Prospect[];
  onProspectClick: (p: Prospect) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:#0D0D10]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.accent }} />
          <span className="eyebrow text-[11px]">{stage.label}</span>
        </div>
        <span className="mono-stat text-xs text-[color:var(--color-foreground-muted)]">
          {prospects.length}
        </span>
      </div>
      <div className="flex max-h-[calc(100vh-340px)] flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[120px]">
        {prospects.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[color:var(--color-border)] text-xs text-[color:var(--color-foreground-muted)]" />
        ) : (
          prospects.map((p) => (
            <div
              key={p.id}
              onClick={() => onProspectClick(p)}
              className="cursor-pointer overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5"
            >
              <div className="text-sm font-bold leading-tight">{p.name}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                >
                  {p.industry}
                </span>
                <span className="rounded bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-foreground-dim)]">
                  {p.city}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  prospects,
  onProspectClick,
}: {
  stage: Stage;
  prospects: Prospect[];
  onProspectClick: (p: Prospect) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-[color:#0D0D10] transition-colors ${
        isOver
          ? "border-[color:var(--color-accent)]"
          : "border-[color:var(--color-border)]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: stage.accent }}
          />
          <span className="eyebrow text-[11px]">{stage.label}</span>
        </div>
        <span className="mono-stat text-xs text-[color:var(--color-foreground-muted)]">
          {prospects.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex max-h-[calc(100vh-340px)] flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[120px]"
      >
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[color:var(--color-border)] text-xs text-[color:var(--color-foreground-muted)]">
              Drop here
            </div>
          ) : (
            prospects.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                onClick={() => onProspectClick(p)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
