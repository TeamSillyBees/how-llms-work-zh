# 大语言模型如何工作（中文版）

这是 [ynarwal/how-llms-work](https://github.com/ynarwal/how-llms-work) 的中文版本，用交互式可视化介绍大语言模型的原理、使用方法，以及神经网络与反向传播。

## 阅读入口

- [第一部分：大语言模型如何工作](index.html)：数据采集、BPE 词元化、训练、推理采样、基座模型、后训练、模型心理特性、RAG、安全与完整流程。
- [第二部分：如何使用大语言模型](how-to-use-llms/index.html)：模型选择、思考与搜索、深度研究、文档和代码工具、智能体、语音、视觉与记忆。
- [第三部分：从零理解神经网络](neural-networks/index.html)：神经元、导数、计算图、反向传播、多层感知机及训练的交互演示。

内容基于 Andrej Karpathy 的讲座，来源视频保留在各页面中。第一部分的来源为 [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g)。

## 本次同步

- 上游：[`1add5a7225cfa1292d5641b7d8e65bbd05beb8fd`](https://github.com/ynarwal/how-llms-work/commit/1add5a7225cfa1292d5641b7d8e65bbd05beb8fd)，核对日期为 2026-11-03。
- 保留此前中文正文和事实检查报告；同步上游新增第三部分、跨篇导航、交互演示重构、画布高像素密度修复及样式修改。
- 翻译三个当前阅读页面的新增内容与动态界面，包括按钮状态、图表标签和说明。BPE 与英文采样演示保留原始英文词元、空格和概率数据，旁附中文说明；它们是教学样本，而非漏译的界面文案。
- 原始讲座逐字稿、历史 `v1.html`、旧讨论记录及工具源码注释保留原样。页面中的模型能力、价格和产品比较反映来源讲座及上游写作时的情况，不代表核对日期的最新产品信息。

## 本地阅读

项目为静态 HTML/CSS/JavaScript，无前端构建步骤。在仓库目录执行 `python3 -m http.server 8000`，再访问 `http://localhost:8000/`。网页字体使用 Google Fonts，无法联网时回退到系统字体；交互演示不需要模型 API。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `index.html`、`main.js`、`style.css` | 第一部分 |
| `how-to-use-llms/` | 第二部分 |
| `neural-networks/` | 第三部分 |
| `v1.html` | 原版深色主题历史页面 |
| `transcript.txt` 及子目录同名文件 | 原始讲座逐字稿 |
| `council.py` | 上游的 LLM 交叉核验工具，不是网站运行依赖 |
| `report.html` | 已有中文事实检查报告；本次同步未重新运行核验模型 |

## 来源与署名

原项目曾发布在 [Hacker News](https://news.ycombinator.com/item?id=47886517)。上游作者说明代码与内容的实现大量借助 Claude / Claude Code，选题、方向与编辑由作者负责，内容来源为 Karpathy 的讲座。中文版本保留这些来源与署名；自动生成或自动检查不等同于所有科学陈述已经独立验证。

## 与上游保持一致

三个正文页面沿用上游 DOM 结构、CSS、计算、事件与动画时序，仅翻译自然语言及语言、标题、无障碍等文本属性。中文文本长度可能造成自然换行差异。BPE 和采样所依赖的英文词元及概率数据不变；BPE 是简化合并演示，采样初始句 `The sky appears blue` 意为“天空看起来是蓝色的”。不在本次翻译中修复上游既有交互问题。
