---
title: 手机版 DeepSeek Harness，鲸娘陪你干活不烧心。
---

你敢信？DeepSeek Harness 竟然有了手机版。社区开发者基于开源的 DeepSeek Harness，做了一个叫 DSH Go 的 Android 客户端，目前已经有 21K star 了。

![](https://cdn.paicoding.com/stutymore/dsh-go-pixel-overview-20261113155108-7aa3aa20.png)

去 GitHub Releases 下载 arm64 版本的安装包，不用获取 Root 权限，也不用在 Termux 里敲命令，装好就能在手机上运行 DSH，也可以一键切换成远程模式，控制你电脑上的 DSH。干活的时候，屏幕上还有小鲸鱼 Deepy 和鲸娘陪着你。你敲代码时它们跟着敲键盘，任务跑完还会翻跟头和你一块庆祝，遇到需要审批时就举手提醒你。

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，DSH 依赖 Node.js 和 Linux 环境，手机怎么跑起来？**

普通 App 直接调用系统命令时，会被 Android 的权限拦下来。DSH Go 的做法是把 Ubuntu、Node.js、Python、pnpm 和 DSH 一起打包成一套内置的运行环境。

默认是以 PRoot 模式兼容启动。PRoot 是一个运行在用户态的工具，它会拦截访问文件的系统调用，把路径改写到 App 自己的私有目录里，所以不需要 Root 权限也能运行完整的 Linux 环境。

不过，由于这种方式需要在系统调用时做一次路径转换，速度偏慢。如果你嫌慢的话，可以在开发者选项里打开直接启动，改由 Node 的预加载模块负责路径映射和 DNS 解析。如果直接启动被 Android 的系统限制拦截，DSH Go 会自动退回兼容启动。

![](https://cdn.paicoding.com/stutymore/dsh-go-pixel-engine-20261113155108-0d4d65e0.png)

这套本机环境大约要占用 `1 GB` 存储空间。需要注意，手机上运行的只是 Agent 引擎，大模型推理仍然需要联网。

如果手机剩余空间不足，可以在安装后直接选择远程主机，通过 SSH 隧道或端到端加密的 DSH Remote 连接电脑。DSH Remote 会优先尝试局域网直连或 P2P 直连，连不上再走中继服务器。你还可以打开“精简历史”开关，让电脑先把早期工具调用的参数和长输出压缩成简短摘要，再传给手机，这样上下文不会中断，也能节省流量。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，鲸娘只是个桌面宠物，真能帮上忙？**

长任务跑久了，没人愿意一直盯着手机屏幕等结果。在设置里打开“App 外显示”后，你切回微信或者去刷网页，鲸娘会以悬浮窗的形式留在手机桌面，显示后台任务的进度。

任务完成、出现报错，或者需要你审批权限时，鲸娘都会弹出气泡提醒；双击鲸娘，会跳转到最需要你处理的那个会话。

长按鲸娘还会弹出一个半圆形菜单。滑到“问一句”，可以用本地安装的离线语音模型，通过语音输入提示词。

![](https://cdn.paicoding.com/stutymore/dsh-go-pets-wechat-600px-180frames-20261113160045-4fa90cfe.gif)

除了像素桌宠，打开切换主机面板，还能进入一个单独的“伙伴小屋”。导入素材包后，小屋里会出现 Live2D 版本的鲸娘。你可以摸她的头、喂她点心，倾斜或摇晃手机时，她也会随重力做出反应。

你还可以接入小米 MiMo、硅基流动，或者自己部署的 GPT-SoVITS 语音合成服务给她配音，甚至上传一段录音来克隆音色。

恭喜看到这里的你，成功击败 70% 的学习者了。

**最后聪明的你还会问，除了在沙箱里跑命令，它能不能帮我操作手机上的其他 App？**

可以。开启手机操控和无障碍服务后，DSH Go 会用内置的 Google ML Kit 在手机本地识别屏幕上的中文，把识别出的文字或屏幕画面发给大模型，再由大模型决定点哪里、输入什么。

任务执行期间，屏幕顶部会显示一个胶囊形状的悬浮条，实时告诉你它正在点哪个按钮。你随时可以点开悬浮条补充指令、调整做法，也可以按住屏幕边缘的小球 `1` 秒，让任务紧急停止。

![](https://cdn.paicoding.com/stutymore/dsh-go-pixel-phone-safety-20261113155109-01c0eb65.png)

另外，手机操控只能在正常模式下的本机引擎中可用，执行期间手机必须保持亮屏和解锁状态。一旦熄屏，或者连续 `3` 分钟没有新操作，任务就会自动终止。

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下，DSH Go 是社区开源的 DeepSeek Harness 手机客户端。它既能靠内置的 Ubuntu 环境，在不 Root 的手机上直接运行 DSH，也能通过 SSH 或 DSH Remote 远程控制电脑上的 DSH。鲸娘会以悬浮窗的形式显示任务进度、提醒你审批，还能一键截图提问；开启手机操控后，DSH Go 还能替你操作手机。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
## 视频封面

竖版 3:4：

![DSH Go 像素风竖版封面](https://cdn.paicoding.com/stutymore/dsh-go-pixel-cover-vertical-20261113155925-773b92a4.png)

宽屏 16:9：

![DSH Go 像素风宽屏封面](https://cdn.paicoding.com/stutymore/dsh-go-pixel-cover-widescreen-20261113155925-3ee283c0.png)

横版 4:3：

![DSH Go 像素风横版封面](https://cdn.paicoding.com/stutymore/dsh-go-pixel-cover-horizontal-20261113155925-771e94af.png)
<!-- video-covers:end -->
