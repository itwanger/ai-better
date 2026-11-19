---
title: Gemini 4 Neon 牛啊，这次给我用爽了。
---

11 月 18 日，Google 正式发布了 Gemini 4 Neon。Anthropic 搞文艺，OpenAI 搞天文，谷歌干脆搞起了化学元素周期表，Neon 对应的就是氖，在 Gemini 4 全家桶里刚好卡在极速款 Hydrogen 和旗舰 Carbon 中间。

![](https://cdn.paicoding.com/stutymore/gemini-4-neon-review-01-release-20261119135053-fb3c174d.png)

这个模型把上下文窗口给到了 `1M`，文本、图片、音频、视频和文档都能原生读懂。最让人爽的地方在于它的平衡感，平均每秒输出 `110` 个 Token，比旗舰 Carbon 快将近一倍，价格便宜了四分之一，写代码和做推理的能力却比肩 Carbon。我自己也在 Antigravity 里测了一把，一口气从零搭出了一座 3D 霓虹元素实验室。

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，Gemini 4 Neon 跑分有多猛？**

在第三方评测机构 Artificial Analysis 的综合智能指数上，Neon 把思考开到最高档 `xhigh` 拿到了 `61.4` 分，排进全球前三，超过了 Claude Opus 5.5 和 GPT-6.2 Sol。在编程 Agent 榜单上，Neon 以 `58.6` 分排在第一。

速度方面，Neon 平均每秒输出 `110` 个 Token，旗舰 Carbon 每秒只有 `57` 个，差不多快了一倍。而且它的思考深度支持 `low`、`medium`、`high` 和 `xhigh` 四档调节，默认是 `high` 档。简单任务开低档省时间，遇到难题再往上调，速度和深度都能按需控制。

![](https://cdn.paicoding.com/stutymore/gemini-4-neon-review-09-benchmarks-20261119135100-ef14f005.png)

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，Neon 实战起来有多顶？**

先看几个出圈的官方案例。第一个是把 Google 表格当显卡用。任务要求把一张静态照片转成包含 `10` 万个单元格的电子表格，全程不插图片，也不写一行脚本代码，只靠表格自带的公式硬算。几个 Neon Agent 协作，往表格里写进了 `50` 多万条公式，在网格里跑通了图像边缘检测、3D 深度映射，还做出了 `6` 种可以切换的交互打光模式。

在多 Agent 协作上，谷歌团队还拿历史建筑练了手。Neon 参照历史档案里的照片，指挥多个 Agent 同时干了几个小时，1 比 1 复原了阿兰·图灵 1936 年在剑桥国王学院的书房，从礼拜堂外景一直到室内的壁炉和陈设，书桌上甚至摆着一台正在运行的通用图灵机。

我自己也手痒，在 Antigravity 里拿元素周期表出题，让 Neon 从零搭了一座 3D 霓虹元素实验室。所有几何体、材质和声效全靠代码生成，四支高压气体放电管、包含 `118` 种元素的 3D 周期表星环和实时发射光谱一次跑通。写完代码之后，它还会自己启动本地服务，打开无头浏览器截取四张关键状态图，用视觉能力检查构图有没有穿模、辉光有没有过曝，发现瑕疵自己返工修好再交付。

![](https://cdn.paicoding.com/stutymore/gemini-4-neon-review-08-neon-lab-20261119135149-2a24ceb2.gif)

恭喜看到这里的你，成功击败 70% 的学习者了。

**聪明的你可能会继续问，Orchestrator 怎么做到又快又省？**

平时我们跑复杂任务，如果从头到尾全让旗舰模型自己干，慢不说，Token 账单也扛不住。谷歌这次在 Antigravity 里同步推出了 Orchestrator 动态编排机制，核心思路就是按任务难度自动分工。

打开 Orchestrator 之后，像架构设计、进度判断和疑难排错这类需要深度思考的活，交给旗舰 Carbon 或者 Neon 来把关；像批量改文件、跑单元测试、搜索代码仓库这类重复性工作，就会拆分给多个 Sub-agent，由价格只有 Neon 一半的 Hydrogen 并行干完。

![](https://cdn.paicoding.com/stutymore/gemini-4-neon-review-10-orchestrator-20261119135101-9e10d86f.png)

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后聪明的你还会问，Gemini 4 全家桶该怎么选？**

Neon 的标准 API 定价是输入每百万 Token `3` 美元，输出 `15` 美元，命中缓存时只要 `0.15` 美元。

Hydrogen 每百万 Token 输入 `1.5` 美元、输出 `7.5` 美元，价格只有 Neon 的一半，适合高并发跑简单脚本、提取信息，或者在 Orchestrator 里当并行干活的 Sub-agent。Neon 价格比旗舰 Carbon 低 `25%`，输出速度又快将近一倍，日常写代码、做交互原型、跑数据分析，拿它当主力最顺手。至于之前发布的 Argon，现在 Neon 的速度和编程能力都更强，新项目优先选 Neon 就行。旗舰 Carbon 每百万 Token 输入 `4` 美元、输出 `20` 美元，每秒输出约 `57` 个 Token，留给需要长时间推演的科研难题或者核心架构。

目前 Neon 已经上线了 Gemini API、Google AI Studio、Vertex AI 和 Google Antigravity，也接进了 GitHub Copilot，订阅了 Pro 或者 Ultra 的用户，也能在 Gemini App 里用上。

![](https://cdn.paicoding.com/stutymore/gemini-4-neon-review-11-api-pricing-20261119135101-f12bee82.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下。Gemini 4 Neon 是谷歌这代主打性价比和工程效率的中坚主力，`1M` 上下文。配合 Antigravity 的 Orchestrator 动态编排，把规划交给强模型，把重复任务拆分给 Hydrogen 并行处理，速度和账单都能兼顾。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
## 视频封面

竖版 3:4

![Gemini 4 Neon 像素风竖版封面](https://cdn.paicoding.com/stutymore/gemini-4-neon-pixel-cover-3x4-20261119161113-24e079d1.png)

宽屏 16:9

![Gemini 4 Neon 像素风宽屏封面](https://cdn.paicoding.com/stutymore/gemini-4-neon-pixel-cover-16x9-20261119161113-d2a10edd.png)

横版 4:3

![Gemini 4 Neon 像素风横版封面](https://cdn.paicoding.com/stutymore/gemini-4-neon-pixel-cover-4x3-20261119161113-43f991a2.png)
<!-- video-covers:end -->
