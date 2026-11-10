# Metacase Challenge: homepage film, third cut

246.40 s · 1920×1080 · 60 fps · H.264 High (BT.709, `yuv420p`, `+faststart`) + silent AAC 48 kHz stereo.
No narration, no music.

Link: <https://easonai-5589.github.io/metacase-challenge/docs/video/home-film/metacase-home-film-1080p60.mp4>

`metacase-home-film-1080p60.mp4` is the copy for the web: the 1080p60 master re-encoded at 3.08 Mbps (two-pass) to stay under GitHub's 100 MB file limit (95,613,068 bytes, SHA-256 `c5910f543b2582dd6471b98ec37e83fc0a5fd7f79901bc19252daf1f713655fc`). The master (CRF 14, 265,895,039 bytes, SHA-256 `7c28bf77bd8832ec83a86ff79023b2d0f106337d1844600b80f67a753bea415b`) is a working file and is not in git.

## What it is

A film made for the homepage, not a recording of it. It uses the homepage's 3D sets (the book on its desk, the retrieval shelves, the library, the arena, the participation room) and films them with its own cameras. No web interface is in frame.

Chapter numbers and names, headings, step names, field and class names, tags and figures are read from the homepage when the film renders. The one-sentence captions are the film's own: each keeps the point of the homepage's paragraph for that step in about a third of its words.

The pipeline that renders it (`video-demo/home-film/`) is not in git yet.

## Chapters

| From | To | Chapter |
|---|---|---|
| 0.0 s | 10.8 s | Opening: the library, the film's name |
| 10.8 s | 57.3 s | 01 The Metacase: the book opens (10.8 s), its five stages (22.3 s), the solution signature (50.3 s) |
| 57.3 s | 84.5 s | 02 Retrieval |
| 84.5 s | 113.0 s | 03 The network |
| 113.0 s | 140.5 s | 04 The first fields: three walls, eighteen classes |
| 140.5 s | 181.4 s | 05 The Metacase Challenge: the loadout (140.5 s), the three tracks (152.9 s) |
| 181.4 s | 219.4 s | 06 Participation workflow |
| 219.4 s | 231.6 s | 07 Results so far |
| 231.6 s | 246.4 s | 08 Team & collaboration, and the end card |

## Checks on the master (2026-11-10)

- Length as planned; no picture held still for over a second; black only at the three intended fades (the opening, after the flight into the portal, before the team card).
- Flash test (a general-flash test after WCAG 2.3.1, the one the stage film used): no strobe at the 2-frame and 3-frame windows.
- 6 s are marked as fast pattern motion, which is a note and not a strobe: the tracking walk along the shelves (3 s) and the moves between the class walls (3 s).

## Status

Third cut, 2026-11-10. It applies the team's review of the first cut: every piece of text stays up long enough to read (four words a second at most), captions sit bottom-centre under the subject, nothing standing in a scene covers printed text, and the results shot is held. Silent.
