---
title: "Attention from scratch"
track: llms
order: 1
summary: "How a transformer lets every word decide which other words matter, built up from dot products in four small steps."
duration: 15 min lesson
---

Read the sentence *"The bank raised its interest rates, so Priya moved her savings."* You know instantly that **bank** means a financial institution, not a river bank, because of words further along: *interest rates*, *savings*. Attention is the mechanism that lets a transformer do the same thing: every word looks at every other word and decides which ones help explain it.

This lesson builds attention from the dot products you met in [Vectors, dot products and similarity](/learn/vectors-and-similarity/).

## Step 1: three roles for every token

Each token starts as an embedding vector. The model multiplies it by three learned matrices to produce three new vectors:

- a **query** $$\mathbf{q}$$: *what am I looking for?*
- a **key** $$\mathbf{k}$$: *what do I contain?*
- a **value** $$\mathbf{v}$$: *what will I pass on if someone attends to me?*

Stacking these for all tokens gives three matrices, $$Q$$, $$K$$ and $$V$$, with one row per token.

## Step 2: score every pair

How relevant is token $$j$$ to token $$i$$? Compare token $$i$$'s query with token $$j$$'s key using a dot product. Doing this for every pair at once is a single matrix multiplication:

$$\text{scores} = QK^{\top}$$

For a sentence of $$n$$ tokens this is an $$n \times n$$ table. Row *i* says how much token *i* cares about each token in the sentence.

## Step 3: scale, then softmax

Dot products grow with vector dimension $$d_k$$, and large scores would push softmax into giving nearly all the weight to one token. So the scores are divided by $$\sqrt{d_k}$$ and then turned into probabilities, row by row:

$$A = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)$$

Each row of $$A$$ now sums to 1: a set of **attention weights**.

## Step 4: mix the values

Finally, each token's output is the attention-weighted average of all the value vectors:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right) V$$

For "bank", the weights on "interest" and "savings" will be high, so its output vector absorbs their meaning. The ambiguity is resolved by mixing in context.

## The whole thing in a few lines

```python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V):
    d_k = Q.shape[-1]
    weights = softmax(Q @ K.T / np.sqrt(d_k))   # n x n attention weights
    return weights @ V, weights

rng = np.random.default_rng(0)
n, d = 4, 8                       # 4 tokens, 8-dimensional vectors
Q, K, V = (rng.normal(size=(n, d)) for _ in range(3))
out, w = attention(Q, K, V)
print(w.round(2))                 # each row sums to 1
```

## Multi-head attention and masking, briefly

Real transformers run several attention operations in parallel, called **heads**, each with its own learned matrices. One head might track grammar, another which noun a pronoun refers to, another long-range topic. Their outputs are joined back together.

In language models that generate text left to right, a **causal mask** sets the scores for future tokens to negative infinity before the softmax, so each token can only attend to itself and the tokens before it. That is what lets the model be trained to predict the next token.

## Check your understanding

1. In one sentence, what do the query and key vectors each represent?
2. Why divide by $$\sqrt{d_k}$$ before the softmax?
3. What does each row of the attention-weight matrix sum to, and why?

*Answers: The query is what a token is looking for; the key is what a token offers. To keep large dot products from making the softmax too peaked. 1, because softmax turns each row into a probability distribution.*
