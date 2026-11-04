---
title: 混元 Hy4 正式版+WorkBuddy， 真的太顶了。
---

11 月 4 日，也就是今天（霍元甲台词），腾讯 Hy4 正式版发布，这是一个总参数 `770B`、每个 Token 激活 `49B` 参数的 MoE 大模型，支持 `1M` 上下文窗口，并且计划在近期开源模型权重。

相比 preview 版本，Hy4 正式版补齐了原生的多模态视觉理解与 Computer Use 电脑操作能力。我第一时间在 WorkBuddy 里切换到了混元 Hy4 正式版，跑了几个 Case。

![](https://cdn.paicoding.com/stutymore/Hy4sucai-20261104141237.png)

比如配合我的一分钟视频 Skill，从检索物理教案、合成配音到编写电路动画，做出了“欧姆定律”科普视频；纯靠 Canvas 2D 画出了带昼夜切换、萤火虫和躲避障碍的绵羊小游戏；纯原生 SVG 手绘奶茶制作流程；还用 Three.js 搭了一套能旋转视角、观察电流的 3D ESP32 硬件实验台。

![](https://cdn.paicoding.com/stutymore/sucai-20261104111210.png)

从实测表现来看，国产 Harness 配上国产大模型，完成度已经很高了，继续给我们的国产模型加油助威吧。

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，怎么在 WorkBuddy 里用上 Hy4 正式版？**

目前 Hy4 正式版已经在腾讯云和 OpenRouter 上线，WorkBuddy、CodeBuddy、元宝和 ima 都能用。11 月 4 日到 15 日，WorkBuddy 和 CodeBuddy 还开放了免费体验。API 定价维持和 preview 版本一致，输入每百万 Token `6` 元，命中缓存低至 `3` 毛钱，输出每百万 Token `18` 元。

在 WorkBuddy 里用 Hy4 正式版，最顺手的就是原生多模态的视觉能力。比如我做“欧姆定律”视频时，第一章预览出来，一节电池的画面里多留了一个空的电池插槽，导致电路在视觉上是断开的。

![](https://cdn.paicoding.com/stutymore/sucai-20261103224610.png)

我把预览画面截图发给 WorkBuddy，Hy4 靠原生视觉识别出左下角淡紫色的虚线空槽和断开的导线，定位到组件代码，把一节电池状态改成了完整的闭合回路，等切到两节电池时再串联进来。

![](https://cdn.paicoding.com/stutymore/sucai-20261103224914.png)

而且对话时 WorkBuddy 还会冒出“别担心，我办事，你放心”、“马上，比外卖快”这类状态提示，更像一个有温度的 Personal Agent。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，Hy4 正式版相比 preview 到底提升了多少？**

综合官方公布的评测结果来看，正式版扩大了预训练和后训练规模，各项指标都有大幅上涨。先看新增的视觉与电脑操作能力，在 OSWorld 2.1 上，Hy4 拿到 `78.9` 分，超过了 GPT-6.1 Sol 的 `68.4` 分；带工具的视觉问答 BuddyVQA Atlas 拿到 `81.0` 分，多模态理解 MMMU-Pro 拿到 `78.6` 分。

![](https://cdn.paicoding.com/stutymore/hy4-review-bench-chart-20261104141313-95da06ef.png)

再看 Agent 编程与三维建模。Terminal-Bench 4.0 从 preview 的 `26.3` 分涨到了 `44.4` 分；三维代码建模 3DArena-Modeling 从 `23.4` 分涨到了 `37.1` 分。

![](https://cdn.paicoding.com/stutymore/hy4-review-bench-table-20261104141314-294e3d04.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

**聪明的你可能会继续问，怎么用 WorkBuddy 的 Computer Use 跨应用操控其他 Agent？**

做好欧姆定律的视频预览后，我让 WorkBuddy 驱动 Hy4 正式版，通过 Computer Use 去控制桌面上的 DeepSeek Harness 渲染出片。首次使用时在系统设置的“隐私与安全性”里开启屏幕录制和辅助功能权限，先发一条测试指令，让它切换到 DeepSeek Harness 读取最后一条回复。

![](https://cdn.paicoding.com/stutymore/sucai-20261104103147.png)

Hy4 在底层会按应用的唯一标识激活软件，再查出目标窗口的编号和屏幕逻辑坐标，按窗口编号定向抓取画面交给视觉模型核验。

确认画面后，Hy4 会先读取系统的无障碍元素树，拿到“新会话”按钮和输入框的坐标并切换视图，接着把提示词写入系统剪贴板，发送系统级鼠标事件聚焦输入框，再触发粘贴快捷键发送出去。靠这套 Harness 监督模式，WorkBuddy 顺利指挥 DeepSeek Harness 渲染出了高清成片。

![](https://cdn.paicoding.com/stutymore/sucai-20261104104106.png)

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后，聪明的你可能还会问，为什么它的前端、小游戏和 3D 交互完成度这么高？**

![](https://cdn.paicoding.com/stutymore/sucai-20261104110559.png)

混元团队这次依托腾讯云的 Agent Runtime 沙箱环境，在训练阶段部署了数百款软件，让模型反复执行和验证；同时联合腾讯 IEG 游戏团队打磨了游戏开发和游戏逻辑，两项评测分别提升了 `19.1%` 和 `9.8%`，工具调用深度达到了 preview 版的 `3.7` 倍。所以在 WorkBuddy 里跑前端和 3D 项目时，Hy4 写完代码会自动拉起本地预览服务，用浏览器自动化跑几十项交互测试，结合视觉能力看着画面把问题修完再交付。

![](https://cdn.paicoding.com/stutymore/hunyuan-hy4-review-20261104155428.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下，Hy4 正式版是一个 `770B` 参数的 MoE 大模型，补齐了原生多模态视觉和 Computer Use 电脑操作能力。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
![](https://cdn.paicoding.com/stutymore/hunyuan-hy4-cover-official-3x4-20261104191505-0eee11ce.png)

![](https://cdn.paicoding.com/stutymore/hunyuan-hy4-cover-official-16x9-20261104191506-6d8753e6.png)

![](https://cdn.paicoding.com/stutymore/hunyuan-hy4-cover-official-4x3-20261104191507-966a9798.png)
<!-- video-covers:end -->
