# Metacase Challenge: SFF stage film, first version

89.7 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, CRF 15, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music, no captions track. Status: first version for review, not yet approved.

Chapters: HERO 0.0–9.5 s; 01 METACASE 9.2–20.7 s; 02 RETRIEVAL 20.4–29.1 s; 03 NETWORK 28.8–38.8 s; 04 FIELDS 38.5–52.6 s; 05 ARENA 52.3–65.1 s; 06 PARTICIPATE 64.8–73.3 s; 07 RESULTS 73.0–79.8 s; 08 TEAM 79.5–83.0 s; END CARD 82.7–89.7 s. Chapters overlap by the 0.3 s crossfade.

Source: `index.html` at commit `cefd87bb44155d86528f452ceefb6992bdc9b9fe`, served locally from the worktree at `127.0.0.1:4199`. `origin/main` was still at that commit when the master was rendered. The timeline is `video-demo/sff-homepage/shots.mjs`, its reading copy is `storyboard.md` beside it, and the end card is `cards/end.html`.

Files (not in git, per the handoff): `video-demo/sff-homepage/out/final/metacase-sff-stage-1080p60.mp4` and `metacase-sff-stage-poster.jpg`. Sizes and SHA-256 are in `render-receipt.json`.

Boundaries: an edit of the website's pages. Nothing was re-run or re-scored, and there are no new figures. Every readable DOM string traces to the locked commit in `provenance.json`, except the end-card URL, which comes from the handoff.

What the shoot changes at runtime, with no site file edited:
- Lenis smooth scrolling is off and a script drives the scroll. Scrollbars and the cursor are hidden.
- The site header, section nav, footer and long paragraphs are hidden. The page's own short labels are enlarged for a big screen.
- The hero's lead is cut to an exact substring, "an open benchmark and research arena built around reusable Metacases", with its first letter shown in capitals. The first results caption is cut to "3 fields × 200 tasks · 18 classes".
- The figures that contradict each other on the locked page are hidden: 208 / 209 / 187 records, 604 tasks, sixteen categories and the per-domain counts. The film shows only 600 / 200 per field / 18 classes.
- The results illustrations are hidden; they rendered too dark to read on a big screen.
- In chapter 05 the provider, model, effort and equip controls are fired by script at set times, as a click would. The path is the next two providers in page order, back to the page's default OpenAI, then GPT-5.6 Sol, XHigh and Codex CLI.
- In chapter 04 the page's clock runs at 0.55x during a book change and 0.3x during its fade-out.

Motion avoided on purpose: weapon fire is not shot. Chapter 06 cuts past the docking flash (progress .345–.385) and every muzzle spark (.41–.58). Chapter 02 is split at progress .4 so that a camera jump on the page itself (`metacase-archive.js:207`) falls inside a crossfade.

Capture: `page.clock` is paused before navigation and stepped once per frame after a fixed warm-up; CSS and WAAPI animations are seeked to the same clock. This is frame stepping, not screen recording, but two runs are not byte-identical. Run against run, compared at 30 fps: `06b-choose` matched on 26 of 114 frames with 38.7–66.1 dB on the unmatched frames sampled; `04-network` matched on 0 of 300 with 59.6–66.8 dB.

Known limits, listed in full in `render-receipt.json`:
- Flicker: 15 one-second windows exceed 3 bright/dark flips on a 32×18 grid, all in chapters 01 and 03, at most 1.39 % of the screen. Frame review shows a page leaf turning and the camera crossing lit shelves, not a repeating flash. The strict criterion in the handoff is not met.
- Text under 28 px on output: the arena panel's chips and buttons (21.5–24.4 px), the wheel's labels (22.5 px) and the rail's numerals (23.6 px).
- Holds of 2 s or more with no pixel change are deliberate reading time: chapter 04's heading, results, team, end card.
- The stage names in chapter 01 stay about 2 s each, under the handoff's reading formula of about 3.4 s.
- Checked on extracted frames and frame-difference scans. No person has yet watched it play at full speed on a large screen.
- Text painted into the WebGL scenes is not in the ledger; the scene sources were searched for the contradictory figures instead.
