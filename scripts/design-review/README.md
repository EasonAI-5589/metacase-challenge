# 设计改动的检查工具

11-02 到 11-03 改网站和重拍视频时，用这些工具看改动、做前后对比。网站文件不依赖它们，GitHub Pages 也不发布这个目录。

改了什么、为什么改，见 [docs/design/review-20261102](../../docs/design/review-20261102/README.md)（卡通角色、Fields 书、子页面）和 [docs/design/review-20261103](../../docs/design/review-20261103/README.md)（Arena 轮盘、结果卡片、提交卡片）。视频的改动和验收见 [docs/video/sff-homepage/STATUS.md](../../docs/video/sff-homepage/STATUS.md) 最后一节。

## 准备

```bash
python3 -m http.server 4199 --bind 127.0.0.1
```

在仓库根目录运行。Playwright 用 `video-demo/sff-homepage` 里已经装好的那份；浏览器默认用本机 Chrome，和 `scripts/test-*.mjs` 一样，可以用 `BROWSER_CHANNEL` 或 `BROWSER_EXECUTABLE` 改。

## `shoot.mjs`：某一部分在各宽度、各语言下的截图

```bash
PLAYWRIGHT_MODULE="$PWD/video-demo/sff-homepage/node_modules/playwright" node scripts/design-review/shoot.mjs results out/design-review
```

| 目标 | 拍什么 | 宽度 × 语言 |
| --- | --- | --- |
| `results` | 07 结果卡片整张 | 1440 / 1024 / 390 × 中英 |
| `submit` | 三张提交卡片 | 1440 / 1024 / 390 × 中英 |
| `submit-arrow` | 提交卡片的箭头，静止和悬停两张 | 1440，3 倍像素 |
| `wheel` | 05 Arena 装备轮盘（滚到 p = .27），看机器人是否在圆环中间 | 1440×900、1100×1000、1440×760、390 × 中文 |
| `subpages` | 七个子页面的页首和 3D 场景 | 1440 / 390 × 英文 |
| `characters` | 角色样张页：人物正面、背面，机器人 | 1440 |

每张截图都会顺带检查两件事，有问题就打印出来，并以非零状态退出：

- 页面能不能被横向滚动；
- 画面里有没有没画出来的 3D 图。被固定页头和章节导航挡住的部分不算，因为共享画布本来就不在那里画。

改之前先拍一次，改完再拍一次，两组图并排比较。`docs/design/review-*` 里的对比图就是这样做的。

## 角色样张页

`docs/design/character-lab.html` 把 `mc-kit.js` 里的人物和机器人排成一排，改造型时用它对照，不必滚到首页各章去找。参数：`?view=people`、`?view=robots`、`?view=all`；加 `&yaw=2.6` 看背面，`&t=` 固定动画时刻。

## 视频：`video-demo/sff-homepage/probe-fields.mjs`

用拍摄的视口（1280×720）和拍摄样式，先算出 Fields 书台在每个滚动进度上显示哪个领域、第几个展开页，再量出结果卡片各部分的位置。v6 的 `shots.mjs` 里，04 Fields 和 07 Results 的关键帧就是按它的输出定的。

```bash
cd video-demo/sff-homepage
node probe-fields.mjs            # SHOT=1 时每个停点另存一帧到 out/review/probe-fields
PS=.03,.1667 node probe-fields.mjs
```

展开页 s 在领域 f 里停在 `(f + (s - .5) / 3) / 3`，见 `metacase.js` 的 `spreadAt`。

## v6 的拍摄流程（复现用）

在 `video-demo/sff-homepage` 下：

```bash
FPS=10 node capture.mjs all      # 10 fps 粗拍，先看拼图
node capture.mjs all             # 60 fps 母版帧
POSTER_AT=5.4 node render.mjs    # 母版和海报，写到 out/final
node verify.mjs out/final/metacase-sff-stage-1080p60.mp4
LOCK=$(git rev-parse HEAD) node provenance.mjs
node contact.mjs out/frames ../../docs/video/sff-homepage/p0-contact-v6.jpg
```

- git 里放的那份，是把 CRF 15 母版用两遍编码压到 2.85 Mbps，以避开 GitHub 单文件 100 MB 的上限。
- 这台 Mac 没有能运行的 ffprobe。验收用的是 `verify.mjs` 的临时副本，只把 ffprobe 换成从 `ffmpeg -i` 读流信息，其余检查原样。在有 ffprobe 的机器上可以直接跑原版复核。

## 网站自己的检查

```bash
node scripts/check.mjs
```

改完都要跑。它会检查发布白名单：新加的网页文件不在 `publicFiles` 里，上线后会 404。另外 `scripts/test-leaderboard.mjs`、`test-dev100.mjs`、`test-dual-board.mjs`、`test-run-card.mjs` 都通过。`test-arena.mjs` 在第 107 行失败：它仍断言轮盘有 8 把武器，而页面从 `5518f3f` 起只有 6 个。这是测试过期，和这两天的改动无关，没有改。
