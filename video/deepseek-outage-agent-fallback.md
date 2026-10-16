---
title: DeepSeek 宕机 5 小时赔付 7 天账单，如何应对 API 的单点依赖？
---

10 月 15 日，DeepSeek 发生了持续 4 小时 53 分钟的服务故障。网页端、手机客户端，以及 DeepSeek API 同时报错，均无法正常调用。

当天下午，DeepSeek 官方发布了致歉与补偿通知。直接把账号在 10 月 8 日到 10 月 14 日整整 7 天的实际 API 消耗金额，以赠金形式 100% 全额返还。

![](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-20261016115010.png)

我翻了 DeepSeek 官方的故障通报、API 调用文档，以及开源模型网关 LiteLLM 的容灾路由文档，可以自信地、大方地、光明磊落地帮你搞清楚这三件事。

- 拥有万卡集群的 DeepSeek，为什么会因为单点依赖全网瘫痪？
- 我们做 Agent 开发时，怎么剥离对模型 API 的单点依赖？
- 为什么切换到备用模型会报 400 错误，甚至瞬间把账单打爆？

哈喽大家好，我是二哥呀。今天用 3 分钟，给你讲透生产 Agent 怎么做高可用容灾。

先说第一件事。一次 API 请求在进入 GPU 显卡计算之前，必须先做好这三道关卡控制。

第一道是鉴权与计费服务，负责校验 API Key、扣减余额、检查每分钟的 Token 限额。如果数据中心的计费或者限流出现连接池打满，或者主从切换卡死，所有的请求就会在网关层被拦截。

第二道是全局前缀缓存路由器。DeepSeek 默认开启了全自动的 Prefix Caching，网关不能随机轮询分发请求，必须查询一个维护着全局 Radix Tree 的中心路由目录，把相同前缀的请求准确调度到驻留了对应 KV Cache 的工作节点上。

第三道是 PD 分离架构的中心协调器，负责把计算密集的 Prefill 节点和显存带宽密集的 Decode 节点配对调度。只要鉴权计费、缓存路由或者中心协调器里存在单点依赖，一旦卡死，哪怕还有几万张空闲显卡，外部的请求也进不去。

解释一点，PD 也就是 Prefill-Decode Disaggregation，预填充与解码分离架构。

![](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-01-20261016143057-e1809d68.png)

**那聪明的你肯定要问，怎么剥离对单一模型 API 的单点依赖啊？**

生产环境里，不能在业务代码里写死一家模型厂商的接口地址，而是要在 Harness 与模型厂商之间，加一层具备容灾路由能力的大模型网关，比如开源的 LiteLLM Router。

在路由网关里，靠重试、熔断和 Fallback 剥离单点依赖。

比如说遇到网络抖动或者偶发的 502 错误时，网关通过 `num_retries` 参数发起带随机抖动的指数退避重试，防止所有客户端在同一时间扎堆重试把刚恢复的服务再次打崩。如果上游彻底挂了，网关根据 `allowed_fails` 失败阈值和 `cooldown_time` 冷却时间，比如 1 分钟内连续失败 3 次就立即触发熔断，把故障节点隔离 60 秒，新请求不再干等超时。主模型熔断期间，网关按照 `fallbacks` 列表自动把请求转发给备用的 Qwen 或 GLM 同档位模型，等主模型恢复后再切换回来。

![](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-02-20261016143244-37aa95bf.png)

**那聪明的你肯定又要问了，为什么 Agent 切换到备用模型会报 400 错误，甚至瞬间把账单打爆？**

第一个原因，跨模型调用会出现消息协议冲突。按照 DeepSeek 官方 API 文档规定，思考模式在多轮工具调用时，上一轮返回的 `reasoning_content` 字段必须在下一轮原样传回，否则就报 400 错误。但中途触发 Fallback 切换到 Qwen 或 GLM 接口时，JSON Schema 校验器可能不认识 `reasoning_content` 这个扩展字段，原样发过去的话就会报 400 错误。所以跨厂商转发前必须先做协议清洗，剥离不支持的扩展字段，并统一 `tool_calls` 的 ID 格式。

第二个原因是 SSE 流式输出的中途断连。模型刚拼出半个残缺的 JSON 字符串时连接中断，如果直接重放，就会把没收到 `[DONE]` 结束标记的残缺参数拿去执行工具从而引发误操作。正确的做法是在流完成标记前断开，立刻丢弃半成品的工具调用，并且只要已经向用户输出过内容，就不再隐式重放。

第三个原因是 Prefix Caching 瞬间归零。Agent 跑到中后期，系统提示词加上工具定义和多轮文件读取结果，单次输入动辄十万个 Token。平时在 DeepSeek 上靠自动前缀缓存能拿到 80% 以上的命中率。但切换到备用模型时，KV Cache 无法跨厂商搬运，备用模型第一下必然是 100% 缓存未命中。所以触发跨厂商降级时，必须同步触发上下文摘要压缩，把上下文压缩后再发给备用模型。

![](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-03-20261016143406-809bca46.png)

说实话，我对 DeepSeek 这次的处理态度非常认可。出故障后不甩锅，直接承认单点依赖，还免工单退还了整整 7 天的全额账单，诚意在行业里是顶格的，完全值得继续作为主力模型使用。

给你一条实用建议。检查一下你手头的 Agent 调用代码，不要在业务层硬编码单一模型的接口地址，在中间加一层路由网关配好 `fallbacks`，并在跨厂商切换时剥离 `reasoning_content` 并压缩超长上下文。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->

## 视频封面

![竖版封面 3:4](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-cover-portrait-3x4-20261016143031-639677f6.png)

![宽屏横版封面 16:9](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-cover-wide-16x9-20261016143032-cae33c18.png)

![标准横版封面 4:3](https://cdn.paicoding.com/stutymore/deepseek-outage-agent-fallback-cover-standard-4x3-20261016143033-370fbfae.png)

<!-- video-covers:end -->
