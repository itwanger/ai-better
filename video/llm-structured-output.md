---
title: 怎么让 LLM 返回结构化数据？
---

做 Agent 开发或者调用大模型 API 时，我们经常需要让模型从票据里抽取字段，或者判断一条终端命令安不安全，然后把返回结果交给下游代码用 `JSON.parse` 解析。

【截图：大模型返回非标准 JSON 导致解析报错；风格：二哥像素风；截图目标：展示模型在 JSON 外包裹 Markdown 反引号并夹带客套话导致 JSON.parse 报错的对比画面；关键词：JSON.parse、格式报错、结构化输出】

但大模型是按概率一个 `Token` 接一个 `Token` 生成文本的。很多时候它会在 JSON 外面套一层 Markdown 代码块，在开头加一句“好的，结果如下”，或者漏掉必填字段，导致下游代码解析报错。为了拿到规整的结构化数据，从早期的提示词约束、受限解码，到生产级 Agent 的工具闭环与容错解析，一共有四层方案。

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，只写提示词或者开启 JSON Mode，为什么还是会翻车？**

先看提示词约束。我们在系统提示词或用户提示词里写上“请只返回 JSON，不要输出其他解释”，这只是在调整候选词的概率分布，让大括号和引号更容易被抽中。但在解码采样阶段，词表里的其他候选词并没有被屏蔽，模型依然有概率抽中普通文字或反引号。

为了解决语法错误，各家 API 后来推出了 JSON Mode，比如在请求参数里传 `response_format: { type: "json_object" }`。开启之后，服务端能保证模型输出一段括号闭合、语法合法的 JSON 对象，而且提示词里必须显式包含 `JSON` 这四个字母，漏写就会返回 `400` 错误。但 JSON Mode 只管语法合不合法，不管里面的字段名对不对、类型匹不匹配。比如下游代码要求 `age` 字段是数字 `42`，模型可能会返回字符串 `"42"`，或者把字段名写成 `user_age`，到了业务代码里照样会出错。

【截图：提示词约束与 JSON Mode 的局限性；风格：二哥像素风；截图目标：展示提示词约束夹带多余文本、JSON Mode 语法合法但字段名或类型不匹配的对比；关键词：Prompt、json_object、字段类型错误】

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，原生 Structured Outputs 是怎么锁死格式的？背后有什么代价？**

要连字段名和数据类型一起锁死，就要用到带 `JSON Schema` 的结构化输出，比如 OpenAI 的 `json_schema` 格式和 Anthropic 的 `output_config.format`。它们在底层采用的是受限解码（Constrained Decoding）。

服务端拿到你传入的 `JSON Schema` 后，会先把它编译成一套状态机。模型每生成一个新 `Token`，算完词表里十几万个候选词的分数（`Logits`）后，服务端会先看一眼状态机当前走到了哪一步。比如当前刚输出完左大括号 `{`，按 Schema 规则下一步只能跟双引号 `"`，服务端就会把词表里所有不是双引号开头的候选词分数设为负无穷，只留下符合规则的候选词参与抽签。这样生成出来的每个 `Token`，都不会偏离 Schema 规定的字段名和类型。

但受限解码有三个工程代价。第一，服务端第一次见到一个新的 Schema 时，需要在后台把 Schema 编译成词表掩码索引，这会拉长首字延迟。第二，为了控制状态机的状态数量，开启 `strict: true` 严格模式后只支持一部分 Schema 语法，要求把所有字段都放进 `required` 必填列表，并设置 `additionalProperties: false` 禁止额外属性。翻开 Pi Agent 的源码能看到，为了兼容各家厂商的严格模式，它在发送请求前会自动把可选字段改写成允许为 `null` 并塞进 `required` 列表；等收到模型返回的结果后，再对照原始 Schema 把值为 `null` 的可选字段删掉还原。第三，如果 `max_tokens` 预算给小了，模型生成到一半因为长度超限停下来，状态机也拦不住，拿到的依然是半截残缺的 JSON。

【截图：受限解码状态机掩码与三大代价；风格：二哥像素风；截图目标：展示 JSON Schema 编译为状态机、将违规 Token 的 Logits 设为负无穷，以及首字延迟、全字段 required、max_tokens 截断三大边界；关键词：Constrained Decoding、Logits Mask、JSON Schema】

恭喜看到这里的你，成功击败 70% 的学习者了。

**聪明的你可能会继续问，多轮工作的 Agent 为什么不用 API 的结构化输出，反而要专门注册一个工具？**

因为在多轮 Agent 任务里，模型需要先调用 `read`、`bash`、`edit` 等工具去读文件、跑命令，到最后一轮才能汇总出结构化结果。如果从第一轮请求开始就在 API 上开启 `output_config.format` 或 `response_format`，模型的第一轮文本回复就会被强制锁死成目标 JSON Schema，没法正常推进多步任务。

