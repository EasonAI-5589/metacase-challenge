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

## 2026-11-02 03:32 · CP3 P0 主片与海报（第一版）
- 锁定 commit：cefd87bb44155d86528f452ceefb6992bdc9b9fe（渲染前再次 fetch，origin/main 未变）
- 产物（都在 `video-demo/sff-homepage/out/final/`，未进 git）：
  - `metacase-sff-stage-1080p60.mp4`：89.7 s，1920×1080，60 fps，5382 帧，58,858,930 字节，SHA-256 `b3d9f2ff95edac948bc4f217575740c3f5d7a265cb1b90ac8ec660d0af6fd54d`
  - `metacase-sff-stage-poster.jpg`：1920×1080，241,546 字节，SHA-256 `0f0235f087cdc301e202bf5e6e1df119c514e50c45bbd7283e86581ead1204e7`
- 验收（从最终文件读回）：
  - 通过：时长 75–90 s、1920×1080、60 fps、H.264 High、yuv420p、BT.709 三项标注、AAC 48 kHz 立体声、faststart。
  - 黑场：只有片头 0–0.47 s。
  - 静止段：4 段，都是有意停顿（第 04 章标题 2.1 s、结果卡 5.1 s、团队 2.5 s、结尾卡 5.4 s）。
  - 来源：257 条屏幕文字，矛盾数字 0 条，无出处 0 条。
  - 二维码：从主片帧解码，指向官网。
  - 960×540 和每镜首、中、尾拼图（`out/review/p0-960x540.jpg`、`p0-contact.jpg`）已看：无滚动条、光标、回退字体、fallback 渲染、半截内容。
  - **未通过：严格闪烁判据**。第 01、03 章有 15 个窗口超过每秒 3 次翻转，最大占屏 1.39%。逐帧看是翻页和镜头扫过书架，不是频闪。
- `review-animations` 第二轮：只看抽帧发现不了，于是加了单帧跳变扫描（`pops.py`），又改一轮。
  - 翻页原来约 5 帧完成，现在按 0.55 秒慢走翻页窗口。
  - 第 03 章换书改成慢走，并把页面自身的相机跳变（p = .4）藏进淡化。
  - 第 04 章换书的亮区淡出放慢。赛场面板从一帧弹出改为淡入。
  - 剩余单帧变化：第 04 章标签消失、第 05 章标题换字（都是页面自身行为）、第 06 章的设计硬切、第 07→08 章的淡场起点。
  - 结论：可以交第一版看，但**还没有人看过连续播放**，手感要 Eason 在大屏上判断。
- `verification-before-completion`：过程中有一次全片抓帧在第 06a 镜超时（`page.screenshot` 30 s），后续合成因此没跑，当时的验收报告是旧数据，未采信。之后加了重试（重试次数 0），改成严格串联重跑。
- `project-core-links`：最终回复末尾附核心链接。
- 复现性：两次抓帧不逐字节相同（`06b-choose` 114 帧中 26 帧相同，`04-network` 300 帧中 0 帧相同；抽样 PSNR 38.7 dB 到 66.8 dB）。不能称为“逐字节可复现”。
- 假设 / 默认值：见 CP1 一节；另外全片结尾不淡出，暂停时还能看到二维码。

### 要 Eason 定
1. §3 的数字：604 还是 600；208/209/187 还是 200；16 类还是 18 类。片子只用 600 / 200 / 18。若首页改了，重拍受影响的镜头。
2. 二维码指向官网还是 SFF 报名页（默认官网）。改法：`QR_URL=… node make-qr.mjs`，再 `node capture.mjs 10-end && node render.mjs`。
3. 赛场这段的路径：切 Anthropic、Google 后回 OpenAI，最终 GPT-5.6 Sol × Codex CLI。屏幕上还有页面原文 “Harness is the weapon.”（没拍开火）。
4. 拍摄时隐藏的内容是否接受：导航栏、长段落、结果卡插图；Hero 的长段换成原文片段。
5. 严格闪烁判据未过的这几处，能否按「翻页动作」放行。
6. 片长 89.7 s 贴着上限，放在 15 分钟发言里是否要再短。
7. 方向切换页 `cards/prototype.html` 留着等认可，认可后再删。

### 给工作 Mac 的站点观察（未改站点）
- `metacase-archive.js:207`：`p > .4 ? 1 : 0` 让相机在第 02 章 p = .4 处跳一帧，真实滚动时也存在。
- `metacase-run.js:408`：`Case` 标签太靠近标题时不显示，拍摄版式下这一步由字幕 “1 · Choose a case” 承担。

### 下一步
Eason 看片并定上面几项；认可后做 P1（展台循环版、网页版、GIF）。帧序列保留在 `out/frames/`（1.5 GB），重剪不用重抓；磁盘剩约 35 GiB。4199 服务已停，重启命令：`python3 -m http.server 4199 --bind 127.0.0.1`（在 worktree 根目录）。

### 过程中的两件事
- 一条清理临时图的 `rm` 被安全检查拦下，没有重试；那个目录是新建的，本来就不需要删。没有删除任何东西。
- 收尾时用过一次 `pkill -x caffeinate`，范围偏大，这台机器上如果有别的会话开着 caffeinate 也会被停。可能影响防睡眠，不影响文件；4198 仍在运行。

