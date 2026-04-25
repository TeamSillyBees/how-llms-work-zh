# LLM Council Fact-Check Report
**Generated:** 2026-04-26 08:03  
**Council:** GPT-4.1, Gemini 2.5 Pro, Llama 4 Maverick  
**Synthesised by:** Claude Opus 4.7

---

# Fact-Check Synthesis Report

## High Confidence Issues (flagged by 2+ models)

- **Llama 3: 405B params, 15T tokens** — Flagged by GPT-4.1 (misleading) and Llama 4 Maverick (unverifiable). GPT-4.1 notes that as of mid-2024, only 70B was publicly released; however, Meta did subsequently release Llama 3.1 405B trained on 15T tokens, so the claim is now **accurate** but worth a citation/date clarification.

- **GPT-4 vocabulary of 100,277 tokens via BPE** — Flagged by GPT-4.1 (misleading) and Llama 4 Maverick (unverifiable). The 100,277 figure matches the `cl100k_base`/`o200k` tiktoken tokenizers, but OpenAI has not officially confirmed this is used across all GPT-4 variants. Consider softening to "GPT-4's tiktoken tokenizer."

- **GPT-2 parameter count and training cost claims** — Flagged by Gemini 2.5 Pro (wrong: 1.5B not 1.6B) and Llama 4 Maverick (outdated on $100 reproduction cost). The 1.5B figure is a clear factual correction worth making.

- **Common Crawl: 2.7 billion pages by 2024** — Flagged by Gemini 2.5 Pro (misleading) and Llama 4 Maverick (outdated). The figure understates the cumulative archive (tens of billions of pages); likely conflates a single monthly snapshot with the total.

## Lower Confidence / Worth Reviewing (flagged by 1 model)

- **SFT duration "hours (not months)"** (GPT-4.1) — Fair point that large-scale SFT can take days, but this reads as intentional simplification contrasting with pre-training scale. **Likely dismissable.**

- **RLHF producing "more honest" responses** (GPT-4.1) — Legitimate concern; RLHF optimizes for preference, not truthfulness. Worth rewording to "perceived as more honest" or removing the honesty claim.

- **PII removal including "named individuals"** (Gemini 2.5 Pro) — Valid nuance; current systems cannot reliably scrub all personal names. Worth softening to "attempts to detect."

- **Provenance claim tied solely to Karpathy's lecture** (Gemini 2.5 Pro) — Correctly notes that Llama 3 / FineWeb figures postdate the November 2023 lecture. Worth adjusting the attribution.

- **"Modern frontier models: hundreds of billions of parameters, trillions of tokens"** (Llama 4 Maverick) — Over-pedantic; this is clearly an intentional generalization. **Dismissable.**

## Summary

The guide is broadly accurate but contains several figures that deserve tightening or citation updates. The highest-priority fixes are the GPT-2 parameter count (1.5B, not 1.6B), the Common Crawl page count (which understates the cumulative archive), and the provenance statement that credits only Karpathy's lecture despite including post-lecture data (Llama 3, FineWeb). The Llama 3 405B and GPT-4 tokenizer claims are defensible but should be sourced explicitly. Softer edits are warranted around RLHF's honesty claim and PII removal capabilities, while simplifications about SFT duration and frontier model scale are reasonable pedagogical choices that can stand.

---

## Raw Findings by Model

### GPT-4.1
- **Claim:** Llama 3: 405B params, 15T tokens.
  **Verdict:** misleading
  **Explanation:** As of June 2024, Meta has not released a 405B parameter version of Llama 3. The largest publicly announced Llama 3 model is 70B parameters. The 405B figure is speculative or refers to unreleased/internal models.
- **Claim:** GPT-4 uses a vocabulary of 100,277 tokens, built via the Byte Pair Encoding (BPE) algorithm.
  **Verdict:** misleading
  **Explanation:** GPT-4's tokenizer (specifically for OpenAI's GPT-4 models) uses a variant of Byte Pair Encoding called 'Byte-level BPE' or 'Unigram Language Model' for some versions, and the vocabulary size varies by implementation. The 100,277 figure is accurate for GPT-4's tiktoken tokenizer, but not all GPT-4 models use exactly this vocabulary or pure BPE.
