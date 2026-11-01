# SFF 首页案例视频 · 进度

唯一进度入口（交接单 §9）。每到一个检查点追加一段，不改写旧的。

## 2026-11-02 01:55 · CP0 现场与环境
- 锁定 commit：cefd87bb44155d86528f452ceefb6992bdc9b9fe（= origin/main，开工时 fetch 确认）
- 现场：Mac15,12 / macOS 26.5.2 / Node 25.4 / ffmpeg 8.1；主目录剩 38 GiB；4198 是另一个会话的预览，未碰；本片服务在 127.0.0.1:4199
- 渲染器：真 GPU，`ANGLE Metal Renderer: Apple M3`，headless 可用；`.mc-chapter[data-renderer]=webgl`
- Lenis 已关（`window.__lenis` 为空）；Inter / Space Mono 均 `document.fonts.check` 通过；页面无报错、无 4xx
- 管线：`page.clock` 在导航前暂停，每帧 `runFor` 后把 `document.getAnimations()` 对齐到假时钟，已跑通 10 个代表镜头（`out/review/probe-1280.jpg`）
- 用了 `design-to-motion`：本片按 Part C 的假时钟抓帧 + Part B 的 `--e` / `--e2` / `--io` 曲线；无镜头推拉（B7）；不做 Part A 的像素复刻，因为拍的就是真页面
- 下一步：比较视口并定字卡方向（CP1）

## 2026-11-02 02:15 · 各 skill 的结论（CP1 前）
- `landing-page-design`：只用它的叙事部分。片子按 B 型「长篇故事」组织：先说这是什么，再讲一条记录、检索方法、网络、领域，然后是怎么参加、已有结果，最后是谁在做。全片只有一个行动：结尾卡的 Join the Challenge，与 Hero 的主按钮同文。它的字体禁令（不用 Inter）不采用，交接单要求用站点字体。
- `prototype`：做了 Margin / Bookplate / Signature 三个方向（`cards/prototype.html`，对照图 `out/review/proto-all.jpg`）。选 Margin：Bookplate 全屏米色，在暗场大屏上会亮闪一下；Signature 的二维码只有 300 px，台下扫不到。Margin 的二维码 600 px，是全片最亮的东西。章节号不新做，直接放大页面自带的 `.mc-label`，不另起一套视觉。切换页先留着，等 Eason 认可方向后再删。
- `hallmark`：只用于结尾卡。sloplint 0 FAIL。保留 3 项 REFLEX 并写了豁免：2b、38iii 是站点自己的标题渐变（metacase.css:58，交接单要求沿用），26b 是画面上没有可按的东西。middle dot 那条是页面原文，不改。
- `impeccable`：`context` 和 `detect` 都跑了。detect 只报渐变文字，理由同上。按它的下限把字距收到 -0.04em、卡片圆角收到 16 px，并核了对比度。它要求先向用户提问（init / 访谈），本任务明确不问人，所以跳过，按现有站点视觉作为权威。
- `web-design-guidelines`：取了最新规则。只有动效和文字部分适用于片子帧：只动 transform / opacity、标题用 `text-wrap` 防孤词、计数器用 tabular-nums（页面已用）。交互类规则不适用。
- `animate`：新动效只有两处：结尾卡出场（transform + opacity + 4 px blur）、Hero 的 3D 画布淡入（只动 opacity）。章节号动效被否决，它什么也没解释。
- `emil-design-eng`：退场快于进场，停顿长于动作，同一屏的元素错开 100–150 ms（大屏节奏，比 UI 的 30–80 ms 慢）。粗剪要逐帧慢放审。
- `apple-design`：没有手势就没有弹簧，移动结束时不过冲；不做全屏背景移动；避免明暗突变（Bookplate 被否的另一个理由）。
- `animation-vocabulary`：统一术语。章节内是 scroll-driven animation + ease-in-out，段内停顿靠关键帧平段；章节间是 crossfade；结果卡是 number ticker + tabular numbers。

