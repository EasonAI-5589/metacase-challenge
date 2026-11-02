# Metacase Challenge: SFF stage film, v3 (CP3-R3)

129.35 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, CRF 15, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music, no captions track. Status: v3, selection and shuttle redone after Eason's review. Not yet approved for the stage: the flash finding below is open.

Chapters: HERO 0.0–8.7 s; 01 METACASE 8.8–27.2 s; 02 RETRIEVAL 27.3–38.5 s; 03 NETWORK 38.7–52.3 s; 04 FIELDS 52.4–67.8 s; 05 ARENA selecting 67.9–82.4 s, shuttle 82.4–96.9 s, arrival on the Challenge page 96.9–102.4 s; 06 PARTICIPATE 102.5–111.3 s; 07 RESULTS 111.4–117.9 s; 08 TEAM 118.0–122.2 s; END CARD 122.4–129.35 s.

Source: `index.html` and `challenge.html` at commit `cefd87bb44155d86528f452ceefb6992bdc9b9fe`, served locally from the worktree at `127.0.0.1:4199`. The timeline is `video-demo/sff-homepage/shots.mjs`, its reading copy is `storyboard.md` beside it, and the end card is `cards/end.html`.

Files (not in git, per the handoff), in `video-demo/sff-homepage/out/final/`: `metacase-sff-stage-1080p60.mp4` (same file as `-v3.mp4`) and `metacase-sff-stage-poster.jpg`, with earlier versions kept as `-v1.mp4`, `-v2.mp4`, `-v2.1.mp4` and `-v2.2-dips.mp4`. Sizes and SHA-256 are in `render-receipt.json`. Review sheets: `out/review/p0-contact.jpg` and `out/review/v3-arena-shuttle-sheet.jpg`.

Boundaries: an edit of the website's pages. Nothing was re-run or re-scored, and there are no new figures. Every readable DOM string traces to the locked commit in `provenance.json`, except the end-card URL, which comes from the handoff, and the arrival badge, which the page composes from its own names. The figures are the page's own and their evidence was not checked here.

## How one thing changes into another

Nothing is ever double-exposed. The master is a concat, with no crossfade anywhere.
- Between chapters the whole frame dims to the page's dark in 0.35 s, holds 7 frames, and the next scene rises in 0.4 s. Text and scene go together.
- Inside a chapter, where the scroll has to jump (chapter 02 at p = .4, chapter 06 past its flashes), only the 3D and its labels dim. The heading and rail stay still.
- The selection runs straight into the shuttle in one continuous take. The portal's warp ends on its dark frame, which is also the first frame of the Challenge page: a joined cut with no dark frames added.

## What the shoot changes at runtime, with no site file edited

- Lenis smooth scrolling is off and a script drives the scroll. Scrollbars and the cursor are hidden.
- Safe area: 96 px left and right, 54 px top and bottom on output. `--mc-gutter` is 64 CSS px (70 in chapter 04, whose device scale differs), and because the page's `.wrap` ignores that variable, `.wrap` and the captions are set too. Rails sit at `bottom: 36px`.
- The site header, section nav, footer and long paragraphs are hidden. The page's own short labels are enlarged for a big screen.
- The hero's lead is cut to an exact substring, "an open benchmark and research arena built around reusable Metacases", with its first letter shown in capitals. The first results caption is cut to "3 fields × 200 tasks · 18 classes". The foundation sentence has a fixed line break, "A foundation for / experience-based AI."
- The figures that contradict each other on the locked page are hidden: 208 / 209 / 187 records, 604 tasks, sixteen categories and the per-domain counts. The film shows only 600 / 200 per field / 18 classes.
- **The tunnels' banners that state record counts are cleared.** `arena-data.js` paints "152 Candidate Records · 5 Economics Classes", "90 Candidate Records · 6 Finance Classes" and "43 Candidate Records · 5 Social Science Classes" into the 3D. A patch on `fillText` clears those three textures, so they are never drawn. Every string painted into a canvas in the recaptured shots is logged in `provenance.json` (`painted_text`).
- The results illustrations are hidden; they rendered too dark to read on a big screen.
- Chapter 04 is captured at 1392×783 (DPR 1.379), which shrinks the whole shot to 0.92 so the stage fits the safe area. `transform: scale` would break the page's own FLIP measurements. Its title stands alone first and fades out, the scroll cuts while nothing is showing, and the stage fades in at its sticky position.
- In chapter 04 the open book's 200 ms fade uses linear easing instead of the page's strong ease-out, which dropped it in 6 frames, the biggest single jump in the film. The page's clock runs at 1x.
- In chapter 05 the provider, model, effort, equip and portal controls are fired by script at set times, as a click would. The path is Anthropic, Google, back to the page's default OpenAI, then GPT-5.6 Sol, XHigh, the wheel through to Codex CLI, Equip. The panel is wider, its secondary lines are hidden, and model names wrap instead of clipping.
- In chapter 05 the page swaps its heading in one frame at each phase; here the heading fades out and in around that frame.
- In chapter 05 the wheel stops at p = .295. The harness is `floor((p - .16) / .22 * 6)` (`arena.js:329`), so p = .31 would have equipped Terminus-2. The panel and wheel fade before the scroll passes .3067, where the panel would offer the next harness.
- In chapter 05 the portal's warp runs at 0.7x, and the navigation it ends with is stopped so the iris can finish on the arena page.
- On the Challenge page, section chrome and the class descriptions are hidden and the type is enlarged. Its dark and glow are placed from the coordinates the warp wrote. **The arrival is replayed:** the page's own arrival runs during warm-up while the guardian's 3D loads, then the same classes, keyframes and timings run again at frame 0 at 0.7x. So the guardian is already standing when the dark clears. On the live page it appears about 0.9 s after landing, plus load time.

