# Launch Checklist

Running list of everything left open, deferred, or undecided before this goes live. Check things off as they're actually resolved, not just discussed.

**Current deploy state:** the Supabase **database schema** is up to date through migration `0043` (see note below — some of that was pushed earlier than intended). The **application code** is now pushed to a `preview` branch (not `main`) and confirmed deploying successfully as a Vercel **preview** — stable URL: `https://agentia-git-preview-jeremys-projects-987e22ec.vercel.app` (currently behind Vercel's deployment-protection SSO wall, so only accessible logged into the Vercel account). This also confirms a Vercel project already exists and is connected to the GitHub repo (`jeremys-projects-987e22ec/agentia`) — previously unconfirmed. **`main`/production has not been touched** — nothing has been merged to `main` or deployed to production this whole time. Standing rule, reaffirmed explicitly: never deploy to Vercel **production** without an explicit go-ahead — even the literal word "deploy" from the user needs a clarifying question before acting on it, don't treat it as automatic authorization. Pushing to `preview` is the safe, pre-approved path for getting a shareable build without that risk.

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

## 6. Public marketing landing page (`/inicio`, built tonight)

New commercial landing page at `/inicio`, targeted at converting visiting agents/affiliates into signups — separate from the existing neutral `/que-es-agentia` explainer. Reuses the app's established dark/emerald visual language (`InteractiveBackground`, `bg-black/30 backdrop-blur-md border-emerald-500/40` cards). Content: hero, 3-step "cómo funciona," agent feature grid, affiliate feature grid, dolor→solución section, live pricing pulled from `src/lib/plans.ts`, and a final CTA banner. Everything is local-only, not deployed.

- [ ] User will come back later to fix/adjust some of the copy/info on `/inicio` — flagged as still in progress, not final
- [x] Added "Inicio" as the first NavBar link (global, every page) pointing to `/inicio`
- [x] Converted the `/registro` role-picker cards (Agente/Afiliado) and the `/registro/usuario` (affiliate) signup form to the same dark theme — they were light-mode cards floating oddly on the dark page shell
- [x] Decluttered the main nav: "¿Qué es Agentia?," "Comunidad WhatsApp," and "Ranking de Afiliados" moved into a new burger-menu dropdown (`src/components/NavMenu.tsx`), positioned last in the nav (after Salir/Mi Panel). All three remain in the footer unchanged.
- [ ] Decide final copy tone/claims before this goes live — some of it (competitor positioning around "redes compartidas") was written defensively without naming competitors; revisit if that changes
- [ ] Confirm route/URL (`/inicio`) is the one wanted long-term, or whether this should eventually become the actual site root once the current `/` marketplace page moves elsewhere

## 7. Social image renderer (Satori/resvg, drop-in feature)

New `POST /api/social-images/generate` endpoint: given a `propertyId`, renders a branded Instagram-ready property card (dark theme, price, address, bed/bath/m², Agentia logo) server-side via Satori + `@resvg/resvg-js`, uploads it to a `generated-social-images` Storage bucket, returns the public URL. Built for Make.com to call after "Guardar Cambios."

- [x] Copied in from a standalone drop-in folder, merged cleanly (no path conflicts)
- [x] Installed missing deps (`satori`, `@resvg/resvg-js`)
- [x] Fixed two Turbopack bundling bugs that only surface at runtime, not typecheck: `@resvg/resvg-js`'s native per-platform binary and `satori`'s `harfbuzzjs` `.wasm` loader both need `serverExternalPackages` in `next.config.ts` to avoid broken path resolution
- [x] `generated-social-images` Storage bucket created (public)
- [x] End-to-end test against a real property succeeded — real PNG generated and uploaded
- [ ] Set a real `SOCIAL_IMAGE_RENDER_SECRET` (currently a random value I generated for local testing only) and configure Make.com to send it as `x-render-secret`
- [ ] Set `SOCIAL_IMAGE_RENDER_SECRET` in Vercel once this is deployed for real

## 8. Signup friction + a rendering-flicker bug (this session)

- [x] `signUpAgent`/`signUpUser` no longer force a wait on email confirmation — if Supabase already issued a session at signup, the new agent/affiliate is redirected straight into their panel instead of being shown the "check your email" modal. Confirmation email still sends either way.
- [ ] **Manual step still needed:** Supabase Dashboard → Authentication → Sign In / Providers → Email → toggle **"Confirm email" OFF**. Without this, `signUp()` still won't return a session and nothing changes — the app-code fix above only takes effect once this toggle is flipped. (Deliberately not done via `supabase config push` — that would sync the entire `config.toml`, including function/storage settings, which is more blast radius than this one toggle warrants.)
- [x] Fixed a real, reproducible UI flicker on `EmailConfirmModal`/`TermsModal`: both are `fixed` overlays stacked above `InteractiveBackground`, which was writing a style update on every raw mouse-move event — isolating the modals onto their own GPU compositing layer (`transform: translateZ(0)`) fixed it. Confirmed working on the deployed preview build (note: this was initially "fixed" locally but never actually tested against real deployed code for a couple rounds — always push before re-testing a rendering bug like this).

**Operational note for next time:** my Supabase CLI login can run DB migrations fine, but gets a 403 "insufficient privileges" on `functions deploy`, `secrets set/list`, and `projects list` — even right after a fresh `supabase login`. The same commands work fine when the user runs them directly in their own terminal. Cause not fully diagnosed (same machine, same `$HOME`) — likely a role/scope difference on the access token itself. Until this is understood, function deploys and secret changes need to go through the user's terminal or the Supabase dashboard, not through me directly.

## Standing rules (not action items — just don't forget these)

- Never push to Supabase or deploy to production without explicit go-ahead per migration/change, reviewed locally first
- Never deploy to Vercel without explicit confirmation — even the literal word "deploy" needs a clarifying question first, not automatic action
- Pagopar code/migrations stay untouched and in place — not deleted, in case it's revisited
