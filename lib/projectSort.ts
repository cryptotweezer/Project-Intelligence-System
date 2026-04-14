// Shared sort logic and localStorage keys for Overview + Projects pages

export const ORDER_KEY = "pis-overview-order";
export const MODE_KEY  = "pis-overview-mode";

export type SortMode = "urgency" | "date" | "manual";

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, Scheduled: 1, Someday: 2 };

type Sortable = { id: string; priority: string; created_at: string };

export function sortByUrgency<T extends Sortable>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 3;
    const rb = PRIORITY_RANK[b.priority] ?? 3;
    const rd = ra - rb;
    if (rd !== 0) return rd;
    if (ra === 3 && rb === 3) {
      const alpha = a.priority.localeCompare(b.priority);
      if (alpha !== 0) return alpha;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function sortByDate<T extends Sortable>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function applyOrder<T extends Sortable>(list: T[], order: string[]): T[] {
  const map = new Map(list.map((p) => [p.id, p]));
  const out: T[] = [];
  for (const id of order) {
    const p = map.get(id);
    if (p) out.push(p);
  }
  for (const p of list) {
    if (!order.includes(p.id)) out.push(p);
  }
  return out;
}

export function loadSavedSort<T extends Sortable>(
  list: T[]
): { mode: SortMode; ordered: T[] } {
  try {
    const savedMode = localStorage.getItem(MODE_KEY) as SortMode | null;
    const savedOrder: string[] = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]");
    const currentIds = new Set(list.map((p) => p.id));
    const hasOverlap = savedOrder.some((id) => currentIds.has(id));

    if (savedMode === "manual" && hasOverlap) {
      return { mode: "manual", ordered: applyOrder(list, savedOrder) };
    }
    if (savedMode === "date") {
      return { mode: "date", ordered: sortByDate(list) };
    }
  } catch {
    // ignore (SSR / private browsing)
  }
  return { mode: "urgency", ordered: sortByUrgency(list) };
}
