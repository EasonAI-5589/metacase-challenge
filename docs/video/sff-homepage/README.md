# Metacase Challenge: SFF stage film, v5 (continuous scroll, portal framing)

134.13 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, CRF 15, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music, no captions track. Status: v5, both items of Eason's 11-02 handoff: the homepage filmed as one continuous scroll (v4: no dark cuts, every stage shown, the page's own UI back), and in the arena the robot sized and placed against the portals (`arena-scene.js`, a site change, live on the page too). Not yet approved for the stage: the flash finding below is open.

Chapters: HERO 0.0–8.4 s; 01 METACASE 8.4–31.0 s; 02 RETRIEVAL 31.0–42.6 s; 03 NETWORK 42.6–55.8 s; 04 FIELDS 55.8–70.8 s; 05 ARENA selecting 70.8–85.3 s, shuttle 85.3–99.8 s, arrival on the Challenge page 99.8–105.3 s; 06 PARTICIPATE 105.4–116.4 s; 07 RESULTS 116.4–123.2 s; 08 TEAM 123.2–127.0 s; END CARD 127.1–134.13 s. 00–05 is one take, as is 06–08.

Source: `index.html` and `challenge.html` at commit `cefd87bb44155d86528f452ceefb6992bdc9b9fe`, served locally from the worktree at `127.0.0.1:4199`. The timeline is `video-demo/sff-homepage/shots.mjs`, its reading copy is `storyboard.md` beside it, and the end card is `cards/end.html`.

Working files (not in git), in `video-demo/sff-homepage/out/final/`: `metacase-sff-stage-1080p60.mp4` (CRF 15, 112,724,237 bytes, SHA-256 `e7bd01be…bca0d067d9`) and `metacase-sff-stage-poster.jpg`. The copy in git is `docs/video/sff-homepage/metacase-sff-stage-1080p60-v5.mp4`, the same master re-encoded at 3.1 Mbps to stay under GitHub's 100 MB file limit (48,317,745 bytes, SHA-256 `bd42e740…16f56716`); v3 and v4 stay beside it for comparison, and the sheets are `p0-contact-v5.jpg` and `v5-arena-shuttle-sheet.jpg`, with earlier versions kept as `-v1.mp4`, `-v2.mp4`, `-v2.1.mp4` and `-v2.2-dips.mp4`. `render-receipt.json` and `provenance.json` beside this file still describe v3: `receipt.mjs` is written around the v3 run's logs and has not been brought up to v4. v4 and v5 sizes, SHA-256 and acceptance figures are in `STATUS.md`; its text provenance passed (545 strings, none forbidden, none without a source). Review sheets: `out/review/p0-contact.jpg` and `out/review/v3-arena-shuttle-sheet.jpg`.

Boundaries: an edit of the website's pages. Nothing was re-run or re-scored, and there are no new figures. Every readable DOM string traces to the locked commit in `provenance.json`, except the end-card URL, which comes from the handoff, and the arrival badge, which the page composes from its own names. The figures are the page's own and their evidence was not checked here.

## How one thing changes into another

The homepage is filmed the way a visitor scrolls it. Nothing is ever double-exposed and there is no crossfade anywhere.
- Hero through the arena (chapters 01–05) is one continuous take in one browser on one clock, and so are chapters 06–08. Each chapter starts at rest exactly where the last one stopped, so a chapter change is the page's own scroll from one chapter into the next. No dark frames, no fades, no jumps of the scroll.
- Inside a chapter every stage is crossed: chapter 01 runs on through the closed book and its signature, chapter 02 through Reuse, chapter 04 scrolls from its title into the book stage, chapter 06 through Execute (its docking flash included) and Contribute, and results and team scroll in.
- The frame dims to the page's dark only where the film leaves the page: from the Challenge page back to chapter 06, and into the end card (0.35 s out, 7 frames, 0.4 s in).
- The selection runs straight into the shuttle. The portal's warp ends on its dark frame, which is also the first frame of the Challenge page: a joined cut with no dark frames added.