翻开 DeepSeek Harness 和 Claude Code 的源码，它们在需要多轮 Agent 返回结构化数据时，都采用了“合成终结工具加校验重试”的做法。在 DeepSeek Harness 里，当父 Agent 传入 `outputSchema` 启动一个进程内的 Sub-agent 时，运行时会动态给这个 Sub-agent 注册一个名叫 `structured_output` 的工具，把目标 Schema 设为该工具的参数定义，并在系统提示词里要求 Sub-agent 完成任务时调用这个工具提交结果。

模型调用 `structured_output` 工具后，DeepSeek Harness 会用本地的 Schema 校验器检查每一个字段。如果某个字段类型不对或者缺了必填项，校验器就会把具体的违规原因包装成一条带有 `is_error: true` 标记的 `tool_result` 发回给模型，让模型在当前会话轮次里看着报错自己重填；校验通过后，才会标记当前轮次结束，并拦截同一批次排在后面的其他工具调用。Claude Code 在处理 `--json-schema` 参数时也是同样的路数，动态创建一个 `StructuredOutput` 工具并用 `Ajv` 校验输入，同时还挂载了一个 `Stop` 钩子：如果模型干完活想用普通文本结束会话、忘了调用 `StructuredOutput` 工具，钩子就会拦住它并追加一条提示词逼它补调，最多允许重试 `5` 次。

【截图：多轮 Agent 合成终结工具与校验重试闭环；风格：二哥像素风；截图目标：展示 Sub-agent 先调用 read/bash 工具，最后调用 structured_output 提交，校验失败转 tool_result 自愈重试以及 Stop 钩子拦截的流程；关键词：structured_output、tool_result、Stop Hook】

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后聪明的你还会问，开启思考模式或者追求低延迟时，Claude Code、Codex 和 DeepSeek Harness 是怎么取舍的？**

在真实的生产环境里，各大 Agent 并不会把所有内部请求都设为严格模式，而是根据延迟、Token 消耗和思考模式的限制做取舍。

先看 Codex 的 Guardian 自动权限审查。它的 Schema 定义了风险等级、授权状态、结论和原因 `4` 个字段，但绝大多数日常命令都是安全的，为了省下输出 `Token` 和等待时间，低风险命令只需要输出 `{"outcome": "allow"}` 就行，不需要长篇大论写原因。而 OpenAI 的 `strict: true` 严格模式强制要求所有字段都必填，一旦开启就会报错，所以 Codex 专门给这类基础审查会话关掉了 `strict`。为了应对关闭严格模式后模型偶发在 JSON 前后夹带文字的情况，Codex 在客户端做了两级容错：先尝试解析整段文本，如果失败，就找到第一个左大括号 `{` 和最后一个右大括号 `}` 截取中间的子串再解析，并为省略掉的字段补上安全默认值。

再看 DeepSeek Harness 的自动权限审批。为了兼容开启了思考模式的模型，它不挂载任何工具，把 `temperature` 设为 `0`，允许模型在返回流里先输出任意个 `reasoning` 思考块，只要求排在最后的一个块是单行 JSON 文本。更细致的是，它在调用 `JSON.parse` 之前专门写了一段词法扫描逻辑，统计 JSON 顶层一共有几个键。为什么要查这个？因为如果模型输出了两个同名的 `decision` 键，前一个写 `deny`，后一个写 `allow`，标准的 `JSON.parse` 会静默用后面的 `allow` 覆盖前面的 `deny`。一旦发现顶层键数量和解析后的键数量对不上，DeepSeek Harness 就会判定存在重复键名并拒绝放行。

最后看 Claude Code 的自动安全分类器。在 Anthropic 的接口协议里，开启思考模式时禁止使用强制 `tool_choice` 指定调用某个工具，而且自适应思考会占用 `max_tokens` 输出额度。为此，Claude Code 默认改用 `<block>yes</block>` 或 `<block>no</block>` 这样的 XML 标签格式，把闭合标签 `</block>` 设为停止词（`stop_sequences`），并为开启自适应思考的模型额外增加 `2048` 个 `Token` 的预算余量。这样既避开了思考模式与强制工具调用的冲突，防止思考过程耗尽额度导致正文被截断，又能在模型输出完 `</block>` 的那一刻停下来，省去生成后续文字的时间。

【截图：三大 Agent 在权限与安全审查中的结构化取舍；风格：二哥像素风；截图目标：展示 Codex 关闭 strict 截取大括号省 Token、DeepSeek Harness 兼容思考块并扫描重复键防覆盖、Claude Code 用 XML 配合 stop_sequences 与 2048 思考余量；关键词：Codex Guardian、重复键检测、stop_sequences】

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下，让大模型返回结构化数据一共有四层方案。提示词约束和 JSON Mode 适合快速原型，但管不住字段名和类型。原生的 Structured Outputs 靠受限解码和状态机掩码锁死 Schema，但要注意首次编译延迟、全字段必填限制和长度截断。多轮工作的 Agent 会注册专门的 `structured_output` 合成工具，配合本地校验报错和 `Stop` 钩子实现自我修正。而在面对思考模式和低延迟审查场景时，各大 Agent 会灵活关闭严格模式，结合大括号截取、重复键扫描或 XML 停止词来兜底。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！
