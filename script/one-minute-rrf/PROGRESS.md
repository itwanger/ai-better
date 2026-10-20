# PROGRESS — one-minute-rrf

## 当前任务与范围（2026-10-20）

用户要求接手并覆盖豆包制作的低质量画面。已重做分镜、动画与动态预览，完整文字稿、二哥声音和语速保留。本轮属于阶段④返修；正式1080p出片仍待用户查看新版后推进。

## 保留项

- 文字真源：`docs/src/ai/one-minute/rrf.md`（对应 `ai-better/one-minute/rrf.md`）。
- `spoken.txt`、`narration-lock.json`、`build/voiceover.wav`、`build/voiceover-with-effects.wav` 的SHA256与接手前一致。
- 旁白66.130秒；整条1984帧 / 30fps = 66.133秒。超出一分钟目标，保留全文，无删减、截断或加速。
- 原有语音待核对项保持原记录：beat4「1除以」、beat8「RRF」。本轮未重新合成或替换音色，不声称重新完成听感验收。

## 原版本备份

`backups/before-codex-redesign-20261020-091549/` 保留原 `remotion/src/`、`OUTLINE.md`、`PROGRESS.md` 以及源稿与音频哈希。

## 新版画面

- `OUTLINE.md`：以真实语音时间轴重写画面动作。
- `remotion/src/Chapter1.tsx`：替换原小卡片布局，使用深墨蓝、米白大字与稳定的文档色彩身份。
- 两路检索从同一知识库分出；不同刻度的分数条建立原始相加问题；大字号RRF和贡献公式解释共同标准。
- A、B、C的两路贡献沿曲线汇入对应总分；显示真实计算结果，避免无意义的小数滚动。
- 最终B、C向上移动，A从侧边进入第三名，避免排序卡片交叉遮挡；文字解释在重排时切换，避免两句叠印。
- 全部26条字幕逐字拼接后与 `spoken.txt` 完全一致。

## 动态预览

- 独立后台 Studio：<http://localhost:3211/OneMinuteRrf>。
- 启动记录：`preview/studio/studio.json`；启动进程PID 47372，日志 `preview/studio/studio.log`。
- 完整Composition：`OneMinuteRrf`，1920×1080、30fps。
- 浏览器已打开并正常速度从片头播放至片尾，时间推进与画面变化正常；检查了定义、公式、贡献汇合、最终换位和边界画面。交付时暂停，保留服务供用户查看。
- 720p完整预览视频：`preview/codex-v2/rrf-v2-review.mp4`，1280×720、30fps、1984帧、66.133秒，含完整原旁白。
- `preview/codex-v2/rrf-v2-preview.mp4` 为中间预览，`rrf-v2-tail.mp4` 为末段修正渲染；对外使用 `rrf-v2-review.mp4`。

## 已验证

- TypeScript检查通过；`one_minute.py check`通过，时长目标提醒如实保留。
- 原稿、口播、原音频及声音锁文件哈希未变。
- 融合排名按完整精度验证为 B > C > A；界面显示为0.0325、0.0320、0.0164。
- 预览视频全文件解码通过；视频1984帧、30fps，音轨66.130秒。
- 修正后的动态区间额外抽帧检查，实际视频帧保存在 `preview/codex-v2/video-check-*.png`；机器检查记录为 `preview/codex-v2/review-checks.json`。

## 下一阶段

等待用户查看新版预览与提出修改。用户说“下一步”后才进入⑤正式1080p导出与验收；本轮没有提交、推送或发布。
