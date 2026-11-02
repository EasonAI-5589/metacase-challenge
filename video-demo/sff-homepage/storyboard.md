# Storyboard: Metacase Challenge, SFF stage film

Locked page: `cefd87bb44155d86528f452ceefb6992bdc9b9fe` `index.html` and `challenge.html`. The timeline lives in `shots.mjs`; this file is its reading copy.
Output 1920×1080 at 60 fps. Capture viewport 1280×720 × DPR 1.5, so the 3D renders at full resolution (`arena-scene.js` caps its pixel ratio at 1.5).

The film tells one argument in the order the page does: what it is → what one record is → why records are searched by method → what they add up to → where it starts → how you enter and arrive → what you do → what has been measured → who runs it → where to go.

| Shot | Length | Source | What happens | On-screen text (page's own) |
|---|---|---|---|---|
| 01 Hero | 8.7 s | `#top` | From the dark canvas: the page's own entrance, then the library lights up | Global Metacase Initiative; Metacase Challenge; an open benchmark and research arena built around reusable Metacases; Hosted by NTU GIFTS · with HKU and SUFE |
| 02 Metacase | 18.4 s | `#metacase` | The book opens, then one stage at a time. Each leaf turn takes 0.95 s (57 frames) | A Metacase is one episode, recorded end to end.; the five stage names |
| 03 Retrieval | 11.2 s | `#structure` | Topic match, paths split; solution match, paths align. The 3D dims while the scroll crosses the page's camera jump at p = .4; the heading stays | Retrieve experience by how a problem was solved.; Topic match; Solution match; Different path / Same topic; Same path |
| 04 Network | 13.6 s | `#net` | Field by field, linked by solution path, then the aim | A reusable network of Metacases.; Field by field; Linked by solution path; The foundation; A foundation for experience-based AI. |
| 05 Fields | 15.4 s | `#fields` | The title alone, then the stage fades in where it will stay; three books open in turn. Each scroll to the next book takes 1.5 s (90 frames) | Three fields to start, eighteen classes of cases.; Economics; Finance; Social science; the class names |
| 06 Arena: selecting | first 14.5 s of one 29 s take | `#arena` | Three portals, then Anthropic, Google, OpenAI at 1.2 s each so the robot's full turn plays, GPT-5.6 Sol, XHigh; the wheel turns for 3.4 s (204 frames) through four harnesses to Codex CLI; Equipped, then 2 s stable | Three portals. Three tracks.; Model is the character. Harness is the weapon.; the loadout chips; the wheel's harness names; Equipped ✓ |
| 06 Arena: shuttle | last 14.5 s of the take | `#arena` | With no cut, the agent lifts off through the Economics, Finance and Social Science tunnels to the three open portals. The Economics portal is clicked: its iris and three rings cover the frame at 0.7x | Economics / Evidence to insight.; Finance / Make it add up.; Social Science / People & decisions.; Step through. Pick your track.; Portal 1 · Economics / Enter the Economics track, and the same for the others; Codex CLI; the tunnels' banners, except the three that state record counts |
| 06c Arrival | 5.5 s | `challenge.html?via=portal#track-econ` | From the warp's last dark frame: the dark clears from the doorway with one ring, the track's frame lights, and the guardian stands with the chosen loadout | Track 01; 200 tasks · 6 classes; Economics; the track summary; OpenAI · GPT-5.6 Sol · XHigh × Codex CLI; the six class names and their task counts |
| 07 Participate | 8.8 s | `#rules` | Case → Model → Harness → Trajectory → Verifier → Result. The 3D dims twice while the scroll skips the flashes; the heading and rail stay | How to participate in the challenge.; the flow labels |
| 08 Results | 6.5 s | `#tracks` | The counters run to their final values | See how runs have been scored.; 600 Candidate tasks; 3 fields × 200 tasks · 18 classes; 8 × 5; 3,999 / 4,000 trials scored; 9 Harnesses on GPT-5.6 Sol; 900 / 900 Dev100 trials scored |
| 09 Team | 4.2 s | `#team` | Host and the two partner labs | Meet our team & collaborations.; NTU GIFTS; HKU AI-Agents Lab; SUFE AIFLM Lab |
| 10 End card | 7 s | `cards/end.html` | Title, hosts, QR, and the one action | Metacase Challenge; Hosted by NTU GIFTS · with HKU and SUFE; Join the Challenge; easonai-5589.github.io/metacase-challenge |

Motion rules, from the skill passes recorded in `docs/video/sff-homepage/STATUS.md`:
- Scroll progress is the camera. Moves use `cubic-bezier(0.65, 0, 0.35, 1)` and end flat with no overshoot. A run of `glide` keys is a monotone cubic: speed is continuous through its keys and zero where the run starts and ends, so the page turns and the shuttle never start or stop abruptly.
- Nothing is double-exposed. Between chapters the whole frame dims to the page's dark (0.35 s), holds 7 frames and rises (0.4 s). Inside a chapter only the 3D and its labels dim. The warp's last frame is the arrival's first.
- New motion exists only on the end card (rise 16 px, resolve from 4 px blur, `--e` and `--e2`) and on the hero's 3D canvas (opacity from 0 over 2 s). No zoom, no pan, no parallax added.
- The film ends on the end card with no fade-out, so a paused player still shows the QR.
