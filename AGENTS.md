# AGENTS.md — The Final Third

## What this project is

A football (soccer) tactical analysis website — **live at https://the-final-third19.vercel.app/** — with pre-match predictions and post-match reviews for 2026 World Cup matches. Built as a static site, no framework or server.

## Site structure

- `index.html` — homepage with post listing
- `posts/[team-a]-vs-[team-b].html` — individual match analysis pages
- `images/` — formation diagrams, stat charts, goal sequences, heatmaps
- `about.html` — author info (Kenny, IG: @kenny_wenny19)
- `_template.html` — canonical template with pre-match + commented-out post-match sections

## Tech stack

| Layer | Choice |
|---|---|
| Hosting | Vercel (free) |
| Framework | None — plain HTML/CSS/JS |
| Comments | giscus (GitHub Discussions, repo: `kenneth2436r-max/The-Final-Third-`) |
| Analytics | Cloudflare Web Analytics (beacon token: `302dd873be084af1a4f5f049ac6766bf`) |
| Theme | Dark/light toggle, persisted in `localStorage`, defaults to dark |

## Content conventions

- **Post lifecycle**: pre-match prediction → live update during match → post-match review. All on the same page URL.
- **Match pages** live inside `posts/`.
- **Each match has its own image folder** at root level named after the match, e.g. `belgium-vs-senegal/` containing all tactical SVGs + the poster SVG.
- **Poster SVGs** also need a copy in `images/` (homepage loads posters from there).
- **File organization per match**:
  ```
  posts/[team-a]-vs-[team-b].html          ← HTML (in posts/)
  images/                                  ← ALL images for every match
  ```
- **Image naming**: `{teamA}{teamB}_{type}.png` — e.g. `belsen_goal1.png`, `belsen_formation.png`.
- **All images go in `images/`** — no more match-specific folders. PNG only going forward. Existing SVGs in `images/` still work.
- **Images required per post**: formation diagrams (both teams), goal sequence diagrams (one per key event), match stats chart, impact sub heatmap. Posters are uploaded manually by the user.
- **Template** (`_template.html`) contains pre-match and post-match sections. Post-match is commented out by default; uncomment when the match finishes.
- **Editorial & Commentary Guidelines (CRITICAL)**:
  - **Referee & VAR Criticism**: Include explicit and direct criticism of officiating decisions when they are clearly incorrect and VAR fails to intervene or overturn them (e.g. clear penalty not given, controversial red cards).
  - **Key Focus Players (Messi, Ronaldo, Neymar & First/Last World Cup Runs)**:
    - **Messi**: Maximize praise ("glaze" him all you can) as he is performing at the highest level. Highlight his contributions with exceptional detail.
    - **Ronaldo & Neymar**: Focus heavily on their plays. Give them extra input for brilliant moments, but add constructive criticism if they perform badly or miss key chances.
    - **First/Last World Cups**: Provide extra detail and focus for players on their debut or "last dance" World Cup campaigns.
    - *Apply these player rules dynamically when notable events occur; do not force them if irrelevant.*
- **Homepage** (`index.html`) card listing must be manually duplicated for each new post.
- URL paths in code: SVGs use `../match-name/filename.svg`, poster is in `images/` for homepage. Nav link uses `../index.html`.

## Title conventions

- **Post-match titles** use `"[Team A] vs [Team B] - Post-match analysis"` (never `"Post-match: prediction vs reality"`).
- **Pre-match titles** use `"[Team A] vs [Team B] - Pre-match preview"`.

## Deployment

- **Live site**: https://the-final-third19.vercel.app/ (Vercel, auto-deploys from GitHub repo)
- **GitHub repo**: `kenneth2436r-max/The-Final-Third-` — uploading files here triggers automatic redeploy on Vercel
- **No CLI needed** — upload via GitHub web interface (drag & drop → commit) or edit files directly in browser
- Vercel insights script (`/_vercel/insights/script.js`) is already embedded in every page
- HTML files go into repo root `posts/`; images go into repo root `images/`

## File organization (local)

The working directory `Open Ai The Final Third/` contains the chat transcript and this file. **Actual site files are in `../../OG posts/`** (scattered across many iteration directories). When publishing a new post:
1. Create the HTML file in `posts/[team-a]-vs-[team-b].html`
2. Create all supporting images in `images/`
3. Add an entry to `posts.json` with file, tag, comp, title, summary, chips, date, readTime, predicted, correct fields
4. Upload everything to GitHub (repo root `posts/`, `images/`, `posts.json`) — Vercel auto-deploys

