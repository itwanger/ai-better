---
title: DeepSeek-V4.1-Flash-1017 真来了，这次是真滴强。
---

10 月 17 日，DeepSeek 把 V4.1-Flash 更新到了 1017 版本。官方发布页的标题是，Wish-Driven Programming Made Real，翻译翻译就是许愿式编程，一键成真。

![DeepSeek 官方中文发布页与发布日期](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-release-zh-20261018085720-58aac7bc.png)

要知道 10 月 15 日它宕机了将近五个小时，果然，大的来之前，必然是有点前兆的。这次跑分，可以说拉到了满中满。

DeepSeek Harness 升级到最新版，就能直接使用了。如果你勾选了自动升级，打开 DeepSeek Harness 就可以看到更新提示，更新完新建一个 session，就能选择 DeepSeek-V4.1-Flash-1017 了。

![](https://cdn.paicoding.com/stutymore/sucai-20261018074458.png)

Terminal-Bench 4.0，考的是在真实终端里把任务做完，从 31.2 涨到 42.3 分。

ProgramBench，考的是把一个完整程序从零写出来，从 20.3 涨到 29.1 分。

HLE，Humanity's Last Exam，考的是 AI 在无外部搜索辅助下的深度推理能力，从 36.8 涨到 42.6 分。

性能和价格都让人服气的梁圣，他又回来了。那聪明的你肯定要问，一个小版本号的更新，凭什么能力上涨这么多？

我翻了 DeepSeek 的官方发布页、更新日志、API 定价页，还有 HuggingFace 上的技术报告，可以自信地、大方地、光明磊落地帮你搞清楚三件事。

- 1017 到底升级了什么？
- 许愿式编程，是怎么做到的？
- 对我们用户而言，有何意味？

哈喽大家好，我是二哥呀。今天用 3 分钟，给你讲清楚 DeepSeek-V4.1-Flash-1017 这次更新。

**先说第一件事，1017 到底升级了什么。**

官方把它定义成一次 minor update，也就是小版本更新。架构没动，还是 9 月 10 日那版的 V4.1-Flash，动的是后训练这块。

预训练决定模型读过多少书，后训练决定模型是纸上谈兵，还是真的能在战场上所向披靡。

![DeepSeek 官方基准对比表](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-official-benchmarks-20261018085721-3a62349d.png)

官方对比表里，DeepSWE 77.0、Agents' Last Exam 35.4、Apex Bench 72.1 这三项都排第一，把几个闭源旗舰模型狠狠按在地上摩擦。

在提升性能的同时，DeepSeek 还缩短了模型的任务运行时间和输出长度，让用户能够以更低成本、更快速度完成任务，在多个 Harness 下达到了新的性能-费用帕累托最优，比如 WorkBuddy 和 DeepSeek Harness。

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-e6888dc8d0f84cd3973511d6b0e495fa.png)

**那聪明的你肯定要问，凭什么能做到许愿式编程？**

先说什么叫许愿式编程。一句话，用自然语言描述开发需求，让 AI 自主完成任务开发，并且减少人工干预。你不用写代码，把想要的东西说清楚，AI 就能自己拆解任务、编写代码、运行并测试、发现问题还能自我改进。

凭什么能做到许愿式编程？靠的是基于自反馈的强化学习，也就是说，模型自己给自己安排训练任务，然后依据任务目标、运行环境和验收标准，进行自我迭代。

具体什么是强化学习，我们之前讲过。

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-self-feedback-diagram-20261018085721-eb1a4dd6.png)

官方给的四个例子也很能说明问题。故宫的 3D 建模，网页版的赛车游戏，用 Godot 引擎复刻的 Portal 2，还有一条从史前走到现代的“时间之谷”3D 场景。

我自己也试了一把。一段提示词，一个单文件的 3D 太阳系，八大行星按真实公转周期跑。五分钟，页面就在浏览器里跑起来了，没有脚本报错。然后它还会一颗一颗行星点开核对数据，自己审查完后继续优化环的纹理、光照。

```
用单个 HTML 文件做一个 3D 太阳系模拟，Three.js 通过 CDN 引入。要求：
1. 太阳和八大行星，按真实的相对公转周期运行，行星大小按真实比例压缩后展示；
2. 鼠标拖拽旋转视角，滚轮缩放，双击行星聚焦；
3. 点击行星弹出信息卡，显示名称、公转周期、距日距离；
4. 行星表面用程序化材质，不引用任何外部图片；
5. 底部加一条时间轴，可以拖动改变模拟速度。
做完之后自己在浏览器里打开检查一遍，有报错就修到能跑为止。
```

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-case-solar-20261018094734-68ccbbe8.gif)

提示词 2：

```
用单个 HTML 文件做一个像素风塔防游戏：三条路径、五种防御塔、二十波敌人、金币和血量系统、暂停和两倍速按钮、通关和失败结算界面。所有美术资源用 Canvas 程序化绘制，不引用外部图片和音频文件。做完自己在浏览器里打开玩一遍，保证第一波敌人能正常出现、塔能正常攻击、金币能正常扣减。
```

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-case-tower-20261018091205-73e4380d.gif)

提示词 3：

```
用单个 HTML 文件加 Three.js 做一个「时间之谷」3D 场景：从史前到现代四个时代分段排布在同一条山谷里，每个时代有代表性的地形、建筑和植被，摄像机可以沿着山谷自动巡游，也可以手动控制。全部几何体程序化生成，不引用外部模型文件。
```

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-case-time-valley-20261018091205-6a65e694.gif)

**那聪明的你肯定又要问了，对我们开发者意味着什么？**

先说最直接的，接入成本为零。调用名还是 deepseek-flash，价格没变，上下文仍然是 1M，最大输出是 384K，原生视觉支持。

![](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-official-pricing-20261018085722-26218a78.png)

第二个变化更值得说一说，Search & Fetch 接口对外开放了。搜索和抓取都是千次 5 元，支持 `site: 限定域名` 模式，支持在 DeepSeek Harness、Claude Code、Codex 里调用，11 月 1 日之前完全免费。

以前我们搭一个能查资料的 Agent，搜索接口要自己找、自己接、自己付费、自己处理反爬。现在模型原生就支持搜索了，舒服。

第三个，权重仍然是 MIT 协议开源，HuggingFace 和 ModelScope 都能下载。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-cover-portrait-3x4-20261018100645-0fd85a32.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-cover-wide-16x9-20261018100646-fdeedd48.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/deepseek-v4-1-flash-1017-cover-standard-4x3-20261018100646-1b3cbbf6.png)

<!-- video-covers:end -->
