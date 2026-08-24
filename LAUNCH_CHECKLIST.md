# Launch Checklist

Running list of everything left open, deferred, or undecided before this goes live. Check things off as they're actually resolved, not just discussed.

**Current deploy state:** the Supabase **database schema** is up to date through migration `0044` (see note below — some of that was pushed earlier than intended). The **application code** is now pushed to a `preview` branch (not `main`) and confirmed deploying successfully as a Vercel **preview** — stable URL: `https://agentia-git-preview-jeremys-projects-987e22ec.vercel.app` (currently behind Vercel's deployment-protection SSO wall, so only accessible logged into the Vercel account). This also confirms a Vercel project already exists and is connected to the GitHub repo (`jeremys-projects-987e22ec/agentia`) — previously unconfirmed. **`main`/production has not been touched** — nothing has been merged to `main` or deployed to production this whole time. Standing rule, reaffirmed explicitly: never deploy to Vercel **production** without an explicit go-ahead — even the literal word "deploy" from the user needs a clarifying question before acting on it, don't treat it as automatic authorization. Pushing to `preview` is the safe, pre-approved path for getting a shareable build without that risk.

- [x] Vercel project confirmed to exist and connected to GitHub — resolves part of §3 below
- [x] `preview` branch workflow established: commit → push `preview` → poll GitHub's commit status API for the Vercel check (`success`/`failure`) → same stable branch URL every time, no new link needed per push

## 1. Payment processor — Pagopar is now the working, tested option

Three processors exist in the codebase (Pagopar, Bancard-direct, dLocal). Pagopar is no longer just "the one being tested" — as of tonight it's a **fully working, end-to-end verified integration** in Pagopar's staging environment (see §5: real card charge succeeded, webhook correctly updates our DB, status-check API confirmed working). Bancard-direct and dLocal remain untouched, uncredentialed, and local-only. Nothing has formally been declared "the launch processor" yet, but Pagopar is now far ahead of the other two in actual proof-of-working-ness.

- [ ] **Formally decide/confirm Pagopar as the launch processor** (or keep evaluating Bancard-direct/dLocal — but there's now a real cost to switching given tonight's work)
- [x] Both checkout entry points (`PricingPlans` "Elegir plan" and `suscripcion` page's "Pagar ahora") now consistently call Pagopar — the earlier "mixed state" risk is resolved
- [ ] If Bancard-direct: get real `BANCARD_PUBLIC_KEY` / `BANCARD_PRIVATE_KEY` (currently blank), field names still `UNVERIFIED` in `src/lib/bancard.ts`
- [ ] If dLocal: get real `DLOCAL_X_LOGIN` / `DLOCAL_X_TRANS_KEY`, confirm sandbox host, build the card-capture UI — all still untouched
- [x] Migrations `0040`–`0043` and `0030` — confirmed applied to production DB (additive/nullable only, no harm)

### Pagopar integration bugs found & fixed tonight (context for future debugging)

Pagopar's own documentation is inconsistent (an old 2017 PDF disagrees with their current support KB), and neither fully matched what their live API actually expects. Everything below was reverse-engineered by trial against the real API until `respuesta: true` came back — worth knowing if something in this area breaks again:

- The `comercios/2.0/iniciar-transaccion` endpoint expects the public-key field named **`public_key`**, not `token_publico` like every other Pagopar endpoint. Using the wrong name produces the generic, misleading **"Token no corresponde"** error — indistinguishable from an actually-wrong token. The token formula itself (`sha1(privado + idPedido + montoTotal)`) was correct the whole time.
- `comprador` and each `compras_items` entry need their **exact full key set** present (empty string/null where we don't have data) — Pagopar seems to validate field count, not just required-ness.
- `comprador.documento` must be **at least 5 characters** and **digits only** (a formatted RUC like `"1234567-8"` fails because of the hyphen) — `documento`/`ruc` get sanitized with `.replace(/\D/g, "")` in `_shared/pagopar.ts` now, falling back to a placeholder for agents with no `ruc` on file.
- `tipo_documento` must always be `"CI"` — `"RUC"` is not an accepted value even though Pagopar's own docs show a separate `ruc` field.
- The **webhook** (`pagopar-webhook`) body shape is `{ respuesta: true, resultado: [ {...} ] }` — `resultado` is an **array**, not a flat object. The old code read `body.resultado?.token` (undefined on an array), so every real webhook call was silently ignored despite the token-verify formula being correct. Confirmed the real shape via Pagopar's own "Simular pago del último pedido" tool, which shows both the exact payload sent and the exact response expected back (the bare `resultado` array, no wrapper).
- Fix confirmed working end-to-end: real test card charge (`4111 1111 1111 1111`) succeeded, webhook updated `payments.status` to `approved` and `subscriptions.status` to `active` correctly, all 3 of Pagopar's own checklist steps went green.

## 2. Chatbot cost & abuse protection

- [ ] Add rate limiting / abuse protection to `/api/chat` — currently **zero** limits: no auth, no IP/session throttling, no cooldown, fully public. Someone scripting requests can run up real Anthropic charges with nothing in the way.
- [ ] Consider the double-API-call-per-turn issue — every chat message also fires a second, separate `generateSummary` Anthropic call, roughly doubling real cost per exchange
- [ ] Add real `ANTHROPIC_API_KEY` + prepaid billing credits at console.anthropic.com before this sees real traffic (currently blank/no credits — API calls will just fail without this)

## 3. Hosting & domain launch (from the earlier deploy plan)

- [x] Git remote already exists (`github.com/jeremysilva-green/agentia`) — the original plan assumed no remote; that's outdated
- [x] Vercel project exists and is connected to the repo (confirmed via a real `preview` branch deploy) — still need to confirm it's actually on the **Pro** plan (Hobby tier's ToS forbid commercial use, and this app takes real payments)
- [ ] Register the `.com.py` domain via NIC.py
- [ ] Set every env var in Vercel: Supabase (3), Bancard (4) or dLocal (3) — whichever was chosen — plus `CRON_SECRET`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] Add the custom domain in Vercel + create the DNS records NIC.py needs
- [ ] Decide a cadence for the `subscriptions-check` cron and add it to `vercel.json` — it exists as a route but isn't scheduled anywhere yet
- [ ] Post-launch smoke test: Supabase-hosted images load, both cron endpoints actually fire, the chosen payment flow works end-to-end with real credentials, chat widget responds with the real API key

## 4. Vista Global (new panel tab, built tonight)

New "Vista Global" tab with 12 monthly stat tiles, a monthly PDF report, and a gated annual report (unlocks 1 year after account creation). Migration `0043_portfolio_views.sql` is pushed and live; all application code is local-only (not deployed).

- [ ] Actually look at `/panel/vista-global` in a real logged-in browser session — everything so far was verified via direct DB queries and curl (auth-redirect checks only), never visually confirmed in the UI
- [ ] Download both PDFs (monthly report + annual report, once eligible) on localhost and check they render correctly — same caveat, only confirmed they respond with a 200/PDF content-type, never opened one
- [ ] The annual report won't be testable for real until an agent account is 365 days old — currently the only test account is about a month in, so that whole path is unverified beyond the eligibility-gate logic itself

## 5. Pagopar production-approval test purchase — circuit complete, blocked on IP whitelisting

Pagopar requires a successful test purchase (test card `4111 1111 1111 1111`) before they'll grant production access, verified through their own 3-step checklist (insert pedido → webhook fires → status query works). All 3 steps are now green.

- [x] All 7 Pagopar edge functions deployed to production Supabase, `verify_jwt = false` set correctly for `pagopar-webhook`/`pagopar-cobro-mensual`
- [x] `PAGOPAR_TOKEN_PUBLICO` / `PAGOPAR_TOKEN_PRIVADO` sandbox secrets set (regenerated once mid-session; current values are live on Supabase)
- [x] Both "Pagar ahora" and "Elegir plan" consistently call Pagopar
- [x] **Test purchase completed successfully** — real charge with test card `4111 1111 1111 1111` on order #28192073, Gs. 149.000, confirmed paid via Pagopar's own `consultar pedido` API
- [x] Webhook confirmed firing and correctly updating `payments.status` → `approved` and `subscriptions.status` → `active` (see the bug-fix notes in §1 — this took real debugging, wasn't just a config issue)
- [x] Pagopar's own staging checklist shows all 3 steps green (Paso 1/2/3)
- [ ] **New blocker: clicking "Pasar a entorno Producción" fails with "IP no corresponde."** Supabase Edge Functions don't have static outbound IPs (confirmed via Supabase's own docs — they explicitly don't publish egress ranges), so there's no fixed value that can go in Pagopar's "IP's Habilitadas" field as-is.
  - [ ] Sent a support message to Pagopar (drafted, not yet confirmed sent) asking whether IP whitelisting is strictly required for serverless/cloud merchants, or if there's a workaround
  - [ ] If Pagopar says it's mandatory: decide between a static-IP proxy service (e.g. QuotaGuard) or a self-hosted fixed-IP relay VM that Edge Functions route Pagopar calls through — real cost/complexity trade-off, needs a decision once we know if it's actually required
- [ ] Once production access is granted: swap `PAGOPAR_TOKEN_PUBLICO`/`PAGOPAR_TOKEN_PRIVADO` secrets from sandbox to real production values (same dashboard process as tonight)
- [ ] Longer-term, non-blocking: `documento` sent to Pagopar defaults to a placeholder (`"00000000"`) for any agent without a real `ruc` on file — fine for testing, but worth eventually collecting a real CI/RUC from agents during signup/profile for actual production billing records

## 6. Public marketing landing page — now the actual site root

Commercial landing page targeted at converting visiting agents/affiliates into signups — separate from the existing neutral `/que-es-agentia` explainer. Reuses the app's established dark/emerald visual language. Content: hero, 3-step "cómo funciona," agent feature grid, affiliate feature grid, dolor→solución section, live pricing pulled from `src/lib/plans.ts`, and a final CTA banner.

- [x] **Moved to `/` (the actual site root)** — it's the first thing visitors see now, per explicit request. The old marketplace/agent-directory page that used to live at `/` moved to `/agentes`, with its own route-level metadata (previously inherited from the root layout, which now carries landing-page copy instead). `/inicio` (its original route) now just redirects to `/`.
- [x] NavBar's old redundant "Inicio" link (identical to clicking the logo once it was pointing at "/") replaced with "Buscar propiedades" → `/agentes`, since the marketplace had no nav entry point of its own after the move
- [x] Converted the `/registro` role-picker cards (Agente/Afiliado) and the `/registro/usuario` (affiliate) signup form to the same dark theme — they were light-mode cards floating oddly on the dark page shell
- [x] Decluttered the main nav: "¿Qué es Agentia?," "Comunidad WhatsApp," and "Ranking de Afiliados" moved into a new burger-menu dropdown (`src/components/NavMenu.tsx`), positioned last in the nav (after Salir/Mi Panel). All three remain in the footer unchanged.
- [x] Deployed and confirmed working on the `preview` branch (both `/` and `/agentes` render correctly)
- [ ] Decide final copy tone/claims before this goes live — some of it (competitor positioning around "redes compartidas") was written defensively without naming competitors; revisit if that changes

## 7. Social image renderer (Satori/resvg, drop-in feature)

New `POST /api/social-images/generate` endpoint: given a `propertyId`, renders a branded Instagram-ready property card (dark theme, price, address, bed/bath/m², Agentia logo) server-side via Satori + `@resvg/resvg-js`, uploads it to a `generated-social-images` Storage bucket, returns the public URL. Built for Make.com to call after "Guardar Cambios."

- [x] Copied in from a standalone drop-in folder, merged cleanly (no path conflicts)
- [x] Installed missing deps (`satori`, `@resvg/resvg-js`)
- [x] Fixed two Turbopack bundling bugs that only surface at runtime, not typecheck: `@resvg/resvg-js`'s native per-platform binary and `satori`'s `harfbuzzjs` `.wasm` loader both need `serverExternalPackages` in `next.config.ts` to avoid broken path resolution
- [x] `generated-social-images` Storage bucket created (public)
- [x] End-to-end test against a real property succeeded — real PNG generated and uploaded
- [ ] Set a real `SOCIAL_IMAGE_RENDER_SECRET` (currently a random value I generated for local testing only) and configure Make.com to send it as `x-render-secret`
- [ ] Set `SOCIAL_IMAGE_RENDER_SECRET` in Vercel once this is deployed for real
- [x] Superseded/complemented by the automated Instagram-post-queue flow below (§9) — this endpoint is what Make.com's scenario calls once it picks up a `generation_requests` row

## 8. Signup friction + a rendering-flicker bug (this session)

- [x] **Final approach** (revised from an earlier attempt): `signUpAgent`/`signUpUser` now admin-confirm the new account server-side immediately after creating it (`service.auth.admin.updateUserById(id, { email_confirm: true })`), then sign them in directly (`signInWithPassword`) and redirect straight into their panel — access no longer depends on the Supabase "Confirm email" dashboard setting at all, which should stay **ON** (not off — turning it off means Supabase sends no email whatsoever, confirmed via research, which isn't what's wanted here).
- [ ] **Custom "Gracias por registrarte..." email copy still blocked**: Supabase's dashboard template editor is read-only until **custom SMTP is connected** — their built-in mailer only sends the generic default template, can't be edited. Needs a real SMTP provider (Resend recommended — already hinted at via an existing TODO comment elsewhere in the codebase) connected in Supabase Dashboard → Authentication → Emails before the subject/body can be customized. **User explicitly deferred this** ("just wait, I'll come back to that later") — don't proceed without them raising it again.
- [x] Fixed a real, reproducible UI flicker on `EmailConfirmModal`/`TermsModal`: both are `fixed` overlays stacked above `InteractiveBackground`, which was writing a style update on every raw mouse-move event — isolating the modals onto their own GPU compositing layer (`transform: translateZ(0)`) fixed it. Confirmed working on the deployed preview build (note: this was initially "fixed" locally but never actually tested against real deployed code for a couple rounds — always push before re-testing a rendering bug like this).

## 9. Automated Instagram posting on property save — ✅ confirmed working end-to-end on preview

**Trigger point (revised from the original design):** queues exactly once per property, the moment its **first photo finishes uploading** — not on property create/update at all. `notifyFirstPhotoAdded(propertyId)` (exported from `src/lib/actions/properties.ts`) is called directly from `PropertyPhotoManager` (a client component) right after a successful upload where the property had zero photos before; it independently verifies server-side that the authenticated caller actually owns the property (exported server actions are directly callable by anyone, not just from the UI that references them — never trust a client-supplied id for this). `createProperty` and `updateProperty` no longer queue anything themselves. Inserts a `pending` row into `generation_requests` with the property's public URL, then POSTs to a Make.com webhook. Every step wrapped so a failure (missing agent slug, DB error, webhook unreachable) is logged but never blocks the actual photo upload.

- [x] **Bug found & fixed: original design (queue on every property save) fired before any photo existed.** `createProperty` redirects straight to the edit page where photos get added *afterward* — Make.com had nothing real to render at that trigger point. Real-world consequence: confirmed via Vercel/Buffer that a create + immediate follow-up save was producing two near-identical queued posts (root-caused via `generation_requests` timestamps, not a race condition) — user re-decided (after initially saying "leave it as-is, duplicates and all") that they need the image to genuinely exist at queue time, prompting the full redesign above.

**⚠️ REMINDER: this whole flow currently only exists on the `preview` branch/deployment. Before real launch, it needs to actually be merged/deployed to `main`/production** — the `generation_requests` table + `MAKE_INSTAGRAM_WEBHOOK_SECRET` exist on the real (shared) Supabase project already, but the *application code* calling them is preview-only until `main` gets this. Don't forget this when doing the final pre-launch deploy.

- [x] **User-confirmed working end-to-end on the deployed preview** — full real flow tested (property save → `generation_requests` row → Make.com webhook → Instagram post generation) and confirmed working correctly.

- [x] `generation_requests` has RLS enabled with **no policies** — the insert uses the service-role client, not the regular session-scoped one
- [x] `MAKE_INSTAGRAM_WEBHOOK_SECRET` set in both `.env.local` and Vercel
- [x] **Bug found & fixed: `generation_requests_id_seq` was desynced** from actual table data (rows existed up to `id=999` from earlier manual testing, but the sequence was still at 2) — every insert collided with an existing row. Fixed via `setval(...)` to the real max id; verified with a real test insert/delete. Not a code bug — the insert never passed an explicit `id`.
- [x] **Bug found & fixed: `property_link` resolved to `localhost:3000` on deployed previews** — `NEXT_PUBLIC_SITE_URL` was never set in Vercel. `getSiteUrl()` now falls back to Vercel's auto-injected `VERCEL_URL` before localhost, so it self-corrects on any deployment without needing that var manually set per environment (still honored first, for when a real custom domain exists in production).
- [x] **Bug found & fixed (confirmed root cause, reproduced locally): `POST /api/social-images/generate` crashed on every real property with a `DataView` `RangeError`.** `getPropertyForSocialCard()` (`src/lib/data/social-image-property.ts`) hardcoded the cover photo's data URI as `data:image/jpeg;base64,...` regardless of the real file format — every property photo is actually a PNG, so every cover photo was mislabeled. Satori picks its decoder (`parseJPEG` vs `parsePNG`) off the data URI's declared MIME type rather than sniffing the actual bytes, so it ran a JPEG parser against real PNG byte structure and threw immediately. Confirmed by reproducing the exact error verbatim locally (same message, same Satori stack frames) by feeding the real, verified-valid PNG through the pipeline mislabeled the same way — then confirmed the fix by running the full real pipeline end-to-end against the actual failing property, which now renders correctly. Fix: read the real `content-type` off the fetch response instead of hardcoding it.
- [x] **Separate, secondary fix (unrelated route, still worth keeping):** while first investigating this before finding the real cause above, found and fixed a genuine but unrelated robustness gap in `/api/property-card/[propertyId]` (the older OG-image/promo-card route — confirmed via Vercel logs this was *not* the route that actually crashed). It was handing `next/og`'s `ImageResponse` a raw remote image URL with zero error handling around the fetch/decode. Refactored to pre-fetch + base64-encode both the cover photo and agent avatar server-side (same pattern as the social-images renderer), wrapped in try/catch — a failed image fetch there now falls back to the existing placeholder UI instead of 500ing the whole response.
- [x] **Added property title/headline to the card** (`properties.title` already existed, just wasn't wired through — added to `getPropertyForSocialCard`, `PropertySocialCardProps`, and rendered in `PropertyTemplate.tsx` between the tag and price).
- [x] **Bug found & fixed: adding the headline caused the price and address text to render overlapping each other.** Genuine Satori/Yoga layout engine bug, not a styling issue — ruled out `lineHeight` (neither unitless nor pixel values had any effect) and font choice (happened regardless of the headline's own font) via Satori's `debug: true` bounding-box mode. Fixed by grouping headline/price/address into their own isolated flex-column container.
- [x] **Bug found & fixed: bottom content (stats row, logo) was overflowing past the canvas edge** once the headline was added — summing every element's height + margins confirmed the total layout exceeded the fixed 1350px canvas by ~80px. Fixed by moving the "EN VENTA" tag off its own row and onto the cover photo itself (bottom-left corner overlay with a drop shadow for legibility), which recovers enough vertical space.
- [x] Nudged the watermark logo up to align with the stats row (Satori wasn't respecting `alignItems: center` for the raw `LogoMark` SVG the way it does for `div`s).
- [ ] **Known open issue, outside this codebase:** the Instagram caption text (posted alongside the image) includes a broken, unfilled `"hab. /baños"` placeholder — confirmed nothing in our repo generates or writes to `generation_requests.caption`, so this is a bug in the **Make.com scenario's own caption-composition step**, not something fixable here. Needs to be fixed directly in Make.com's scenario editor.

## 10. "Compartir" button + Redes Sociales panel tab (new feature)

Agents can now generate a short link + reuse the existing promo-image system for their own listings — mirrors the affiliate's "Generar Link" flow but scoped to the owning agent. New `agent_social_shares` table (migration `0044`), kept fully separate from `affiliate_links`/`short_links` so an agent's own share can never be conflated with affiliate referral/commission attribution. New `/sa/[code]` resolver (no `?ref=` param — never eligible for referral tracking). "Compartir" button on the property page, shown only to the owning agent. New "Redes Sociales" tab in `PanelNav`.

- [x] Migration `0044_agent_social_shares.sql` applied (confirmed only this migration went out, not a wider batch)
- [x] `/sa/[code]` resolver verified end-to-end against real data (correct redirect, correct OG tags, `click_count` increments)
- [ ] The actual "Compartir" button click + viewing the row in the "Redes Sociales" tab still need to be tested interactively (needs a real logged-in session, not testable from my side)

### Bug found & fixed while building this: `NEXT_PUBLIC_SITE_URL` fallback duplicated across 11 files, all resolving to `localhost` on deployed previews

The new share-link table showed `localhost:3000` in the generated URL — same root cause as the earlier Instagram `property_link` bug (`NEXT_PUBLIC_SITE_URL` never set in Vercel), just copy-pasted in a second place. Grepped and found the identical fallback pattern (`process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`) duplicated across **11 files** — including the **affiliate's own "Mis Enlaces" tab**, a pre-existing bug not introduced this session.

- [x] Extracted a shared `getSiteUrl()` helper (`src/lib/siteUrl.ts`) — prefers `NEXT_PUBLIC_SITE_URL`, falls back to Vercel's auto-injected `VERCEL_URL`, only falls back to `localhost` for actual local dev. Switched all **10 server-side files** to it (property page, `/s/[code]`, `/sa/[code]`, Bancard/dLocal checkout routes, `AffiliateLinksTable`, `AgentSocialSharesTable`, `dlocalSubscription.ts`, `auth.ts`, `properties.ts`).
- [ ] **`AcuerdosList.tsx` still shows localhost on preview and can't be fixed the same way** — it's a client component, and `VERCEL_URL` is never inlined into browser bundles (only `NEXT_PUBLIC_`-prefixed vars are). This one genuinely needs **`NEXT_PUBLIC_SITE_URL` set directly in Vercel's environment variables** to fix, not a code change.
- [ ] **Action needed:** set `NEXT_PUBLIC_SITE_URL` in Vercel now — for the Preview environment, `https://agentia-git-preview-jeremys-projects-987e22ec.vercel.app`; once a real custom domain exists for production, set it there too. This both fixes `AcuerdosList.tsx` and makes every other file's *primary* branch (rather than the `VERCEL_URL` fallback) the one actually used.
- **Follow-up (found while debugging a "no image on WhatsApp preview" report):** the `VERCEL_URL` fallback isn't just a cosmetic localhost issue — it's actively breaking share links. `VERCEL_URL` is a **per-deployment** hostname (e.g. `agentia-l5hklazm-...vercel.app`), not the stable branch alias, so it changes on every `preview` push. Any link generated (or OG image URL embedded in a link's metadata) while an older deployment was live goes fully dead — 404 `DEPLOYMENT_NOT_FOUND` — the moment a newer one ships. Verified: the OG image endpoint (`/api/property-card/[id]`) itself works fine and isn't blocked by Vercel deployment protection when hit against the *stable* branch-alias URL; the metadata code (`openGraph.images`/`twitter.images`) is already correct in all three relevant pages (property page, `/s/[code]`, `/sa/[code]`). So this isn't a missing-metadata bug — it's the same root cause as the row above, just with a sharper consequence: **until `NEXT_PUBLIC_SITE_URL` is set, every share link is a ticking time bomb that dies on the next deploy.**

**Operational note for next time:** my Supabase CLI login can run DB migrations fine, but gets a 403 "insufficient privileges" on `functions deploy`, `secrets set/list`, and `projects list` — even right after a fresh `supabase login`. The same commands work fine when the user runs them directly in their own terminal. Cause not fully diagnosed (same machine, same `$HOME`) — likely a role/scope difference on the access token itself. Until this is understood, function deploys and secret changes need to go through the user's terminal or the Supabase dashboard, not through me directly.

## Standing rules (not action items — just don't forget these)

- Never push to Supabase or deploy to production without explicit go-ahead per migration/change, reviewed locally first
- Never deploy to Vercel without explicit confirmation — even the literal word "deploy" needs a clarifying question first, not automatic action
- Pagopar code/migrations stay untouched and in place — not deleted, in case it's revisited
