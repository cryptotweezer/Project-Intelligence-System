import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import arcjet, { shield } from "@arcjet/next";

// Shield runs on every matched request — blocks SQLi, XSS, path traversal, etc.
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [shield({ mode: "LIVE" })],
});

export async function middleware(request: NextRequest) {
  // ── Arcjet Shield — API routes only ───────────────────────────────────────
  // Page navigation skips this — API routes already have per-route Arcjet.
  // Running Shield on every page load adds an external round-trip per click.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Supabase auth — dashboard routes only ────────────────────────────────
  // Public routes (/, /login) pass through immediately — no Supabase round-trip.
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