## 2026-11-02 02:15 · 读字时间的取舍（假设）
- 交接单规定每张字卡停留 2.5 秒 + 每词 0.3 秒。章节标题、Hero、结尾卡都满足。
- 第 02 镜的五个阶段名（3–4 词）每个约 1.9 秒，低于该公式（约 3.4 秒）。全按公式算，这一镜要 17 秒以上，全片会超过 90 秒。这些是随书页出现的短标签，不算字卡，判定可以接受。

## 2026-11-02 02:22 · CP1 分镜与样片
- 锁定 commit：cefd87bb44155d86528f452ceefb6992bdc9b9fe
- 做了：分镜定稿（`video-demo/sff-homepage/storyboard.md`、`shots.mjs`）；11 个镜头 10 fps 粗剪；每镜首、中、尾三帧拼图。视口试过 1280×720、1120×630：选 1280×720 × DPR 1.5，书能完整入画，且赛场 3D 不用放大（`arena-scene.js` 的 pixel ratio 上限是 1.5）。
- 产物：`video-demo/sff-homepage/out/review/cp1-contact.jpg`（1448×3010，约 570 KB，未进 git）
- `review-animations` 审粗剪（默认挑刺），结论 Block，已按下表改一轮：

| Before | After | Why |
| --- | --- | --- |
| Hero 首帧已露出 eyebrow 和三个领域标签 | 文字 0.35 s 后才开始出场，标签随 3D 画布一起淡入 | 片子必须从暗场开始，标签不能悬空 |
| 第 02 镜翻页 0.8 s、停 0.9 s，画面在约 0.25 s 内突变 | 翻页 1.2 s、停 0.7 s | 缓动中段太快，读着像跳变 |
| 第 05 镜第一本书在交叉淡化期间就翻开 | 起始位置放到触发线以下，滚上来后才翻开 | 动作要落在看得见的时候 |
| 第 07 镜在运动中硬切 | 先停住再切 | 速度突变会很显眼 |
| 第 06a 镜 6 家厂商每 0.4 s 切一次，机器人转身被反复打断 | 按页面顺序切 2 家，再回默认，每 0.7 s 一次 | 能删就删，动作要做完 |
| 第 08 镜卡片插图发暗，像污迹 | 拍摄时隐藏插图，计数器放大到 116 CSS px（174 px） | 数字才是画面主角 |

- 假设 / 默认值：
  - 拍摄用 CSS 隐藏了导航栏、长段落、页脚和 §3 的矛盾数字；放大了页面自带的短标签。站点文件一字未改。
  - Hero 的长段落换成原文片段 “an open benchmark and research arena built around reusable Metacases”，首字母显示为大写。
  - `Case` 标签被页面逻辑隐藏（标签太靠近标题就不显示，`metacase-run.js:408`），这一步由原文字幕 “1 · Choose a case” 承担。
  - 装备轮的厂商按页面顺序切两家后回到默认 OpenAI，模型选 GPT-5.6 Sol（对应结果卡），Harness 停在 Codex CLI。
- 要 Eason 定：见片末汇总，目前有 §3 的数字、二维码指向、装备轮停在哪家。
- 下一步：CP2，先抓第 1、6 镜的 60 fps 片段。

## 2026-11-02 02:27 · CP2 管线验证
- 第 1、6 镜已抓 60 fps，单镜 40–70 秒，假时钟下 WebGL 正常，滚动与预期无偏差，页面无报错。
- 产物：`video-demo/sff-homepage/out/review/cp2-01-hero.mp4`（5.2 MB）、`cp2-06a-arena.mp4`（8.2 MB）、`cp2-sheet.jpg`
- 发现并修正：赛场面板放大后厂商名被截断（`Anthr…`），面板还压住导航条。改为加宽面板，字号收到 12.5 CSS px（约 24 px）；第 2 阶段隐藏底部导航条。
- 下一步：抓全片 60 fps，合成 P0，跑验收。
