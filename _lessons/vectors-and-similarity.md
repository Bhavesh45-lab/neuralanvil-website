---
title: "Vectors, dot products and similarity"
track: maths
order: 1
summary: "The one idea behind embeddings, semantic search and attention: measuring how alike two lists of numbers are."
duration: 12 min lesson
---

Almost every modern AI system, from search engines to ChatGPT-style models, rests on one surprisingly simple operation: **comparing two lists of numbers to see how alike they are.** Learn this well and embeddings, vector databases and attention all become much less mysterious.

## A vector is a list of numbers with meaning

A vector is an ordered list of numbers. In two dimensions you can draw it as an arrow from the origin:

$$\mathbf{a} = [3, 4]$$

Here the arrow points 3 units right and 4 units up. Its **length** (or *norm*) follows from Pythagoras:

$$\|\mathbf{a}\| = \sqrt{3^2 + 4^2} = 5$$

AI models use the same idea with far more dimensions. An **embedding** model turns a sentence into a vector of perhaps 768 or 1,536 numbers. You can't draw it, but the maths is identical, and the key property carries over: **sentences with similar meanings end up as vectors pointing in similar directions.**

## The dot product

The dot product multiplies matching entries and adds them up:

$$\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i$$

For $$\mathbf{a} = [3, 4]$$ and $$\mathbf{b} = [4, 3]$$:

$$\mathbf{a} \cdot \mathbf{b} = 3 \times 4 + 4 \times 3 = 24$$

Geometrically, the dot product also equals

$$\mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\| \, \|\mathbf{b}\| \cos\theta$$

where $$\theta$$ is the angle between the two arrows. That second form is the important one: the dot product is large when vectors point the same way, zero when they are at right angles, and negative when they point in opposite directions.

## Cosine similarity: direction without length

Long documents can produce vectors with large magnitudes simply because they contain more content. To compare **direction only**, divide out the lengths:

$$\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\| \, \|\mathbf{b}\|}$$

For our example: $$\dfrac{24}{5 \times 5} = 0.96$$, so the two vectors point in almost the same direction.

Cosine similarity always lies between −1 and 1:

| Value | Meaning |
|---|---|
| close to 1 | very similar direction, so similar meaning |
| around 0 | unrelated |
| close to −1 | opposite direction (rare with text embeddings) |

## Try it in Python

```python
import numpy as np

def cosine(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

print(cosine([3, 4], [4, 3]))    # 0.96  nearly the same direction
print(cosine([1, 0], [0, 1]))    # 0.0   at right angles
print(cosine([1, 2], [-1, -2]))  # -1.0  opposite
```

## Where you'll meet this again

- **Semantic search and RAG.** Your question becomes a vector; the database returns the stored chunks with the highest cosine similarity.
- **Attention in transformers.** Each token compares its *query* vector with every other token's *key* vector using dot products, which is how it decides what to pay attention to.
- **Recommendations.** Users and products as vectors; recommend the products whose vectors are closest to yours.

## Check your understanding

1. What is the length of the vector $$[6, 8]$$?
2. Two embedding vectors have a cosine similarity of 0.12. Are the sentences likely to be about the same topic?
3. Why might cosine similarity be preferred over the raw dot product when comparing a short question with a long document?

*Answers: 10. Probably not, since 0.12 is close to unrelated. Because cosine ignores vector length, so a long document isn't favoured just for being long.*
