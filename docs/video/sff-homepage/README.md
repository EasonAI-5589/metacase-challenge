# Metacase Challenge: SFF stage film, v2 (CP3-R1)

89.7 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, CRF 15, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music, no captions track. Status: v2 rework after the CP3 review, awaiting review and not yet approved for the stage.

Chapters: HERO 0.0–9.0 s; 01 METACASE 8.7–20.2 s; 02 RETRIEVAL 19.9–28.6 s; 03 NETWORK 28.3–38.3 s; 04 FIELDS 38.0–52.1 s; 05 ARENA 51.8–64.1 s; 06 PARTICIPATE 63.8–72.3 s; 07 RESULTS 72.0–78.8 s; 08 TEAM 78.5–83.0 s; END CARD 82.7–89.7 s. Chapters overlap by the 0.3 s crossfade.

Source: `index.html` at commit `cefd87bb44155d86528f452ceefb6992bdc9b9fe`, served locally from the worktree at `127.0.0.1:4199`. The timeline is `video-demo/sff-homepage/shots.mjs`, its reading copy is `storyboard.md` beside it, and the end card is `cards/end.html`.

Files (not in git, per the handoff), in `video-demo/sff-homepage/out/final/`: `metacase-sff-stage-1080p60.mp4` and the identical `metacase-sff-stage-1080p60-v2.mp4`, `metacase-sff-stage-poster.jpg`, and the v1 copies `metacase-sff-stage-1080p60-v1.mp4` and `metacase-sff-stage-poster-v1.jpg`. Sizes and SHA-256 are in `render-receipt.json`. Chapters 07 and 10 reuse the v1 frames; everything else was captured again.

Boundaries: an edit of the website's pages. Nothing was re-run or re-scored, and there are no new figures. Every readable DOM string traces to the locked commit in `provenance.json`, except the end-card URL, which comes from the handoff. The figures are the page's own and their evidence was not checked here.

What the shoot changes at runtime, with no site file edited:
- Lenis smooth scrolling is off and a script drives the scroll. Scrollbars and the cursor are hidden.
- Safe area: 96 px left and right, 54 px top and bottom on output. `--mc-gutter` is 64 CSS px (70 in chapter 04, whose device scale differs), and because the page's `.wrap` ignores that variable, `.wrap` and the captions are set too. Rails sit at `bottom: 36px`.
- The site header, section nav, footer and long paragraphs are hidden. The page's own short labels are enlarged for a big screen.
- The hero's lead is cut to an exact substring, "an open benchmark and research arena built around reusable Metacases", with its first letter shown in capitals. The first results caption is cut to "3 fields × 200 tasks · 18 classes". The foundation sentence has a fixed line break, "A foundation for / experience-based AI."
- The figures that contradict each other on the locked page are hidden: 208 / 209 / 187 records, 604 tasks, sixteen categories and the per-domain counts. The film shows only 600 / 200 per field / 18 classes.
- The results illustrations are hidden; they rendered too dark to read on a big screen.
- Text layers leave before a crossfade and arrive after it, so two chapters' words never stack; only the 3D dissolves. Inside chapter 02 only the caption band, rail and labels do this, so the heading stays.
- Chapter 04 is captured at 1392×783 (DPR 1.379), which shrinks the whole shot to 0.92 so the stage fits the safe area. `transform: scale` would break the page's own FLIP measurements. Its title stands alone first; the stage then scrolls to its sticky position.
- In chapter 04 the page's clock runs at 0.55x during a book change and 0.3x during its fade-out.
- In chapter 05 the provider, model, effort and equip controls are fired by script at set times, as a click would. The path is one provider switch (Anthropic) and back to the page's default OpenAI, then GPT-5.6 Sol, XHigh and Codex CLI, followed by 2 s of stable state. The panel is wider, its secondary lines are hidden, and model names wrap instead of clipping.

Motion avoided on purpose: weapon fire is not shot. Chapter 06 cuts past the docking flash (progress .345–.385) and every muzzle spark (.41–.58). Chapter 02 is split at progress .4 so that a camera jump on the page itself (`metacase-archive.js:207`) falls inside a crossfade.

Capture: `page.clock` is paused before navigation and stepped once per frame after a fixed warm-up; CSS and WAAPI animations are seeked to the same clock. This is frame stepping, not screen recording, but two runs are not byte-identical (measured before v2: `06b-choose` 26 of 114 frames matched, 38.7–66.1 dB on the others sampled; `04-network` 0 of 300, 59.6–66.8 dB). A screenshot occasionally stalls; the shot is then captured again from scratch, and frame counts are checked after every shot.

Known limits, listed in full in `render-receipt.json`:
- Flicker: 13 one-second windows exceed 3 bright/dark flips on a 32×18 grid, all in chapters 01 and 03, at most 1.56 % of the screen. Frame review shows a page leaf turning and the camera crossing lit shelves, not a repeating flash. The strict criterion in the handoff is not met.
- Safe area audit: text boxes are checked four times a second. 8 samples fall outside, each a single sample during a camera or scroll move, none during a hold. Chapters 07 and 10 reuse v1 frames and are not in the audit: the results card's frame sits about 60 px from the left edge, with its text about 165 px in by frame measurement.
- Text under 28 px on output: chapter 05's chips and buttons (27.3 px), the wheel's labels (22.5 px), and rail numerals and tab text (23.6–25.5 px).
- Holds of 2 s or more with no pixel change are deliberate reading time: chapter 04's title 2.2 s, results 5.1 s, team 3.35 s, end card 5.4 s.
- The stage names in chapter 01 stay about 2 s each, under the handoff's reading formula of about 3.4 s.
- Checked on extracted frames and frame-difference scans. No person has yet watched it play at full speed on a large screen, and the QR has been decoded from a frame, not scanned from a seat.
- Text painted into the WebGL scenes is not in the ledger; the scene sources were searched for the contradictory figures instead.