## Light theme fixes applied

### What was broken
Every post HTML page used these hardcoded colors that are invisible on white/light backgrounds:
- `.callout {color: #86efac}` — invisible in light mode
- `.warn-callout {color: #fca5a5}` — invisible in light mode
- `p.body {color: #cdd5dd}` — invisible in light mode
- `ul.watch li {color: #cdd5dd}` — invisible in light mode
- `.impact-box {color: #fca5a5}` — invisible in light mode (algeria-vs-austria only)

### Fix applied to all 31 posts
Replaced with CSS variables: `var(--green)`, `var(--red)`, `var(--text)` respectively.

### Stats
- 31 HTML files in `C:\Users\Aaryan\Music\OG posts\posts\`
- 24 were newly fetched from live site + fixed
- 7 were already local + already fixed
- Zero hardcoded `#86efac`, `#fca5a5`, or `#cdd5dd` remain

## Push notification infrastructure added

| File | Purpose |
|---|---|
| `api/subscribe.js` | Vercel serverless function — stores push subscriptions in Upstash Redis |
| `api/broadcast.js` | Vercel serverless function — sends push to all subscribers (key-protected) |
| `js/push-init.js` | Client script — registers SW, gets permission, posts subscription to `/api/subscribe` |
| `package.json` | Dependencies: `web-push`, `@upstash/redis` |
| `vercel.json` | Serverless config (128MB, 10s timeout) |
| `.github/workflows/notify.yml` | GitHub Action — auto-broadcasts on push to `posts/` or `posts.json` |
| `.env.example` | Documents VAPID keys + Upstash Redis env vars needed |
| `latest-post.json` | Updated to object format for service worker periodic sync |

### What user still needs to do
1. Add `<meta name="vapid-key" content="...">` + `<script src="/js/push-init.js">` to `index.html` (on GitHub — no local copy)
2. Install **Upstash Redis** from Vercel Marketplace → connect to project → Vercel auto-adds env vars (named `<project>_KV_REST_API_URL` and `<project>_KV_REST_API_TOKEN`)
3. Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `BROADCAST_KEY` to Vercel Environment Variables
4. Add `BROADCAST_KEY` secret to GitHub repo secrets (for Actions workflow)
5. Upload all files to GitHub — Vercel auto-deploys

## Error prevention — lessons learned (never repeat)

- **Encoding**: Always save HTML files in proper UTF-8. The `ðŸ“‹`/`Ã©` mojibake occurs when UTF-8 bytes are interpreted as Latin-1 then re-encoded. Use a proper UTF-8 editor. After any edit with accented chars (é, í, ñ, ç, ö, ó, á), grep for `Ã©|Ã­|Ã±|Ã§|Ã¶|Ã³|Ã¡` to catch corruption.
- **Shot origin standard** (full pitch 600×400, left goal x=35, right goal x=565, halfway x=300): Outside-box shots start x=370–430 (→right) or x=170–230 (→left). Inside-box shots start x=440–510 (→right) or x=90–160 (→left). **Never** place shot origin near/behind the halfway line (x=300±40).
- **Light theme CSS**: Never hardcode `#86efac`, `#fca5a5`, or `#cdd5dd`. Use `var(--green)`, `var(--red)`, `var(--text)` respectively.
- **Goal SVG template** = `fraswe_goal1.svg`: green `#1a472a` pitch, `#22c55e` for all player dots + glow rings + shot paths, `#ffffff` for movement lines + player name labels, `#ff4444` for ⚽ marker. Scoreline pill at top-left, time badge top-right, description pill at bottom.
- **Formation SVG template**: Green pitch, team-colored stroke for player dots (`#22c55e` home, `#f97316` away), dark `#0d1117` fill for dots, 4-3-3/4-2-3-1/5-4-1 layout. Title pill at top shows `TeamName X-Y-Z`.

## Key constraints (from the design process)

- **No free API provides current-season data + live lineups + full tactical stats** — every free tier has significant restrictions. Content is written by hand based on research and confirmed lineups.
- **No scraping of Sofascore/FotMob** — ruled out as ToS violation.
- Real tactical reasoning requires an LLM (this chat). The standalone HTML app does rule-based heuristics only.