## What the shoot changes at runtime, with no site file edited

- Lenis smooth scrolling is off and a script drives the scroll. Scrollbars and the cursor are hidden.
- Safe area: 96 px left and right, 54 px top and bottom on output. `--mc-gutter` is 64 CSS px, and because the page's `.wrap` ignores that variable, `.wrap` and the captions are set too. Rails sit at `bottom: 36px`.
- The site header, section nav, chapter subtitles and body copy stay as the page has them; only the footer is hidden. The page's own short labels are enlarged for a big screen.
- The first results caption is cut to "3 fields × 200 tasks · 18 classes". The foundation sentence has a fixed line break, "A foundation for / experience-based AI."
- The figures that contradict each other on the locked page are hidden: 208 / 209 / 187 records, 604 tasks, sixteen categories and the per-domain counts. The film shows only 600 / 200 per field / 18 classes.
- **The tunnels' banners that state record counts are cleared.** `arena-data.js` paints "152 Candidate Records · 5 Economics Classes", "90 Candidate Records · 6 Finance Classes" and "43 Candidate Records · 5 Social Science Classes" into the 3D. A patch on `fillText` clears those three textures, so they are never drawn. Every string painted into a canvas in the recaptured shots is logged in `provenance.json` (`painted_text`).
- Every shot is captured at 1280×720 (DPR 1.5).
- In chapter 04 the open book's 200 ms fade uses linear easing instead of the page's strong ease-out, which dropped it in 6 frames, the biggest single jump in the film. The page's clock runs at 1x.
- In chapter 05 the provider, model, effort, equip and portal controls are fired by script at set times, as a click would. The path is Anthropic, Google, back to the page's default OpenAI, then GPT-5.6 Sol, XHigh, the wheel through to Codex CLI, Equip. The panel is wider, its secondary lines are hidden, and model names wrap instead of clipping.
- In chapter 05 the page swaps its heading in one frame at each phase; here the heading fades out and in around that frame.
- In chapter 05 the wheel stops at p = .295. The harness is `floor((p - .16) / .22 * 6)` (`arena.js:329`), so p = .31 would have equipped Terminus-2. The panel and wheel fade before the scroll passes .3067, where the panel would offer the next harness.
- In chapter 05 the portal's warp runs at 0.7x, and the navigation it ends with is stopped so the iris can finish on the arena page.
- On the Challenge page, section chrome and the class descriptions are hidden and the type is enlarged. Its dark and glow are placed from the coordinates the warp wrote. **The arrival is replayed:** the page's own arrival runs during warm-up while the guardian's 3D loads, then the same classes, keyframes and timings run again at frame 0 at 0.7x. So the guardian is already standing when the dark clears. On the live page it appears about 0.9 s after landing, plus load time.

Chapter 06 is crossed whole, as the page plays it: the docking flash (progress .345–.385) and the work (.41–.58) pass while the scroll moves from Configure to Execute in 1.8 s. They raised no flash window. The arena itself has no weapon discharge; its source was searched for it.

Capture: `page.clock` is paused before navigation and stepped once per frame after a fixed warm-up; CSS and WAAPI animations are seeked to the same clock. This is frame stepping, not screen recording, but two runs are not byte-identical. A screenshot occasionally stalls; the shot is then captured again from scratch, and frame counts are checked after every shot.

