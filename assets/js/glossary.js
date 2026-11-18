/* Academy: searchable AI glossary */
(() => {
  const list = document.querySelector("[data-terms]");
  if (!list) return;

  const terms = [
    ["Neural network", "Foundations", "Layers of simple units that each weigh their inputs, add them up and pass the result through a non-linear function. Stacked deep enough, they can approximate very complex patterns."],
    ["Gradient descent", "Mathematics", "The way models learn: compute how the error changes with each weight (the gradient), then nudge every weight a small step in the direction that lowers the error."],
    ["Backpropagation", "Mathematics", "The chain rule from calculus applied layer by layer, backwards from the output, to compute the gradient for every weight efficiently."],
    ["Loss function", "Mathematics", "A single number measuring how wrong the model is. Cross-entropy for classification, mean squared error for regression. Training is minimising it."],
    ["Softmax", "Mathematics", "Turns a list of raw scores into probabilities that sum to one by exponentiating each and dividing by the total."],
    ["Embedding", "LLMs", "A vector of numbers representing a word, sentence, image or product, arranged so that similar things sit close together."],
    ["Tokenizer", "LLMs", "Splits text into the sub-word pieces a model actually reads. Models count context, cost and speed in tokens, not words."],
    ["Transformer", "Architectures", "The architecture behind modern LLMs (Vaswani et al., 2017). It replaces recurrence with attention, so every token can look at every other token in parallel."],
    ["Self-attention", "Architectures", "Each token builds a query, key and value. Scores are softmax(QKᵀ/√d), and each token's output is the score-weighted sum of the values."],
    ["Context window", "LLMs", "How many tokens a model can consider at once, including the prompt, any retrieved documents and its own answer."],
    ["Fine-tuning", "LLMs", "Continuing to train a pre-trained model on a smaller, task-specific dataset so it adopts a format, tone or domain skill."],
    ["LoRA", "LLMs", "Low-Rank Adaptation: freeze the original weights and train small low-rank matrices added beside them. Far cheaper fine-tuning with similar results."],
    ["RAG", "Systems", "Retrieval-Augmented Generation: fetch relevant documents at question time and give them to the model, so answers are grounded in your data and can cite sources."],
    ["Vector database", "Systems", "A store built to find the nearest vectors to a query quickly, using indexes such as HNSW. The retrieval engine behind most RAG systems."],
    ["Chunking", "Systems", "Splitting long documents into passages before embedding them. Chunk size and overlap strongly affect retrieval quality."],
    ["Re-ranking", "Systems", "A second, more precise model re-scores the top retrieved passages so the best evidence reaches the LLM first."],
    ["AI agent", "Systems", "An LLM in a loop that can plan, call tools or APIs, observe results and decide the next step until a goal is met."],
    ["Function calling", "Systems", "Letting a model return structured requests to run your code (look up an order, query a database) instead of only text."],
    ["Hallucination", "LLMs", "A fluent but false output. Reduced by grounding (RAG), constrained outputs, evaluation and asking the model to cite its sources."],
    ["Temperature", "LLMs", "Scales randomness when sampling the next token. Low values give focused, repeatable output; high values give more varied output."],
    ["CNN", "Architectures", "Convolutional neural network: small learned filters slide across an image to detect edges, textures and, deeper in, whole objects."],
    ["Diffusion model", "Architectures", "Generates images by learning to reverse a gradual noising process, refining pure noise into a picture step by step."],
    ["Mixture of experts", "Architectures", "Many expert sub-networks with a router that sends each token to only a few of them, giving a large model at a fraction of the compute."],
    ["Quantization", "Systems", "Storing weights in fewer bits (8-bit, 4-bit) to cut memory and speed up inference with a small accuracy trade-off."],
    ["Overfitting", "Foundations", "When a model memorises training data instead of learning general patterns, so it scores well in training and poorly on new data."],
    ["Eigenvectors", "Mathematics", "Directions a matrix only stretches, never rotates. Central to PCA, which finds the directions of greatest variance in data."],
    ["MLOps", "Systems", "The practice of versioning, deploying, monitoring and retraining models in production, the way DevOps does for software."],
    ["Reinforcement learning", "Foundations", "Learning by trial and reward: an agent acts, receives a score, and adjusts its behaviour to earn more reward over time. RLHF uses it to align LLMs with human preferences."],
    ["Prompt engineering", "LLMs", "Designing instructions, examples and structure in the input so a model reliably produces the output you need, without changing its weights."],
    ["Evaluation (evals)", "Systems", "Test sets and scoring rules that measure whether a model or AI feature is good enough to ship, and catch regressions when it changes."],
  ];

  list.innerHTML = terms.map(([n, c, d]) =>
    `<article class="term" data-cat="${c}" data-text="${(n + " " + d).toLowerCase()}"><h3>${n}</h3><span class="cat">${c}</span><p>${d}</p></article>`
  ).join("") + `<p class="empty" hidden>No terms match that search. Try a broader word such as “attention” or “vector”.</p>`;

  const input = document.querySelector("[data-search]");
  const btns = [...document.querySelectorAll("[data-filter]")];
  const empty = list.querySelector(".empty");
  const count = document.querySelector("[data-count]");
  let cat = "All";

  function apply() {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    list.querySelectorAll(".term").forEach((el) => {
      const ok = (cat === "All" || el.dataset.cat === cat) && (!q || el.dataset.text.includes(q));
      el.hidden = !ok; if (ok) shown++;
    });
    empty.hidden = shown !== 0;
    if (count) count.textContent = `${shown} of ${terms.length} terms`;
  }
  input.addEventListener("input", apply);
  btns.forEach((b) => b.addEventListener("click", () => {
    cat = b.dataset.filter;
    btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }));
  apply();
})();
