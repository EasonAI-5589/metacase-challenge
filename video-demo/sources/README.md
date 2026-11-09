# 网站视频的可编辑源工程

这里存放网站上每段视频的渲染源工程，压缩包都是原样字节，没有重新打包。改视频时请从这里取底稿，改完后把新版源工程也放回这里，不要只留在本地。

| 视频 | 网站上的成片 | 源工程 | 状态 |
|---|---|---|---|
| task0001 计量复现（GPT-5.6 Sol · DeepAgents） | `assets/video/agent-replay-task0001.mp4`（v4） | [`task0001/Metacase-task0001-deepagents-flow-source-v4.zip`](task0001/Metacase-task0001-deepagents-flow-source-v4.zip)；底稿 v3.2 同目录 | 完整 |
| FIN-T1-003 月结审核（qwen3.7-max · Claude Code） | `assets/video/finance-story-demo.mp4`（v3） | [`finance/Metacase-FIN-T1-003-guide-aligned-v3-source.zip`](finance/Metacase-FIN-T1-003-guide-aligned-v3-source.zip)；底稿 v2 同目录 | 完整 |
| HR-T3-114 培训与采购验收（qwen3.7-max · Claude Code） | `assets/video/hr-agent-replay.mp4` | 引擎在 Finance 包的 `original-source/engine/` 里 | 缺故事板、运行数据和旁白缓存 |
| SFF 舞台片 | `docs/video/sff-homepage/` | [`../sff-homepage/`](../sff-homepage/)（已在仓库） | 拍摄脚本完整，母版不在 git |

成片与源工程的对应关系都按 SHA-256 核对过，完整哈希见 [`SHA256SUMS`](SHA256SUMS)。

## 2026-11-09：Metacase 版（Finance v3、task0001 v4）

按 [issue #64](https://github.com/EasonAI-5589/metacase-challenge/issues/64) 改为网站现在的品牌：引导角色换成首页机器人持 Claude Code 枪，只留英文，片头片尾和标头换成 Metacase 并带机构行。两个新包都是在下面的底稿上增量修改，每一步的改动和验收见包内 `README-v3.md`（Finance）和 `README.txt` 开头的 v4 一节（task0001）。

- **Finance v3**：Skia 引擎在 Windows 上渲染（与 v2 同一台机器、同样的 Consolas 字体），`engine/check_guide.py` 全部 8,840 帧通过。片头片尾单独导出在 `docs/video/finance/sff/`。重新生成机器人素材用 `robot/sprite.html` 和 `robot/render_sprites.mjs`，需要和网站仓库放在同一父目录下用本地服务打开。
- **task0001 v4**：用包内的 SVG/canvas 导出器在 macOS 的无头 Chrome 上渲染，FFmpeg 编码，ffprobe 在 Windows 渲染机上校验成片。引导连续性审计 8,558 帧通过，11 个原始渲染函数逐字节未变，版面检查 124 张静帧无溢出。

下面各节描述的是底稿版本。

## task0001 · v3.2

- 网站成片 SHA-256 `978e3ae4…0daf05b0`，与源工程目录里导出的 `InferenceNet-task0001-deepagents-flow-v3-2.mp4` 字节一致。
- 包内有 `site/`（动画、像素向导 `original-guide.js`、执行流程层 `harness-flow.js`、`enhancement.js`）、`shotlist.json`（37 个镜头的中英讲稿）、`audio/`（36 段 WAV、混音和生成脚本）、三份 SRT 字幕，以及 10 月 18 日的原始源码 `original-source.zip`。
- 渲染方式：浏览器动画逐帧导出，再用 FFmpeg 编码。需要 Python 3、Node.js、Chrome、FFmpeg。具体命令见包内 `README.txt` 的「编辑与重新导出」一节。
- 原位置：haojiang 的 Windows 机 `D:\learning\artifacts\InferenceNet\20261018\replay-deepagents-v3-2\`。

## FIN-T1-003 · guide-aligned v2

- 网站成片 SHA-256 `9555f279…5183d82`，与源工程目录里导出的 `InferenceNet-FIN-T1-003-guide-aligned-v2.mp4` 字节一致。
- [issue #64](https://github.com/EasonAI-5589/metacase-challenge/issues/64) 要核对的文件全部一致：`engine/render.py`、`engine/reference_pet.py`、`engine/reference_bookends.py`、`engine/guide.py`、`engine/guide_targets.py`、`engine/ui.py`、`engine/compose.py`、`story/fin.py`、`build/fin/voice.json`。34 段旁白 MP3 都在包里。
- 渲染方式：Python + skia-python 离线逐帧渲染，再用 FFmpeg 编码，不需要浏览器。在 Windows 上用 Python 3.12.7 验证过。环境准备和预览命令见包内 `README-guide-aligned.md`。用缓存旁白重建：

  ```powershell
  python -X utf8 engine/render.py fin --workers 2 --crf 18
  python -X utf8 engine/package.py fin
  ```

- 原位置：haojiang 的 Windows 机 `D:\inferenceNet\artifacts\finance-guide-aligned-v2\`。

## HR-T3-114 · relay v2（不完整）

HR 和 Finance 用的是同一套 Skia 引擎。`docs/video/hr/provenance.json` 记录的 13 个引擎文件，与 Finance 包里 `original-source/engine/` 下的文件哈希全部一致。

还缺三样东西，所以目前还不能重建 HR：
- 故事板 `story/hr.py`
- 运行数据 `data/hr.json`、`data/hr.requests.jsonl`
- 旁白缓存 `build/hr/voice/` 和 `build/hr/voice.json`

它们原本在 `research/sufe-video-claude-relay-20261018/`（从 Finance 包里的路径记录看，在一台用户名为 `user` 的 Mac 上）。找到后请放进 `hr/`，并更新本文件和 `SHA256SUMS`。

## 旧版（10 月 18 日）

- [`legacy-20261018/InferenceNet-FIN-T1-003-story-source-20261018.zip`](legacy-20261018/InferenceNet-FIN-T1-003-story-source-20261018.zip)：Finance 的 HTML 故事版，78 秒，无旁白。没有后来的引导角色和片头片尾，只作兜底。取自 `codex/video-demo` 分支，哈希与该分支的 `SHA256SUMS` 一致。
- task0001 的 10 月 18 日源码已经包含在 v3.2 包里（`original-source.zip`），这里不重复存放。

## 内容边界

压缩包里没有 API 密钥或私有原始 trace。Finance 的 `data/fin.requests.jsonl` 只有时间戳和 token 用量。部分 JSON 记录了出片机上的绝对路径，不影响重建。
