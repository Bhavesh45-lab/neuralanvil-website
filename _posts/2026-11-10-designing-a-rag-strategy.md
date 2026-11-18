---
title: "Designing a RAG strategy that survives production"
description: "Most RAG systems fail before a single token is generated. A field guide to the decisions that actually matter: question types, chunking, hybrid retrieval, reranking, context assembly and evaluation."
date: 2026-11-10 09:00:00 +0530
category: RAG
tags: [RAG, retrieval, embeddings, evaluation]
cover: /assets/img/blog/designing-a-rag-strategy.png
---

Every RAG demo looks brilliant. You upload a PDF, ask a question you already know the answer to, and the model quotes the right paragraph back at you. Then the system meets real users, real documents and real questions, and the answers quietly get worse.

When we take apart a struggling RAG system, the model is almost never the problem. The failure happened earlier: the right passage was never retrieved, or it was retrieved and buried, or it was split in half at a chunk boundary. **Generation can only be as good as the evidence you hand it.**

This article is the checklist we work through before writing any retrieval code. It is opinionated, and it is ordered: each decision constrains the next.

## Start from the questions, not the documents

The instinct is to begin with the corpus: "we have 40,000 pages, let's index them." Resist it. Begin by collecting fifty real questions your users will ask, and sort them by shape. Almost every workload is a mix of five types:

| Question type | Example | What retrieval must do |
|---|---|---|
| Lookup | "What is the notice period in the Pune office lease?" | Find one precise passage |
| Synthesis | "How has our refund policy changed since 2023?" | Gather several passages across documents |
| Comparison | "Plan A vs Plan B for international roaming?" | Retrieve two entities side by side |
| Procedural | "How do I reset a merchant's API key?" | Return ordered steps, intact |
| Out-of-scope | "What will the stock price be next month?" | Retrieve nothing, and say so |

This table *is* your strategy. A workload dominated by lookups lives or dies on precision and exact keyword matching. A synthesis-heavy workload needs higher recall, more chunks and better context assembly. Procedural questions punish you for splitting steps across chunks. Out-of-scope questions test whether your system can admit it found nothing useful.

Keep those fifty questions. Add the correct source passage for each one. That small file becomes your evaluation set, and it will be the most valuable artefact in the project.

## Chunking is a modelling decision

Chunking is usually treated as plumbing: pick 512 tokens with 50 overlap, move on. In practice it decides what your retriever is *able* to find, because a chunk is the unit of meaning your embedding model compresses into a single vector.

Three principles have held up across every corpus we have worked with:

**Follow the document's own structure.** Split on headings, sections, list boundaries and table edges before you ever split on token counts. A policy clause should be one chunk, not the tail of one and the head of another. Markdown and HTML make this easy. PDFs need a layout-aware parser, and the time spent on parsing pays back many times over.

**Size chunks for the question, not the model.** Lookup questions favour small chunks (roughly 150–300 tokens) because the vector stays focused on one idea. Synthesis favours larger chunks or the "small-to-big" pattern: retrieve small chunks for precision, then hand the model their surrounding section for context.

**Carry context into every chunk.** A chunk that reads "The limit is 30 days" is useless on its own. Prepend a short header to each chunk before embedding it: document title, section path, date, product. "*Refund Policy › Annual plans › Cancellation:* The limit is 30 days" retrieves dramatically better, and it costs you almost nothing.

## Choose embeddings with your own data

Leaderboards are a reasonable shortlist, not a decision. Embedding models differ a lot on domain vocabulary, on languages (Hindi–English code-mixing is a real test for Indian deployments), and on how they handle short queries against long passages.

Take your fifty-question evaluation set, embed it with two or three candidate models, and measure **recall@k**: for what fraction of questions does the correct passage appear in the top *k* results?

$$\text{recall@}k = \frac{\#\{\text{questions whose gold passage is in the top } k\}}{\#\{\text{questions}\}}$$

An afternoon of this beats a week of reading benchmark tables. While you are there, note the vector dimension and the cost per million tokens, because you will re-embed the corpus more often than you expect.

## Hybrid retrieval is the default, not an upgrade

Dense vectors are excellent at meaning and poor at exact strings. Ask for "error code E-4012" or a specific SKU, and semantic search will happily return passages about *similar* errors. Keyword search (BM25) has the opposite profile.

Run both and merge the results. The simplest robust merge is **Reciprocal Rank Fusion**, which ignores raw scores (they live on different scales) and uses only ranks:

$$\text{RRF}(d) = \sum_{r \in \text{retrievers}} \frac{1}{k + \text{rank}_r(d)}$$

with $$k$$ commonly set to 60. A passage ranked highly by either retriever floats up; one ranked highly by *both* floats to the top. In our experience hybrid retrieval is the single largest jump in quality you can get for the least engineering effort, which is why we treat it as the baseline.

## Retrieve wide, then rerank narrow

First-stage retrieval should be fast and generous: pull 30–50 candidates. Then pass them through a **cross-encoder reranker**, a model that reads the question and each passage *together* and scores relevance directly. It is far more accurate than comparing two independent vectors, and far too slow to run over your whole corpus, which is exactly why it belongs in the second stage.

Keep the top 4–8 after reranking. If your evaluation shows the right passage is usually in the top 50 but rarely in the top 5, a reranker is the fix. If it is not even in the top 50, no reranker will save you; go back to chunking and query handling.

## Assemble the context deliberately

The model's context window is a page you are writing for it. Treat it with the same care.

- **Deduplicate.** Overlapping chunks and repeated boilerplate waste tokens and make the model overweight one source.
- **Order by relevance, keep related chunks together.** Models attend unevenly across long contexts. Put the strongest evidence first and keep adjacent chunks from the same section contiguous.
- **Label every passage.** Give each one an ID, title and date, and ask the model to cite IDs. Citations make answers checkable and make hallucinations visible.
- **Budget tokens.** Reserve room for instructions and the answer. Stuffing the window "because it fits" usually lowers quality.
- **Give the model permission to fail.** Tell it plainly: if the passages do not contain the answer, say so. This one sentence handles most of your out-of-scope questions.

## Measure the two halves separately

When an answer is wrong, you need to know *which half* failed. Track retrieval and generation as separate metrics:

| Stage | Metric | Question it answers |
|---|---|---|
| Retrieval | Recall@k, MRR | Did the right evidence reach the model? |
| Generation | Faithfulness | Is every claim supported by the retrieved passages? |
| Generation | Answer relevance | Does the answer address what was asked? |
| End to end | Correctness on gold set | Would a domain expert accept it? |

Run the suite on every change to chunking, embeddings, prompts or models. A RAG system without an evaluation set is not being improved, only changed.

## A sensible starting configuration

If you want one place to start, this is ours. Every number is a default to be beaten by your own evaluation, not a law.

```yaml
parsing:     layout-aware, split on headings and tables first
chunks:      200–400 tokens, 10–15% overlap, contextual header prepended
retrieval:   hybrid (BM25 + dense), fused with RRF (k = 60), top 40
rerank:      cross-encoder, keep top 6
context:     dedupe, order by score, label [S1]…[S6] with title and date
prompt:      answer only from sources, cite IDs, say "not found" when absent
eval:        50+ real questions with gold passages, run on every change
```

## The short version

Design from the questions. Chunk along meaning. Use hybrid search by default, rerank a wide candidate set, write the context window on purpose, and measure retrieval and generation separately. Do those six things well and your choice of language model becomes the least important decision in the system.

In the next article we go further and compare ten advanced RAG strategies, from HyDE to GraphRAG, and when each one earns its added cost.