Motion avoided on purpose: weapon fire is not shot. Chapter 06 is dark while the scroll skips the docking flash (progress .345–.385) and every muzzle spark (.41–.58). The arena itself has no weapon discharge; its source was searched for it.

Capture: `page.clock` is paused before navigation and stepped once per frame after a fixed warm-up; CSS and WAAPI animations are seeked to the same clock. This is frame stepping, not screen recording, but two runs are not byte-identical. A screenshot occasionally stalls; the shot is then captured again from scratch, and frame counts are checked after every shot.

Known limits, listed in full in `render-receipt.json`:
- Flash, open: see the section below.
- Chapter 06, the hero, results, team and the end card reuse earlier frames, per the v3 review. Chapter 06 was not slowed, so it runs quicker than the chapters around it.
- In the last tunnel the camera all but passes through the robot (p = .857–.895). It is crossed in about 0.4 s as a fly-by, faster than the rest of the shuttle. The robot also fills much of the frame near the end of the first two tunnels; that is the page's own framing.
- The tunnels' other banners fly past and are cut by the frame edges, as they do on the page. One of them reads "FIN-T1-003 · 47 Source Records & 27-Item Rubric Judge", the page's own task detail.
- The tunnels show the arena's 5 / 6 / 5 categories, while the books and the Challenge page show 6 / 6 / 6. No count is readable, but the category names differ. This belongs with the handoff §3 figures.
- Safe area audit: text boxes are checked four times a second, and in chapter 04 on every frame, with the graphics that carry the text measured too. Chapter 03 has 4 samples outside, each a 3D label during a camera move. Chapter 05 has 4 samples of the floating "Codex CLI" tag, 5 px past the right line. The results card and end card reuse frames: the results card's frame sits about 60 px from the left edge, with its text about 165 px in by frame measurement.
- Text under 28 px on output: chapter 05's chips and buttons (27.3 px), the wheel's labels (22.5 px), rail numerals and tab text (23.6–25.5 px), the arrival's task counts (25.5 px).
- Holds of 2 s or more with no pixel change are deliberate reading time: the two later books in chapter 04 (2.4 s, 2.9 s), the arrival (2.2 s), results (4.8 s), team (3.2 s), end card (5.4 s).
- Checked on extracted frames and frame-difference scans, then watched only by Eason on versions before this one. Nobody has yet watched v3 play at full speed on a large screen, and the QR has been decoded from a frame, not scanned from a seat.

## Flash: what was measured

`verify.mjs` reports brightness changes in separate fields, and `render-receipt.json` carries them under `acceptance.flash`.

- `true_strobe_flash`: **6**, seconds 45, 46, 48 (chapter 03's dive into the shelves) and 87, 90, 92 (the tunnels). With "together" meaning 2, 3 or 6 frames the count is 4, 6 or 6. This is a test after WCAG 2.3.1 general flash on a 64×36 grid (`lib/flash.mjs`): the same cells cycling over 3 flashes a second and turning together over more than 25 % of a 640×480 rectangle.
- Slowing the dive by about 1.7× did not clear it. It was 3 seconds at the old speed and is 3 seconds now.
- `page_turn_grid_crossings`: 42 windows over the handoff's strict limit of 3 bright/dark flips per second in a 60×60 px cell, at most 10.07 % of the screen, at 92.2 s during the fly-by. All overlap a scripted move or the page's own timed motion (`unexplained_cell_flip_windows`: 0). `handoff_strict_cell_flip_limit` stays false, because motion explains these windows without making that limit pass.
- `max_luminance_transitions_per_second_any_cell`: 49, at the results counter's digits, a small area.

How far the strobe figure can be trusted: `calibrate-flash.mjs` runs the test on synthetic clips with known answers, and it gets 7 of 8 right. Full-screen flashes at 5 and 10 Hz, a soft 5 Hz sine and a large 5 Hz patch fail as they should; 2 Hz, exactly 3 Hz and a small patch pass. The one miss is high-contrast bars moving at 5 Hz per spot, which it calls a strobe. So it cannot separate a fast-moving high-contrast pattern from a real flash, and the flagged seconds may be that case: extracted frames show the camera sweeping past bright shelves and the robot, with no flash repeating in place. It is an approximation, not a certified PSE test, and saturated red is not tested.

Not resolved by these numbers. A person needs to watch 44–49 s and 85–94 s playing continuously on a large screen.
