---
title: 说说 Computer Use 的原理
---

如果你用过 Codex 或者 Claude，一定见过它们不仅能改代码、操作浏览器，还能直接接管电脑桌面，操控另外一个 Agent。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-20261026164044.png)

比如说，我现在正在让 Codex 操控 DeepSeek Harness，注意看 DSH 的左上角就有一个被电脑控制的小图标。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-20261026164220.png)

那聪明的你应该已经注意到了，为什么 Agent 能像人一样跨应用操作其他桌面 Agent 呢？

如果你觉得 Computer Use 就是给大模型暴露一堆 `click`、`move`、`type` 的原子工具，让模型看一张截图点击一下鼠标，那就没有理解 Computer Use 的核心原理。

上一期我们讲过 Browser Use，Agent 能靠网页自带的无障碍树拿到元素编号直接点击。但 Computer Use 面对的是操作系统，很多原生桌面软件没有统一的结构化接口，必须结合屏幕画面和系统状态来操作。在 Codex 里，Computer Use 主要解决两个问题，一是用 Node.js REPL 环境取代点击工具，让模型直接写 JavaScript 脚本批量编排桌面动作；二是防止 Agent 误点其他软件或者被屏幕上的恶意内容劫持。

恭喜看到这里的你，已经成功击败 30% 的学习者，给自己来个关注鼓励一下吧。视频的原稿以及 364 道 Agent 八股已经整理到开源知识库。

**接下来我问你，Codex 在执行 Computer Use 时，底层是怎么向大模型暴露桌面操作能力的？**

A，把鼠标点击、移动、键盘输入、截屏拆分成独立的原子工具，每做一个动作请求一次模型；B，通过内置的 `cua_repl` 插件暴露一个 `js` 工具，让模型直接写 JavaScript 代码调用全局 `cua` 对象，在持久化的 Node.js 环境里操作；C，每次让模型生成一段 Shell 脚本去调用系统命令。喜欢收藏的你可以把答案打在弹幕或者留言区。

我的答案是 B。翻开 Codex 的源码，内置插件挂载了一个名叫 `cua_repl` 的 MCP 服务，向大模型暴露的核心工具就叫 `js`，只接收两个参数，一个是描述动作意图的 `title`，Codex 会读取 `title` 把连续多次操作折叠成 `Using computer · N actions`；另一个是要执行的 JavaScript 代码 `code`。模型在 `code` 里直接调用全局 `cua` 对象，比如执行 `await cua.getState()` 获取桌面状态，接着完成点击、输入和截屏，同时返回文本输出和 Base64 编码的 PNG 截图。回合结束或中断时，内置钩子还会自动调用 `turn_ended` 工具释放桌面焦点。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-repl-orchestration-20261026172311-c47ebb66.png)

那聪明的你一定想问，为什么不拆分成独立的 `click`、`type` 工具，非要让模型写 `js` 脚本呢？

一方面，桌面操作往往是一连串动作，如果移动一下鼠标、敲一下回车都要走一轮模型推理并重传高清截图，延迟和 Token 消耗根本承受不住；在持久化的 `cua_repl` 里，一次调用就能执行完整个动作。另一方面，为了保护 KV Cache，Codex 不会在系统提示词里塞满接口文档；只有当模型写错方法名触发 `"Script error"` 时，`cua_repl` 才把完整的 Computer Use API 文档拼接到报错末尾。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**接下来继续问你，电脑桌面上同时开着浏览器、编辑器、聊天软件和终端，Codex 底层是怎么控制 Agent 能访问哪些应用的？**

A，只在系统提示词里叮嘱模型千万别点击无关窗口；B，按操作系统的原生应用标识做黑白名单控制，macOS 绑定 `bundle_ids`，Windows 绑定 `aumids` 和可执行文件的签名信息；C，每次运行都把整台电脑放进虚拟机里。喜欢点赞的你会选哪一个？

Codex 在 `computer_use` 配置块里，先用 `default_app_access` 设定默认是允许访问 `allow` 还是 `deny`。接着在 macOS 系统下按每个软件唯一的 `bundle_ids` 逐个控制，比如把浏览器 `com.apple.Safari` 设为 `allow`，把系统终端 `com.apple.Terminal` 设为 `deny`。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-app-permissions-20261026172637-729dd2d3.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

**继续问你，模型提交了一段 `js` 脚本在后台持续执行，如果脚本运行中途突然要输入密码，或者点击“发送邮件”“确认付款”按钮，Codex 怎么防止它先斩后奏？**

A，每次调用 `js` 工具前都弹窗让用户自己读一遍 JavaScript 代码；B，划分动作确认策略，并在脚本运行中途通过 MCP 实时挂起敏感动作；C，允许脚本先执行完，点错了再撤销。喜欢推荐的你会选哪一个？

我的答案是 B。Codex 在模型配置里制定了确认策略。第一级是必须移交用户的操作，涉及密码、银行卡、验证码、两步验证或签署协议，严禁 Agent 触碰；第二级是动作发生前一刻必须确认的，比如发送消息、付款、删除文件、修改安全设置，不接受提前授权；第三级是允许预先授权的常规修改；第四级是截图、滚动、切换窗口等免确认的只读操作。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-action-confirmation-20261026172739-f895a6a3.png)

当 `js` 脚本运行中途即将触发桌面动作时，`cua_repl` 会反向给 Codex 发一个 `elicitation/create` 审批请求。Codex 检查里面的 `codex_sensitive_action` 标记，普通点击自动返回 `Accept` 静默放行，不打断用户；一旦标记为敏感动作，立刻挂起脚本，弹窗让用户确认或转交安全围栏。也就是说，普通点击静默放行保流畅，高危动作中途挂起保安全。

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后再问你，Computer Use 每一步都要看屏幕截图，如果屏幕上打开的网页或文档里藏着攻击者伪造的恶意指令，Codex 怎么防止大模型被劫持？**

A，把屏幕截图做模糊处理，让模型看不清里面的小字；B，采集多模态证据，交给安全围栏审查。聪明的你会选哪一个？

每次 `cua_repl` 返回的文本和 PNG 截图都会存入上限为 `8 M` 的证据缓冲区，超限时优先淘汰旧图片、保留文本记录。审查下一步操作时，这些历史截图和输出会被打上不可信的证据标签，连同原图发给 Guardian 模型，核对点击目标是否符合用户本意。为了避免同步审查造成卡顿，Guardian V2 采用了自适应模式，会话第一次调用 `cua_repl` 的 `js` 工具时，上下文里还没有外部截图进入，不存在被屏幕内容注入的可能，直接走 `initial_cua_call` 快速通道；同时在后台启动 `LunaSampler` 异步对会话风险打分，低风险记为 `0`，高风险记为 `1`。只要后台评分处于低风险，后续操作就快速放行；一旦某张截图触发高风险评分，立刻切换为同步阻塞。

![](https://cdn.paicoding.com/stutymore/what-is-computer-use-guardian-evidence-20261026172740-11c0c495.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结下，Browser Use 靠无障碍树引用编号精准操控网页，而 Codex 的 Computer Use 靠 `cua_repl` 脚本编排桌面动作。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/what-is-computer-use-cover-portrait-3x4-20261026183910-26cecaad.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/what-is-computer-use-cover-wide-16x9-20261026183910-5bd9a49a.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/what-is-computer-use-cover-standard-4x3-20261026183911-b40cf691.png)

<!-- video-covers:end -->
