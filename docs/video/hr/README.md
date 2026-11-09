# HR-T3-114 人力资源回放 v3（Metacase 版）

对应 [issue #64](https://github.com/EasonAI-5589/metacase-challenge/issues/64)。和财务 v3 做同样三件事：引导角色换成首页机器人（持 Claude Code 枪、带瞄准激光），只留英文，片头片尾和标头换成 Metacase。案例事实、旁白（最后一句除外）、镜头顺序和时长、所有数字和评分都不变，没有重跑 Agent，也没有重新评分。

和财务不同的是：**HR v2 的源工程没有存档**（`story/hr.py`、`data/hr.json`、`hr.requests.jsonl` 和配音缓存都找不到）。所以这一版的数据和分镜是**从已发布的 v2 视频反向复原的**，再用和财务 v3 相同的引擎重新渲染。

## 怎么复原的

- **分镜**（`story/hr.py`）：28 个镜头的编号、类型、章节、旁白和底部状态行取自 v2 的 `docs/video/hr/provenance.json`；卡片文字、文件名、状态和金额逐帧从 v2 画面转写。引擎里本来就有 HR 专用的场景（`sites`、`packages`、`edits`、`rerun`、`wpa`、`pooled`、`r32`），版式与 v2 一致。
- **运行数据**（`data/hr.json`、`data/hr.requests.jsonl`）：由 `reconstruction/build_hr_data.py` 生成。每次请求的输出 token、提示 token、工具调用和计划状态，从 v2 画面里的 Run ledger、整次运行轨迹图（h16）和上下文曲线（h17）读出。
  - **精确**：28 次请求、44 次工具调用（Bash 33、TodoWrite 4、Write 1、Read 2、Edit 4）、卡片上显示的步骤时间、屏幕上印出的 12 个提示 token 数值、输出 token 合计 33,040、评分结果和奖励值、两份交付物的大小。
  - **近似**：其余 16 个提示 token（从曲线读出并做了偏差校正），以及相邻两次读数之间输出 token 在各请求之间的分配。
  - **未知**：两份从未在画面上出现名字的 Word 输入文件（v3 也不显示），R20、R32 以外各评分项的权重。
- **配音**：用 v2 的同一个声音和语速（`en-US-AriaNeural`，+12%）重新合成。27 个镜头的起止时间与 v2 相差不超过 0.011 s。最后一句改为 “Metacase Challenge site”，比原来短 0.2 s。
- **核对**：在 v2 全片抽了 21 个 Run ledger 读数（请求数、工具调用数、输出 token、最新提示长度、已打开文件数），复原数据全部吻合（误差不超过 2 个 token）。另外在每个镜头的 35%、70%、95% 处，把 v3 静帧与 v2 原帧并排逐张比对（84 组）。
- **一处更正**：h14 的阶段标签 v2 写的是 “Bash ×8 · TodoWrite”，但 v2 自己的 ledger 显示步骤 39–46 是 7 次 Bash 加 1 次 TodoWrite，v3 改为 “Bash ×7 · TodoWrite”。

## 改了什么（相对财务 v3 的引擎）

- `engine/gfx.py`、`engine/compose.py`：画面英文对照表按任务切换，`story/hr_en.py` 是 HR 的对照表（文件名、Word 规则原文、工作表名、状态、工作包名称）。编号、金额、百分比不翻译。
- `engine/scenes_x.py`：工作包卡片只显示英文名称；“没有来源索引”那一行的工作表标签英文更长，改为自动换行；重跑对比卡里的状态文字过长时自动缩小字号。
- `engine/panels.py`：AGENT FOUND 的数值过长时缩小字号，不截断。
- `engine/guide_targets.py`：新增 HR 的提示点目标。与财务版式相同的镜头直接沿用财务的目标。
- `engine/check_guide.py`：可以指定任务（`check_guide.py hr`）。HR 没有存档基线，所以不比对帧数和源文件清单，只做几何检查。
- `engine/package_hr.py`：HR 的打包脚本，provenance 里有 `reconstruction` 一节，写明哪些是精确值、哪些是近似值、哪些未知。
- `engine/rundata.py`：登记 `data/hr.json`。

## 验收

- `python -X utf8 engine/check_guide.py hr`：7,357 帧逐帧检查，73 个提示点全部通过，0 处失败。机器人底部最低 888.3 px，不进字幕区。激光与机身无交叉。
- `reconstruction/cjk_scan.py`：每 5 帧画一次，全片没有中文字符上屏。
- 财务的 `check_guide.py fin` 仍然通过。

## 重新渲染

```bash
python -X utf8 engine/render.py hr --workers 2
python -X utf8 engine/package_hr.py
```

直接使用 `build/hr/voice/` 里缓存的 28 段配音和 `build/hr/voice.json`，不需要重新合成。
