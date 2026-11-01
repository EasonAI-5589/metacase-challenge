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
