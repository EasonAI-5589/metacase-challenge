# HR-T3-114 回放视频：gemini-3.8-flash × DeepSeek Harness（soc v1）

这是社会科学 Metacase 页用的回放视频。它展示 HR-T3-114 的一次运行：gemini-3.8-flash 在 DeepSeek Harness 0.2.2-rc.1 里完成任务，细则得分 0.745（79/106）。

网站上原有的 HR-T3-114 视频（`assets/video/hr-agent-replay.mp4`）展示的是另一次运行。这一版是新写的分镜，没有沿用那次运行的任何结论和数字，画面里也不出现其他模型或其他运行。

几个叫法：

- **引擎**：财务、HR 回放视频共用的离线渲染程序（Python + skia-python），在 `engine/` 下。
- **分镜**：`story/hr.py`，每个镜头一句旁白，旁白里的 `{标记}` 是画面动作的时间点。
- **运行数据**：`data/hr.json` 和 `data/hr.requests.jsonl`，画面上的请求数、工具调用、时间、token 都从这里读。

## 1 成片

| 项目 | 值 |
| --- | --- |
| 成片 | `assets/video/hr-t3-114-gemini-dsh-replay.mp4`，封面 `…-poster.jpg` |
| 规格 | 1920×1080，30 fps，H.264 + AAC |
| 时长 | 5 分 0.7 秒（9,020 帧） |
| 镜头 | 30 个，分 5 章：TASK、AGENT、HARNESS、CHECK、RESULT |
| 旁白 | edge-tts，`en-US-AriaNeural`，语速 +12%（与财务、HR 视频相同），只有英文字幕 |
| 引导角色 | 首页机器人，手持网站竞技场里 DeepSeek Harness 对应的武器（`blaster-q.glb`） |

## 2 每类数字从哪来

- **运行记录**：请求数 86、工具调用 85、各步时间、退出码、token、打开文件的顺序、两份交付物的大小和表数、34 条细则的判定、得分。运行数据由 `reconstruction/build_soc_data.py` 从该次运行的回放记录生成。
- **已确认的网页文案**（`网页文案-经济与社科.md` 第 5、7 节）：情境、五处未结清的事项、六条合同门槛、各项金额、行为达标的三种口径、合并与逐中心的净变化、各条细则的含义。
- **编辑加工**（视频里都有标注，或在 `provenance.json` 里写明）：
  - 左栏的九个「运行阶段」是按记录的步骤时间划分的，这次运行没有写计划。
  - 「退出码非零」取自 Harness 在失败命令结果末尾追加的 `[exit code: N]`，共 2 次（第 509.3 秒的 NameError，第 1072.2 秒的 IndexError）。
  - 第 9 镜头卡片上的文件内容、第 26 镜头引用的备忘录措辞，是中文原文的英文转述。

## 3 没有放进来的内容

- **题目输入文件的行**。运行数据里不含命令全文、工具输出和模型的思考文本，因为工具输出会引用受限输入文件的内容。只保留：步骤序号、起止时间、工具名、智能体自己写的一行说明、命令里出现的输入文件名、退出码。
- **其他模型和其他运行**。裁判模型在画面上只写「a separate model」。
- **密钥**。工程里没有任何密钥。

## 4 相对 HR v3 引擎改了什么

完整差异见 `ENGINE-CHANGES.patch`（对 `video-demo/sources/hr/` 里 v3 源工程的 `engine/` 做的 diff）。

- **写死的运行信息改为从分镜读取**：Claude Code、qwen3.7-max、TodoWrite、Harbor 0.20.0 这些原来写在引擎里的文字，现在由 `story/hr.py` 的 `CONF` 提供，默认值不变。涉及 `panels.py`、`scenes.py`、`scenes_x.py`、`rundata.py`。
- **新场景** `engine/scenes_soc.py`：四个中心、三个工作包、五处未结清事项、六条门槛、三种口径（AGENT 和 CHECK 两章各用一次）、三包验收结论、逐中心对比与来源索引、备忘录措辞、复盘。
- **图表适配更长的运行**：时间轴刻度在超过 600 秒时改为每 180 秒一格；上下文曲线的纵轴上限可由分镜指定（这次是 230,000）。
- **字标**：改为网站现在的「Global Metacase Challenge」（`brand.py`），页眉里相应缩小。
- **引导角色的武器**：`robot/sprite.html` 改为按参数选择武器，`robot/make_sprites.sh` 用 DeepSeek Harness 的 `blaster-q.glb` 重新渲染了 362 张素材。
- **提示点**：`guide_targets.py` 增加 s00 到 s30 的目标框。

## 5 验收

| 检查 | 结果 | 记录 |
| --- | --- | --- |
| 引导几何（`engine/check_guide.py hr`） | 9,020 帧、88 个提示点全部通过，激光与机身无交叉，机器人底部最低 888.3 px | `guide-geometry-qa.json` |
| 画面中文扫描（`reconstruction/cjk_scan.py`，每 5 帧一次） | 0 条含中文的文字上屏 | `cjk-onscreen.json` |
| 文字停留时间（`reconstruction/text_timing.py`） | 22 处后出现的文字都满足「至少 0.3 秒 + 词数 ÷ 4」 | `text-timing.json` |
| 静帧审看 | 30 个镜头每个至少看过一张静帧，改过的镜头重看 | 未存档 |
| 成片帧数、帧率、分辨率 | 渲染结束时由 ffprobe 核对 | `render-receipt.json` |

没有做的：没有人工从头到尾看过、听过成片。

## 6 重新渲染

需要 Python 3.12、FFmpeg。在本目录下：

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements-render.txt
.venv/bin/python -X utf8 engine/render.py hr --workers 2
.venv/bin/python -X utf8 engine/package_soc.py
```

- 直接使用 `build/hr/voice/` 里缓存的 30 段旁白和 `build/hr/voice.json`。只有改了旁白才需要运行 `engine/voice.py hr`（要装 `edge-tts`，需联网）。
- 这次是在 macOS 上渲染的：等宽字体用系统的 SF Mono，符号用系统字体；实际用到的字体记录在 `font-selection.json`。
- 重新生成机器人素材：`bash robot/make_sprites.sh`。要求本工程和网站仓库的工作副本放在同一个上级目录下，并装有 Node、`playwright-core` 和 Chrome。

## 7 内容边界

- 这是对一次已有试跑的编辑回放，没有重新运行智能体，也没有重新评分。
- 任务的全部主体与数据为合成。得分是一次试跑的细则得分，不是准确率，也不是排名。
- 本题有 6 条扣分项，没有红线。
