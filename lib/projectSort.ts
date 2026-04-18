// Shared sort logic and localStorage keys for Overview + Projects pages

export const ORDER_KEY = "pis-overview-order";
export const MODE_KEY  = "pis-overview-mode";

export type SortMode = "urgency" | "date" | "manual";

const PRIORITY_RANK: Record<string, number> = { Urgent: 0, Scheduled: 1, Someday: 2 };

type Sortable = { id: string; priority: string; created_at: string };

// Parse Spanish/English date-like priority strings into a timestamp.
// Handles "15 de junio", "20 de abril", "April 20", "2025-06-15", etc.
// Returns null if the string doesn't look like a date.
const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

// Compiled once — reused across all sort comparisons
const SPANISH_DATE_RE = /^(\d{1,2})\s+de\s+([a-záéíóúü]+)(?:\s+de\s+(\d{4}))?$/;

function parsePriorityDate(priority: string): number | null {
  const s = priority.trim().toLowerCase();

  const m = SPANISH_DATE_RE.exec(s);
  if (m) {
    const day   = parseInt(m[1], 10);
    const month = SPANISH_MONTHS[m[2]];
    const year  = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    if (month !== undefined) return new Date(year, month, day).getTime();
  }

  const parsed = Date.parse(priority);
  return isNaN(parsed) ? null : parsed;
}

export function sortByUrgency<T extends Sortable>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = PRIORITY_RANK[a.priority] ?? 3;
    const rb = PRIORITY_RANK[b.priority] ?? 3;
    const rd = ra - rb;
    if (rd !== 0) return rd;

    if (ra === 3 && rb === 3) {
      const da = parsePriorityDate(a.priority);
      const db = parsePriorityDate(b.priority);
      if (da !== null && db !== null) return da - db;
      if (da !== null) return -1;
      if (db !== null) return 1;
      return a.priority.localeCompare(b.priority);
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function sortByDate<T extends Sortable>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
