-- AI photo enhancement feature: prompt templates, per-attempt usage/cost
-- logging (metadata only — no image bytes or URLs ever touch this schema,
-- per the feature's "zero image persistence" design), and a monthly credit
-- balance per agent. Purely additive.

-- One row per enhancement type. Only 'standard' is seeded at launch; more
-- types can be added later without a schema change. RLS enabled with ZERO
-- policies — nothing here is ever read client-side, only looked up
-- server-side by the API route, same deny-all-by-default pattern just
-- applied to invoice_counters (0053_invoice_counters_rls.sql).
create table public.enhancement_prompt_templates (
  enhancement_type text primary key,
  prompt_template text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.enhancement_prompt_templates enable row level security;

-- One row per generation attempt — metadata only, never image data or URLs.
create table public.enhancement_jobs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles(id) on delete cascade,
  enhancement_type text not null references public.enhancement_prompt_templates(enhancement_type),
  status text not null check (status in ('completed', 'failed')),
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 5),
  credit_charged boolean not null default true,
  created_at timestamptz not null default now()
);

create index enhancement_jobs_agent_id_idx on public.enhancement_jobs (agent_id, created_at);

alter table public.enhancement_jobs enable row level security;

create policy "enhancement_jobs_select_own" on public.enhancement_jobs
  for select using (agent_id = auth.uid());

-- Per-agent monthly credit balance. Rows are created lazily (see
-- try_charge_ai_credit below) rather than backfilled or created at signup,
-- so this works for every existing agent with zero migration-time writes.
create table public.agent_ai_credits (
  agent_id uuid primary key references public.agent_profiles(id) on delete cascade,
  plan_monthly_allowance int not null default 100,
  credits_remaining int not null default 100,
  cycle_reset_at date not null default (current_date + interval '1 month'),
  updated_at timestamptz not null default now()
);

alter table public.agent_ai_credits enable row level security;

create policy "agent_ai_credits_select_own" on public.agent_ai_credits
  for select using (agent_id = auth.uid());

create trigger set_updated_at before update on public.agent_ai_credits
  for each row execute function public.set_updated_at();

