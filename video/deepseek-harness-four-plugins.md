---
title: DeepSeek Harness官方点名的4个神仙级插件
---

11 月 8 日，DeepSeek Harness 发布了一则官方公告，调用 API 的用户日活已经来到了 `154` 万。更夸张的是社区生态，第三方插件数量涨到了 `3.5` 万个，10 个活跃用户中有 6 个安装或者开发过自己的插件。

![DeepSeek Harness 官方长文中的日活、日耗 Token 与第三方插件数量图表](https://cdn.paicoding.com/stutymore/dsh-four-plugins-official-stats-20261109170416-491371b7.png)

DeepSeek 官方不仅宣布要上线官方插件市场、拿 Token 资助和流量扶持插件作者，还从 `3.5` 万个插件里点名表扬了四个社区插件：自媒体工作台 `dsh-media-desk`、归藏设计 `dsh-guizang-design`、上下文洞察 `dsh-context` 和论文阅读 `agentero-dsh`。

我在 DeepSeek Harness 桌面版上把这四个插件全装了一遍，统一拿“用一句话讲清 Transformer 的注意力机制”这个选题跑了完整实测，今天就带你看看这四个插件到底神仙在哪。

恭喜看到这里的你，已经成功击败 30% 的学习者。

先看第一个插件，自媒体工作台 `dsh-media-desk`，作者是“蜗牛的科技笔记”。平时我们用 Agent，需要在对话框里一轮一轮地发提示词；装上这个插件之后，DeepSeek Harness 的左侧栏会多出一个工作台页面，里面分为灵感、内容、排期、复盘、风格五个模块。

我把选题存进灵感墙，点一下“一键成稿”，右侧工作区就会同时生成标题、正文和分镜。实测下来，它生成了 `974` 个字符的正文，把注意力机制比作查字典，把 Q、K、V 分别对应为要查的词、字典的词条和词条释义，同时配好了 `6` 个各 5 秒的分镜脚本，合计 `30` 秒。在左侧对话框输入一句“把第 3 镜改得通俗一点”，右侧对应的分镜就会实时更新。

![自媒体工作台的灵感墙、已保存的注意力机制草稿和六个分镜](https://cdn.paicoding.com/stutymore/dsh-four-plugins-media-workbench-20261109170417-17c49187.gif)

恭喜看到这里的你，已经成功击败 50% 的学习者了。

接下来看第二个插件，归藏开发的 `dsh-guizang-design`。它把网页 PPT、图文卡片、网页排版、去 AI 味和语气档案五个 Skill 打包进了同一个插件。

实测时，我点开侧栏的“归藏设计”，选择“网页排版”，只提供了两句关于注意力机制的素材，它就生成了一个“墨水经典”主题的杂志风网页《一句话理解注意力》。生成好的作品会自动登记到“我的作品”。另外，插件会把网页实际用到的中英文字形打包进网页，把网页发给别人，即使离线打开，字体和排版也不会走样。

![歸藏设计「我的作品」中的《一句话理解注意力》与插件归档的网页缩略图](https://cdn.paicoding.com/stutymore/dsh-four-plugins-design-result-20261109170419-a2188ae2.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

接下来是第三个插件，Bowen 开发的上下文洞察插件 `dsh-context`。平时我们和 Agent 对话时，看不到上下文里具体有什么，只能看到 Token 用量，却不知道是哪一部分占了大头。装上 `dsh-context` 后，有四个入口可以查看上下文的构成。侧栏的跨会话总览页、单个会话里的 Context 标签页、展示主 Agent 与子 Agent 协作关系的 Fleet 标签页，以及 `/context` 斜杠命令。

![首轮第一步上下文估算 127.8k，213 项工具占 92%，下方展开了归藏技能注入](https://cdn.paicoding.com/stutymore/dsh-four-plugins-context-first-step-20261109170420-52977199.png)

`dsh-context` 之所以能把上下文分析得这么清楚，是因为 DeepSeek Harness 在组装系统提示词、生成工具列表和发送请求时，都会通过公开的会话事件和投影接口对外提供数据。`dsh-context` 只要监听这些事件，就能实时算出各部分内容的 Token 占比。

恭喜看到这里的你，成功击败 90% 的学习者了。

接下来分享第四个插件，Phil-Fan 团队开发的论文阅读插件 `agentero-dsh`。它把科研工作台 Agentero 移植进了 DeepSeek Harness。Agentero 采用本地优先的设计，论文和笔记默认存放在自己的电脑上。插件由宿主通信、文献库、笔记和 PDF 阅读器四个子模块组成；界面中间是 Agent 聊天框，右侧是本地文献库和 PDF 阅读器。

实测时，我先在插件设置里一键安装 Agentero CLI，并选好本地论文库的目录；然后在右侧栏切换到“文献”，输入 arXiv 编号 `1706.03762`，就把《Attention Is All You Need》这篇论文 PDF 导出到了本地。打开 PDF 跳到第 `4` 页，对照缩放点积注意力的公式和配图，选中文字后可以直接翻译、高亮，或者发送到中间的对话框向 Agent 提问。

![Agentero 阅读器中的论文第 4 页、缩放点积注意力公式与保存的本地笔记](https://cdn.paicoding.com/stutymore/dsh-four-plugins-paper-and-notes-20261109170421-9cc2dcdc.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下。从这四个插件的实测就能看出，DeepSeek Harness 为什么敢把目标定为 Agent 时代的操作系统。依靠的正是底层的 Cordis 插件架构，一个插件既能在后端挂载工具、Skill 和事件监听，又能定制前端的侧边栏、主画布和右侧面板，从而把一个通用的 Agent 客户端改造成自媒体工作台、视觉设计台、上下文调试器或者科研文献库。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
## 视频封面

竖版 3:4：

![DeepSeek Harness 插件像素风竖版封面](https://cdn.paicoding.com/stutymore/deepseek-harness-four-plugins-pixel-vertical-20261109170233-64cd908d.png)

宽屏 16:9：

![DeepSeek Harness 插件像素风宽屏封面](https://cdn.paicoding.com/stutymore/deepseek-harness-four-plugins-pixel-widescreen-20261109170233-a6b6e1b2.png)

横版 4:3：

![DeepSeek Harness 插件像素风横版封面](https://cdn.paicoding.com/stutymore/deepseek-harness-four-plugins-pixel-horizontal-20261109170233-7ce1c5a3.png)
<!-- video-covers:end -->
