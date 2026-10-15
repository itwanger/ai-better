---
title: 用户需求模糊时 Agent 怎么澄清？
blibli: 用户需求模糊时 Agent 怎么澄清（Agent面试题）？
xiaohongshu: 字节面试：用户需求模糊时 Agent 怎么澄清
douyin: 用户需求模糊时 Agent 怎么澄清？
shipinhao: 用户需求模糊时 Agent 怎么澄清？
---

面试官问你：“用户需求模糊的时候，Agent 怎么澄清？”如果你回答“在提示词里写一句，遇到不清楚的需求先反问用户”，恭喜你，出门右拐回家等通知吧。

为什么？

因为只靠一句提示词让模型自己把握，会出现两个极端。要么变成十万个为什么，连代码库里现成的配置都要问你；要么把问题原封不动踢回给你，比如你说“帮我加个登录”，它直接反问一句“请问你希望怎么设计登录方案”，还得你教它怎么做。

真正的生产级 Agent，处理模糊需求的核心原则只有一个，先调用工具查清事实，再带着方案给你选择。

![](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-01-20261015162018-d583522e.png)

恭喜看到这里的你，已经成功击败 30% 的学习者，给自己鼓个掌吧。**接下来我问你，用户只说了一句“帮我把登录接口加上限流”，Agent 第一步应该干什么？**

A、立刻反问用户用什么限流算法；B、直接按默认的算法修改代码；C、先调用只读工具搜索代码库，搞清楚现有技术栈后再决定问什么。喜欢点赞的你可以把答案打在弹幕或者留言区。

我的答案是遇到模糊需求时，先搞清楚缺失的信息是代码里的事实，还是用户的偏好。

Codex 在 Plan 模式的系统提示词里，把未知信息明确拆分成了两类。

第一类叫 Discoverable facts（可发现的事实），比如项目用的是什么框架、现有的登录接口写在哪、有没有现成的 Redis 配置。对于这类信息，Codex 的硬性规定是先探索后再提问，在向用户提问之前，必须先调用只读工具把代码库扫一遍。Claude Code 的源码提示词里也有一句同样的铁律，“Never ask what you could find out by reading the code”，意思是绝不要询问通过读取代码就能查明的事情。

第二类叫 Preferences and tradeoffs（个人偏好和方案取舍），比如限流阈值设成每秒多少次、超出后是排队等待还是直接返回报错。这些在代码库里查不到的信息，而且会改变最终的执行结果，才需要找用户拍板。

哪怕搜索完发现了两套完全不同的鉴权模块，Agent 也要先自己有一个自己的判断，带着现成的方案去问用户。

![](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-02-20261015162321-67f4f015.png)

恭喜看到这里的你，已经成功击败 50% 的学习者了。**接下来继续问你，Agent 决定向用户提问时，下面哪种问法体验最好？**

A、把相关问题打包，每个问题给 2 个选项和判断；B、列出十几个选项让用户自己挑。聪明的你会选哪一个？

我们来看看 Claude Code 源码里的 AskUserQuestion（向用户提问工具）是怎么用 JSON Schema 把问法锁死的。

第一，打包提问。AskUserQuestion 顶层的 questions 数组规定最少 1 个问题、最多 4 个问题，提示词明确要求把相关问题打包在一次调用里完成提问。

第二，给足选项并标明推荐项。每个问题必须提供 2 个选项，每个选项都要写清楚名称和方案。如果模型有倾向的方案，把推荐项放在第一个，并在名称末尾加上 Recommended（推荐）标记。

第三，留一个兜底输入框。Claude Code 在工具描述里严禁模型自己生成 Other 选项，因为这个选项是交给用户输入的。Pi 的 questionnaire（问卷扩展工具）也是同样的设计，默认开启 allowOther，自动在列表最后加上一项“Type something”，用户既能选推荐项，又能输入自己的想法。

![](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-03-20261015162734-c4b17525.png)

恭喜你，已经成功击败 70% 的学习者了。**继续问你，模型决定反问用户时，底层的 Agent Loop 是怎么停下来等用户回答的？**

A、结束本轮对话，等用户的下一轮消息发送；B、把“向用户提问”做成一个工具，调用时挂起当前任务，用户回答后作为 tool_result 返回；C、开启一个死循环不断轮询数据库。聪明的你会选哪一个？

我的答案是 B。

如果直接结束本轮对话，当前这轮推理的上下文状态就断了；最优雅的实现，是把“向用户提问”也包装成一个标准的工具。

Claude Code 的实现非常巧妙，它的 AskUserQuestion 没有单独写一套暂停逻辑，而是直接复用了工具权限审批的通道。在源码里，这个工具的 requiresUserInteraction（是否需要用户交互）固定返回 true，checkPermissions（权限检查）固定返回 ask。哪怕你开启了跳过所有权限审批的自动模式，执行到这个工具时也会被强制拦下来。

接着，交互处理器会创建一个未决的 Promise（异步占位对象），放进前端的确认队列里，Agent Loop 就在 await 的地方自然挂起，不会多消耗任何一个 Token。

等你在界面上勾选完答案点击提交，前端会把你的回答写进 updatedInput.answers 字段里，唤醒刚才那个 Promise。随后系统把你的回答组装成一条标准的 tool_result，正文写着“User has answered your questions”，再传回给模型继续往下推理。

![](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-04-20261015163054-62f781a1.png)

恭喜看到这里的你，成功击败 90% 的学习者了。

面试官如果追问：“如果 Agent 跑的是后台的定时任务、Headless（无界面模式）或者 Sub-agent 里，屏幕前根本没有人，遇到模糊需求怎么办？”

告诉他，生产环境会通过工具拦截和提示词兜底来解决。

先是工具层拦截，防止后台进程没人回应而卡死。

在 Codex 源码里，request_user_input（请求用户输入工具）的第一行就会检查当前是不是 root 线程，如果是 Sub-agent 发起调用，直接报错“request_user_input can only be used by the root thread”，只允许主 Agent 提问。如果运行在 codex exec 这种非交互模式下，连外部 MCP 服务端通过 elicitation（服务端中途反问机制）发来的追问请求，也会被自动取消，源码里直接返回 Cancel 动作。Pi 的 questionnaire 工具执行时也会先检查当前模式是不是 TUI，不是就直接报错返回。

然后是提示词兜底。

Codex 的提示词明确规定，当无法获取用户回答时，不要停下来，而是直接按最稳妥的推荐选项继续往下执行；但必须在最终输出的 Assumptions（假设清单）小节里，把刚才替用户做出的所有假设一条条写清楚，让用户事后看结果时一眼就能核对。

![](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-05-20261015163259-a9627d5b.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-cover-portrait-3x4-20261015162947-3bd9b5df.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-cover-wide-16x9-20261015162947-b511046c.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/agent-requirement-clarification-cover-standard-4x3-20261015162948-f3d1e9cf.png)

<!-- video-covers:end -->