- **Claim:** Supervised Fine-Tuning (SFT)... Duration: hours (not months).
  **Verdict:** misleading
  **Explanation:** While SFT is much faster than pre-training, for very large models and very large datasets, SFT can take days, not just hours. The 'hours' figure is only true for smaller models or smaller datasets.
- **Claim:** RLHF... The language model is optimized via reinforcement learning to score higher — producing responses that are more helpful, better structured, and more honest.
  **Verdict:** misleading
  **Explanation:** RLHF can improve helpfulness and structure, but it does not guarantee more honesty or factuality. RLHF optimizes for human preference, which may not always align with truthfulness.

### Gemini 2.5 Pro
- **Claim:** Common Crawl have been crawling the web since 2007 — indexing 2.7 billion pages by 2024.
  **Verdict:** misleading
  **Explanation:** This number is ambiguous and likely a significant underestimate. While a single monthly crawl contains around 3 billion pages, the total archive contains many tens of billions of unique pages. The phrasing 'by 2024' implies a cumulative total, making the figure misleadingly small regarding the full scale of the Common Crawl archive.
- **Claim:** PII Removal: ...Regex patterns and ML classifiers find phone numbers, emails, Social Security numbers, physical addresses, and named individuals.
  **Verdict:** misleading
  **Explanation:** The claim that PII removal finds and removes 'named individuals' is an overstatement of current capabilities. While systems attempt to remove private names, they are imperfect and cannot reliably distinguish all private individuals from public figures or other non-PII names. This suggests a higher level of data sanitization than is realistically achieved.
- **Claim:** GPT-2 (2019): 1.6B params
  **Verdict:** wrong
  **Explanation:** The largest version of GPT-2 has 1.5 billion parameters (specifically, 1,558M), not 1.6 billion. This is a minor but direct factual inaccuracy.
- **Claim:** Built from Andrej Karpathy's 'Intro to Large Language Models' lecture — all facts, figures, and framings traced back to that source.
  **Verdict:** wrong
  **Explanation:** This claim of provenance is incorrect. Several key figures used throughout the guide, such as the 15T tokens, 405B parameters, and 44TB FineWeb dataset, are from Meta's Llama 3 release (April 2024), which occurred months after Karpathy's lecture (November 2023). The guide is clearly based on the lecture but has been updated with newer sources.

### Llama 4 Maverick
- **Claim:** Organizations like Common Crawl have been crawling the web since 2007 — indexing 2.7 billion pages by 2024.
  **Verdict:** outdated
  **Explanation:** Common Crawl has been crawling the web since 2007, but the exact number of pages indexed by 2024 may not be up-to-date or accurate. Common Crawl's own statistics should be checked for the most recent figures.
- **Claim:** GPT-2 (2019): 1.6B params, 100B tokens, ~$40K to train. Today: same quality for ~$100.
  **Verdict:** outdated
  **Explanation:** The cost to train a model to the same quality as GPT-2 in 2019 for ~$100 is likely an underestimate and not reflective of current costs or advancements. The actual cost and computational requirements have evolved significantly since then.
- **Claim:** GPT-4 uses a vocabulary of 100,277 tokens, built via the Byte Pair Encoding (BPE) algorithm.
  **Verdict:** unverifiable
  **Explanation:** The exact vocabulary size of GPT-4 is not publicly confirmed by OpenAI. While it's plausible that GPT-4 uses BPE, the specific vocabulary size is not verified information.
- **Claim:** Llama 3: 405B params, 15T tokens.
  **Verdict:** unverifiable
  **Explanation:** The specific details about Llama 3 (such as the number of parameters and tokens used for training) are not confirmed or may not be publicly available, making this claim unverifiable without an official source.
- **Claim:** Modern frontier models: hundreds of billions of parameters, trillions of tokens.
  **Verdict:** misleading
  **Explanation:** While it's true that many modern large language models have hundreds of billions of parameters and are trained on trillions of tokens, this statement is too vague to be informative and doesn't accurately represent the diversity in model sizes and training data across different frontier models.
