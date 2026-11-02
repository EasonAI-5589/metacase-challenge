# Metacase 评测框架（Harbor 600 题）与官网优化交接 (2026-11-02)

- To: 浩哥（江浩）　From: Eason（郭奕辰）
- Repo / branch:
  - 评测框架主干：[`EasonAI-5589/metacase-harbor` (`dev-metacase-benchmark`)](https://github.com/EasonAI-5589/metacase-harbor/tree/dev-metacase-benchmark)　Commits: [`77cb990...33782d7`](https://github.com/EasonAI-5589/metacase-harbor/compare/77cb990...33782d7)
  - 实测榜单分支：[`EasonAI-5589/metacase-harbor` (`dev-results`)](https://github.com/EasonAI-5589/metacase-harbor/tree/dev-results)　Commit: [`252df2c`](https://github.com/EasonAI-5589/metacase-harbor/commit/252df2ca428fdfba35e59ff9ea030ec9d00329fe)
  - 挑战赛官网：[`EasonAI-5589/metacase-challenge` (`main`)](https://github.com/EasonAI-5589/metacase-challenge/tree/main)　Commit: [`cefd87b`](https://github.com/EasonAI-5589/metacase-challenge/commit/cefd87bb44155d86528f452ceefb6992bdc9b9fe)
- Other places: 官网线上预览 [`easonai-5589.github.io/metacase-challenge/index.html`](https://easonai-5589.github.io/metacase-challenge/index.html)

## Conclusion
Metacase 基准已完成三赛道各 200 题（共 600 道高难题、18 个子类）的数据对齐与冻结，并在内网服务器上用百炼（DashScope）挂起了 3 个主力国模 × 6 套 Harness（外加多模型组合）的首批评测（目前已落盘 372 个 trial 结果）。请浩哥帮忙：（1）Review 评测框架与 Harness 适配代码；（2）在 `macstud` 上用百炼 Key 和 OpenRouter Key 接力挂跑剩余的 600 题全量批次与海外模型对照；（3）按你的想法直接推进挑战赛官网（`metacase-challenge`）前端与榜单展示优化。

## What was done
| # | Item | Evidence | Status |
| --- | --- | --- | --- |
| 1 | 三赛道题库对齐为 `200:200:200 = 600` 题（`econ` 200 / `fin` 200 / `soc` 200，共 18 个二级子类） | [`metacase/summary.json#L1-L13`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/metacase/summary.json#L1-L13) / [commit `91bcff1`](https://github.com/EasonAI-5589/metacase-harbor/commit/91bcff1) / [SAB 对齐 `0b869a0`](https://github.com/EasonAI-5589/metacase-harbor/commit/0b869a0) | 已推送 `dev-metacase-benchmark` |
| 2 | 预挂载 6 套单模型 Harness（`opencode`、`claude-code`、`terminus-2`、`mini-swe-agent`、`openhands-sdk`、`codex`）及 2 套跨模型组合 Harness（`combo-opencode`、`combo-claude-code`） | [`harnesses/prebaked.py#L33-L119`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/harnesses/prebaked.py#L33-L119) / [`scripts/run_bailian_3track_unit.sh#L63-L92`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_bailian_3track_unit.sh#L63-L92) | 已验证容器内只读挂载 `/opt/agents` |
| 3 | 百炼三赛道 3 国模（`qwen3.8-max`、`deepseek-v4-pro`、`kimi-k3`）× 6 Harness 批量调度器与 372-trial 首批实测榜 | [`scripts/run_bailian_3track_campaign.sh#L27-L93`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_bailian_3track_campaign.sh#L27-L93) / [`notes/reports/bailian-3track-campaign-20261102.md#L1-L37`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-results/notes/reports/bailian-3track-campaign-20261102.md#L1-L37) / [`LEADERBOARD.md#L1-L33`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-results/results/bailian-3track-20261102/LEADERBOARD.md#L1-L33) | Core 集已跑通（`qwen3.8-max + opencode` 三赛道均分 72.6%），产物已推 `dev-results` |
| 4 | OpenRouter 评测包装器与 Dev100/多模型批量脚本 | [`scripts/run_harbor_openrouter.sh#L1-L16`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_harbor_openrouter.sh#L1-L16) / [`scripts/run_dev100_openrouter_campaign.sh#L1-L68`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_dev100_openrouter_campaign.sh#L1-L68) | 已就绪，可在 `macstud` 直接注入 Key 启动 |
| 5 | 挑战赛官网同步 600 题（200:200:200）口径与首页/Challenge 页展示 | [`index.html#L1-L30`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/index.html#L1-L30) / [`challenge.html#L1-L30`](https://github.com/EasonAI-5589/metacase-challenge/blob/main/challenge.html#L1-L30) / [commit `cefd87b`](https://github.com/EasonAI-5589/metacase-challenge/commit/cefd87bb44155d86528f452ceefb6992bdc9b9fe) | 已推送 `main` 并上线 GitHub Pages |

## Decisions and why
- **算力与调度分流（内网服务器 vs `macstud`）**：原百度开发机已下线，内网服务器需内网环境访问；因此浩哥侧的补跑与全量扩展统一挂在 `macstud` 上执行，直接复用已有的百炼（`DASHSCOPE_API_KEY`）与 OpenRouter（`OPENROUTER_API_KEY`）双通道。
- **预挂载只读工具链（`harnesses/prebaked.py`）**：避免每个 Harbor 任务容器启动时重复执行 `apt/npm/pip` 安装，直接将宿主机的 `/opt/agents` 只读挂载进容器，保持上游 Harbor Agent 逻辑零侵入。
- **官网迭代自主权**：`EasonAI-5589/metacase-challenge` 已完成 600 题口径对齐，后续视觉/交互/榜单呈现由浩哥按自己想法直接优化或调度 AI Agent 推进。

## How to reproduce / use (on `macstud`)
```bash
# 1. 克隆评测框架仓库并安装锁定依赖
git clone --branch dev-metacase-benchmark https://github.com/EasonAI-5589/metacase-harbor.git
cd metacase-harbor && uv sync --frozen

# 2. 查看已跑完的 372-trial 实测榜单分支
git fetch origin dev-results && git show origin/dev-results:results/bailian-3track-20261102/LEADERBOARD.md

# 3. 跑百炼单单元或全量 600 题（需在 ~/.config/inferencenet/providers/aliyun-bailian.env 配置 DASHSCOPE_API_KEY）
#    用法：scripts/run_bailian_3track_unit.sh <econ|fin|soc> <harness> <model_spec> [concurrency] [core|full200]
bash scripts/run_bailian_3track_unit.sh econ opencode qwen3.8-max 2 core
bash scripts/run_bailian_3track_unit.sh fin openhands-sdk deepseek-v4-pro 2 core
bash scripts/run_bailian_3track_campaign.sh   # 跑完整 Stage 1-3 + Wave 2 (full200)

# 4. 跑 OpenRouter 通道任务
export OPENROUTER_API_KEY="sk-or-v1-..."
./scripts/run_harbor_openrouter.sh --registry-path metacase/registry.json -d metacase-fin@v1.0 -a terminus-2 -m openrouter/openai/gpt-5.6-sol -n 2 --yes
```

## Open items and who decides
| Item | Evidence | Needs |
| --- | --- | --- |
| 1. 补齐 Stage 3 剩余 `econ`/`soc` 单元格与 Wave 2 (`full200`) 全量 600 题 | [`LEADERBOARD.md#L15-L22`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-results/results/bailian-3track-20261102/LEADERBOARD.md#L15-L22)（`openhands-sdk`/`codex`/`mini-swe-agent` 部分 `pending`） | 浩哥在 `macstud` 排期挂跑 |
| 2. Review 评测协议与预挂载 Harness 代码 | [`harnesses/prebaked.py#L1-L142`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/harnesses/prebaked.py#L1-L142) / [`scripts/run_bailian_3track_unit.sh#L1-L140`](https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_bailian_3track_unit.sh#L1-L140) | 浩哥 Code Review |
| 3. 挑战赛官网（`metacase-challenge`）体验与榜单页优化 | [`EasonAI-5589/metacase-challenge`](https://github.com/EasonAI-5589/metacase-challenge/tree/main) | 浩哥按想法推进优化 |

## Message to send (WeChat)
```text
浩哥，Metacase 基于 Harbor 的评测框架、600 题对齐配置和官网代码我都整理好推上去了，链接都在下面，你直接拉下来 review 并在 macstud 上接力挂就行：

1. 评测框架与 600 题题库（econ/fin/soc 各 200 题、18 个子类）：主分支是 metacase-harbor 的 dev-metacase-benchmark，里面配好了 3 个国模（qwen3.8-max、deepseek-v4-pro、kimi-k3）× 6 套单模型 Harness（opencode、claude-code、terminus-2、mini-swe-agent、openhands-sdk、codex）和 2 套跨模型组合的调度脚本，你可以先帮我 review 一下代码：
- 评测框架分支：https://github.com/EasonAI-5589/metacase-harbor/tree/dev-metacase-benchmark
- 600 题分布汇总：https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/metacase/summary.json#L1-L13
- 6 套预挂载 Harness 与跨模型组合：https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/harnesses/prebaked.py#L33-L119

2. 已跑出的 372 个 trial 成绩与 macstud 接力脚本：我在内网机上用百炼跑完了 core 集的前两阶段（qwen3.8-max + opencode 三赛道均分 72.6%），结果推在 dev-results 分支了。剩下的 openhands-sdk / codex 在 econ、soc 上的 pending 项，还有 Wave 2 的 full200 全量 600 题和 OpenRouter 评测，你在 macstud 上用那两个 key 直接挂就行：
- 372-trial 实时榜单：https://github.com/EasonAI-5589/metacase-harbor/blob/dev-results/results/bailian-3track-20261102/LEADERBOARD.md#L1-L33
- 百炼三赛道批量脚本：https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_bailian_3track_campaign.sh#L27-L93
- OpenRouter 启动脚本：https://github.com/EasonAI-5589/metacase-harbor/blob/dev-metacase-benchmark/scripts/run_harbor_openrouter.sh#L1-L16

3. 挑战赛官网仓库（已同步 600 题口径，你按自己想法或者让 AI 继续优化就行）：
- 官网源码仓库：https://github.com/EasonAI-5589/metacase-challenge/tree/main
- 线上预览：https://easonai-5589.github.io/metacase-challenge/index.html
```

