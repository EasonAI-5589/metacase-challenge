# Metacase Challenge: SFF stage film, v2.1 (CP3-R2)

89.7 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, CRF 15, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music, no captions track. Status: v2.1, the one-shot fix after the v2 review. Not yet approved for the stage: the flash finding below is open.

Chapters: HERO 0.0–9.0 s; 01 METACASE 8.7–20.2 s; 02 RETRIEVAL 19.9–28.6 s; 03 NETWORK 28.3–38.3 s; 04 FIELDS 38.0–52.1 s; 05 ARENA 51.8–64.1 s; 06 PARTICIPATE 63.8–72.3 s; 07 RESULTS 72.0–78.8 s; 08 TEAM 78.5–83.0 s; END CARD 82.7–89.7 s. Chapters overlap by the 0.3 s crossfade.

Source: `index.html` at commit `cefd87bb44155d86528f452ceefb6992bdc9b9fe`, served locally from the worktree at `127.0.0.1:4199`. The timeline is `video-demo/sff-homepage/shots.mjs`, its reading copy is `storyboard.md` beside it, and the end card is `cards/end.html`.

Files (not in git, per the handoff), in `video-demo/sff-homepage/out/final/`: `metacase-sff-stage-1080p60.mp4` (v2.1) and `metacase-sff-stage-poster.jpg`, with the earlier versions kept as `metacase-sff-stage-1080p60-v1.mp4`, `metacase-sff-stage-1080p60-v2.mp4` and `metacase-sff-stage-poster-v1.jpg`. Sizes and SHA-256 are in `render-receipt.json`. Only chapter 04 was captured again for v2.1; every other shot reuses its existing intermediate, unchanged by hash. Results and the end card still carry their v1 frames.

Boundaries: an edit of the website's pages. Nothing was re-run or re-scored, and there are no new figures. Every readable DOM string traces to the locked commit in `provenance.json`, except the end-card URL, which comes from the handoff. The figures are the page's own and their evidence was not checked here.

What the shoot changes at runtime, with no site file edited:
- Lenis smooth scrolling is off and a script drives the scroll. Scrollbars and the cursor are hidden.
- Safe area: 96 px left and right, 54 px top and bottom on output. `--mc-gutter` is 64 CSS px (70 in chapter 04, whose device scale differs), and because the page's `.wrap` ignores that variable, `.wrap` and the captions are set too. Rails sit at `bottom: 36px`.
- The site header, section nav, footer and long paragraphs are hidden. The page's own short labels are enlarged for a big screen.
- The hero's lead is cut to an exact substring, "an open benchmark and research arena built around reusable Metacases", with its first letter shown in capitals. The first results caption is cut to "3 fields × 200 tasks · 18 classes". The foundation sentence has a fixed line break, "A foundation for / experience-based AI."
- The figures that contradict each other on the locked page are hidden: 208 / 209 / 187 records, 604 tasks, sixteen categories and the per-domain counts. The film shows only 600 / 200 per field / 18 classes.
- The results illustrations are hidden; they rendered too dark to read on a big screen.
- Text layers leave before a crossfade and arrive after it, so two chapters' words never stack; only the 3D dissolves. Inside chapter 02 only the caption band, rail and labels do this, so the heading stays.
- Chapter 04 is captured at 1392×783 (DPR 1.379), which shrinks the whole shot to 0.92 so the stage fits the safe area. `transform: scale` would break the page's own FLIP measurements. Its title stands alone first and fades out, the scroll cuts while nothing is showing, and the stage fades in at its sticky position, so nothing slides in across the bottom edge.
- In chapter 04 the page's clock runs at 0.55x during a book change and 0.3x during its fade-out.
- In chapter 05 the provider, model, effort and equip controls are fired by script at set times, as a click would. The path is one provider switch (Anthropic) and back to the page's default OpenAI, then GPT-5.6 Sol, XHigh and Codex CLI, followed by 2 s of stable state. The panel is wider, its secondary lines are hidden, and model names wrap instead of clipping.

