---
title: "Ten RAG strategies, and when each one earns its place"
description: "From hybrid search and reranking to HyDE, small-to-big retrieval, knowledge graphs and agentic loops: what each RAG strategy fixes, what it costs, and how to choose without over-engineering."
date: 2026-11-18 09:00:00 +0530
category: RAG
tags: [RAG, retrieval, GraphRAG, agents]
cover: /assets/img/blog/ten-rag-strategies.png
---

"Advanced RAG" is often presented as a menu where more is better: add query rewriting, then HyDE, then a knowledge graph, then an agent on top. In practice every technique costs latency, money and debugging time, and most systems need only two or three of them.

The useful question is never "which strategies exist?" It is **"which failure am I seeing, and what is the cheapest fix?"** So for each strategy below we cover the failure it targets, how it works, and what it costs.

If you haven't read it yet, start with our guide to [designing a RAG strategy](/blog/designing-a-rag-strategy/). It covers the foundations this article builds on.

## 1. Naive RAG: the baseline

**How it works:** split documents into chunks, embed them, retrieve the top-k most similar chunks for each question, and paste them into the prompt.

**It fixes:** the model not knowing your private or recent information.

**Where it breaks:** exact identifiers, vague questions, multi-part questions, and answers that span several documents.

Build this first anyway. You cannot judge any improvement without a baseline and an evaluation set to measure it against.

## 2. Hybrid search

**Failure it targets:** the retriever misses passages containing exact terms such as product codes, names, error numbers and legal clause references.

**How it works:** run keyword search (BM25) and vector search in parallel, then merge the two ranked lists, usually with reciprocal rank fusion.

**Cost:** low. Most vector databases support it natively.

**Verdict:** this belongs in almost every production system. It is the default, not an advanced option.

## 3. Cross-encoder reranking

**Failure it targets:** the right passage is retrieved, but sits at position 14 where the model never sees it.

**How it works:** retrieve a wide set (30–50 candidates) cheaply, then score each one against the question with a reranking model that reads both together, and keep the best handful.

**Cost:** an extra model call, typically adding tens to a few hundred milliseconds.

**Verdict:** the highest-value upgrade after hybrid search. Check your recall@50 first: reranking can only reorder what was retrieved.

## 4. Query rewriting

**Failure it targets:** users ask short, vague or conversational questions ("what about the other plan?") that embed poorly.

**How it works:** before retrieval, an LLM rewrites the question into a standalone, explicit search query, resolving pronouns from the chat history and expanding abbreviations.

**Cost:** one small, fast model call.

**Verdict:** essential for chat interfaces with follow-up questions. Less useful when users already write precise queries.

## 5. Multi-query retrieval

**Failure it targets:** a single phrasing of the question only matches part of the relevant material.

**How it works:** generate three to five differently worded versions of the question, retrieve for each, and fuse the results. Complex questions can also be **decomposed** into sub-questions ("pricing in 2024", "pricing in 2026") that are retrieved separately.

**Cost:** several retrievals per question, plus one generation call.

**Verdict:** strong for comparison and synthesis questions. Overkill for simple lookups.

## 6. HyDE (hypothetical document embeddings)

**Failure it targets:** questions and answers look different. "Why does my payout fail?" doesn't resemble the paragraph that explains settlement holds.

**How it works:** ask the model to write a short *hypothetical* answer, embed that, and search with it. A fake answer often sits closer in vector space to the real answer than the question does.

**Cost:** one generation call before retrieval.

**Watch out:** if the model's guess is confidently wrong, it steers retrieval the wrong way. HyDE works best in well-covered domains, and is worth combining with ordinary query retrieval rather than replacing it.

## 7. Small-to-big (parent document) retrieval

**Failure it targets:** small chunks retrieve precisely but lack context; large chunks carry context but retrieve poorly.

**How it works:** index small chunks (a sentence or paragraph) for matching, but return their **parent** (the surrounding section or page) to the model.

**Cost:** low. It is a change to indexing and storage, not an extra model call.

