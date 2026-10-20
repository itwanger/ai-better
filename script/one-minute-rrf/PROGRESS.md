# RRF 制作进度

2026-10-20，当前为阶段④ layout-v5 返修。用户反馈规则段元素分散、向量未命中A应保留文档身份、最终分组括号方向错误。

## 当前 layout-v5 三处修正

- 规则段改为同一水平计算流程：名次→倒数计分→本路贡献，参数k=60位于公式下，未命中A→0使用同列下方例外行。形变轮廓从公式下方通过，不覆盖分子分母与参数。
- 向量未命中项保留A字和同色文档轮廓，降低明度，未命中状态放在文档下面；没有第3名数字，贡献仍为0。
- 右侧B/C分组改成右花括号，开口向左包住两行；右侧“2路命中”文字保持正常方向。上游库未改，仅在本条场景镜像绘制括号。
- 文字稿、字幕、声音配置与完整原音频均未改，与3c6bb0f逐字节一致，证据preview/layout-v5/preserved-inputs.json；原配音66.130167秒，1984帧/30fps。
- 本轮前源码备份在backups/before-three-layout-fixes-20261020-095154/，前版完整源码与视频可从Git提交3c6bb0f回退。
- 最新预览目标：preview/layout-v5/rrf-layout-v5-review.mp4；中间渲染文件rrf-layout-v5-render.mp4不作交付。Studio复用http://localhost:3211/OneMinuteRrf，已播放检查规则段及后续，交付停在规则段；预览服务保持后台运行。
- 最新完整预览已通过全解码、6个有声窗口波形同步（相关度>0.99997）及one_minute.py媒体检查，1920×1080、30fps、1984帧、66.133333秒。检查记录为preview/layout-v5/export-check.json与review-checks.json；独立审片记录为审片/layout-v5-independent.md。
- 本轮仍停留在阶段④，正式导出需要用户另行推进。

## 前版 v4 记录

## 已认可版备份与推送

- 花叔动画 v3：ai-better 提交 e0d1ef0，已推送 origin/main；Skill 提交9d6627245，已推送 origin/master，均核对远端哈希。
- 完整回退包：/Users/itwanger/Downloads/rrf-huashu-v3-approved-before-ergo-palette-20261020.zip，解压校验通过。
- v3原预览保留于 preview/huashu-v3/rrf-huashu-1080p-review.mp4；更早版本在 c39d56b、8a6b3f8ff 和本地旧备份中。

## 本轮 v4 修改

直接导入 shared/remotion/components 的色板 C：暖米色背景、蓝色主色、铁锈橙强调、深色正文，字幕深底浅字；A铁锈橙、B蓝、C深色，绿色保留正确/通过语义。花叔的对象形变、路径、运镜和排序时点保留，没有改成卡片翻页。

删除开场“怎么合成一份榜单？”以及原始分数段、排序段、边界段与字幕近义的整句解释/结论。保留检索类型、文档名、名次、公式、数值与短状态。字幕26组保持原文，解释由旁白和字幕承担，图形承担因果。

完整稿件、spoken.txt、beats.json、声音配置、锁文件、短句时点和三份完整原声文件，与 e0d1ef0 逐字节一致，证据在 preview/ergo-v4/preserved-inputs.json。原声66.130167秒，整片1984帧/30fps=66.133333秒；不删字、不加速、不替换音色。原有 beat4“1除以”、beat8“RRF”的试听待核对记录保留，本轮不重配也不重锁。

## 最新预览与检查

- 本轮交付：preview/ergo-v4/rrf-ergo-v4-review.mp4，1920×1080、30fps、1984帧、66.133333秒。
- 完整解码通过；6个有声窗口与原配音波形相关度均>0.99997；one_minute.py check --media通过，保留超出60秒目标提醒。
- verify_export 原始报告 preview/ergo-v4/export-check.json，总检查记录 preview/ergo-v4/review-checks.json。
- Studio继续复用独立后台服务 http://localhost:3211/OneMinuteRrf；已观察正常速度播放、画面/字幕随时间推进、音轨未静音。开场证明截图 preview/ergo-v4/studio-proof.png。保留服务供用户查看，不等待服务退出。
- 独立审片记录：审片/ergo-v4-independent.md。关键帧与完整视频抽样检查、听感边界分别记录，不以静帧冒充完整听感验收。
- 中间文件 rrf-ergo-v4-render.mp4 不是交付件；交付版本已按二哥管线复用原配音重新封装并验证同步。

## 后续

本轮仍为阶段④，用户查看新版后说“下一步”再正式导出。Skill已同步二哥色系与字幕去重规则，下载包为 /Users/itwanger/Downloads/one-minute-remotion.zip。Git仅提交本任务文件，其他文章、课件、共享读音词典与视频目录改动保留。
