import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { performanceRequestHeaders } from "@/lib/performance-diagnostics";

const PERF_PATHS = new Set(["/fleet", "/trips", "/invoices"]);

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const shouldMeasure = PERF_PATHS.has(pathname);
  const requestId = shouldMeasure ? crypto.randomUUID() : null;
  const requestStartedAt = shouldMeasure
    ? performance.timeOrigin + performance.now()
    : null;
  const forwardedHeaders = () => {
    const headers = new Headers(request.headers);
    if (requestId && requestStartedAt !== null) {
      headers.set(performanceRequestHeaders.requestId, requestId);
      headers.set(performanceRequestHeaders.requestStart, String(requestStartedAt));
      headers.set(performanceRequestHeaders.path, pathname);
    }
    return headers;
  };
  const createNextResponse = () =>
    shouldMeasure
      ? NextResponse.next({ request: { headers: forwardedHeaders() } })
      : NextResponse.next({ request });

  let supabaseResponse = createNextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = createNextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the JWT locally using asymmetric key verification (JWKS).
  // This avoids the ~300-1000ms network roundtrip of getUser() while still
  // cryptographically verifying the token's signature and expiry.
  // The dashboard layout's getUser() remains as the authoritative server-side
  // check, and RLS enforces row-level authorization on all queries.
  const authStartedAt = shouldMeasure ? performance.now() : 0;
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const user = claimsError ? null : claimsData?.claims?.sub ? { id: claimsData.claims.sub } : null;
  const authDuration = shouldMeasure ? performance.now() - authStartedAt : 0;

  const addPerformanceHeaders = (response: NextResponse) => {
    if (shouldMeasure && requestId) {
      response.headers.set("X-Bridge-Perf-Request-Id", requestId);
      response.headers.set(
        "Server-Timing",
        `proxy_auth;dur=${authDuration.toFixed(1)};desc="Supabase auth.getClaims"`
      );
      console.info(
        `[PERF] request=${requestId} path=${pathname} Proxy auth.getClaims: ${authDuration.toFixed(1)}ms`
      );
    }
    return response;
  };

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  // Unauthenticated access to dashboard routes -> redirect to /login
  if (!user && !isAuthRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return addPerformanceHeaders(redirectResponse);
  }

  // Authenticated user trying to visit login/signup -> redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return addPerformanceHeaders(redirectResponse);
  }

  return addPerformanceHeaders(supabaseResponse);
}
