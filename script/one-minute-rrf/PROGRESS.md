# RRF 制作进度

2026-10-20：当前进行阶段④画面返修。用户要求先提交推送旧版，再将花叔画面能力真正接入 Skill，并保留文字稿与本人声音重做本片。正式出片仍待查看本轮预览后推进。

## 已保存的旧版

- ai-better 备份提交 `c39d56b` 已推送 origin/main，含完整稿件、配音、源码及 v2 预览；远端哈希已核对。
- toBeBetterJavaer Skill 备份提交 `8a6b3f8ff` 已推送 origin/master，远端哈希已核对。
- 本机完整回退包：`/Users/itwanger/Downloads/rrf-before-huashu-20261020.zip`，解压校验通过。
- 更早豆包版仍在 `backups/before-codex-redesign-20261020-091549/`。

## 本轮保留

源稿 `one-minute/rrf.md`、`script.md`、`spoken.txt`、`beats.json`、`narration-lock.json`、`project.json`、实际短句时点和三份完整旁白文件与 c39d56b 逐字节一致；证据为 `preview/huashu-v3/preserved-inputs.json`。旁白66.130167秒，1984帧/30fps，超60秒保留全文和原语速。本轮没有重新生成语音，原先 beat4「1除以」、beat8「RRF」的试听待核对记录保持，不声称重新完成听感验收。

## 画面实现

`OUTLINE.md` 已按 t1_3b1b 语法重写。`remotion/src/huashu/` 实际接入固定版本的 MO、DG、CAM 库，公式字体/中文字体及许可在 `public/huashu-fonts/`；函数与本片动作的映射见 `assets/references/visual-provenance.json`。黑底、细轮廓、固定文档颜色，没有沿用卡片仪表盘。

名次圆形变成贡献条；同一文档的两路轮廓经空隙变形合并；A先侧移再下移归列，B/C上移形成最终榜单。贡献值和条宽由同一真实数据计算，原始分数尺子改变时量程同步。原稿中的示例结果为 A≈0.0164、B≈0.0325、C≈0.0320，排序按完整精度 B>C>A。

## 预览与审片

- 复用独立后台 Studio：<http://localhost:3211/OneMinuteRrf>，Composition `OneMinuteRrf`。不等待服务退出。PID和日志见 `preview/studio/studio.json`。
- 初稿720p候选：`preview/huashu-v3/rrf-huashu-review.mp4`，已完整解码；独立审片记录在 `审片/huashu-v3-independent.md`。它是修前候选，不作为最新交付。
- 已按独立审片修正：公式与形变通道分开；贡献轮廓绕过其他文档；排序避免同列交叉；分数条与量程实时一致；标题前后接续。`fixed-frames/` 为修正关键帧。
- 最新交付为 `preview/huashu-v3/rrf-huashu-1080p-review.mp4`，1920×1080、30fps、1984帧、66.133333秒，SHA256 `94ba19a000837d2063a3b1e709ecca8a8cbbe8d0e6943ec38d78b13835dd8604`。已完成全流解码，6个有声区间与原配音波形相关度均>0.99997；`one_minute.py check --media`通过，保留超时提醒。
- 独立审片对四组问题复查通过，修前及修后结果在 `审片/huashu-v3-independent.md`；完整检查记录在 `preview/huashu-v3/review-checks.json`，声音同步报告在 `preview/export-check/report.json`。
- 实际Studio已验证正常速度播放、帧号与画面/字幕推进、音轨未静音，并检查计算与末段。浏览器交付时暂停在最终榜单，保留后台服务；证明截图为 `preview/huashu-v3/studio-proof.png`。未声称新的全片人工听感验收。
- Remotion直接编码音轨为中间产物，最新版按原管线重新复用完整原音频封装，声音同步已核对；不要交付 `rrf-huashu-remotion-audio-intermediate.mp4`。

## 下一阶段

本轮新版修改保留在本地，先供用户查看；旧版的备份提交已经推送。不把“备份已推送”说成“新版已提交”。用户说“下一步”再进入阶段⑤正式导出；只改画面时不重新配音或重建文字锁。
