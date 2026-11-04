import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PATHNAME_HEADER } from "@/lib/metaPixel";

export async function updateSession(request: NextRequest) {
  // Always overwritten here, so a client can never spoof it. The root layout
  // reads it to decide whether the Meta Pixel may load on this route.
  // Rebuilt from request.headers each time so refreshed session cookies (set on
  // the request in setAll below) are forwarded too.
  const forwardedHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
    return headers;
  };

  let response = NextResponse.next({ request: { headers: forwardedHeaders() } });

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
          response = NextResponse.next({ request: { headers: forwardedHeaders() } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPanelRoute = request.nextUrl.pathname.startsWith("/panel");

  if (isPanelRoute && !user) {
    const redirectUrl = new URL("/ingresar", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
