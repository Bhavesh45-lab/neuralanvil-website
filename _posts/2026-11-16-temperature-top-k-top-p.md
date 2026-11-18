---
title: "Temperature, top-k and top-p: tuning an LLM's settings for agents"
description: "What sampling parameters actually do to a model's next-token probabilities, worked through with real numbers, plus the settings we use for extraction, RAG, code, chat and every role inside an agent."
date: 2026-11-16 09:00:00 +0530
category: LLMs
tags: [LLMs, sampling, temperature, agents]
cover: /assets/img/blog/temperature-top-k-top-p.png
math: true
---

Every LLM API exposes a handful of dials: temperature, top-p, top-k, max tokens, penalties. Most teams leave them at the defaults, or copy a number from a forum post. Yet these settings decide whether your agent calls the same tool the same way twice, whether your extraction pipeline returns valid JSON, and whether your brainstorming assistant ever says anything surprising.

They are much easier to reason about once you see what they do to a real probability distribution. So let's look.

## What the model actually produces

At every step a language model outputs a **score (logit)** for every token in its vocabulary. Those scores become probabilities through the softmax function, and then one token is **sampled** from that distribution. The sampling parameters all act at this moment, between "scores" and "chosen token".

Imagine the model is completing *"The capital of Maharashtra is…"* and, after filtering, four candidate tokens remain with these logits:

| Token | Logit $$z_i$$ |
|---|---|
| Mumbai | 2.0 |
| Pune | 1.0 |
| Nagpur | 0.5 |
| Delhi | −1.0 |

## Temperature: sharpening or flattening

Temperature $$T$$ divides every logit before the softmax:

$$p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$

Here is what that does to our four tokens:

| Temperature | Mumbai | Pune | Nagpur | Delhi |
|---|---|---|---|---|
| 0.2 | 99.3% | 0.7% | 0.1% | ~0% |
| 0.5 | 84.2% | 11.4% | 4.2% | 0.2% |
| 1.0 | 60.9% | 22.4% | 13.6% | 3.0% |
| 1.5 | 49.6% | 25.5% | 18.2% | 6.7% |

**Low temperature** exaggerates the gaps between scores, so the top choice dominates and outputs become focused and repeatable. As $$T \to 0$$ sampling becomes *greedy*: always pick the highest-scoring token.

**High temperature** squashes the gaps, so unlikely tokens get a real chance. That is where variety and creativity come from, and also where mistakes come from. At $$T = 1.5$$, one answer in fifteen names the wrong city.

> Temperature doesn't make a model more or less intelligent. It changes how often the model takes its own second, third and tenth choices.

## Top-k: a fixed-size shortlist

Top-k keeps only the $$k$$ highest-probability tokens, renormalises, and samples among them. With $$k = 2$$, only Mumbai and Pune survive, so "Delhi" becomes impossible however high the temperature goes.

The weakness of top-k is that the right shortlist size changes from token to token. After "The capital of Maharashtra is", one or two options are sensible. At the start of a poem, hundreds are. A fixed $$k$$ is too loose in the first case and too tight in the second.

## Top-p (nucleus sampling): an adaptive shortlist

Top-p fixes the problem by keeping the **smallest set of tokens whose cumulative probability reaches $$p$$**. At temperature 1.0, our cumulative probabilities are:

| Token | Probability | Cumulative |
|---|---|---|
| Mumbai | 60.9% | 60.9% |
| Pune | 22.4% | 83.4% |
| Nagpur | 13.6% | 97.0% |
| Delhi | 3.0% | 100% |

With **top-p = 0.9**, the shortlist is Mumbai, Pune and Nagpur, because those three are needed to pass 90%. Delhi is cut. When the model is confident the nucleus shrinks to one or two tokens; when it is uncertain the nucleus widens automatically. That adaptivity is why top-p is the more common choice.

**Min-p** is a newer variant offered by some open-model servers: keep any token whose probability is at least a fraction of the top token's probability. It behaves well at higher temperatures and is worth trying if your stack supports it.

### Temperature and top-p together

The two interact: temperature reshapes the distribution, and top-p then trims its tail. Changing both at once makes behaviour hard to reason about, which is why a common recommendation is to **tune one and leave the other at its default**. Our habit is to set top-p to around 0.9–1.0 and tune temperature.

## The other dials

- **Max tokens** caps output length. It is a cost and latency guard, not a quality control. Set it with headroom, because truncated JSON is invalid JSON.
- **Stop sequences** end generation when a string appears. They are useful for templates and for stopping a model from continuing past its turn.
- **Frequency and presence penalties** lower the scores of tokens that have already appeared. Mild values reduce repetition in long creative text; large values damage technical writing, where repeating the right term is correct.
- **Seed**, where offered, makes sampling more reproducible. Even at temperature 0, outputs can differ slightly between runs because of batching and floating-point effects on the provider's servers. Design for "nearly deterministic", never "guaranteed identical".

Some reasoning-focused models restrict or ignore these parameters because their internal reasoning is tuned for a fixed configuration. Check your provider's documentation before tuning.

## Settings by task

These are the starting points we use. Treat them as hypotheses for your own evaluation set, not rules.

| Task | Temperature | Top-p | Why |
|---|---|---|---|
| Extraction, classification, JSON output | 0–0.2 | 1.0 | One correct answer; variety is just error |
| Tool and function calls | 0–0.2 | 1.0 | Arguments must be exact and repeatable |
| RAG answers over your documents | 0.1–0.3 | 0.9–1.0 | Stay close to the evidence |
| Code generation | 0–0.3 | 0.95 | Correctness first; sample more only if you have tests |
| Conversational assistant | 0.5–0.8 | 0.9–0.95 | Natural phrasing without drifting |
| Brainstorming, naming, creative drafts | 0.8–1.1 | 0.9–0.95 | Exploration is the point |

## Tuning an agent: different roles, different settings

An agent is not one model call but many, and they don't all want the same behaviour.

**The planner** decides what to do next. Moderate settings (around 0.3–0.7) let it consider alternative approaches without becoming erratic.

**The executor** turns the plan into tool calls with exact arguments. Keep it cold (0–0.2). A creative SQL query is a broken SQL query.

**The critic or verifier** checks work against criteria. Keep it low, so its judgements are consistent from run to run.

**The writer** turns results into the final answer for a human. Moderate settings (around 0.4–0.7) give readable prose that still stays faithful to the facts.

A powerful pattern combines a moderate temperature with **self-consistency**: sample three to five candidate answers, then pick the one most candidates agree with, or let a verifier choose. You trade compute for reliability, which is often a good deal for high-stakes steps.

## How to tune properly

1. **Fix the prompt first.** Sampling settings cannot rescue an unclear prompt.
2. **Build a small evaluation set** of 30–50 representative inputs with expected outputs or pass/fail checks.
3. **Sweep one parameter**: for example, temperature 0, 0.3, 0.7 and 1.0, with three runs each.
4. **Measure accuracy and variance.** The best setting is the one that is right most often *and* stays consistent across runs.
5. **Log the settings with every production call**, so a behaviour change can be traced to a configuration change.

The dials are simple once you can picture the distribution they reshape: temperature changes its shape, top-k and top-p decide how much of the tail survives, and everything else guards length, repetition and reproducibility. Match the settings to the job each call is doing, and your agents become noticeably more predictable.
