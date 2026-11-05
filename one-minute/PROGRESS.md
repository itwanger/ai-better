# Vibe 知识大赏 · 制作进度

## 阿基米德原理（docs/src/ai/one-minute/archimedes-principle.md）

- 当前阶段：④ 第 1 章经纳米 Work 交付、Codex 优化，有声 Studio 预览待用户审核；未导出。
- 当前章 / 已通过章节：第 1 章 / 无；第 2–4 章尚未实现。
- 预览：http://localhost:3125/Chapter1Preview?review=codex-v2 （0–27.133 秒，beat 1–5）。
- 文稿与配音沿用已确认版本；完整配音 92.204 秒。本轮只优化画面，字幕和声音哈希未变。
- 主要修正和验证：等尺寸排水轮廓、入水与示数联动、受力箭头比例、标签避让、公式下标；完整第 1 章原速播放与音频信号检查、手机缩图检查通过。用户主观审片与听感仍待确认。
- 详情：script/one-minute-archimedes-principle/PROGRESS.md 与 review.json。下一步等待用户审核当前章。

更新：2026-11-04

## 阶段⑤ 已出片（2026-11-04 10:30–10:36）

**当前阶段：⑤ 已出片，验收通过；用户主观审片与听感确认仍待完成。**

用户明确要求由 DeepSeek Harness「新开一个线程」出片。已用电脑控制（Quartz `CGEvent`）在 DSH 点击「新会话」、粘贴并发送阶段⑤指令，由 DSH 新会话「执行阶段五出片与验收」执行 `remotion.mjs render --project script/one-minute-ohms-law --detach`（pid 2037），并轮询到 `Final MP4:` 后运行 `verify_export.py` 与 `one_minute.py check`，DSH 最终回复「导出成功」。

- 成片：`ai-better/script/one-minute-ohms-law/output/one-minute-ohms-law.mp4`，6,913,166 字节，sha256 `fca888c9952f866fc757d4d82ba95bf52342ec4e08b4c2035bbd5df6a8a1bb29`；97.566667 秒 / 2927 帧 / 1920×1080 30fps / h264 + AAC。
- 验收：`fullDecodeErrors=false`；6 个有声窗口波形相关性 0.999990–0.999997；`one_minute.py check` status `passed`，errors/pending/warnings 全空；`preview/export-check/report.json` 已生成。当前会话独立复跑 ffprobe、全解码与 check，结果一致。
- 导出的是 Codex 复核后版本（41 组字幕、69 事件），文字稿、配音、字幕文本、分镜与画面代码均未改动；`project.json` 的 `progress` 仍只有 `script`；未提交、未推送、未发布。
- 完整证据：`review.json` 的 `stage5Export`、`OUTLINE.md` 文末阶段⑤段、项目 `PROGRESS.md`、`assets/references/visual-provenance.json`。
- 注意：出片授权**不等于**配音听感认可或整片预览已通过；用户主观审片、真实设备听感、逐章确认与 `progress.done.audio` 仍待完成。
- 附带提示：DSH 报告自己额外编辑了 `.claude/skills/ai-article/sucai.md`（+41 行「Computer Use 控制」素材），这超出了本次下达给它的任务范围，需用户确认是否保留。

更新：2026-11-04 10:40

## Codex 独立复核与返修（2026-11-03 夜间）

用户授权睡觉期间监控、交付后检查并接手修复。现已完成整片技术复核与返修，详见 `codex-review.md`；原交付保存在 `preview/codex-review/workbuddy-original/`。字幕由31组调整为41组，原文/配音/69个事件不变；电流按速度表现、三节电池实际接入、控制变量、公式换位避让及字号已修正。最终版本完整1x播放、实际音频信号、音画同步与字幕边界已检查。以下 WorkBuddy 历史记录中的“未重跑整片播放”、固定两节电池与点密度说明已由这次复核取代；主观听感和用户确认仍待完成。保留 http://localhost:3123/OneMinuteOhmsLaw?review=codex-v2 ，当时未出片、未提交、未推送、未发布（成片已于 2026-11-04 10:35 导出，见文首阶段⑤）。

## 欧姆定律（docs/src/ai/one-minute/ohms-law.md）

