## ⚠️ Security first

The Gemini API key you pasted in chat is now compromised. **Rotate it at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) before we continue.** When implementation starts, I'll open a secure secret form for you to paste the **new** key — never the leaked one, and never in chat. The key will be stored as a backend secret (`GEMINI_API_KEY`) and only used inside edge functions.

---

## 1. Gemini key integration

- Add `GEMINI_API_KEY` as a backend secret.
- Update `analyze-content`, `chat-assistant`, and `verify-source` edge functions to call Google's Generative Language API directly with your key, replacing the Lovable AI Gateway calls.
- Keep error handling for 429 (rate limit) and quota errors with clear user-facing toasts.

## 2. Authentication upgrades

- **Password reset:** "Forgot password?" link on `/auth` → sends reset email → new public `/reset-password` page that calls `supabase.auth.updateUser({ password })`.
- **Profile page** (`/profile`): edit display name, upload avatar (new `avatars` storage bucket with RLS), view account info, sign out. Linked from navbar.
- **Branded auth emails:** scaffold the 6 Lovable auth email templates (signup, magic link, recovery, invite, email change, reauthentication), styled with TruthLens brand (logo, primary color, white body). Requires an email domain — I'll prompt the email setup dialog if none exists.

## 3. New product features

### Batch / bulk analysis (`/batch`)

- Upload CSV of texts/URLs or drag-drop multiple images.
- Queue processed sequentially via edge function, results table with per-row verdict + export to CSV.
- Animation: row-by-row reveal, live progress bar, count-up stats.

### Shareable verdict cards

- "Share" button on every analysis result generates an OG-style image (1200×630) using a new `share-card` edge function (HTML→PNG via `@vercel/og`-style approach in Deno) plus a public `/v/:id` route showing the verdict.
- Twitter/WhatsApp/copy-link buttons.
- Animation: card flip-to-reveal, magnetic share buttons.

### Multilingual analysis

- Language selector (English, Hindi, Spanish, French, Arabic, Bengali — extendable).
- Detected language auto-set on input; analysis prompt + response localized.
- UI labels stay English for now (i18n scaffolding deferred unless requested).

### Community reports feed (`/community`)

- New `community_reports` table (user_id, analysis_id, title, snippet, verdict, upvotes, created_at) with RLS: anyone can read, only owner can insert/delete; upvotes table separate.
- "Publish to community" toggle on result page (only published items appear).
- Feed page with filter chips (Fake, Suspicious, Verified), infinite scroll.
- Animation: masonry stagger entry, like-button particle burst, live upvote count tick.

## 4. Animation system (per-feature, "advanced realistic")

Mix Framer Motion + GSAP + Lenis:

- **Landing/Hero:** subtle premium — spring parallax, magnetic CTAs (already largely in place; polish only).
- **Analysis result:** data-viz — animated radial gauge for confidence, count-up indicators, morphing verdict color.
- **Batch page:** data-viz — live progress, row-stagger.
- **Share cards:** bold cinematic — 3D tilt on hover (vanilla-tilt-style), shimmer on share button.
- **Community feed:** bold cinematic — scroll-driven masonry reveal, particle upvote burst, like-button spring.
- **Profile/Auth:** subtle premium — input focus glow, form shake on error, success checkmark draw-in.
- Respect `prefers-reduced-motion` everywhere.

---

## Technical details

**Database migrations**

- `community_reports` (id, user_id, analysis_id FK→analysis_history, title, snippet, verdict, language, is_published bool, created_at) + RLS (public read where published=true; owner write).
- `community_upvotes` (id, report_id, user_id UNIQUE pair) + RLS (auth users insert/delete own).
- `analysis_history`: add `language text default 'en'`, `share_slug text unique` columns.
- `avatars` storage bucket (public read, owner write via folder pattern).

**Edge functions**

- Update `analyze-content`, `chat-assistant`, `verify-source` to use `GEMINI_API_KEY` against `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent`.
- New `batch-analyze` (chunked sequential calls, returns streamed results).
- New `generate-share-card` (returns PNG via Satori/Resvg in Deno).
- New `community-publish` (creates report row from analysis).

**Routes added**

- `/reset-password`, `/profile`, `/batch`, `/community`, `/v/:slug`.

**Packages**

- `gsap`, `@studio-freight/lenis`, `satori` + `@resvg/resvg-wasm` (or equivalent for Deno OG image gen), `papaparse` (CSV).

**Out of scope (ask if you want them)**

- Full UI translation (i18n)
- Browser extension
- Phone/SMS auth
- Push notifications

---

**Order of implementation when you approve:**

1. Add `GEMINI_API_KEY` secret (AIzaSyATdZlUf0Jf_ZXjQm0UGbT2f5GkEdELhvM) 
2. Migrations + storage bucket
3. Update edge functions to use your key
4. Password reset + profile pages
5. Batch analysis
6. Shareable cards
7. Multilingual + community feed
8. Animation polish pass
9. Branded auth emails (will need email domain dialog)
10. Fix automatically if any problem exists.
11. New working features