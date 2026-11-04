# 清华素材已交付：由原 Claude 继续前端

两张图均已从官方站点下载，原始字节保持不变，并已放入本分支。云端无需再访问清华网站。

## 素材

| 用途 | 仓库原件 | 格式及尺寸 |
|---|---|---|
| 清华大学紫色校徽 | `assets/institutions/tsinghua-university-original.jpg` | JPEG，1400×600 |
| 张晓燕官方照片 | `assets/people/xiaoyan-zhang-original.jpg` | JPEG，2364×3072 |

下载与核验日期：2026-11-05。图片均已解码检查，并核对官方页面中的来源关系。校徽只有圆形图案，没有外置校名字标；原件有白底和较多留白。人物照片为官网原图，尚未裁为头像。请保留这两个原件，按站内样式生成使用版本。

你现有代码引用的目标文件是：

- `assets/institutions/tsinghua-pbcsf-crest.png`
- `assets/people/xiaoyan-zhang.jpg`

这两个派生文件仍由你生成并接入：校徽保持完整圆形、紫色、比例一致，处理外围空白；头像按现有惯例裁切为240×240。不要只修改文件扩展名来假装格式转换。来源已追加到两个现有 ATTRIBUTION.txt，派生文件完成后补充其处理说明。

## 最新展示要求

用户已明确是“财富中心，张晓燕教授”，之后再次纠正为“五道口金融财富管理中心”。正式名称已核实为“清华大学五道口金融学院财富管理研究中心”。前台应保留研究中心层级，不能继续沿用仅学院名、没有研究中心的旧方案。

建议中文卡片两行机构名：“清华五道口” / “财富管理研究中心”；人物：“张晓燕” / “教授”。英文对应：“Tsinghua PBCSF” / “Research Center for Wealth Management”；“Xiaoyan Zhang” / “Professor”。完整机构名和其他行政头衔不用堆在卡片内。官方职称确为金融学讲席教授 / Xinyuan Chair Professor of Finance，简写 Professor 不构成身份疑问。

请继续完成首页和 Teams 页的素材接入、相关网格与中英文展示，由你负责前端实现、视觉验收和既有发布流程。这个素材提交未改动 HTML/CSS/JS，也未合并 main。保留最新的 NTU 对齐修复。完成目标图片后运行 `node scripts/check.mjs`，并检查中英文桌面、平板、手机布局；单独交付原件不代表现有缺失引用检查已通过。

## 官方来源

- 校徽说明：https://vi.tsinghua.edu.cn/gk/xxbz/xh/bzjbzsy.htm
- 校徽原件：https://vi.tsinghua.edu.cn/__local/8/1C/21/2F02A66E31BF084FE340463BB47_B9A95F73_185BC.jpg
- 张晓燕中文主页：https://www.pbcsf.tsinghua.edu.cn/info/1018/1013.htm
- 张晓燕英文主页：https://eng.pbcsf.tsinghua.edu.cn/info/1084/2047.htm
- 照片原件：https://www.pbcsf.tsinghua.edu.cn/__local/0/74/8D/81E5407F6F92E6E90E140DE802D_269765B7_ABE85.jpg
- 财富管理研究中心介绍：https://www.pbcsf.tsinghua.edu.cn/yjjg/xyzsyjzx/yjzx/cfglyjzx.htm
- 英文中心介绍：https://eng.pbcsf.tsinghua.edu.cn/info/1291/2791.htm

## 原件 SHA-256

- 校徽：`90132d030d8a70f9d21375c85d8a0c614d44a6201ab82200067b10aca38986a8`
- 照片：`190eb959dba72cb09903481cfe3c2d278d0a1a3e805b3f96b564f79f5ed30bb3`
