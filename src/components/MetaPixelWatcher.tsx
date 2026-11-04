"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { META_PIXEL_ID, META_PIXEL_SNIPPET, SIGNUP_COOKIE, isMetaBlockedPath } from "@/lib/metaPixel";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __mtPixel?: 1;
    // While true, the pixel's own request filter (see metaPixel.ts) drops everything.
    __mtBlocked?: boolean;
  }
}

function startPixel() {
  if (window.__mtPixel) return;
  const script = document.createElement("script");
  script.textContent = META_PIXEL_SNIPPET;
  document.head.appendChild(script);
}

// SHA-256 of the signed-in user's email (trimmed, lowercased — Meta's format),
// read from the browser session. The plain email is never stored or sent; null
// when there is no session.
async function sessionEmailHash(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getSession();
    const email = data.session?.user.email?.trim().toLowerCase();
    if (!email) return null;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function fireSignupEvent() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIGNUP_COOKIE}=([^;]*)`));
  if (!match) return;
  // Consumed first so the event can only ever fire once.
  document.cookie = `${SIGNUP_COOKIE}=; path=/; max-age=0`;

  const emailHash = await sessionEmailHash();
  if (emailHash) window.fbq?.("init", META_PIXEL_ID, { em: emailHash });
  window.fbq?.("track", "CompleteRegistration", { content_name: decodeURIComponent(match[1]) });
}

// The root layout decides on the server whether the pixel loads on a first
// page load. This watcher covers client-side navigation, which never
// re-renders the layout: it blocks the pixel's requests while the visitor is
// on a blocked route, lets them through on public routes, and sends PageView
// itself since Meta's own history tracking is disabled in the snippet.
export function MetaPixelWatcher() {
  const pathname = usePathname();
  const silenced = useRef(false);
  const firstRun = useRef(true);

  // A click on a link into a blocked route must not reach Meta — the pixel's
  // automatic button-click event includes the link's destination, and it is
  // sent before the route actually changes. Capturing on window runs ahead of
  // the pixel's own listener.
  useEffect(() => {
    function onClick(e: Event) {
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || !isMetaBlockedPath(url.pathname)) return;

      window.__mtBlocked = true;
      silenced.current = true;
      // New tab / cancelled navigation: we are still on a public page, so wake
      // the pixel back up. A real navigation is handled by the effect below.
      setTimeout(() => {
        if (silenced.current && !isMetaBlockedPath(window.location.pathname)) {
          window.__mtBlocked = false;
          silenced.current = false;
        }
      }, 1500);
    }
    window.addEventListener("click", onClick, true);
    window.addEventListener("auxclick", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  useEffect(() => {
    const first = firstRun.current;
    firstRun.current = false;

    if (isMetaBlockedPath(pathname)) {
      window.__mtBlocked = true;
      silenced.current = true;
      return;
    }
    window.__mtBlocked = false;

    if (!window.__mtPixel) {
      // Not loaded yet (first load was a blocked route, or the server-rendered
      // script has not run): the snippet sends the first PageView itself.
      startPixel();
    } else {
      if (silenced.current) {
        silenced.current = false;
        window.fbq?.("track", "PageView");
      } else if (!first) {
        window.fbq?.("track", "PageView");
      }
    }
    fireSignupEvent();
  }, [pathname]);

  return null;
}