-- Atomically ensures a credit row exists, then decrements it — avoids a
-- race if an agent double-clicks "Generar", and means no other code path
-- (signup, backfill) ever needs to pre-create this row.
create or replace function public.try_charge_ai_credit(p_agent_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  insert into public.agent_ai_credits (agent_id)
  values (p_agent_id)
  on conflict (agent_id) do nothing;

  update public.agent_ai_credits
     set credits_remaining = credits_remaining - 1,
         updated_at = now()
   where agent_id = p_agent_id
     and credits_remaining > 0
  returning credits_remaining into v_remaining;

  return v_remaining is not null;
end;
$$;

create or replace function public.refund_ai_credit(p_agent_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.agent_ai_credits
     set credits_remaining = credits_remaining + 1,
         updated_at = now()
   where agent_id = p_agent_id;
$$;

-- Locked prompt for the 'standard' enhancement type — seeded exactly as
-- validated for this feature, not a draft to be paraphrased at insert time.
insert into public.enhancement_prompt_templates (enhancement_type, prompt_template, active)
values (
  'standard',
  $$Enhance this real estate photo to professional HDR quality. Do not add, remove, or alter any objects, furniture, architecture, or scene content. Only adjust exposure, dynamic range, color, and micro-contrast to simulate a natural multi-exposure HDR blend, as if the image were captured with bracketed exposures and merged/tone-mapped by a professional real estate photographer.

Dynamic range / exposure blending:
- Recover and reveal detail in blown-out highlights, especially window areas — bring back visible sky, trees, or exterior detail through the glass without making windows look gray or flat.
- Lift shadow regions (under cabinets, corners, ceiling recesses, furniture undersides) so no area is pure black; target shadow detail retention similar to a 3–5 bracket HDR merge (-2EV, -1EV, 0EV, +1EV, +2EV blended).
- Keep a natural exposure gradient — window light should still read as brighter than interior, just not clipped.
- Avoid the "halo" or "glow" artifact common in bad HDR (no bright rings around window frames or ceiling edges).

White balance / color:
- Neutral-to-slightly-warm white balance (~4500–5200K) for interiors lit by ambient/tungsten light; correct any green or orange color cast from mixed lighting (fluorescent + daylight + tungsten).
- Preserve true material color — wood floors should read as warm honey/amber tones, countertops neutral gray/white/cream, walls true to their actual paint color.
- If exterior daylight is visible through windows, balance it slightly cooler/bluer than the interior so the two zones feel realistic, not color-matched into a flat single tone.

Contrast / tone mapping:
- Apply a gentle S-curve for global contrast, but keep local tone mapping soft — avoid the "flat gray HDR" look where midtones get crushed together.
- Add micro-contrast/clarity to textured surfaces (wood grain, stone countertops, upholstery, rugs, tile) to enhance realism and perceived sharpness.
- Keep skin tones, walls, and ceilings smooth — do not add texture/noise/clarity to flat painted surfaces.

Sharpening / noise:
- Apply edge-aware sharpening (unsharp mask style) at moderate strength — enhance architectural lines (cabinet edges, window frames, floor seams) without introducing halos.
- Reduce noise/grain from the original low-light capture using detail-preserving denoising (not blur-based) — noise should be removed from flat areas (walls, ceilings) while texture stays intact on detailed surfaces.

Perspective / lens correction (if visibly distorted):
- Correct barrel/fisheye distortion from wide-angle lenses so vertical lines (door frames, cabinets, windows) are straight and parallel.
- Correct converging verticals (keystoning) so walls don't lean inward/outward.

Lighting realism:
- Simulate a soft, even ambient fill as if additional bounce flash or continuous LED panels were used off-camera, without creating visible light sources, flash reflections, or hotspots.
- Ceiling lights, pendants, and windows should each retain their own realistic light falloff — don't make the whole room uniformly bright.

Scenario-specific settings:

Daytime interior (window-lit):
- Priority: window pull. Recover full exterior view (trees, sky, yard) while keeping interior exposure natural — this is the signature "bright window, bright room" HDR real estate look.
- Slightly cooler color temp outside the glass vs. inside.
- Avoid overexposing walls near windows; keep a soft falloff gradient from window toward room interior.

Daytime exterior (dusk/twilight):
- Balance a deep saturated blue-to-orange sky gradient with warm, evenly-lit building lights (windows, sconces, path lights all glowing but not blown out).
- Shadows in landscaping (bushes, grass) should retain visible detail and slight color, not go flat black.
- Increase color saturation moderately in the sky (blues/pinks/oranges) — this is the "magic hour" HDR technique, typically shot 15–30 min after sunset with a tripod and bracketed exposures for sky vs. building light.

Daytime exterior (full sun):
- Reduce harsh shadow contrast on the building/landscaping without flattening the whole image.
- Keep sky detail (clouds, gradient) instead of blown-out white.
- Boost saturation slightly on grass/landscaping and correct any yellow/warm cast from midday sun.

Nighttime interior (lit only by room lighting):
- Preserve individual light sources (lamps, pendants, recessed lights) as warm glowing points without blooming into overexposed blobs.
- Lift ambient shadow areas enough to see furniture/architecture clearly, but keep contrast between "lit" and "unlit" zones so it still reads as nighttime, not daytime with lights on.
- Correct heavy orange/yellow tungsten cast — target a warm-but-clean 3200–4000K, not a muddy orange wash.

Nighttime exterior (twilight/blue hour with interior lights on):
- Sky should read a deep saturated blue (not black, not gray), building/window lights should glow warmly and be clearly visible through glass, and exterior architectural or landscape lighting should be balanced against the sky brightness.
- Increase contrast between the cool sky and warm light sources for that classic "twilight real estate hero shot" — this normally requires 2 blended exposures: one for the sky (exposed for the dimming daylight, ~15–20 min post-sunset) and one for the interior/exterior lights (longer exposure, tripod-mounted).

Preserve all original content, geometry, and object placement exactly as-is. Do not generate, remove, or replace any elements. Only apply exposure recovery, white balance correction, tone mapping, and texture-preserving sharpening/denoising to elevate this photo to a professional-grade HDR real estate image. Remove logos and watermarks if any.$$,
  true
);