- 当前阶段（历史记录，已被文首阶段⑤取代）：④ **第 1–4 章孟菲斯版已连续制作完成，整片有声 Studio 预览待用户确认；当时未导出 MP4**。用户以「继续完成后面几个章节吧，但不要出片」授权跳过逐章等待、连续完成第 2–4 章，并明确禁止出片。该授权不等于配音听感认可，也不等于任何一章已通过；项目 `progress` 仍只有 `script`。
- 当前章 / 已通过章节：第 1–4 章均已制作并交付预览，但**全部待用户确认** / 已通过章节：无。
- 制作项目：`ai-better/script/one-minute-ohms-law/`（经软链对应统一稿件目录）。
- 预览入口：整片 `http://localhost:3123/OneMinuteOhmsLaw`（2927 帧 / 0.000–97.567 秒 / beat 1–13）；分章 `Chapter1Preview`(0/809)、`Chapter2Preview`(809/772)、`Chapter3Preview`(1581/838)、`Chapter4Preview`(2419/508)，均已注册。Studio 22:38 重启后 PID 6760，静态前缀 `/static-140999ccc5a3`，日志 `preview/studio/studio.log`。3121 属于上一期 Newton 项目，未复用、未停止。**热更新后必须重新加载预览页**，旧缓存页会 404。
- 阶段④产物：`remotion/src/Chapter1.tsx`（场景 A–K 全部实现，单一绝对帧时间轴）、`remotion/src/Root.tsx`（5 个 Composition）、`remotion/src/memphis-palette.ts`、`remotion/src/huashu/runtime.ts`（commit `8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c`）、`assets/references/ch1-spec.json` / `ch1-phrase-timing.json`（31 组字幕 + 69 事件 + 2927 帧）/ `visual-provenance.json`、`review.json`、`OUTLINE.md`、`preview/chapter{1,2,3,4}/`、`preview/fullfilm/`、`preview/thumbnails/`。
- 第 2–4 章实现：D 符号与公式、E 三组整数示例、F/G 两组实验读数白板、H 误差范围内满足、I 左右两组状态对照、J 适用边界（金属导体 / 气体导电 / 二极管保留对象身份）、K 任意两个求第三个 + `DG.morph` 形变收尾到 `R = U / I`。公式作为跨场景独立层（D/E 常驻、F/G 隐藏、H 与 J/K 复现）；电路身份贯穿全片，实验一/二只改变电荷点密度与指针状态。
- 音轨与字幕：整条 `build/voiceover.wav`（97.553208 秒）以 `Audio startFrom={reviewOffset}` 接入，各章帧 0 对应全片 offset 帧，哈希后缀 `4a0bd45d0573e034`；字幕按绝对帧查 `ch1-phrase-timing.json` 的 31 组短语，48px 单行。
- 已做检查：`typecheck` 多次通过；五个 Composition 均成功渲染静帧；第 2–4 章关键帧 22 张、整片衔接/收尾帧 7 张、beat 5–13 起音帧 9 张；390px / 740px 缩图复核；章边界 808/809、1580/1581、2418/2419、2926 无黑屏或重复；字幕随绝对帧正确切换，证明 `reviewOffset` 映射正确。Studio 页面与 WAV 均 HTTP 200，四个章起点各 1 秒实测 mean −17.0 / −17.0 / −16.1 / −15.4 dB，全片 −17.1 dB / max −1.2 dB；22:37 的 Web Audio `AnalyserNode` 实测 RMS 0.160–0.214 结论沿用（音频文件与 Studio 服务未变）。
- **本轮未做**：未重跑浏览器端 1x 整片播放采样（Remotion 内部 CDP 封装 `newPage` 需额外参数）；不把静帧与电平分析冒充实际播放验收。整片主观听感仍以用户审片为准；若内置预览面板自身不输出音频，请用系统浏览器打开同一链接复听。
- 历史：22:37 修复 Studio 因 `NODE_OPTIONS` 文件代理 / broker socket 失效导致页面与音频 500 的「播放无声」故障（重启为无代理注入，补测 Web Audio 真实波形）；22:46 依用户返修「一节电池时不该给两节电池留位置，不然电路是不通的」删除空槽与缺失导线，改为任意帧回路闭合、第二节电池以不透明卡片滑入覆盖连续导线一段完成串联。
- 阶段③产物：`OUTLINE.md`，11 个场景 A–K 覆盖 0–2927 帧，4 个审片章节 `[0,809)`、`[809,1581)`、`[1581,2419)`、`[2419,2927)`；主要语法「同一场景的状态推进」，全部语音锚点取自逐词对齐。
- 阶段②产物：完整配音 `build/voiceover.wav` / `.mp3`；13 个意群，二哥音色 `S_j97bqlje2`、speedRatio 1.0；`script.md`、`article.md`、`spoken.txt`、`beats.json`、`narration-lock.json`；`build/cues.json`、`chapters.json`、`durations.json`、`timeline-manifest.json`、`audio-generation.json`；`preview/chapter1-asr.json`、`ch1-forced-alignment.json`；改稿记录 `assets/references/narration-revision.md` 与 v1 备份 `build/narration-v1-backup/`。
- 待用户核对：四章画面、动作节奏、字幕分组与孟菲斯配色；配音中 U / I / R 字母读音、「简单总结下」一句与整体听感。用户此前只说「下一步」，未给试听结论；`progress` 仍只有 `script`，`audio` 未标记。无头浏览器不能替代真实设备主观听感。
- 未完成（历史记录；MP4 导出、`verify_export.py` 与 `one_minute.py check` 已于 2026-11-04 完成）：把任一章标记为用户已确认通过、配音听感认可、`progress.done.audio`、用户主观审片；未提交、未推送、未发布。
- 下一步：用户审片 + 真实设备复听成片；如需重出片，须修改画面/字幕后重新走阶段⑤。普通「继续」不推断通过或授权。

更新：2026-11-03 23:17
