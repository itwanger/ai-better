# 视频画面规范

Claude Code（`ergo-remotion-video` Skill）和 Codex 制作二哥视频，画面都按这里的入口执行。目录和命令见 [WORKFLOW.md](WORKFLOW.md)。

## 当前风格

以 [用户偏好](https://github.com/itwanger/toBeBetterJavaer/blob/master/.claude/skills/ergo-remotion-video/references/USER_PREFERENCES.md) 为准，要点如下：

- 暖米色背景、顶部完整章节导航、底部单行字幕和按章节分段的进度条，场景按段落短淡入切换。
- 左上显示用户确认的本视频主题，前半深色、后半蓝色；所有章节一致，不自行换成栏目名或另拟概括。
- 全片一套色调，颜色只从共享色板 `C` 取：蓝色主色，铁锈橙强调，绿色只表示正确，深色写正文，灰色写次要信息。
- 自制图示需要分组边界时用共享 `card`：直角、蓝色细边、无模糊的灰色偏移阴影，外框与内边距对齐。字体按用户偏好执行：常规标签 34px，分组标题 40px / 字重 600，字幕独立保持 39px；不把全部主体字放大加粗。数据场景用 `Cards.tsx` 的分格进度条、排行表和便签结论卡。
- 画面不复述字幕整句，信息来自对象、关系和步骤。
- 截图或插图外不新增网站、作者、发布日期、版本、“原文 / 定价例子”等出处行，顶部、底部、另造窗口标题都不加；来源写入项目记录，原图自带内容保留。配音已说明的原理、关系与结论不用短句再写一遍；保留辨认对象与读取数据所需的文字，删字后回收空间、重新对齐。
- 真实截图、录屏和原稿插图优先在原图内框选、淡化无关区域、贴简短标签；必要时用 `FigureFocus` 聚焦，保持完整因果关系。说明列只在需要额外译文、独立解释或对照时使用，删掉后重新居中主体。原图能讲清机制时，沿原图顺序做高亮、流动与转场。
- 原文接数据对比时，先框出原文对应表述，再展开图表；可用左原文、右侧上下对比的布局。原文小字难读且上下留白过多时，用足纵向空间、聚焦完整段落，或重新采集官网真实窄屏高分辨率截图；不把低清图硬拉大。参照[已认可第二章](https://github.com/itwanger/toBeBetterJavaer/blob/master/.claude/skills/ergo-remotion-video/references/APPROVED_CH2.md)。
- 发送、汇合、失效等机制用实际动作推进，避免只有文字框和静态箭头；场景按完整意思切换。布局、动效与成帧参考 Skill 中的[已认可第一章](https://github.com/itwanger/toBeBetterJavaer/blob/master/.claude/skills/ergo-remotion-video/references/APPROVED_CH1.md)。
- 审片先逐项核对新增文字的用途，再检查字号、对齐和播放；检查关系是否由对象变化表达，不能靠补解释短句通过。

样张：[examples/Cards.example.tsx](remotion/examples/Cards.example.tsx)，渲染命令写在文件开头。
