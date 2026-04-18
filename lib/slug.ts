/**
 * Generates a URL-safe slug from a project name.
 * "My Trading Bot!" → "my-trading-bot"
 * "Proyecto Ñoño" → "proyecto-nono"
 */
export function generateSlug(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accent marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")      // remove non-alphanumeric
    .replace(/\s+/g, "-")              // spaces → hyphens
    .replace(/-+/g, "-")               // collapse multiple hyphens
    .replace(/^-|-$/g, "");            // trim leading/trailing hyphens
}
