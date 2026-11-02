# Metacase SFF 首页演示视频（v3 过渡版）与两项动效精修交接 (2026-11-02)

- To: 浩哥（江浩）　From: Eason（郭奕辰）
- Repo / branch: [`EasonAI-5589/metacase-challenge` (`main`)](https://github.com/EasonAI-5589/metacase-challenge/tree/main)　Video branch: [`video/sff-homepage-20261102`](https://github.com/EasonAI-5589/metacase-challenge/tree/video/sff-homepage-20261102)
- 线上页面与过渡视频直链:
  - 官网首页：[`easonai-5589.github.io/metacase-challenge/index.html`](https://easonai-5589.github.io/metacase-challenge/index.html)
  - Challenge 赛道页：[`easonai-5589.github.io/metacase-challenge/challenge.html`](https://easonai-5589.github.io/metacase-challenge/challenge.html)
  - SFF 演示视频 v3 过渡版（129.35s · 1080p60）：[`docs/video/sff-homepage/metacase-sff-stage-1080p60-v3.mp4`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/metacase-sff-stage-1080p60-v3.mp4)

## Conclusion
SFF（新加坡金融科技节）首页案例演示视频的录制管线（`video-demo/sff-homepage/`）与 v3 过渡版成片（`129.35s`、`1920×1080`、`60fps`）已合并提交进仓库 `main` 分支先作过渡。目前成片还有**两处很明显的问题**需要浩哥接手调优：**（1）视频里的滚动动态没有按网页真实滑动的细节一步步连续呈现（存在人工黑场跳切、阶段漏拍和 CSS 隐藏过度）；（2）05 Arena 传送门区域的机器人与传送门比例、站位没有对齐（机器人过大挡门、社科房穿模、三门全景悬浮遮挡中门按钮）**。

## What was done (v3 过渡版基线)
| # | Item | Evidence | Status |
| --- | --- | --- | --- |
| 1 | 确定性 60fps 抓帧与合成管线（Playwright 虚拟时钟 + WebGL 同步 + ffmpeg BT.709 合成） | [`video-demo/sff-homepage/capture.mjs#L1-L184`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/capture.mjs#L1-L184) / [`video-demo/sff-homepage/lib/stage.mjs#L1-L272`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/lib/stage.mjs#L1-L272) / [`video-demo/sff-homepage/render.mjs#L1-L51`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/render.mjs#L1-L51) | 已合入 `main` |
| 2 | v3 过渡版分镜脚本（01 Hero → 02 Metacase → 03 Retrieval → 04 Network → 05 Fields → 06 Arena 选择+三赛道穿梭+传送门跨页 → Challenge 赛道页 → 07 Rules → 08 Results → 09 Team → 10 End Card） | [`video-demo/sff-homepage/shots.mjs#L42-L118`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L42-L118) / [`docs/video/sff-homepage/STATUS.md#L186-L271`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/STATUS.md#L186-L271) | 已生成 `129.35s` 过渡片 |
| 3 | v3 过渡版 1080p60 MP4 成片、全片首中尾拼图与 05 Arena 连续 30 格关键帧拼图 | [`docs/video/sff-homepage/metacase-sff-stage-1080p60-v3.mp4`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/metacase-sff-stage-1080p60-v3.mp4) / [`docs/video/sff-homepage/p0-contact-v3.jpg`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/p0-contact-v3.jpg) / [`docs/video/sff-homepage/v3-arena-shuttle-sheet.jpg`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/v3-arena-shuttle-sheet.jpg) | 已入库供直接对比 |

## 两项核心待改问题定位与修改建议（请浩哥重点调整）

### 1. 视频动态细节：未按网页真实滑动细节一步步连续呈现
- **现状与根因**：
  1. **各章之间及章内用了人工压暗跳切（`DIP` / `dips`），打断了网页原本连续的滚动过渡**：
     - 全片 10 处换章全部用 `0.35s 压暗 + 7 帧黑场 + 0.40s 亮起` 拼接（[`video-demo/sff-homepage/shots.mjs#L112-L118`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L112-L118)、[`video-demo/sff-homepage/render.mjs#L15-L34`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/render.mjs#L15-L34)），而不是像真人在网页上顺滑滚过章节衔接处。
     - **02 Retrieval** 在 `t=5.95..6.6s` 用 `dips` 把 3D 场景压黑跳帧，且在 `p=0.68` 就提前结束（[`video-demo/sff-homepage/shots.mjs#L56-L58`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L56-L58)），漏掉了网页上第 3 步 `03 Reuse`（`p=0.70..1.00`，[`metacase-archive.js#L204-L245`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/metacase-archive.js#L204-L245)）的完整展开细节。
     - **04 Fields** 在 `t=3.1s` 把标题淡出后瞬移 `scrollY` 到 `p=0.1` 再原地淡入书台（[`video-demo/sff-homepage/shots.mjs#L72-L75`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L72-L75)），没有体现网页上从章节标题自然向下滑入三本立体书台的真实滚动感。
     - **06 Participation Workflow (`07-rules`)** 用了两处 `dips` 瞬移跳过 `p=0.31..0.386` 和 `0.392..0.585`，且停在 `p=0.78`（[`video-demo/sff-homepage/shots.mjs#L100-L104`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L100-L104)），漏掉了 `03 Execute` 完整走位与 `05 Contribute` 收尾；**07 Results (`08-results`)** 与 **08 Team (`09-team`)** 則是完全静止的零滚动定格（[`video-demo/sff-homepage/shots.mjs#L105-L106`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L105-L106)）。
  2. **抓帧注入的 `STAGE_CSS` 隐藏了过多网页原生细节**：
     - [`video-demo/sff-homepage/lib/stage.mjs#L14-L28`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/lib/stage.mjs#L14-L28) 把顶部导航栏（`.mc-nav`）、各章副标题说明（`.mc-lead` / `.mc-sub` / `[data-mc-body]`）、Arena 底部事件说明（`[data-mc-event]`）和结果卡片插图（`.mc-stat-art`）全隐藏了，导致画面和真实滑网页的观感脱节。
- **修改建议**：
  - 去掉章内人为的 `dips` 黑场跳切，按网页真实的 `0 → 1` 滚动轨迹把每个子阶段（包括 Retrieval 的 `03 Reuse`、Rules 的 `01 Choose → 02 Configure → 03 Execute → 04 Verify → 05 Contribute`、Fields 从标题滚入书台、Results/Team 的滚动入场）一步一步完整呈现出来；恢复被 `STAGE_CSS` 误藏的网页原生 UI 细节。

### 2. 传送门区域（05 Arena）：机器人与传送门的比例、位置未对齐
- **现状与根因**（见拼图 [`v3-arena-shuttle-sheet.jpg`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/v3-arena-shuttle-sheet.jpg) 第 1、3、4 行）：
  1. **机器人在三扇门房间内比例偏大、离相机过近，遮挡传送门主体**：
     - 传送门光幕尺寸为 `PlaneGeometry(5.3, 6.2)`、中心高 `y=3.7`（[`arena-scene.js#L523-L524`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L523-L524)），门框高 `6.5`（[`arena-scene.js#L624-L627`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L624-L627)）。
     - 但在三赛道房间特写（`p=0.41..0.91`，[`arena-scene.js#L1471-L1517`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1471-L1517)）中，`toyRobot.root.scale` 设为 `2.15`（[`arena-scene.js#L1638`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1638)），加上升空高度 `hover ≈ 1.74`（[`arena-scene.js#L1630-L1639`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1630-L1639)）且相机距离机器人仅约 `2.4` 个单位，导致透视下机器人头部和右侧悬浮武器（`carriedScale = 2.1`，[`arena-scene.js#L1692-L1701`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1692-L1701)）占满画面下半部，把背后的传送门挡住了大半；在 Social Science 房间（`p=0.85..0.90`）相机轨迹还会擦过机器人右肩造成穿模（见 `v3-arena-shuttle-sheet.jpg` 第 4 行第 1 格）。
  2. **入口（`01 ENTER`）与三门全开（`06 CHOOSE`）全景下，机器人缩放 `2.85` 过大且悬浮遮挡中门（Finance）按钮**：
     - 在 `p=0` 和 `p=1`（[`arena-scene.js#L1439-L1453`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1439-L1453)、[`arena-scene.js#L1519-L1525`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1519-L1525)），`toyRobot.root.scale` 达到 `2.85`（[`arena-scene.js#L1638`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1638)）；尤其在 `p=0.95..1.0`（`06 CHOOSE`）时，`takeoff=1` 让机器人悬停在 `y ≈ 1.16, z = 4.1`，正好挡在中央 Finance 传送门正前方，与 `Finance →` 门廊按钮（[`arena.js#L415-L429`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena.js#L415-L429)、[`arena-scene.js#L1836-L1846`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1836-L1846)）叠在一起。
- **修改建议**：
  - 调小机器人在全景与门前的相对缩放比例（[`arena-scene.js#L1638`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1638)，例如隧道/门前从 `2.15` 收至 `1.45–1.65`，全景从 `2.85` 收至 `1.8–2.1`），并调整 [`arena-scene.js#L1471-L1525`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1471-L1525) 中 `shots` 的 `hero` 与 `camera` 相对位置及 `hover` 高度，让机器人端正站在传送门前方的地面符文环（`glyph` `z=4.6`，[`arena-scene.js#L563-L564`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L563-L564)）上，与身后的高大传送门形成协调的视觉比例，不遮挡门心旋涡与门廊按钮。

## How to reproduce / re-render
```bash
# 1. 拉取最新 main 分支并启动本地静态服务
git clone https://github.com/EasonAI-5589/metacase-challenge.git
cd metacase-challenge
python3 -m http.server 4199 --bind 127.0.0.1 &

# 2. 进入视频工程目录安装依赖
cd video-demo/sff-homepage
npm ci

# 3. 先用 10fps 快速试抓验证修改效果（单镜约 10–15 秒）
FPS=10 node capture.mjs 06-arena-shuttle,06c-challenge-arrive

# 4. 确认无误后抓 60fps 全片并合成 1080p60 MP4 + 验收报告
node capture.mjs
node render.mjs
node verify.mjs
```

## Message to send (WeChat)
```text
浩哥，SFF 大会首页演示视频的 v3 过渡版（129.35s，1080p60）和整套 60fps 抓帧合成脚本我已经先提交到 metacase-challenge 主分支过渡了。现在视频还有两个很明显的问题，需要你帮忙针对这个视频做一下修改和重新录制：

1. 视频动态细节没按网页真实滑动一步步呈现：现在视频为了拼章节，在章间和章内加了不少黑场跳切（dips），而且 lib/stage.mjs 里的 STAGE_CSS 隐藏了导航栏、副标题和卡片插图，导致和我们在网页上真实滑动看到的逐步展开细节不一致（比如 02 Retrieval 在 p=0.68 提前截断漏了 03 Reuse、04 Fields 从标题到书台是黑场瞬移而不是滚进去、06 Rules 跳过了中间走位、07/08 是纯静态定格）。这块需要把人为跳切拿掉，按网页真实的滑动细节一个一个完整呈现出来：
- 当前过渡视频（1080p60 MP4）：https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/metacase-sff-stage-1080p60-v3.mp4
- 分镜与滚动关键帧配置：https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/shots.mjs#L42-L118
- 抓帧隐藏样式 STAGE_CSS：https://github.com/EasonAI-5589/metacase-challenge/blob/main/video-demo/sff-homepage/lib/stage.mjs#L14-L28

2. 传送门区域机器人和门的比例、站位没对齐：在 05 Arena 里，三赛道门前特写（p=0.41..0.91）的机器人缩放（scale 2.15）和悬停高度偏大、离相机太近，把身后的传送门挡住了大半（社科房 p=0.85..0.90 相机还会擦过机器人右肩穿模）；另外三门同开全景（06 CHOOSE）下机器人 scale 是 2.85 且悬在半空，正好压住中间 Finance 传送门的按钮。需要调一下 arena-scene.js 里机器人与传送门的相对比例、站位高度和相机距离，让机器人和门对齐：
- 传送门与三赛道连续 30 格抽帧图（第 1、3、4 行可见比例问题）：https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/video/sff-homepage/v3-arena-shuttle-sheet.jpg
- 传送门光幕与门框尺寸定义：https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L523-L633
- 各阶段相机与机器人坐标（shots）：https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1437-L1526
- 机器人缩放比例与武器悬停偏移：https://github.com/EasonAI-5589/metacase-challenge/blob/main/arena-scene.js#L1630-L1702

完整的定位分析、代码行号和一键重跑命令我都整理在交接文档里了：https://github.com/EasonAI-5589/metacase-challenge/blob/main/docs/handoffs/20261102_jianghao_sff_video_handoff.md
```


