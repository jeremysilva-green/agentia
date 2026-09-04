# Launch Checklist

Running list of everything left open, deferred, or undecided before this goes live. Check things off as they're actually resolved, not just discussed.

**Current deploy state:** the Supabase **database schema** is live through migration `0052` (SIFEN electronic-invoicing tables — see §26). The **application code on `preview`** is current through commit `e35eac7` (agent portfolio header restyle — covers §22 through §30 below, all committed and deployed). **One real gap remains, carried over from the previous update:** the `0052` migration's own `notify_payment_approved()` trigger function still has the **literal placeholder text `<SITE_URL>`** baked into the URL it POSTs to (a code deploy can't fix this — it's baked into the already-applied migration; needs a `create or replace function` run directly against Supabase with the real domain, now that `agentia.com.py` is confirmed registered and live — see §3). Until that's fixed, a real approved payment's invoicing trigger silently fails (fire-and-forget `net.http_post`, doesn't block the payment itself) rather than actually creating an invoice. Stable preview URL: `https://agentia-git-preview-jeremys-projects-987e22ec.vercel.app` (behind Vercel's deployment-protection SSO wall). **`main`/production has not been touched.** Standing rule, reaffirmed: never deploy to Vercel **production** without an explicit go-ahead — even the literal word "deploy" needs a clarifying question first.

- [x] Vercel project confirmed to exist and connected to GitHub — resolves part of §3 below
- [x] `preview` branch workflow established: commit → push `preview` → poll GitHub's commit status API for the Vercel check (`success`/`failure`) → same stable branch URL every time, no new link needed per push

## 1. Payment processor — Pagopar is now the working, tested option

Three processors exist in the codebase (Pagopar, Bancard-direct, dLocal). Pagopar is no longer just "the one being tested" — as of tonight it's a **fully working, end-to-end verified integration** in Pagopar's staging environment (see §5: real card charge succeeded, webhook correctly updates our DB, status-check API confirmed working). Bancard-direct and dLocal remain untouched, uncredentialed, and local-only. Nothing has formally been declared "the launch processor" yet, but Pagopar is now far ahead of the other two in actual proof-of-working-ness.

- [x] **Decided: Pagopar is the launch processor.** Bancard-direct and dLocal are explicitly dropped, not just de-prioritized — confirmed while scoping the SIFEN invoicing work in §26. Their code/migrations stay in place untouched (see Standing rules) but nothing new should be built assuming either is live.
- [x] Both checkout entry points (`PricingPlans` "Elegir plan" and `suscripcion` page's "Pagar ahora") now consistently call Pagopar — the earlier "mixed state" risk is resolved
- Bancard/dLocal env vars, field-name verification, and card-capture UI are moot now that both are dropped — leaving the two items that used to be here removed rather than marked done.
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
- [x] Vercel project exists and is connected to the repo (confirmed via a real `preview` branch deploy), **confirmed on the Pro plan** — resolves the commercial-use ToS concern and clears §26's `invoice-status` cron (`*/15 * * * *`) to actually run as scheduled; Hobby would have silently ignored the sub-daily interval.
- [x] `.com.py` domain registered via NIC.py and added to Vercel as a Production domain (`agentia.com.py`) — found while checking on an unrelated Vercel dashboard notice, not done through this session, but confirmed live. `agentia-chi.vercel.app` (the default Vercel domain) also shows "Valid Configuration."
- [ ] **Optional DNS housekeeping, not urgent:** Vercel is recommending the `@` CNAME record move from the legacy target to `f45b8c5af0a9c202.vercel-dns-017.com.` (their IP-range expansion) — flagged "recommended," not broken, and they explicitly confirm the legacy record keeps working. Update at NIC.py whenever, no rush.
- [ ] Env vars in Vercel — `ANTHROPIC_API_KEY` in progress as of this session (adding to both Production and the `preview` branch scope). Still needed: Supabase (3), `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `FACTURASEND_TENANT_ID`, `FACTURASEND_API_KEY`, `INTERNAL_BILLING_SECRET` (Bancard/dLocal vars dropped from this list — see updated §1) — status of these unconfirmed, worth a full audit of what's actually set in the dashboard rather than assuming.
- [ ] Decide a cadence for the `subscriptions-check` cron and add it to `vercel.json` — it exists as a route but isn't scheduled anywhere yet
- [ ] Post-launch smoke test: Supabase-hosted images load, all cron endpoints actually fire (now 4, see §26), Pagopar works end-to-end with real credentials, chat widget responds with the real API key

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

## 11. "Agently" → "Agentia" typo — fixed in code, needs edge function redeploy

Found via a Pagopar dashboard screenshot showing a pedido description reading "Suscripcion Agently - Plan pro" — turned out to be a leftover from an earlier project name, scattered across several **user-facing** strings (not just Pagopar). Fixed in 9 files:

- [x] Payment descriptions: Pagopar (`crear-pedido-pagopar/index.ts`, `_shared/chargeSubscription.ts`), Bancard (`api/checkout/bancard/route.ts`, `bancardSubscription.ts`)
- [x] WhatsApp contact messages to sellers/buyers/affiliates (`VendedorRequestsTable.tsx`, `CompradorRequestsTable.tsx`, `AffiliateDealsTable.tsx`)
- [x] PDF report headers (`actions/leads.ts` deal-close report, `reports/vendorReport.ts`)
- Left as-is, not user-facing: `dlocal.ts`'s HTTP `User-Agent` header, a code comment in `pdfChrome.ts`
- [ ] **Action needed:** redeploy the two touched Supabase edge functions before this actually takes effect — `supabase functions deploy crear-pedido-pagopar` and `pagopar-cobro-mensual`/`pagopar-confirmar-tarjeta` (both import the now-fixed `_shared/chargeSubscription.ts`). Same access gap as the operational note below — I can't run `functions deploy` myself, this needs the user's terminal.
- Note: this only fixes *future* transactions/messages/reports — historical "Agently" entries already in Pagopar's dashboard are permanent records and won't retroactively change.
- [x] **Follow-up:** found 7 more spots — downloaded filenames still read `agently-*` (3 report-PDF routes, their 3 client-side fallback filenames, and the promo-card JPG download in `downloadPromoCard.ts`). All fixed to `agentia-*`, pushed to preview.

## 12. Property-edit bug fixes and the Básico property-limit gate

- [x] **"Guardar cambios" did nothing on save** — `updateProperty` returned `undefined` on success with no redirect, so the edit page just sat there. Now redirects to `/panel/propiedades`, mirroring `createProperty`'s existing pattern.
- [x] **"+ Nueva propiedad" now gates at the Básico limit before the form, not after** — previously a Básico agent at 3 active properties only found out after filling out the whole creation form and hitting save. New `isAtPropertyLimit()` check on the panel page swaps the button for an upgrade-to-Pro modal (styled like the Pro plan card) instead of navigating, when at the cap.

## 13. "Cancelar suscripción" now downgrades to Básico instead of fully deactivating the agent

A `cancelSubscription()` action and red button already existed, but fully deactivated the agent (`is_active = false`) — 404ing their entire public portfolio, not just capping it. Rewired to match what was actually wanted: cancel now downgrades to Básico (stops monthly billing immediately — same effect as picking Básico from the pricing cards, `cancelSubscription` now just delegates to `selectPlan("basico")`), caps active properties at 3, and keeps the agent's profile/portfolio page live.

- [x] New `enforceBasicoPropertyLimit()` / `restoreHiddenPropertiesOnUpgrade()` pair (migration `0045_property_hidden_by_downgrade.sql`): downgrading unpublishes excess active properties (keeps the 3 most recently created), tracked via a new `properties.hidden_by_downgrade` flag so a later Pro/Fundador upgrade auto-republishes *exactly* the ones the downgrade hid — never something the agent unpublished themselves on purpose. A manual re-publish in the edit form clears the flag so a later upgrade doesn't double-touch it.
- [x] Wired into **every** payment-activation path, not just Pagopar: `pagopar-webhook` (Deno edge function — logic duplicated inline since it can't import Next.js code, same pattern as `_shared/plans.ts`), `api/webhooks/bancard/route.ts`, `api/checkout/dlocal/route.ts`, `api/webhooks/dlocal/route.ts`. Bancard/dLocal aren't credentialed yet, but wired anyway so nothing's inconsistent whenever they go live.
- [x] **Security gap found and fixed while building this:** the chatbot's property lookup (`/api/chat/route.ts`) used the service-role client with no `published` filter — it could still answer questions about (and surface the agent's phone number for) a property that's supposed to be hidden, including one just hidden by this new downgrade logic. Now filtered on `published = true`.
- [ ] **Action needed:** redeploy `pagopar-webhook` — `supabase functions deploy pagopar-webhook` — same access gap as always, needs the user's terminal. That's now 3 edge functions total pending redeploy (this one, `crear-pedido-pagopar`, `pagopar-cobro-mensual`/`pagopar-confirmar-tarjeta` from §11).
- Deliberately not built: auto-republishing on upgrade was scoped to *exactly* what the downgrade hid — an agent manually re-publishing something themselves while still on Básico is left alone, not force-hidden again.

## 14. Public site content/design pass

- [x] Nav link "Buscar propiedades" → "Portal" (same `/agentes` target). New agents now land on `/agentes` right after signup instead of their own empty `/panel` (affiliate signup and existing-user login unchanged).
- [x] Added 5 features to the Pro/Fundador plan list (ChatBot Inteligente, CRM Automatizado, Contratos Digitales, Analíticas, Reportes en PDF) — 3 of these were renames/merges of pre-existing items (`Chatbot avanzado`, `Panel CRM automatizado`, the two `Estadísticas...` lines) rather than duplicates. Homepage teaser bumped from 5 to 10 visible features for Pro/Fundador only (Básico's teaser untouched); `/panel/suscripcion` already showed the full list, so it picked this up automatically.
- [x] Homepage "Para Agentes"/"Para Afiliados" sections redesigned twice per feedback: bordered icon cards → centered text-only → left-aligned with icon+title row (title bigger than body) and each description manually split into two balanced lines rather than relying on browser wrap.
- [x] Removed the "Los problemas de siempre, resueltos" (pain/solution) homepage section entirely, per request.
- [x] Minor color tweaks: "Editar" buttons on the properties list are now solid emerald (were gray); the agent's "Compartir" button is now black with green text (was light gray).

## 15. "Logo del Agente" + "Tu Marca" brand fields — ✅ pushed

New optional fields for agents: a square (1:1) logo upload and a "Tu Marca" text field, shown on `/panel/perfil` and surfaced as a small corner-badge chip on the agent's public portfolio card in the `/agentes` grid.

- [x] Migration `0046_agent_profiles_brand.sql` (`agent_profiles.brand_name`, `agent_profiles.logo_url`) — **applied to the DB**, confirmed via direct query.
- [x] `AvatarUploader` generalized in place (new `target`/`pathPrefix`/`errorMessage` props) to also write to `agent_profiles.logo_url`, reusing the existing `avatars` storage bucket (already scoped by `auth.uid()` folder prefix via RLS) with a `logo-` filename prefix so it doesn't collide with the profile photo.
- [x] Portal card (`AgentCard.tsx`) shows the logo as a small rounded chip, bottom-right corner of the profile photo, only when `logo_url` is set — no query changes needed since the marketplace fetch already does `select("*")` on `agent_profiles`.
- [x] Pushed to `preview` — commit `03c2e30`, along with §16–§21's batch.

## 16. Site polish pass — branding, mobile nav, misc bug fixes

- [x] Nav logo swapped from plain "AGENTIA" text to the real logo image (`public/logo.png`, sized down from `h-8 sm:h-12` to `h-7 sm:h-10` per feedback). Favicon replaced twice — first `Icon.png`, then swapped again to `agentia iso.png` (current: `src/app/icon.png`, Next.js App Router's auto-detected-favicon convention; old `favicon.ico` deleted to avoid any stale fallback).
- [x] Mobile nav decluttered: "Mi Panel"/"Panel Afiliado" hidden on mobile from the inline bar (`hidden sm:flex`) and moved into the burger dropdown instead (`sm:hidden` there) — nothing lost, just relocated. "Portal" reversed to stay visible at all sizes after initial hide-on-mobile feedback.
- [x] Homepage "Para Agentes"/"Para Afiliados" items get a frosted `bg-black/40 backdrop-blur-md` panel on hover (negative-margin trick so it doesn't shift layout at rest).
- [x] Found 7 more `agently-*` → `agentia-*` spots specifically in **downloaded filenames** (3 report-PDF routes + their button fallbacks + the promo-card JPG) — separate from the earlier §11 fix, which only covered visible text.
- [x] Agent signup page (`/registro/agente`) restyled to match the affiliate signup page exactly — was on a light `bg-emerald-50` card with inverted black/white button colors (a visual outlier); now the same dark glass card, white labels, solid emerald button.
- [x] Both signup flows (agent and affiliate) now redirect to `/agentes` (the Portal) after signup instead of `/panel`/`/panel-afiliado` — a brand-new account sees the marketplace first. `login()` for existing users is unchanged.
- [x] Footer Instagram icon now links to the real `@agentia.py` account (was a dead `instagram.com` placeholder).
- [x] Supabase Auth's raw English rate-limit error ("For security purposes, you can only request this after N seconds") now translates to Spanish with the actual wait time, instead of leaking untranslated text into signup forms.
- [x] `ViewClientRequestModal` (Solicitudes "Ver" modal) now has `break-words` on its field values — a long unbroken description string was overflowing the modal's fixed width.

## 17. Agent's own "Compartir" button on their public portfolio page

Previously every property card on `/agentes/[slug]` — including when the agent views their **own** public portfolio — showed the affiliate's "Generar link" button, which fails outright for the agent ("Solo los afiliados pueden generar enlaces de afiliado"). Fixed:

- [x] `PropertyCard.tsx` now takes an `isOwner` prop (computed in the page, same `user.id === agent.id` check already used elsewhere on that page) and swaps in a new `compact` variant of `AgentShareButton` (same visual pill style as "Generar link", same `/sa/[code]` flow as the property detail page's full-size "Compartir" button) instead of `GenerateLinkButton`.
- [x] Visitors and affiliates viewing someone else's portfolio still see "Generar link" as before — no change there.

## 18. Native `confirm()` dialogs being replaced with custom modals — ✅ done everywhere

Browser-native `confirm()`/`alert()` can't be styled with CSS at all (an OS/browser-level limitation, not a code gap) — first fixed for the "Eliminar Acuerdo Privado" dialog specifically, later extended to every remaining delete button on request ("whenever deleting a property use the same customized delete modal... everywhere there is a delete option").

- [x] `DeleteAcuerdoButton.tsx` rebuilt with a real dark-glass/emerald confirm modal, replacing the plain browser popup.
- [x] New shared `src/components/ui/ConfirmModal.tsx` — extracted from the light-themed modal pattern (`DeleteClientRequestButton.tsx` had already hand-duplicated the same markup) so every delete confirmation renders identically instead of each button copy-pasting it.
- [x] Converted to the shared component: `DeletePropertyButton.tsx`, `DeleteAffiliateLinkButton.tsx`, `DeleteAgentSocialShareButton.tsx`, and `DeleteClientRequestButton.tsx` (now shares the component instead of its own copy).
- Deliberately left on native `confirm()`: `CancelSubscriptionButton.tsx` — it's a "cancel," not a delete, read as out of scope for "delete option" specifically. Flag if that reading was wrong.

## 19. Delete option added to the Solicitudes tables

- [x] New `deleteClientRequest` server action (`src/lib/actions/clientRequests.ts`) — works regardless of status (pending/approved/rejected), ownership-checked, doesn't touch a resulting property if one was already created from an approved request.
- [x] New `DeleteClientRequestButton.tsx` (light-themed confirm modal, matching the Solicitudes tables' white styling rather than the dark panel style used in §18) wired into both **Cliente Vendedor** and **Cliente Comprador** tables — the existing "Acciones"/approve-reject/report-download functionality was explicitly kept as-is per the user, only a new delete column was added alongside it.

## 20. Commission-recognition contract feature — ✅ migration pushed, live and working

New mandatory step between closing a deal ("Trato cerrado") and "Pagar al Afiliado": the agent must read and digitally accept a real legal agreement (auto-filled with both parties' info) before payment becomes available, and the affiliate gets a downloadable copy of the finalized PDF in their Avisos tab.

- [x] New non-dismissable modal (`CommissionAgreementModal.tsx`) — no X, no backdrop-close, only proceeds via "Acepto". Gated by DB state (`leads.commission_agreement_accepted_at`), not client state, so it reliably reappears if the agent navigates away mid-flow instead of being skippable.
- [x] Real PDF generation (`src/lib/reports/commissionAgreementPdf.ts`, `pdf-lib` + the shared `pdfChrome.ts` branding helpers, hand-rolled paragraph word-wrapping since the existing report helpers only supported single-line label/value rows) — uploaded to a **new dedicated bucket** `commission-agreements` (kept separate from `deal-reports` on purpose, mirroring how `acuerdo-documentos` was already split out for a different concern).
- [x] New `leads.commission_agreement_accepted_at` / `leads.commission_agreement_path` columns; "Pagar al Afiliado" now gates on the former instead of `commission_confirmed_at`.
- [x] New optional `profiles.ci` (Cédula de Identidad) field — **didn't exist anywhere in the schema before this**, needed for the affiliate's line in the contract. Added to the affiliate's own profile form. If it's still blank when a deal closes, the contract shows "(CI pendiente)" rather than blocking the deal-closing flow over someone else's incomplete profile. Agent's own C.I./RUC line reuses the existing `agent_profiles.ruc` field (Paraguay RUC-for-individuals = CI + a check digit, and the template already accepts "C.I./RUC" interchangeably for the agent).
- [x] Wired into every place the app already recognizes a deal is closed — nothing new to trigger, just gates the existing flow.
- [x] Migration `0047_commission_agreement.sql` — confirmed live on Supabase (verified `leads.commission_agreement_accepted_at`/`commission_agreement_path` exist).
- [x] Pushed to `preview` — commit `03c2e30`.
- Deliberately not built: the affiliate never signs anything in this flow — only the agent accepts, the affiliate just receives a copy. Also deliberately not built: auto-generating a short referral link if one doesn't already exist for the contract's link field — it falls back to the always-valid long-form `?ref=` URL instead.

## 21. Month/Year accordion applied across all 6 panel data tables

Originally built once for the Solicitudes tables per explicit request ("just like in the Acuerdo Privado page"), then extended to Leads, Redes Sociales, Chats, and Agendamientos on request, then upgraded further after the user asked what happens once pill counts grow unbounded over multiple years.

- [x] Extracted into one shared `MonthYearAccordion.tsx` (render-prop based — each table passes its own row-rendering function) plus `src/lib/monthGroups.ts` (`groupByMonth`, `groupByRecency`), used by `VendedorRequestsTable`, `CompradorRequestsTable`, `LeadsTable`, `AgentSocialSharesTable`, `ChatsTable`, `AgendamientosTable`. The original `AcuerdosList.tsx` (the page this pattern was copied from) was deliberately left untouched/still has its own local copy of the grouping logic — no reason to risk already-working code for a refactor nobody asked for there.
- [x] **Bounded growth**: the last 12 months show as flat pills (unchanged behavior); anything older rolls into one pill per calendar year, which expands to reveal that year's own month pills — so the pill row grows by 1/year instead of by 12/year once an agent's account is more than a year old.
- [x] Pills restyled black with green text/border per feedback (both collapsed and expanded states, one shared component so all 6 tables updated at once).
- [x] `AgentSocialSharesTable` had to move its `getSiteUrl()` call up into the page (`redes-sociales/page.tsx`, passed down as a `siteUrl` prop) when it became a Client Component for the accordion state — calling `getSiteUrl()` directly inside a Client Component would've silently reintroduced the exact `VERCEL_URL`-not-available-client-side localhost bug documented in §10, since only `NEXT_PUBLIC_`-prefixed env vars are available there.
- **Discussed, not built:** the user asked for a take on auto-resetting/archiving CRM data once a year passes. Advised strongly against any actual delete — leads carry real financial/legal state (commission timestamps, the new signed contract PDFs, a 180-day referral-protection window that can span a year boundary) and a PDF-only archive stops being searchable/reportable, including for the affiliate whose own dashboard reads the same rows. The month/year accordion already solves the underlying "feels cluttered" goal without deleting anything. Offered a non-destructive "export year as PDF" *download* button as a middle ground if wanted — not requested yet.

## 22. YouTube video field for property listings

- [x] New optional `properties.youtube_url` column (migration `0051`), validated (`src/lib/youtube.ts` extracts the video id from `youtu.be`/`watch?v=`/`shorts`/`embed` URL shapes), shown as an embedded player on the public property page below the photo gallery via new `PropertyVideo.tsx`.
- [x] Added to both the create and edit property forms.

## 23. Site polish pass #2 — share-button feedback, mobile-grid overflow bug, property-card fixes, profile-picture cropping

- [x] Both "Compartir" buttons (agent's own `AgentShareButton.tsx` and the affiliate's `ShareButton.tsx`) now show a small "Guardado en Mi Panel" popup after generating a link, alongside the existing "¡Enlace copiado!" swap — the affiliate version sits higher than the agent version so it doesn't collide with that button's existing hover tooltip.
- [x] **Real mobile-responsive bug found and fixed** on the public property page: the outer grid has no explicit column tracks below the `lg` breakpoint, so each grid item's default `min-width: auto` let a long, space-sparse property description force the whole grid to ~935px wide on a 393px viewport — the page's own `overflow-hidden` silently clipped the overflow instead of showing a scrollbar, so content just got cut off on the right with no way to scroll to it. Fixed with `min-w-0` on the three grid item columns. Verified with Playwright at 8 mobile widths (320–428px) before and after — zero elements exceed the viewport now.
- [x] Same root-cause bug, second location: the price/description sidebar card's description paragraph was missing `break-words` (same fix already applied elsewhere per §16's `ViewClientRequestModal` precedent) — a long unbroken string ran past the card's right edge.
- [x] **`/api/property-card/[propertyId]` (the OG-image/WhatsApp-preview route) had a real, separate bug**, not the same as the two above: its description block used Satori's `width: "100%"`, which resolved against the wrong reference box and ignored the parent's own padding — the description ran past the white card's right edge regardless of alignment. Root cause turned out to be different again: Satori only wraps text at whitespace by default, and the test description had one very long unbroken character run with no spaces, so it couldn't wrap at all. Fixed with `wordBreak: "break-word"` (Satori's equivalent of the CSS fix above) — confirmed by re-rendering the exact same property before/after.
- [x] Swapped the logo used in that same route (top header + footer) from the old `assets/agentia_00000.png` to the new full wordmark `assets/agentia-04.png`, with corrected aspect-ratio math for the new file's real dimensions (5947×943, not the old file's ratio).
- [x] Removed the agent's profile-photo avatar from that card's header entirely (not just hidden) — also cleaned up the now-dead `agentAvatarUrl`/`agentAvatarDataUri` fetch logic, the `agent_profiles` join in the query, and the unused `UserIcon` component.
- [x] Raised `DESCRIPTION_LIMIT` on that same card from 200 to 300 characters.
- [x] **New: profile-picture cropping before upload.** Added `react-easy-crop` (small dep footprint, React-19-compatible) and a new `src/components/ui/ImageCropModal.tsx` (pan, zoom, canvas-based crop-to-JPEG-blob). Wired into the single shared `AvatarUploader.tsx` component, so this covers every place a picture gets uploaded in one change: agent profile photo, affiliate profile photo, the compact avatar-changer on the panel overview, the public portfolio page's inline editor, and the agent's brand logo (square crop there instead of circular). Verified interactively (drag/zoom/save) in a real browser — the cropped output matches exactly what was framed.
- **Discussed, not built:** a Pro/Fundador plan badge on agent cards in the portal grid (blue "Pro" chip, gold "Fundador" chip with a crown icon, nothing for Básico/trial). Fully designed and even wired to real subscription data (`getMarketplaceAgents` would have joined the agent's latest active subscription), previewed on a real card, then explicitly dropped ("just forget the badges altogether") before merging — fully reverted, zero trace left in the code. Worth knowing this was already tried if it comes up again.

## 24. Landing-page pricing card updates (Básico plan)

- [x] Added `"Hasta 3 propiedades activas"` to the Básico card on the homepage — the data already existed (`plans.ts`'s `limitations` field, already shown on the in-app `/panel/suscripcion` pricing view) but the landing page's own card markup had never rendered it.
- [x] Renamed two existing Básico features to match Pro's exact wording (`"Chatbot avanzado"` → `"ChatBot Inteligente"`, `"Panel CRM automatizado"` → `"CRM Automatizado"`) and added `"Contratos Digitales"` as a genuinely new line — all three features are already unrestricted by plan in the actual app, so this is accurate, not aspirational copy. Bumped the landing page's Básico card from showing only its first 5 features to its first 8, since the new items would otherwise be sliced off (Pro's card already showed 10).

## 25. Live search on the agent portfolio page — ✅ pushed

- [x] Added the same `SearchBar` component from the main portal page to each agent's own public portfolio page (`/agentes/[agentSlug]`), above the existing city/type/price filter row.
- [x] **This needed real wiring, not just the UI**: `getAgentProperties` (`src/lib/data/agentPortfolio.ts`) had no free-text search support at all — added `q` filtering (title/description/city/property-type/listing-type, accent-insensitive) mirroring the matching logic `getMarketplaceAgents` already used for the main portal. Extracted the shared accent-normalization helper both now use into `src/lib/text.ts` (previously duplicated only in `marketplace.ts`).
- [x] Gave `SearchBar` an optional `placeholder` prop and a portfolio-specific one ("Buscá por título, ciudad o palabra clave...") — the default text mentions searching by agent name, which doesn't make sense scoped to one agent's own page.
- [x] **Then made both search bars (portal + portfolio) filter live as you type**, not just on Enter — 300ms debounce, `router.replace` (not `push`, so it doesn't spam browser history with one entry per keystroke). Verified interactively: typing "Altos" alone, no Enter, narrows the grid from 2 listings to 1 after the debounce fires.
- [x] Pushed to `preview` — commit `7df2722`.

## 26. SIFEN electronic invoicing (FacturaSend) — DB live, code pushed, real credentials still needed

The user created `agentia-billing/` — a scaffold proposing a full billing pipeline (Pagopar charging + FacturaSend electronic-invoice generation) reconstructed from FacturaSend's published docs and Pagopar's support docs, explicitly flagged by its own README as unverified in several places. Two research passes (existing-codebase architecture + FacturaSend's real public docs) found real problems with using it as-is, both resolved before writing any code — see the approved plan for full detail. **Scope, confirmed with the user: invoicing only.** Nothing about how Pagopar actually charges agents was touched.

- [x] **Confirmed Bancard/dLocal are dropped** (see updated §1) — simplified the integration to Pagopar's two existing approval paths only.
- [x] **Verified FacturaSend's real API directly against `facturasend.com.py/documentacion/`** and corrected two guesses in the scaffold that would have silently failed in production: the create-document response has **no internal id** in `deList[]` (status must be polled by **CDC**, `GET /{tenantId}/de/cdc/{cdc}`, not `de/id/{id}` as scaffolded) and the KUDE (PDF) endpoint is **`POST /{tenantId}/de/pdf` with a `cdcList` body returning base64**, not a GET-by-id returning a URL. Confirmed correct as scaffolded: the create-document endpoint/auth shape itself, `unidadMedida: 77`, and the core document-field codes.
- [x] **Still unconfirmed, deliberately left as named constants with a loud comment rather than guessed**: the IVA rate for a SaaS subscription (FacturaSend's own example showed 5% for an unrelated item; the scaffold guessed 10%) and the `condicion.entregas[].tipo` code for a card payment (their example only showed cash = 1; the scaffold guessed 3). **Needs confirming with FacturaSend support or an accountant before the first real invoice goes out** — see `IVA_RATE`/`CONDICION_ENTREGA_TIPO_TARJETA` in `src/lib/billing/invoiceBuilder.ts`.
- [x] **Architecture: one DB-level chokepoint, not code changes in the Pagopar files.** Rather than editing `pagopar-webhook/index.ts` and `_shared/chargeSubscription.ts` directly (Deno, can't import Next.js code), migration `0052_billing_invoices.sql` adds a Postgres trigger on `payments` (`AFTER UPDATE OF status ... WHEN NEW.status = 'approved'`) that calls a new `/api/internal/invoices/create` route via `pg_net.http_post` — the exact same mechanism already used for the Pagopar cron in `0020_pagopar_cron.sql`. Zero changes to either existing Pagopar file; keeps working automatically if Bancard/dLocal are ever revisited.
- [x] Migration `0052` — **pushed and confirmed live**: `agent_profiles` additions (`address`, six `sifen_*` geo-code columns), new `sifen_cities` reference table (ships empty, see below), `invoice_counters`/`increment_invoice_number()`, new `billing_invoices` table (RLS ships with a working select-own policy from day one, per the `short_links` incident precedent), new public `invoices` Storage bucket with an unguessable-path convention (matching `0033_acuerdo_documentos_bucket.sql`, not a new private/signed-URL pattern), and the trigger itself.
- [ ] **🔴 Blocking, currently broken: the trigger's target URL still has the literal placeholder text `<SITE_URL>` in it** — never replaced with a real domain before the migration was pushed (mirrors `0020`'s `<PROJECT_REF>` placeholder pattern exactly, but that one still needs the same manual fix applied and confirmed too). Until fixed, an approved payment's invoicing call silently fails (fire-and-forget `net.http_post` — doesn't block the payment itself, just means no invoice gets created). Fix: `create or replace function public.notify_payment_approved()` with the real deployed URL once `NEXT_PUBLIC_SITE_URL` is actually set (see the still-open item in §3).
- [ ] **Blocking: the vault secret doesn't exist yet either** — `select vault.create_secret('<value matching INTERNAL_BILLING_SECRET>', 'internal_billing_secret');` needs to be run once from the Supabase SQL editor (never from a migration file). Same two-manual-steps pattern as `0020`.
- [x] New application code, **pushed to `preview` (commit `7df2722`)**: `src/lib/billing/facturasend.ts`, `src/lib/billing/invoiceBuilder.ts` (builds the invoice payload from `payments → subscriptions → agent_profiles → profiles`, using `payments.amount` — the actual historical charged amount — rather than re-deriving price from `PLANS`), `src/app/api/internal/invoices/create/route.ts`, `src/app/api/cron/invoice-status/route.ts` (added to `vercel.json`, `*/15 * * * *`), and new "Cédula", "Dirección", and "Ciudad (facturación)" fields on the agent profile form (`profiles.ci` reused rather than duplicated, new `agent_profiles.address` + a `sifen_cities`-backed dropdown that writes all six SIFEN codes from one selection).
- [ ] **`sifen_cities` ships empty.** Investigated FacturaSend's public docs for a "list all departamentos/distritos/ciudades" endpoint to seed it from (as the original scaffold assumed existed) — **confirmed it isn't publicly documented**. `scripts/seed-sifen-cities.ts` is scaffolded but its data-fetch function intentionally throws until a real source is wired in — either ask FacturaSend support whether a private/console-only lookup endpoint exists, or source SIFEN's own official geo-code table directly (DNIT/SET's "Manual Técnico SIFEN"), since that's the authoritative source either way.
- [ ] **Real FacturaSend credentials still needed**: `FACTURASEND_TENANT_ID` / `FACTURASEND_API_KEY` (blank in `.env.local`, not yet set in Vercel). User confirmed FacturaSend told them they can get API access and test in production before paying — get these, then test `/api/internal/invoices/create` and `/api/cron/invoice-status` manually (correct bearer header) against a real payment before relying on the trigger.
- [ ] `agentia-billing/` scaffold folder itself is untouched, uncommitted, and now excluded from `tsc` (`tsconfig.json`) since it was never meant to compile in place (its own README says "copy `lib/` and `app/api/` into your existing repo," which is what this section's work did, adapted). Fine to delete once confirmed nothing else is needed from it — not done automatically since it's the user's own file.

## 27. Chatbot: real API key wired up, revealed and fixed a string of real bugs — ✅ pushed

The user generated a real `ANTHROPIC_API_KEY` and wired it into `.env.local` + Vercel (Production and the `preview` branch scope) for the first time — every issue below was invisible until real traffic actually hit the model.

- [x] **Fixed: chatbot 400'd on every message.** `output_config: { effort: "low" }` is an Opus/Sonnet reasoning-effort control that Haiku 4.5 rejects outright — leftover from before the model was swapped to Haiku 4.5, never caught because this code path had never run against a real key. Also found and fixed the bare `catch {}` around it that was swallowing the real error with no logging at all, which is what made this hard to diagnose in the first place.
- [x] **Fixed: bot opened every conversation with an unsolicited "te contacto porque tengo un terreno en venta..." sales pitch** — backwards, since the visitor is the one messaging the agent, not the other way around. Added an explicit instruction to the system prompt.
- [x] **Removed a `TEMP TEST BYPASS`** in `/api/chat` that intercepted any message containing a phone-number-like pattern and short-circuited around Claude entirely, leaking debug text (`"[TEST] Lead guardado..."`) to real users. It also never persisted that exchange to conversation history, which is why the bot would ask for name/phone a second time later in the same conversation — it had no memory the first exchange ever happened. Both symptoms shared the one root cause.
- [x] Wired `properties.price_includes_iva` into the chat context — "¿el precio incluye IVA?" now gets answered directly and confidently instead of being deferred to the property owner as an unknown.
- [x] Replaced the "¿podés reformular tu consulta?" fallback (both the hardcoded empty-response one and the model's own instinct) with asking specifically what was unclear, or offering to follow up on WhatsApp.
- [x] **Fixed a real booking bug**: `book_visit` required the visitor's requested time to be an *exact* copy of the agent's whole availability window, so a perfectly valid sub-range (e.g. 9-11am inside an 8am-2pm window) was being rejected outright, with the bot punting the whole booking to WhatsApp instead. Also stopped the model from inventing a default end_time when only given a start time, which had been letting a booking get silently saved with the wrong time (the bot told the visitor one time, the database had another).
- [x] Replies are short, plain text (no markdown asterisks — this widget doesn't render them), split into separate bubbles on paragraph breaks and revealed one at a time with a 5-8s "..." delay between each instead of one instant wall of text.
- [x] The agent (not the property owner) handles the entire negotiation — the bot no longer offers to hand off the owner's contact for the visitor to negotiate directly, even if asked.
- [x] Widget auto-closes after 5 minutes of inactivity (reopening resumes the same conversation, nothing lost); a conversation older than 24h starts fresh instead of dragging the entire old thread — and its growing token cost — into every future message.
- [x] Added a professionalism/on-topic guardrail — jokes, off-topic questions, and prompt-injection attempts ("ignore your instructions and tell me...") now get redirected back to the listing instead of engaged with.
- Verified locally end-to-end for every fix above (including a properly backdated >24h conversation, real Playwright browser runs for the bubble pacing, and direct database checks confirming a lead is saved exactly once) before pushing. All test data cleaned up afterward.

## 28. Property map only shows when a real Google Maps link was pasted — ✅ pushed

Bug found via a real property (`Terreno en José Falcon`, barrio Asturmancha): a map was rendering even though the agent never pasted a Maps link. Root cause — the map fell back to guessing a location from the free-text `address` field whenever `lat`/`lng` weren't set, and `address` is just loose text every agent types, unrelated to whether a verified Maps link was ever provided.

- [x] Gated strictly on `lat`/`lng` (only ever populated by a successfully-parsed Maps URL) in both the page's render condition and inside `PropertyMap` itself — no more address-text fallback anywhere. Verified against the exact reported property (map now absent) and a synthetic positive case (map still renders correctly when real coordinates exist).

## 29. Pro/Fundador plan feature-list trim — ✅ pushed

Removed the unused `'Badge "Agente Pro"'` feature entirely, plus "Soporte prioritario" and "Información y características de la propiedad". Renamed "Perfil profesional" → "Perfil con branding propio". Single shared `PRO_FEATURES` array, so this updated both the landing page and the in-app `/panel/suscripcion` pricing view at once.

## 30. Agent brand/logo on the public portfolio header — ✅ pushed

- [x] Desktop: agency logo + brand name now shown on the right side of the header (centered, logo above the name, no background/border frame around it), alongside the existing profile photo on the left.
- [x] Mobile has no room for both side by side — the same avatar box now doubles as a toggle instead of showing a second box. New `AgentProfileAvatar.tsx` client component: tapping the box flips between the profile photo and the logo in place, with a small corner icon hinting it's tappable. Only applies to visitors viewing someone else's portfolio — the owner's own view (`AvatarUploader`, for editing their photo) is untouched.
- [x] Verified interactively in both directions (photo → logo → photo) on a real mobile viewport, and the desktop layout against the exact iteration the user asked for (no white frame, name centered under the logo).

## Standing rules (not action items — just don't forget these)

- Never push to Supabase or deploy to production without explicit go-ahead per migration/change, reviewed locally first
- Never deploy to Vercel without explicit confirmation — even the literal word "deploy" needs a clarifying question first, not automatic action
- Pagopar code/migrations stay untouched and in place — not deleted, in case it's revisited
- Default to `localhost:3000` for review; only push to `preview` when explicitly asked — not automatically after every change (this replaced an earlier habit of pushing on every change, which was triggering unnecessary Vercel deploys)