Motion avoided on purpose: weapon fire is not shot. Chapter 06 cuts past the docking flash (progress .345–.385) and every muzzle spark (.41–.58). Chapter 02 is split at progress .4 so that a camera jump on the page itself (`metacase-archive.js:207`) falls inside a crossfade.

Capture: `page.clock` is paused before navigation and stepped once per frame after a fixed warm-up; CSS and WAAPI animations are seeked to the same clock. This is frame stepping, not screen recording, but two runs are not byte-identical (measured before v2: `06b-choose` 26 of 114 frames matched, 38.7–66.1 dB on the others sampled; `04-network` 0 of 300, 59.6–66.8 dB). A screenshot occasionally stalls; the shot is then captured again from scratch, and frame counts are checked after every shot.

Known limits, listed in full in `render-receipt.json`:
- Flash, open: see the section below.
- Safe area audit: text boxes are checked four times a second, and in chapter 04 on every one of its 846 frames, with the graphics that carry the text measured too. Chapter 04 has 0 outside. Chapter 03 has 3 samples outside, each a 3D label during a camera move, none during a hold. Results and the end card reuse v1 frames and are not in the audit: the results card's frame sits about 60 px from the left edge, with its text about 165 px in by frame measurement.
- Text under 28 px on output: chapter 05's chips and buttons (27.3 px), the wheel's labels (22.5 px), and rail numerals and tab text (23.6–25.5 px).
- Holds of 2 s or more with no pixel change are deliberate reading time: chapter 04's title 2.1 s, results 5.1 s, team 3.35 s, end card 5.4 s.
- The stage names in chapter 01 stay about 2 s each, under the handoff's reading formula of about 3.4 s.
- Checked on extracted frames and frame-difference scans. No person has yet watched it play at full speed on a large screen, and the QR has been decoded from a frame, not scanned from a seat.
- Text painted into the WebGL scenes is not in the ledger; the scene sources were searched for the contradictory figures instead.

## Flash: what was measured

`verify.mjs` reports brightness changes in separate fields, and `render-receipt.json` carries them under `acceptance.flash`.

- `true_strobe_flash`: **3**, seconds 32, 33 and 34, all in chapter 03's camera dive into the shelves. This is a test after WCAG 2.3.1 general flash on a 64×36 grid (`lib/flash.mjs`): the same cells cycling over 3 flashes a second and turning together over more than 25 % of a 640×480 rectangle. The result is the same whether "together" means within 2, 3 or 6 frames.
- `page_turn_grid_crossings`: 13 windows over the handoff's strict limit of 3 bright/dark flips per second in a 60×60 px cell, at most 1.56 % of the screen. All 13 overlap a scripted move (`unexplained_cell_flip_windows`: 0). The four page turns in chapter 01 pass the strobe test. `handoff_strict_cell_flip_limit` stays false, because motion explains these windows without making that limit pass.
- `max_luminance_transitions_per_second_any_cell`: 41, at the results counter's digits, a small area.

How far the strobe figure can be trusted: `calibrate-flash.mjs` runs the test on synthetic clips with known answers, and it gets 7 of 8 right. Full-screen flashes at 5 and 10 Hz, a soft 5 Hz sine and a large 5 Hz patch fail as they should; 2 Hz, exactly 3 Hz and a small patch pass. The one miss is high-contrast bars moving at 5 Hz per spot, which it calls a strobe. So it cannot separate a fast-moving high-contrast pattern from a real flash, and the three flagged seconds may be that case: extracted frames show the camera sweeping across bright shelves, with no flash repeating in place. It is an approximation, not a certified PSE test, and saturated red is not tested.

Not resolved by these numbers. A person needs to watch 30–36 s playing continuously on a large screen, or the dive needs to change. On the existing intermediate, a test clip that dissolves past the dive (3.7 s to 7.0 s of the shot) measured 0 strobe seconds and 0 fast-pattern seconds, at the cost of 3.3 s and the Transfer step. That change was not applied, because this round's brief reuses every other shot.
