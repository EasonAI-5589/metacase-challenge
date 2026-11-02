# Storyboard: Metacase Challenge, SFF stage film

Locked page: `cefd87bb44155d86528f452ceefb6992bdc9b9fe` `index.html`. The timeline lives in `shots.mjs`; this file is its reading copy.
Output 1920×1080 at 60 fps. Capture viewport 1280×720 × DPR 1.5, so the 3D renders at full resolution (`arena-scene.js` caps its pixel ratio at 1.5). Crossfade 0.3 s between shots.

The film tells one argument in the order the page does: what it is → what one record is → why records are searched by method → what they add up to → where it starts → how you enter → what you do → what has been measured → who runs it → where to go.

| Shot | Length | Source | What happens | On-screen text (page's own) |
|---|---|---|---|---|
| 01 Hero | 9.5 s | `#top` | From the dark canvas: the page's own entrance, then the library lights up | Global Metacase Initiative; Metacase Challenge; an open benchmark and research arena built around reusable Metacases; Hosted by NTU GIFTS · with HKU and SUFE |
| 02 Metacase | 11.5 s | `#metacase` | The book opens, then one stage at a time | A Metacase is one episode, recorded end to end.; the five stage names |
| 03a, 03b Retrieval | 8.7 s | `#structure` | Topic match, paths split; solution match, paths align. Split at p = .4 so the page's own camera jump falls inside the crossfade | Retrieve experience by how a problem was solved.; Topic match; Solution match; Different path / Same topic; Same path |
| 04 Network | 10 s | `#net` | Field by field, linked by solution path, then the aim | A reusable network of Metacases.; Field by field; Linked by solution path; The foundation; A foundation for experience-based AI. |
| 05 Fields | 14.1 s | `#fields` | The title alone, then the stage fades in where it will stay; three books open in turn. The page's book change runs at 0.55x, its fade-out at 0.3x | Three fields to start, eighteen classes of cases.; Economics; Finance; Social science; the class names |
| 06a Arena | 9.3 s | `#arena` | Three portals, the agent lifts off, the wheel: provider, model, effort, harness | Three portals. Three tracks.; Model is the character. Harness is the weapon.; the loadout chips |
| 06b Choose | 3.8 s | `#arena` | All portals open | Step through. Pick your track. |
| 07 Participate | 8.5 s | `#rules` | Case → Model → Harness → Trajectory → Verifier → Result, with two hard cuts to skip the flashes | How to participate in the challenge.; the flow labels |
| 08 Results | 6.8 s | `#tracks` | The counters run to their final values | See how runs have been scored.; 600 Candidate tasks; 3 fields × 200 tasks · 18 classes; 8 × 5; 3,999 / 4,000 trials scored; 9 Harnesses on GPT-5.6 Sol; 900 / 900 Dev100 trials scored |
| 09 Team | 3.5 s | `#team` | Host and the two partner labs | Meet our team & collaborations.; NTU GIFTS; HKU AI-Agents Lab; SUFE AIFLM Lab |
| 10 End card | 7 s | `cards/end.html` | Title, hosts, QR, and the one action | Metacase Challenge; Hosted by NTU GIFTS · with HKU and SUFE; Join the Challenge; easonai-5589.github.io/metacase-challenge |

Motion rules, from the skill passes recorded in `docs/video/sff-homepage/STATUS.md`:
- Scroll progress is the camera. Moves use `cubic-bezier(0.65, 0, 0.35, 1)` and end flat with no overshoot. Where the page packs its main action into a narrow progress window (a leaf turning, the cards giving way), the path crosses that window slowly on linear segments.
- New motion exists only on the end card (rise 16 px, resolve from 4 px blur, `--e` and `--e2`) and on the hero's 3D canvas (opacity from 0 over 2 s). No zoom, no pan, no parallax added.
- The film ends on the end card with no fade-out, so a paused player still shows the QR.
