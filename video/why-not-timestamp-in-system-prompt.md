---
title: 为什么不能在 System Prompt 里放时间戳？
---

聪明的你一定用过 DeepSeek Harness、Claude Code 或者 Codex，你在输入框里敲下的内容，在系统层面来看，叫做用户提示词。那你一定好奇过，大模型每次收到请求时，排在前面的系统提示词长什么样呢？

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-20261028161035.png)

在 DeepSeek Harness 里切到【轨迹】视图，点开 `system` 记录就能看到系统提示词。

它包含四个部分：Agent 的身份、当前用的模型名称、`read` 和 `edit` 等内置工具，以及当前的工作目录。除此之外，我们在项目根目录写的 `AGENTS.md` 和 `CLAUDE.md`，也会在会话开始时发给大模型。

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-01-20261028164914-423a964c.png)

聪明的你一定知道，大模型的知识库是有截止时间的，有时候他会不假思索把 2024 年的过时信息给到我们。那为了让 LLM 知道准确的时间，以前的我们可能会写个脚本，每次提问前自动往系统提示词或者 `AGENTS.md`、`CLAUDE.md` 里塞一行精确到秒的时间，结果，提示词缓存就失效了。后果就是，账单比缓存命中时高很多很多。

恭喜看到这里的你，已经成功击败 30% 的学习者，给自己来个点赞鼓励一下吧。视频的原稿以及 369 道 Agent 八股已经整理到开源知识库。

为什么在系统提示词或 `AGENTS.md` 里加一行时间戳，会让首字延迟飙升、账单翻数倍呢？如果你觉得每次请求只是多发了几个字符，花不了几个钱，那就没有理解 LLM 的缓存机制。

大模型的供应商为了加速推理，都会开启 Prefix Caching，也就是前缀缓存。在 Agent 的提示词设计里，要解决两个问题，一是把固定不变的系统提示词放在最前面，保护服务端的 KV Cache；二是把会变化的规则和时间放进用户消息，让大模型依然能拿到最新状态。

**接下来我问你，为什么系统提示词里加了时间戳，工具定义和历史对话的缓存就会失效？**

A，大模型看到新时间就会清空显存；B，Prefix Caching 是按 Token 序列构建前缀树的，必须从第 `0` 个 Token 开始逐块匹配，开头一变后面全废。喜欢收藏的你可以把答案打在弹幕或者留言区。

说说我的答案。大模型推理最消耗算力的是把输入 Token 算成 KV 向量的 Prefill 阶段。有的引擎按块计算哈希，有的用 Radix Tree 前缀树，复用的共同前提是前缀一致。命中规则是从第 `0` 个 Token 开始逐块匹配。Agent 发给模型的顺序是：系统提示词、工具定义、历史对话、最新提问。系统提示词处在前缀树的根节点，一旦混入每秒变化的数字，根节点的哈希块就会改变，排在后面的工具定义和历史对话就全部失联了，每一轮都要重算 Prefill。

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-02-20261028165048-8e153b9f.png)

Manus 团队曾公开过一组数据，在多步循环里多次调用工具并进行处理时，平均输入与输出的 Token 比例约为 `100:1`；而主流模型的缓存读取价格只有未命中的十分之一。在这个定价例子里，缓存失效部分的输入费用会贵 `10` 倍。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**继续问你，我们在项目里写的 `AGENTS.md`、`CLAUDE.md`，DeepSeek Harness 和 Claude Code 是怎么放进上下文的？**

A，全部拼进系统提示词；B，移出系统提示词，放进带 `<system-reminder>` 标签的第一条用户消息。喜欢点赞的你会选哪一个？

我的答案是 B。这正是系统提示词和用户提示词的分工，系统提示词只放不变的全局指令，而随项目和会话变化的信息，统一放进带 `<system-reminder>` 标签的用户消息。在 DeepSeek Harness 里，第一次请求时会读取 `AGENTS.md` 和 `CLAUDE.md` 作为第一条用户消息发出去，并算出文件内容的哈希值，只要你没改文件，后面就不再重复处理。Claude Code 也是同样的思路，先砍掉时分秒只保留年月日，然后在会话启动时用 `memoize` 算一次，塞进第一条 `<system-reminder>` 用户消息里，整个会话期间都不再改动；而在联网搜索工具的提示词里，也只放当前的年月，一个月才更新一次缓存。

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-03-20261028165308-52e98818.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

**继续，如果我们用 Agent 跨过了凌晨零点，第一条消息里的日期过期了，Claude Code 和 Codex 怎么在不破坏缓存的前提下更新日期？**

A，把第一条消息里的旧日期改成新日期；B，清空历史记录重开会话；C，保持第一条消息的旧日期不动，只在跨天那一轮的对话末尾追加一条新消息。喜欢推荐的你会选哪一个？

翻开 Claude Code 的源码，它在跨天时会保留第一条消息里的旧日期，因为一旦改动，会话里累积的缓存 Token 就会在下一轮作废。当检测到日期和上一轮不一致时，它只在对话末尾追加一条 `<system-reminder>` 消息告知新日期。Codex 也是同样的做法，把当前日期放在用户消息的环境信息里，每轮对比上一轮的内容，日期没变就什么都不做，跨天时才在末尾追加一条新消息。

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-04-20261028165425-28d8e71d.png)

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后再问你，如果会话中途切换了 Plan 模式或者改了 `AGENTS.md`，系统提示词或者项目规则都变了，DeepSeek Harness 是怎么保住前缀缓存的？**

A，每次变化都重写开头的系统提示词；B，固定提示词顺序，把改动后的内容追加到对话末尾，并靠 `in-history` 模式在历史对话末尾追加新的系统提示词。聪明的你会选哪一个？

我的答案是 B。DeepSeek Harness 给系统提示词分段后会进行排序，把不变的身份说明放最前面，工具说明放中间，易变的本地路径放最后；如果你中途改了 `AGENTS.md`，它只会往对话末尾追加一条更新后的用户消息。如果系统提示词变了，DeepSeek Harness 会把系统提示词存为消息列表的第 `0` 号节点，当模型支持 `in-history` 模式时，就算中途切换 Plan 模式改了系统提示词，它也不会改写第 `0` 号节点，而是在已缓存的历史末尾追加一条新的 `system` 消息，模型以最新一条为准，直到触发上下文压缩时才合并回第 `0` 号节点。

![](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-05-20261028165543-26735f7d.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结下，系统提示词位于前缀缓存树的根节点，无论在系统提示词还是 `AGENTS.md` 里放秒级时间戳都会让缓存失效；正确做法是固定的内容放开头、日期降级到按天或按月、跨天或者规则改动就追加到对话末尾。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-cover-3-4-20261028172004-56396565.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-cover-16-9-20261028172004-aadc95a9.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/why-not-timestamp-in-system-prompt-cover-4-3-20261028172004-1fb87bd3.png)

<!-- video-covers:end -->
