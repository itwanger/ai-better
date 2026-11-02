---
title: 小米太顶了，Xiaomi-OCR-0 正式开源。
---

10 月 30 日，小米正式发布了 Xiaomi-OCR-0。这个模型只有 0.8B 参数，模型权重、推理代码、演示页面、MCP 服务和 Agent Skill 全部开源，协议是 Apache-2.0。

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-20261031122851.png)

官方在 Hugging Face 上放了一个演示页面，跑在 A100 上。你上传一张图片或者一份 PDF，可以选择整页解析或者区域解析，正文会输出成 Markdown，表格转成 HTML，公式转成 LaTeX。你也可以让它从票据里抽出指定字段，输出成 JSON，还可以直接对着图片提问。

恭喜看到这里的你，已经成功击败 30% 的学习者。

**那聪明的你一定会问，本地怎么部署和调用 Xiaomi-OCR-0？**

先在本地装好 Ollama，再执行 `ollama pull longwayxu/xiaomi-ocr-0:bf16`，就能把社区打包好的版本拉下来。这个包里同时包含文本模型和视觉编码器，体积只有 `1.8 G` 左右，对电脑配置的要求不高。

不过光把模型拉下来还不够。图像缩放、提示词和解码参数这些配置，都写在官方仓库的 Demo 和 MCP 服务里，所以还要把官方仓库下载到本地。接着把后端地址指向本地 Ollama 的 `11434` 端口，运行 `server.py`，打开浏览器就能用了。

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-local-deployment-upgraded-20261031123354-16a4965f.jpg)

支持区域和整页两种模式识别，印刷整齐的文档建议用区域模式。它会先用版面检测模型把标题、正文、表格、公式一块块框出来，再并行识别。手写、书法、古籍和不规则版面建议用整页模式，整张图一起识别，不会因为区域切错而丢掉上下文。要注意的是，区域模式需要额外安装 PaddleX 和版面检测模型。

恭喜看到这里的你，已经成功击败 50% 的学习者了。

**那聪明的你肯定会继续问，只有 0.8B 参数，真有这么猛吗？**

先来看跑分。在文档解析的权威评测集 OmniDocBench v1.6 上，Xiaomi-OCR-0 拿到了 96.83 的高分，在 1B 以下的模型里排第一，超过了 PaddleOCR-VL-1.6 的 96.33 分。

Xiaomi-OCR-0 是在 Qwen3.5-0.8B-Base 的基础上训练出来的。小米先做了一轮视觉与文本的对齐训练，让模型把文字和它在页面上的位置对应起来，再用大量 OCR 数据继续预训练。

真正拉开差距的是训练数据。训练样本有 1.7 亿条，这么大的量，靠人工根本标注不过来。小米的做法是，先让 PaddleOCR-VL、MinerU 等 8 个现成的 OCR 模型各自识别一遍，结果一致的部分直接采纳。结果有分歧的区域，就交给参数量更大的 Qwen3.5-122B 处理：把识别结果重新渲染成图片，和原图放在一起比对修正，最多校验 3 轮。

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-cross-annotation-20261031121807-3510ba39.png)

恭喜看到这里的你，成功击败 70% 的学习者了。

**聪明的你可能会继续问，强化学习阶段怎么给模型打分？**

OCR 任务的对错有客观标准，不需要人工按偏好打分，按任务类型用规则计算分数就行。普通文本看和标准答案差了几个字，表格看行列结构能不能对上，公式看渲染出来的符号能不能对齐，字段抽取先检查输出是不是合法的 JSON，再逐个字段比对。只要输出解析不了或者格式有问题，一律记 `0` 分，逼着模型老老实实按规矩输出。

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-training-ablation-20261031121739-205616fd.jpg)

恭喜看到这里的你，成功击败 90% 的学习者了。

**最后聪明的你还会问，Agent 和 RAG 知识库怎么接入它？**

先说 Agent。你只需要把官方仓库里 `SKILL.md` 的链接发给 DeepSeek Harness 或者 Codex，让它读取并执行。Agent 会先通过 `npx skills add SeerRay-Lab/Xiaomi-OCR-0` 装好官方 Skill，再执行仓库里的 `install.sh` 脚本，配好 Python 环境，连上本地模型，并注册 MCP 服务。注册完成后，Agent 就多了四个工具：图片解析、PDF 解析、字段抽取和图片问答。

再说 RAG 知识库。扫描件和图片里的文字没法直接参与检索，所以文档上传之后，第一步要用 Xiaomi-OCR-0 把它解析成 Markdown，然后再做文本分块、向量化和检索问答。因为表格已经转换成了 HTML，分块时表格的行列结构也能保留下来。

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-rag-20261031122054-c2e9a773.png)

恭喜你升到王者段位了，成功击败 99% 的学习者。

最后简单总结一下，Xiaomi-OCR-0 是一个 0.8B 的开源 OCR 模型。本地可以用 Ollama 拉取权重，再配合官方的 Demo 或者 MCP 服务来调用。它基于 Qwen3.5-0.8B 训练，1.7 亿条训练样本靠 8 个模型交叉投票，再由 122B 的大模型最多校验 3 轮，强化学习阶段则按任务规则严格算分。

这个知识点你学会了吗？想解锁更多 Agent 硬核知识，点赞关注，我是二哥，咱们下期见！

<!-- video-covers:start -->
![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-cover-3x4-20261031115713-dc77b0de.png)

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-cover-16x9-20261031115716-95d69fc1.png)

![](https://cdn.paicoding.com/stutymore/xiaomi-ocr-0-cover-4x3-20261031115719-9fb86d36.png)
<!-- video-covers:end -->
