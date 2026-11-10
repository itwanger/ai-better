---
title: Claude Fable 5.2 发布，审美和细节的绝对统治。
---

11 月 9 日，Anthropic 正式发布了 Claude Fable 5.2 和 Claude Mythos 5.2。这两个模型基于同一个底层基座，支持 `1M` 上下文和 `128K` 最大输出，主要面向高难度的软件工程、硬件设计、前沿科研，以及需要连续运行好几天的超长周期任务。

![Claude 官方发布短片中的 Fable 5.2 片段](https://cdn.paicoding.com/stutymore/claude-fable-5-2-release-20261110110534-559346a9.gif)

我的 Claude Code 里已经可以看到 Fable 5.2 的模型了。

![](https://cdn.paicoding.com/stutymore/claude-fable-5-2-20261110095945.png)

在预发布测试里，Fable 5.2 交出了好几个让人眼前一亮的实战成果。其中之一是，Anthropic 的工程师让 Fable 5.2 在一个空文件夹里从零设计了一套原型操作系统。Fable 5.2 自己协调了超过 `1000` 个 Sub-agent，连续 `8` 天不间断地写代码、跑测试、互相审查代码。这个操作系统包含内核，磁盘、键盘和网卡驱动，以及能持久保存数据的文件系统，图形窗口和安装程序。

![Anthropic 在笔记本上演示原型操作系统，打开桌面窗口并显示图表](https://cdn.paicoding.com/stutymore/claude-fable-5-2-os-20261110110542-aeaa9cb6.gif)

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，Fable 5.2 的能力提升在哪？**

第一，多 Agent 协作。拿费马大定理的案例来说吧，团队给 `1000` 个 Fable 5.2 的 Agent 提供了不能联网的沙箱、Git 和一个共享的 Postgres 数据库。最后，主 Agent 把大约 `750` 个 Agent 调去攻克其中的 Langlands–Tunnell 子证明。

![1 个主 Agent 和 999 个子 Agent 通过 5 张 Postgres 表协作](https://cdn.paicoding.com/stutymore/claude-fable-5-2-fermat-20261110110545-4042c896.webp)

Agent 把难题逐级拆开，光是这一个子证明，就长出了一棵最深 `10` 层、包含 `2418` 个子任务的任务树。最终，整套证明只用了 `28.7` 个小时就完成了。和上一代模型相比，输出的 Token 数量降到了原来的三分之一，证明代码的长度缩短到了原来的七分之一。

![Anthropic 根据实验记录还原的 Langlands–Tunnell 子证明任务树](https://cdn.paicoding.com/stutymore/claude-fable-5-2-tree-20261110110543-1174d3d3.gif)

第二，物理硬件设计。Anthropic 联合电路板制造商 Diode，只给了一段简短的提示词，让 Fable 5.2 从零设计三台电子设备：智能语音中枢、USB 会议音箱和掌上虚拟宠物。Fable 5.2 会自己查阅芯片数据手册，挑选分销商的现货元件，并为四层电路板布置等长差分走线。

![USB 会议音箱的四层 PCB，依次展示器件与信号线、地平面、电源与背面的触控电极](https://cdn.paicoding.com/stutymore/claude-fable-5-2-pcb-20261110110543-c1520835.gif)

在给语音中枢布线时，Fable 5.2 认为 KiCad 自带的布线工具绘制太慢，就花了半小时自己写了一套网格寻路算法，布完一根只需要一秒钟。设计 3D 外壳时，Fable 5.2 算出 `25` 毫米长的麦克风开孔会在 `3.4` 千赫兹产生共振，而这个频率刚好落在人声频段内。于是它主动把外壳改成前低后高的楔形，把开孔缩短到 `10` 毫米，把共振频率提高到 `8.9` 千赫兹，避开了人声频段。最后，三块电路板送到工厂打样，回来后不需要做任何电气修改，烧录固件后就能正常运行。

![Diode 打样的三台实物：左下是掌上虚拟宠物，中间是语音中枢，右下是 USB 会议音箱](https://cdn.paicoding.com/stutymore/claude-fable-5-2-products-20261110110544-16b93a72.jpg)

第三，前沿科学研究。在理论物理领域，Fable 5.2 独立解决了两个关于黑洞与量子引力的公开难题。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，Fable 5.2 为什么提升这么大？**

![Fable 5.2 的长周期强化学习、自适应思考、空间几何推理和诚实对齐](https://cdn.paicoding.com/stutymore/claude-fable-5-2-upgrades-20261110110545-ec1beb47.webp)

第一个改进，Fable 5.2 在后训练阶段进行了高强度的长周期强化学习，重点奖励这种推理过程，质疑最初的假设，在沙箱里运行测试进行验证，发现方案走不通就主动推翻重来。

第二个改进，是始终开启的自适应思考架构，以及统筹调度能力。在预训练阶段，Fable 5.2 使用的训练 Token 数量约为模型参数的 `25` 倍，训练数据以海量代码和高质量的合成数据为主。推理时，Fable 5.2 始终开启自适应思考，会根据当前步骤的难度，在 `low`、`medium`、`high`、`xhigh`、`max` 五档推理强度之间动态分配算力。同时，训练过程大幅强化了它拆解任务和协调多个角色协同工作的能力。在日常研发中，官方建议把 Opus 5.5 作为主力模型，遇到复杂难题再交给 Fable 5.2。

第三个改进，Fable 5.2 针对工程图纸、三维 CAD 建模和物理布局做了专项强化，能够同时考虑几何位置、机械碰撞、声学共振、散热和电流上限等多种物理约束。

第四个改进，是诚实度对齐和更精准的安全边界。此外，Anthropic 给所有思考块（thinking block）都加上了加密签名，能够拦截恶意的蒸馏行为。

恭喜看到这里的你，成功击败 70% 的学习者了。

**聪明的你可能会继续问，跑分如何？**

先看软件工程。FrontierCode 2.0 考察的是模型写出的代码能否被开源项目的维护者合入。在这项评测中，Fable 5.2 拿到了 `49.1` 的高分，在所有已发布的模型里排名第一，超过了 Opus 5.5 的 `45.5`、GPT-6 Astra 的 `42.8%`。

![Anthropic 官方对比表节选，含 FrontierCode 2.0、FrontierSWE v2、CVE Rediscovery 和 RoboDojo Sim](https://cdn.paicoding.com/stutymore/claude-fable-5-2-scores-20261110110545-00cacee5.png)

硬件设计看 BenchCAD 2.1。横轴是每次尝试的花费，纵轴是设计得分。Fable 5.2 开到 `max` 时，得分到了 `83.5`。

![BenchCAD 2.1 官方成本曲线，Fable 5.2 的 Max 点为 83.5 分](https://cdn.paicoding.com/stutymore/claude-fable-5-2-benchcad-20261110110545-2bc666b3.png)

再看机器人控制。在通过摄像头画面控制双臂机器人的 RoboDojo Sim 评测上，Fable 5.2 拿到了 `64.9` 分，是 GPT-6 Astra（`29.8`）的两倍以上。

![Fable 5.2 控制真实机械臂操作物体并在纸上画机器人](https://cdn.paicoding.com/stutymore/claude-fable-5-2-robot-20261110110544-17f18884.gif)

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后聪明的你还会问，Fable 5.2 的价格呢？**

和上一代 5.1 版本相比，Fable 5.2 的生成速度最高提升了 `30%`，API 价格反而下调了 `20%`，输入价格每百万 Token `8` 刀，输出价格每百万 Token `40` 刀，缓存读取的价格低至每百万 Token `0.2` 刀。

因为 Fable 5.2 的推理更准确、走的弯路更少，完成同样的任务，消耗的 Token 比上一代更少。在 FrontierCode 2.0 编程评测中，Fable 5.2 只开 `high` 档推理强度，就能追平 Opus 5.5 在最高档下的得分，单次任务的花费只有 Opus 5.5 的一半左右。

如果开启 Fast Mode，Token 生成速度最高能再提升 `2.5` 倍，代价是价格翻倍。目前，Fable 5.2 已经在 Claude 全平台、亚马逊 AWS、Google Cloud 和微软 Azure 上线。发布后的第一周，老订阅用户还会按订阅时长，额外获赠 `1` 到 `3` 次额度重置。

![Fable 5.2 每百万 Token 的标准输入与输出价格、Fast Mode 倍率和 FrontierCode 单任务成本对比](https://cdn.paicoding.com/stutymore/claude-fable-5-2-pricing-20261110110546-74befb51.webp)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下，Claude Fable 5.2 和 Mythos 5.2 是 Anthropic 最新发布的旗舰模型。这两个模型依靠长周期强化学习、始终开启的自适应思考和空间几何推理，实战能力非常强；同时，生成速度提升了 `30%`，API 价格下调了 `20%`。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
## 视频封面

竖版 3:4：

![Claude Fable 5.2 像素风竖版封面](https://cdn.paicoding.com/stutymore/claude-fable-5-2-pixel-vertical-20261110110511-ba155183.png)

宽屏 16:9：

![Claude Fable 5.2 像素风宽屏封面](https://cdn.paicoding.com/stutymore/claude-fable-5-2-pixel-widescreen-20261110110511-6ed54c3e.png)

横版 4:3：

![Claude Fable 5.2 像素风横版封面](https://cdn.paicoding.com/stutymore/claude-fable-5-2-pixel-horizontal-20261110110511-35e1e505.png)
<!-- video-covers:end -->