Known limits (v3's are listed in full in `render-receipt.json`):
- Flash, open: see the section below.
- Only the end card reuses earlier frames; the homepage takes and the Challenge-page arrival were captured again for v5.
- With the header and section nav back in frame, the safe-area audit flags them (the header sits above the 54 px top line) and every line of text the scroll carries past an edge. Those counts are the page's own layout, not a framing error. Chapter 04's book stage is taller than the view under the header, so its field rail sits below the bottom edge while a book is open.
- In each track room the robot (scale 1.6, was 2.15) stands on the doorway's glyph ring at the foot of the portal and only lifts to fly between rooms; in the wide views it is 2.0 (was 2.85), and at the closing three-portal view it is already down on the floor at the centre, below the doorways and their buttons. The camera path is unchanged; the last-room fly-by no longer brushes the robot.
- The tunnels' other banners fly past and are cut by the frame edges, as they do on the page. One of them reads "FIN-T1-003 · 47 Source Records & 27-Item Rubric Judge", the page's own task detail.
- The tunnels show the arena's 5 / 6 / 5 categories, while the books and the Challenge page show 6 / 6 / 6. No count is readable, but the category names differ. This belongs with the handoff §3 figures.
- Safe area audit: text boxes are checked four times a second, and in chapter 04 on every frame, with the graphics that carry the text measured too. Chapter 03 has 4 samples outside, each a 3D label during a camera move. Chapter 05 has 4 samples of the floating "Codex CLI" tag, 5 px past the right line. The results card and end card reuse frames: the results card's frame sits about 60 px from the left edge, with its text about 165 px in by frame measurement.
- Text under 28 px on output: chapter 05's chips and buttons (27.3 px), the wheel's labels (22.5 px), rail numerals and tab text (23.6–25.5 px), the arrival's task counts (25.5 px).
- Holds of 2 s or more with no pixel change are deliberate reading time: the first open book in chapter 04 (2.1 s), the results figures (2.3 s), team (3.1 s), end card (3.7 s).
- Checked on extracted frames and frame-difference scans, then watched only by Eason on versions before this one. Nobody has yet watched v5 play at full speed on a large screen, and the QR has been decoded from a frame, not scanned from a seat.

## Flash: what was measured

`verify.mjs` reports brightness changes in separate fields, and `render-receipt.json` carries them under `acceptance.flash`.

- `true_strobe_flash`: **5**, seconds 48, 49 (chapter 03's dive into the shelves), 69 (the open book scrolling away into the arena) and 90, 93 (the tunnels). With "together" meaning 2, 3 or 6 frames the count is 0, 5 or 5. v3 had 6, v4 6. This is a test after WCAG 2.3.1 general flash on a 64×36 grid (`lib/flash.mjs`): the same cells cycling over 3 flashes a second and turning together over more than 25 % of a 640×480 rectangle.
- Second 69 is new, because v3 cut to dark there. Slowing that scroll from 1.8 s to 3 s did not clear it: it is the book's lines of text, bright on dark, sweeping up through the grid, the moving-pattern case the test is known to miss (below).
- `page_turn_grid_crossings`: 21 windows over the handoff's strict limit of 3 bright/dark flips per second in a 60×60 px cell (v4: 41), at most 2.08 % of the screen, at 65.4 s as a book turns. All overlap a scripted move or the page's own timed motion (`unexplained_cell_flip_windows`: 0). `handoff_strict_cell_flip_limit` stays false, because motion explains these windows without making that limit pass.
- `max_luminance_transitions_per_second_any_cell`: 23, at 49.6 s in the dive, a small area.

How far the strobe figure can be trusted: `calibrate-flash.mjs` runs the test on synthetic clips with known answers, and it gets 7 of 8 right. Full-screen flashes at 5 and 10 Hz, a soft 5 Hz sine and a large 5 Hz patch fail as they should; 2 Hz, exactly 3 Hz and a small patch pass. The one miss is high-contrast bars moving at 5 Hz per spot, which it calls a strobe. So it cannot separate a fast-moving high-contrast pattern from a real flash, and the flagged seconds may be that case: extracted frames show the camera sweeping past bright shelves and the robot, with no flash repeating in place. It is an approximation, not a certified PSE test, and saturated red is not tested.

Not resolved by these numbers. A person needs to watch 47–50 s, 68–70 s and 89–94 s playing continuously on a large screen.
