---
title: 说说 Browser Use 的原理
---

如果你用过 DeepSeek Harness 或者 Codex，一定用过他们自动打开浏览器，查网页、点按钮、填表单，甚至完成前端自动化测试。

![](https://cdn.paicoding.com/stutymore/what-is-browser-use-20261025161900.png)

那聪明的你应该已经注意到了，为什么 Agent 能像人一样熟练地操作浏览器呢？

如果你觉得 Browser Use 就是让大模型看着网页截图去猜像素坐标，或者把几万行 HTML 源码原封不动塞进上下文，那就没有 get 到 Browser Use 的核心原理。

Computer Use 面对的是整个操作系统，很多软件没有结构化接口，只能靠截屏让视觉模型估算坐标位置。但浏览器天生就有一套给读屏软件准备的无障碍树（Accessibility Tree），以及底层的浏览器调试协议（Chrome DevTools Protocol，简称 CDP）。Browser Use 主要解决两个问题，一是通过调试协议读取无障碍树，把网页清洗成带短编号的纯文本快照；二是让模型直接按编号指派点击和输入动作，避开窗口缩放导致的坐标偏移。

恭喜看到这里的你，已经成功击败 30% 的学习者，给自己来个关注鼓励一下吧。视频的原稿以及 363 道 Agent 八股已经整理到开源知识库。

**接下来我问你，Agent 操控浏览器时，底层是怎么看懂网页并准确点中目标按钮的？**

A，把 HTML 源码全部塞给大模型，让模型手写 CSS 选择器；B，每一步都截取高清长图，让视觉模型估算像素坐标；C，读取浏览器的无障碍树快照，给可交互元素分配短引用编号，模型按编号操作，必要时再配合截图核验。喜欢收藏的你可以把答案打在弹幕或者留言区。

拿 DeepSeek Harness 来说，Agent 打开 `javabetter.cn` 并点击里面的跳转链接。Agent 并没有去读取冗长的 HTML 源码，而是先调用 `snapshot` 工具提取页面的无障碍树快照，拿到的只有一行结构化文本 `link "Agent 八股" [ref=e1]`，代表页面上有一个编号为 `e1` 的链接。模型直接对 `e1` 发起点击，页面立刻跳转到王二讲 Agent 的开源知识库。接着 Agent 调用 `screenshot` 截取了一张 `1280x720` 分辨率的渲染图，再用内置的 `read_image` 工具读图确认画面正常，最后调用 `back` 回退并调用 `close` 关闭浏览器。

![](https://cdn.paicoding.com/stutymore/what-is-browser-use-snapshot-ref-20261025164405-4e822d63.png)

那聪明的你一定想问，为什么不直接传 HTML 源码或者看图猜坐标呢？

一方面，前端生成的 HTML 动辄几万行，类名全是随机哈希字符串，而无障碍树只保留可交互节点，经 Vercel Labs 的 `agent-browser` 团队实测，Token 消耗能比全量 DOM 方案少 90%。另一方面，网页一旦滚动或者缩放，像素坐标就会偏移，而绑定在 DOM 节点上的引用编号始终准确。可以说，HTML 源码是写给渲染引擎看的，无障碍树快照才是给 Agent 准备的高信噪比地图。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**接下来继续问你，DeepSeek Harness 底层是怎么集成不同 Browser Use 方案的？**

A，在内核里写死一套统一的点击和输入接口；B，只保留一个轻量级的独占注册槽位，由 Playwright MCP、Chrome DevTools MCP 和 Stagehand 三套插件各自暴露原生工具；C，直接拿侧边栏浏览器当自动化工具。喜欢点赞的你会选哪一个？

我的答案是 B。翻开 DeepSeek Harness 的源码，它给用户看的侧边栏浏览器，和给 Agent 操控网页的 Browser Use 拆成了两个独立模块。内核里的浏览器注册服务只提供一个 `register` 方法占住槽位，同一时间只允许激活一个提供方。而且这个注册服务本身不挂载任何工具，不会污染 KV Cache。

官方提供了三套插件。Playwright MCP 插件负责把网页转成无障碍树快照；Chrome DevTools MCP 插件通过 `take_snapshot` 获取元素唯一标识，还能检查控制台报错和网络请求；Stagehand 原生插件则只向主模型暴露 `stagehand_navigate`、`stagehand_tabs`、`stagehand_screenshot` 等工具。主模型只管外层的任务规划，把页面点击和提取 JSON Schema 数据交给独立 Worker 线程里的 Stagehand 模型。

![](https://cdn.paicoding.com/stutymore/what-is-browser-use-plugin-architecture-20261025164318-c530838e.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

**继续问你，如果网页需要登录状态，或者同时开了多个 Agent 会话，DeepSeek Harness 怎么防止它们互相抢占浏览器？**

A，所有会话共用同一个后台浏览器，靠提示词要求模型别乱动别人的标签页；B，区分 `launch` 和 `attach` 两种模式，按会话队列串行，被占用时自动用作用域掩码屏蔽浏览器工具；C，每次调用工具都临时打开一个无痕窗口，用完立刻关掉。喜欢推荐的你会选哪一个？

DeepSeek Harness 的浏览器运行时分为 `launch` 和 `attach` 两种模式。默认的 `launch` 模式为每个实时会话单独拉起一个 Chromium 进程和临时目录，会话结束时自动清理，但里面没有平时登录的 Cookie。如果要操作已登录的后台，就要用 `attach` 模式，通过 CDP 调试地址接管本地已经打开的浏览器。

一旦某个会话通过 `attach` 接管了外部浏览器，运行时就会将它独占锁定，同一会话内通过队列严格串行。其他并发会话如果也想接入，就会被标记为 `blocked` 状态，运行时会调用 `tools.restrict` 自动屏蔽该会话的所有浏览器工具，并剔除系统提示词里的浏览器说明，让它降级为普通会话运行；会话结束时也只断开连接，绝不关闭用户的外部浏览器。

![](https://cdn.paicoding.com/stutymore/what-is-browser-use-session-isolation-20261025164332-4b5708d0.png)

也就是说，`launch` 模式负责沙箱隔离，`attach` 模式负责复用登录状态。

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后再问你，Agent 用 Browser Use 验收前端页面时，看到本地端口返回 HTTP 200 就算验收通过了吗？**

A，只要代码编译通过、端口返回 HTTP 200，就说明页面正常；B，HTTP 200 不等于页面正常渲染，必须对用户正在访问的确切地址做真实页面观测，同时把网页内容当成不可信数据防范提示词注入。聪明的你会选哪一个？

DeepSeek Harness 源码仓库里记录过一次编号为 0003 的真实事故复盘。当时 Agent 改完界面主题去验收，不知道当前界面运行在 `3081` 端口，就自己在 `5173` 端口启动了 Vite 服务，看到返回 HTTP 200 就宣布成功，结果浏览器因为缺少宿主注入的启动变量，打开全是一片空白页。为此官方在系统提示词里立下两条铁律，一是 HTTP 200、构建成功和页面正常渲染不是一码事，操作后必须从最新页面状态验证结果；二是网页文本属于不可信的外部数据，严禁恶意网页通过提示词注入劫持工具调用。

![](https://cdn.paicoding.com/stutymore/what-is-browser-use-render-security-20261025164349-4be0feb3.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/what-is-browser-use-cover-portrait-3x4-20261025164426-f5e6c9a3.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/what-is-browser-use-cover-wide-16x9-20261025164427-b730d2c4.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/what-is-browser-use-cover-standard-4x3-20261025164428-6ed55398.png)

<!-- video-covers:end -->
