---
title: 多个 Agent 同时改一个文件，怎么办？
---

如果你在 Claude Code 里给 Sub-agent 开过 worktree 隔离，同时放好几个 Agent 改同一个项目，你会发现它们从来没有出现过冲突。

在 Pi Agent 里同时开两个终端改同一个仓库，也从来不会弹出任何冲突提示。

聪明的你应该已经注意到了，翻遍这两个 Agent 的代码和文档，你会发现它们都没有给文件加锁。

为什么不加锁？

我翻了 Claude Code 的 worktree 文档，还有 Pi 的文件写入源码，可以自信地、大方地、光明磊落地帮你搞清楚这三件事：

- Claude Code 靠什么避免冲突？
- Pi 没有 worktree，它靠什么？
- 这两种做法分别有什么漏洞？

![git worktree独立目录与共享历史](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-worktrees-20261020160100-4d34a299.png)

哈喽大家好，我是二哥呀。今天用 3 分钟，给你讲清楚多个 Agent 同时改一个文件的时候，Claude Code 和 Pi 到底是怎么处理的。

**先说第一件事，Claude Code 的办法是给每个 Agent 一整个仓库。**

你在启动的时候加上 --worktree，后面再跟一个名字，Claude 就会在 .claude/worktrees/ 下面建一个独立的工作目录，切一条新分支，分支名是 worktree- 加上你给的那个名字。

这个目录是 git worktree 出来的，有自己的文件，有自己的分支，但和主仓库共享同一份提交历史。

想让 Sub-agent 也享受这套隔离，在它的 frontmatter 里加一行 `isolation: worktree`。这样它一启动就会进自己的临时 worktree，如果没有改动的话，Claude Code 会自动把这个目录清理掉。

但光建目录还不够，Agent 完全可以用一条绝对路径，把文件写回主仓库里。所以 Claude Code 加了四道检查。

第一道，文件编辑。Edit、Write、NotebookEdit 这三个工具，只要目标路径落在主仓库里，直接拒绝。

第二道，命令在哪里执行。Bash 命令如果在主仓库里执行，拒绝。

第三道，git 重定向。想用 git -C、--git-dir 这些方式把 git 指回主仓库，拒绝。

第四道，命令形态。一段命令文本如果 Claude Code 没法确认里面执行的 git 会留在 worktree 里，比如命令名是运行时算出来的，也拒绝。

![worktree隔离的四道检查及其边界](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-guards-20261020155857-de887d83.png)

这里有一个明确的漏洞，官方文档也写出来了。这些检查看的是编辑的目标路径、命令在哪里执行、还有命令文本本身，没有跟踪 shell 命令实际写入了哪些文件。所以用 cp 或者重定向把内容往主仓库里写，这几道检查是拦不住的。

换句话说，Claude Code 没有解决冲突，它只是让冲突暂时不可能发生。

**那聪明的你肯定想到了，Pi 没有 worktree，它是怎么处理冲突的？**

Pi 的设计不一样。它的多个 session 共享同一个工作目录，你开的几个终端都在同一个目录里执行任务，没做文件系统隔离。我查看了它的命令行参数表，没有 worktree 相关的开关。

Pi 把注意力放在了时间上。

它内部有一个文件变更队列，实现了一个模块级的 Map，同一个文件上的写入操作会串成 Promise 链，前一个做完才轮到下一个，不同文件之间可以并行。

这个队列的 key 会先做一次路径解析，再做一次真实路径解析，所以两个软链接指向同一个文件的时候，也会排进同一个队列里。

更关键的是 edit 工具的工作方式。它把检查文件是否存在、读取当前内容、匹配 oldText、写回结果，这四步全部放在队列里面完成。同一个进程里有十个并行 edit，也会老老实实排队。

![Pi文件变更队列中同文件串行与不同文件并行](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-queue-20261020160101-65c84040.png)

但这个队列有一个漏洞，bash 工具没有引用它。模型用 sed 改写文件、用重定向写文件、执行 prettier 格式化，这些操作都不排队，甚至和同一个进程里的 edit 也不互斥。

一句话总结，Pi 不拆分工作目录，而是在单个进程里用内存队列把同一个文件的写操作排成单行道。

**那聪明的你肯定又要问了，这两种做法漏掉了什么？**

先看 Pi 的队列。它是模块级的 Map，只在同一个进程里共享。你在两个终端各开一个 pi，指向同一个仓库，它们在内存里根本看不见对方。后写的那个仍然会直接覆盖先写的，没有任何提示。

write 工具的实现里连读都不读，建好父目录就把内容写进去，无条件覆盖。

edit 工具看起来安全一点，因为它要求 oldText 能在当前文件里匹配上。但这是文本匹配的副产物，不是版本校验。如果外部改动恰好落在 oldText 覆盖的那几行，匹配失败，报的错是找不到要替换的文本，模型只会当成自己的 oldText 写错了，意识不到文件其实已经被其他 Agent 改过了。

如果外部改动落在 oldText 以外的地方，匹配照样成功，两边基于不同的基线各改各的，结果静默写回，双方的改动都会生效。

Claude Code 的 worktree 把冲突延迟到了合并那一步，git 该报冲突还是会报，只不过需要人来处理。

更麻烦的是语义冲突。Agent 张三把一个函数的返回值从字符串改成了对象。Agent 李四在另一个 worktree 里，没看到这个改动，照着旧的返回值类型写了一段函数调用代码。合并的时候，这两处改动在不同的文件里，git 一个冲突都不报。可 merge 到一起之后，运行起来就有问题了。

![worktree合并后返回值与调用约定不兼容的语义冲突](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-semantic-20261020160101-b543a320.png)

所以无论是空间隔离还是时间排队，都只能管住单个工具层面的文本写入，管不住跨进程覆盖和代码逻辑层面的语义冲突。

最后简单总结下。

Claude Code 用空间换安全，Pi 用时间换安全。

另外，如果你现在就在用多个 Agent 执行任务，先把任务按目录分好，别让两个 Agent 同时碰同一个文件。真要碰，就串行，一个改完另一个再上。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-cover-portrait-3x4-20261020162229-553d8368.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-cover-wide-16x9-20261020162230-c6bf7da3.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/multi-agent-file-conflict-cover-standard-4x3-20261020162230-aae8bcd8.png)

<!-- video-covers:end -->