**Verdict:** one of the best effort-to-impact ratios available, especially for policies, manuals and contracts where meaning depends on the surrounding clause.

## 8. Contextual chunk enrichment

**Failure it targets:** chunks that make no sense alone. "This limit applies from April" doesn't say *which* limit.

**How it works:** before embedding, prepend each chunk with a short description of where it sits, such as document title, section path and date, or a one-sentence LLM-written summary of the chunk's context within the full document.

**Cost:** one-off, at indexing time. The LLM-summary version costs one call per chunk, which adds up for large corpora but is paid only once.

**Verdict:** quietly one of the most effective techniques. Start with the cheap header version and measure before paying for summaries.

## 9. Metadata filtering and self-querying

**Failure it targets:** semantically similar but wrong results: last year's policy, another region's pricing, a different product line.

**How it works:** store structured metadata with every chunk (date, region, product, document type, access level) and filter on it before or during vector search. With **self-querying**, an LLM extracts filters from the question ("refund rules for Karnataka in 2026") automatically.

**Cost:** low at query time; the real work is getting clean metadata at ingestion.

**Verdict:** essential when documents have versions, regions or permissions. Filtering by access level is also how you stop a RAG system leaking documents a user shouldn't see.

## 10. Knowledge-graph RAG and agentic RAG

These two sit at the top of the cost curve, and they solve problems the others can't.

### Knowledge-graph RAG

**Failure it targets:** questions about relationships and the whole corpus: "Which suppliers are linked to delayed orders across all regions?" or "What are the main themes in 3,000 customer complaints?"

**How it works:** an LLM extracts entities and relationships from the documents into a graph, often with summaries of clusters of related entities. Queries then traverse the graph, or draw on those summaries, instead of only matching individual chunks.

**Cost:** high. Graph construction needs LLM calls across the corpus, and the graph must be maintained as documents change.

**Verdict:** worth it for relationship-heavy domains such as supply chains, compliance and investigations, and for corpus-wide "what are the patterns" questions. Unnecessary for FAQ-style lookup.

### Agentic (iterative) RAG

**Failure it targets:** questions that need several rounds of looking things up, where what to search next depends on what you just found.

**How it works:** retrieval becomes a tool inside an agent loop. The model searches, reads, judges whether the evidence is sufficient, and searches again with a refined query if it isn't. **Corrective** variants explicitly grade retrieved passages and fall back to another source, such as web search, when they are poor.

**Cost:** the highest, with multiple retrievals and model calls per question, and latency measured in seconds.

**Verdict:** the right tool for research-style and multi-hop questions. Give it step limits and source logging, or costs and debugging time grow quickly.

## Choosing: a decision table

| Symptom you observe | Try first | Then |
|---|---|---|
| Misses exact codes, names or IDs | Hybrid search | Metadata filters |
| Right passage retrieved but ranked low | Reranking | Contextual enrichment |
| Follow-up questions fail | Query rewriting | Multi-query |
| Answers lack surrounding context | Small-to-big retrieval | Larger parent sections |
| Wrong version, region or product | Metadata filtering | Self-querying |
| Vague questions retrieve poorly | Query rewriting | HyDE |
| Comparison or multi-part questions | Multi-query, decomposition | Agentic RAG |
| Relationship or corpus-wide questions | Knowledge-graph RAG | Agentic RAG over the graph |

## A sensible order of adoption

For most teams the path looks like this:

1. **Naive baseline plus an evaluation set.** Measure before you change anything.
2. **Hybrid search and reranking.** The biggest gain for the least effort.
3. **Better chunks**: structure-aware splitting, contextual headers, small-to-big.
4. **Query handling**: rewriting for chat, multi-query for complex questions.
5. **Metadata and permissions**, as soon as documents have versions or owners.
6. **Graphs or agents**, only when your evaluation shows a class of questions the earlier steps cannot answer.

Each step should earn its place with a measured improvement on your own questions. The best RAG system is not the one with the most techniques. It is the simplest one that answers your users' questions correctly, with sources they can check.