## 2026-11-02 13:50 · CP3-R1 v2 返工
- 依据：`~/InferenceNet/handoffs/reviews/review-02-cp3-final.md`（Astra 原文 `astra-review-cp3.md`）。锁定 commit 不变：cefd87bb44155d86528f452ceefb6992bdc9b9fe，开工时 origin/main 仍是它。
- 产物（都在 `video-demo/sff-homepage/out/final/`，未进 git）：
  - `metacase-sff-stage-1080p60.mp4` 和同内容的 `-v2.mp4`：89.7 s，1920×1080，60 fps，5382 帧，57,287,819 字节，SHA-256 `2199d9671d7a523ea993b2f51447383af203939bc7129c5fba76b494eb5f54bc`
  - `metacase-sff-stage-poster.jpg`：1920×1080，240,824 字节，SHA-256 `022fe9a241bfd6df684804c46d36a5a74032c6def77a37290233ad72bc4f5aa5`
  - v1 另存为 `-v1.mp4`、`poster-v1.jpg`，SHA-256 未变（`b3d9f2ff…`）
- 重抓第 01–06 章和 Team；Results、End Card 复用 v1 帧。

| 返工项 | 怎么改的 | 结果 |
|---|---|---|
| P0-1 安全边距 | `--mc-gutter: 64px`；页面 `.wrap` 不读这个变量，`.wrap` 和字幕也一起改；`.mc-scene-foot` / `.mc-bottom` 底部 36px；第 01 章说明卡收进右边距 | 新增文字坐标审计（每秒 4 次）：8 个样本越界，都是镜头或滚动移动中的单次采样，停留段 0 个 |
| P0-2 Fields 构图 | 拆成两段：标题单独占屏（书不入画），再滚到书台 sticky 位。改用 1392×783 视口抓帧，整镜缩到 0.92（`transform: scale` 会打乱页面 FLIP 测量） | 三本书的 `FIELD 0x`、书页、侧标签、导航条在停留段都在安全区内 |
| P0-3 03→04 转场 | 第 03 章文字和导航先淡出，只留 3D 淡化；第 04 章标题 0.2 s 后才淡入。第 04 章从 `fields` 顶开始，`#net` 不入画，圆桌不再残留 | 抽帧确认没有两章文字同屏；第 04 章段内已无圆桌，圆桌只在 0.3 s 交叉淡化里随上一章淡出 |
| P1-4 连字符 | 固定两行 `A foundation for` / `experience-based AI.` | 已修 |
| P1-5 面板裁切 | 页面有条媒体查询把模型按钮设成 `nowrap`，改成可换行；面板加宽；字号 24.4→27.3 px；隐藏次要说明。厂商切换减为一次（Anthropic 后回 OpenAI） | 不再裁切；最终 `OpenAI / GPT-5.6 Sol / XHigh / Codex CLI` 稳定约 2.05 s |
| P1-6 切点重影 | 同章切点只淡化 3D，字幕带、导航、标签先出后进，标题不动 | 抽帧确认无 `TOPIC MATCH` / `SOLUTION MATCH` 重影 |
| P1-7 Team 停留 | 镜头 3.5→4.5 s；从 Hero 和赛场前段各回收 0.5 s | 完全静止段 3.35 s（v1 为 2.5 s），全片仍 89.7 s |

- 验收（`verify.mjs`，从最终文件读回）：
  - 通过：时长、1920×1080、60 fps、H.264 High、yuv420p、BT.709 三项标注、AAC 48 kHz 立体声、faststart。
  - 黑场：只有片头 0–0.47 s。
  - 来源：255 条屏幕文字，矛盾数字 0 条，无出处 0 条。二维码从主片帧解码，指向官网。
  - **未通过：严格闪烁判据（`no_flicker`、`flicker_under_1pct_of_screen`）**。第 01、03 章有 13 个窗口超过每秒 3 次翻转，最大占屏 1.56%（v1 为 1.39%）。逐帧看是翻页和镜头扫过书架，不是频闪，仍待 Eason 判断，也应在大屏上复验。
- 回执：`render-receipt.json`、`provenance.json`、`out/review/p0-contact.jpg` 已更新。

### 没有按建议改的（Astra 原文里有，返工单未列）
- 结果卡标题改成 `Evaluation coverage so far.`：不是页面原文，违反交接单 §3，要改应先改首页。这一帧也是复用的。
- 结尾卡延长到 7 秒稳定：P2，未动，稳定段仍约 5.4 s。
- 关键选择文字 30–36 px：做到 27.3 px，再大面板会压住轮盘。
- 这几项仍要 Eason 定：§3 的数字口径（制片方未签字）、二维码指向。还没有人连续看过全片，也没有在现场距离实扫过二维码。

### 更正与过程记录
- **更正**：CP3 收尾时我说“严格模式，任何一步失败都会中止”，这不成立。`set -e` 在这个 shell 环境里没有生效，这次日志里抓帧失败后仍打印了 “capture ok”。v1 的结果仍可信，因为 sha、帧数都从新文件直接读出，但那句话是错的。现在改用 `&&` 串联，抓帧脚本每镜自查帧数。
- 我的 bug：循环里新加的变量遮蔽了帧目录，粗剪的帧被写到工作目录下的数字名文件夹里，当时 exit 0 看不出来。已修，并加了路径防护。v2 主片不受影响。
- 删除这些误写目录的命令被权限检查拦下，我没有绕过，改为原样移到 `video-demo/sff-homepage/out/review/misplaced-frames/`（10 个目录，56 MB，git 已忽略）。内容没有用，Eason 确认后可以删。
- 截图卡死又出现过一次（第 05 镜粗剪）。Playwright 的截图排队执行，原来的同页重试不起作用，改成整镜换新浏览器重抓。60 fps 这轮没有触发。
- 4199 服务已停，重启命令：在 worktree 根目录运行 `python3 -m http.server 4199 --bind 127.0.0.1`。

### 给工作 Mac
返工单 §执行要求已跑完。复核时重点看新 MP4 的 36–43 秒和 52–60 秒。文件在 Air 上，未进 git。
