# FIN-T1-003 财务回放 v3（Metacase 版）

对应 [issue #64](https://github.com/EasonAI-5589/metacase-challenge/issues/64)。底稿是 guide-aligned v2 源工程（`InferenceNet-FIN-T1-003-guide-aligned-v2-source.zip`，SHA-256 `e0fc91dc…bc3`），只做三件事：换引导角色、只留英文、片头片尾和标头换成 Metacase。案例事实、旁白（第 34 句除外）、93 个提示点、章节结构、所有数字和评分都没动，没有重跑，也没有重评。

## 改了什么

**1. 引导角色：首页机器人持 Claude Code 枪**
- `robot/sprite.html` 用网站的 three.js、`mc-kit.js` 的 `robot()`（白色机身、青色眼睛）和竞技场里 Claude Code 对应的 `blaster-e.glb`，按首页灯光渲染透明素材。瞄准角从 -90°（向下）到 +90°（向上）每 1° 一张，睁眼、眨眼各一套，共 362 张，存放在 `robot/sprites/`。`sprites.json` 记录了每张图的枪口、握把、脚底和头顶坐标。
- `robot/render_sprites.mjs` 用无头 Chrome 批量导出这些素材（需要 Node 和 `playwright-core`，用本机 Chrome）。重新生成时，把网站仓库和本工程放在同一个父目录下，从父目录起一个静态服务：

  ```bash
  python3 -m http.server 4190 --bind 127.0.0.1   # 在同时包含 inferencenet-challenge-website/ 和 video-work/ 的目录
  node robot/render_sprites.mjs --out robot/sprites --angles -90:90:1 --size 400
  ```

- `engine/reference_robot.py` 替代 `reference_pet.py`，接口不变：机器人站在宠物原来的落脚点，按目标方向选择最接近的角度素材。目标太近、枪口会碰到目标时，机器人沿水平方向后退，最多退 90 px，退的距离连续变化。原来的指挥棒换成从枪口射出的瞄准激光，颜色仍取目标的颜色。没有目标时（停靠姿态）不显示激光。
- `engine/guide.py` 的路线、提示点和时钟都没改，只换了角色、阴影位置、尘埃颜色和激光的显隐。

**2. 只留英文**
- 不再烧录中文字幕，每句只保留一行英文。只交付 `docs/captions.en.srt`。
- 画面上的中文统一经过 `story/fin_en.py` 的 `GLOSSARY` 换成英文后再排版（挂在 `engine/gfx.py` 的 `text()` / `measure()` 上）。这张表就是中英对照表，共 69 条，覆盖文件名、待入账登记、委托书、工作表名、会计分录和代码里的列名。编号、日期、金额和代码不翻译，所以每个数字都能追溯到原文件。
- 任务卡片和开场画面里的中文副标题，以及“What the brief asks”里引用中文原文的灰字，翻译后会和上面的英文重复，英文版不再显示。
- 逐帧扫描全片的上屏文字，结果没有中文字符。

**3. 片头片尾和标头**
- `engine/brand.py`：首页的 Metacase 描线标识（`.lg-anim` 的出场时序）、“Metacase Challenge” 字标（“Challenge” 用首页渐变）、“Global Metacase Initiative”，以及和首页 Hero 一致的四个校徽和 “Hosted by NTU GIFTS with HKU, SUFE and Tsinghua PBCSF”。校徽原文件放在 `brand/`，字节未改，来源见 `brand/ATTRIBUTION.txt`。
- `engine/reference_bookends.py` 保留原来的粒子汇聚和参考时钟，只换品牌元素。片尾加了官网 `easonai-5589.github.io/metacase-challenge`，保留 SUFE 署名。
- `engine/ui.py` 左上标头换成 Metacase 标识和字标，后面的小字改为 “BUSINESS ANALYSIS”。
- 字体：新增网站用的 Space Mono（OFL，`fonts/SpaceMono-400.ttf`，由网站的 `space-mono-latin.woff2` 转换而来），用于片头片尾和标头的等宽小字。

**4. 第 34 句旁白**
- 原来念的是 “Inference Net Challenge site”。现在用同一个声音（`en-US-AriaNeural`，+12%）重新合成为 “Metacase Challenge site”。其余 33 句直接用缓存。
- 新的一句短 0.192 s，全片从 8846 帧变为 **8840 帧（294.667 s）**，提示点 `site` 的时间不变。

## 验收

`python -X utf8 engine/check_guide.py` 通过（0 处失败）：
- 8840 帧逐帧检查：机器人底部最低 888.3 px，没有进入 892.5 px 以下的字幕区。激光与机器人身体没有交叉。单帧最大位移与 v2 相同（f25 的一次快速移动是原设计）。
- 93 个提示点都已核对。
- 原工程 `MANIFEST.json` 中受保护的 99 个文件没有变化。7 处有意改动登记在 `V3_INTENTIONAL` 里。其中 `story/fin.py` 做了精确核对：把第 34 句改回原文后，哈希与 v2 完全一致。

## 重建

正式成片在 Windows 上渲染（与 v2 相同的 Consolas 等系统字体）：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-render.txt
.\.venv\Scripts\python.exe -X utf8 engine\check_guide.py
.\.venv\Scripts\python.exe -X utf8 engine\render.py fin --workers 2 --crf 18
.\.venv\Scripts\python.exe -X utf8 engine\package.py fin
```

macOS 只能出预览：系统会把等宽字体换成 SF Mono。另外 Apple Symbols 缺少 ✓，`engine/fonts.py` 会依次改用 Menlo 等字体。
