---
title: Agent的权限模式（Permission Mode）了解吗？
---

面试官问你：“DeepSeek Harness 这类 Agent 的权限模式（Permission Mode）了解吗？”如果你回答“就是 Agent 执行命令之前弹个窗，让用户点允许或者拒绝”，恭喜你，出门右拐回家等通知吧。

为什么？

弹窗只是权限模式的一种结果。权限模式决定 Agent 动手之前要不要先问用户。有的模式每一步都问，有的只问危险动作，有的不弹窗直接拒绝，有的全部放行。

DeepSeek Harness 一共有三种权限模式，仅可查看、工作区内修改和完全权限，我自己一直开的是完全权限，从来不担心 Agent 删库跑路。

![](https://cdn.paicoding.com/stutymore/what-is-permission-mode-20261014115755.png)

因为在我看来，不管是 DeepSeek V4.1 Flash 还是 Opus 5.5，顶级的模型已经足够聪明，他们知道自己该干啥不该干啥。

换句话时候，如果一个 Agent 还需要用户不停插手权限，那这个 Agent 可以卸载了。

恭喜看到这里的你，已经成功击败 30% 的学习者，给自己鼓个掌吧。**接下来我问你，Claude Code 一共有几种权限模式？**

A、两种；B、三种；C、六种。喜欢收藏的你可以把答案打在弹幕或者留言区。

我的答案是六种。默认是 Manual，也就是手动模式，只有读取文件不用问，编辑文件和执行命令都要你点头。

![](https://cdn.paicoding.com/stutymore/what-is-permission-mode-20261014140114.png)

acceptEdits 自动放行文件编辑，再加上 mkdir、touch、rm、rmdir、mv、cp、sed 这七个常见的文件命令，前提是路径在工作目录之内，其他命令照样要问。

plan 只读不写，Claude 可以读文件、执行探索性的命令，在你批准计划之前，文件一行都不会改。

auto 不再逐条问你，而是由一个分类器在后台审查每个动作。

dontAsk 一个弹窗都没有，只放行预先批准的工具，原本要问你的一律拒绝。它适合跑在 CI 里，因为它不在 Shift+Tab 的切换列表里，只能用启动参数开启。

bypassPermissions 全部放行，官方只建议在容器或者虚拟机里使用。在 Linux 和 macOS 上用 root 运行时，Claude Code 会直接拒绝启动。

Claude Code 的更新日志写的很清楚，从 2.1.284 版本开始，只要你没有手动配置过权限模式，终端的交互会话都默认进入 auto。按 Shift+Tab，可以在几种模式之间切换。

![](https://cdn.paicoding.com/stutymore/what-is-permission-mode-01-20261014144940-1e13b77b.png)

恭喜看到这里的你，已经成功击败 50% 的学习者了。**接下来继续问你，auto 模式靠什么判断一个动作危不危险？**

A、关键词黑名单；B、另一个模型当分类器；C、Claude 自己判断。喜欢点赞的你会选哪一个？

我的答案是 B。读取文件和工作目录内的编辑直接放行，其余的动作交给分类器。Claude Code 从 2.1.210 版本开始，分类器默认跑在 Sonnet 5 上，不跟着 /model 里选的模型变。

分类器能看到你的消息、Claude 发起的工具调用和 CLAUDE.md，但有两样东西会被剔除掉。一是工具结果，这样网页或者文件里藏着的恶意指令，就没办法直接操纵分类器。二是 Claude 自己的输出，防止 Claude 说服分类器给自己放行。

审查时先输出一个 token，快速判断放行还是可疑；可疑的动作再用思维链仔细复核。

当然了，用户的输入也能放开一部分拦截。官方举过一个例子，只说“清理一下仓库”，不算授权强制 push；明确说“强制 push 这个分支”才算。

被拦截了也不会一直卡住流程。连续拦截 3 次，或者累计拦截 20 次，auto 就会暂停，退回到人工弹窗。

目前正常操作被错误拦截的比例是 0.4%，越权动作被放过的比例是 17%，Anthropic 自己管这个数叫“the honest number”，在他们的接受范围内。

![](https://cdn.paicoding.com/stutymore/what-is-permission-mode-02-20261014145233-0f72ebb2.png)

恭喜看到这里的你，成功击败 70% 的学习者了。**继续问你，开了 bypassPermissions，还有什么能拦住 Agent？**

A，什么都拦不住；B，deny 规则；C，沙箱。聪明的你会选哪一个？

我的答案是 B 和 C 要一起用。

先说 deny 规则。Claude Code 的权限规则分 allow、ask、deny 三种，分别是直接放行、先问你、直接拒绝。判定顺序是先看 deny，再看 ask，最后看 allow，第一个命中的规则说了算。deny 在任何模式下都生效，包括 bypassPermissions。这些规则可以写在好几个配置文件里，有全局配置，有团队共用的项目配置，有只在你项目里生效的本地配置。只要其中一个配置文件写了 deny，其他配置文件里的 allow 都放不开它。另外，对根目录这类关键路径执行 rm，任何模式都不会自动放行。

命令真正跑起来以后规则就管不到了。比如一条执行 Python 脚本的命令，看起来人畜无害，脚本里却去读你的 SSH 私钥，再发到外网。这就要靠沙箱，由操作系统限制这个进程能读写哪些文件、能连接哪些网络地址，超出范围的操作直接失败。

恭喜看到这里的你，成功击败 90% 的学习者了。面试官如果追问：“Pi 连权限弹窗都没有，它安全吗？”

Pi 是 Mario Zechner 开源的编程 Agent，没有内置权限系统，不限制文件、进程、网络和凭证的访问，也不会在每次调用工具之前问你。

作者的理由是，盯着对话记录、事后审查改动，都算不上安全边界。真正的边界，是限制 Pi 能访问和影响的资源。所以官方推荐把整个 Pi 放进容器、虚拟机或者沙箱里运行，并给出了 Gondolin、Docker、OpenShell 三种跑法。

真想要审批，就自己写扩展。Pi 的仓库里给了现成的示例，permission-gate.ts 遇到 rm -rf、sudo、chmod 777 会弹窗确认。

![](https://cdn.paicoding.com/stutymore/what-is-permission-mode-03-20261014145333-ed472749.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结下。

权限模式决定 Agent 动手之前问不问人，沙箱决定 Agent 执行的命令能读写哪些文件、能不能联网。

另外给大家一条实用建议，日常用 Claude Code 直接开 auto，绝对不能读写的文件和不能执行的命令写进 deny 规则，因为 deny 在任何模式下都生效。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面](https://cdn.paicoding.com/stutymore/what-is-permission-mode-cover-portrait-20261014145030-4b78df30.jpg)

![宽屏横版封面](https://cdn.paicoding.com/stutymore/what-is-permission-mode-cover-wide-20261014145030-107dde3f.jpg)

![标准横版封面](https://cdn.paicoding.com/stutymore/what-is-permission-mode-cover-standard-20261014145031-1f5c3ece.jpg)

<!-- video-covers:end -->
