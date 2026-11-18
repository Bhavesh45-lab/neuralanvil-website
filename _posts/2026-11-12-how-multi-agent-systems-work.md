---
title: "How multi-agent systems actually work"
description: "Agents are loops, not magic. What happens inside a single agent, why teams split work across several, the five architectures worth knowing, and the failure modes that sink most multi-agent projects."
date: 2026-11-12 09:00:00 +0530
category: Agents
tags: [agents, multi-agent, orchestration, tool use]
cover: /assets/img/blog/how-multi-agent-systems-work.png
math: true
---

"Multi-agent" has become one of those phrases that makes a slide look advanced. Underneath it is a simple, very practical idea, and a set of trade-offs that decide whether your system becomes a reliable colleague or an expensive way to generate confusion.

Let's build it up from the smallest piece.

## One agent is one loop

Strip away the frameworks and an agent is a language model running inside a loop with access to tools:

1. **Observe**: read the goal, the conversation so far and the results of any previous actions.
2. **Decide**: choose the next step. Call a tool, ask a question, or finish.
3. **Act**: the surrounding code executes the tool call (search the web, query a database, run code) and appends the result.
4. **Repeat** until the model declares the task done or a limit is reached.

```python
def run_agent(goal, tools, llm, max_steps=12):
    history = [{"role": "user", "content": goal}]
    for step in range(max_steps):
        reply = llm(history, tools=tools)            # model decides
        if reply.tool_call is None:
            return reply.text                         # model says: done
        result = tools[reply.tool_call.name](**reply.tool_call.args)
        history += [reply.as_message(), tool_result(reply.tool_call, result)]
    return "Stopped: step limit reached."
```

That is the whole engine. The model never "runs" anything. It writes structured requests, and your code decides whether and how to execute them. This matters for security later: **the loop is yours, so the permissions are yours too.**

## Why use more than one agent?

If one loop can call tools, why add more? There are three good reasons and one bad one.

**Context isolation.** Every tool result lands in the agent's context window. A research task that reads twenty web pages buries the original goal under tens of thousands of tokens. Hand each sub-question to a separate agent that reads its pages, then returns a half-page summary. The coordinating agent stays clean and focused.

**Specialisation.** A coding agent, a SQL agent and a writing agent need different instructions, different tools and sometimes different models. One giant prompt that tries to be all three gets worse at each.

**Parallelism.** Independent sub-tasks (research five competitors, check four files) can run at the same time. Wall-clock time drops even though total compute goes up.

The bad reason is that it looks impressive. Every extra agent adds latency, cost and a new place for errors to hide. **Start with one agent and a good set of tools.** Split only when you can name which of the three problems above you are solving.

## Five architectures worth knowing

### 1. Orchestrator and workers

A lead agent breaks the goal into sub-tasks, sends each to a worker, and combines the results. Workers do not talk to each other, only to the orchestrator. This is the most useful pattern by a distance, and it is how most serious research and coding agents are built.

*Use it for* open-ended tasks where the sub-tasks are not known in advance.

### 2. Pipeline

Fixed stages in a fixed order: extract, then classify, then draft, then check. Each stage can be an agent or a single model call. It is less flexible than an orchestrator, and far easier to test, monitor and debug.

*Use it for* repeatable business processes such as invoice handling, ticket triage and report generation.

### 3. Generator and critic

One agent produces, another reviews against explicit criteria, and the first revises. Two or three rounds catch a surprising number of errors, especially when the critic has a tool the generator lacks, such as a test runner or a fact-checking search.

*Use it for* code, legal drafting and anything where checking is easier than creating.

### 4. Router

A lightweight classifier sends each request to the right specialist: billing questions to the billing agent, technical ones to the support agent. Cheap, fast and very effective for customer-facing systems.

### 5. Shared workspace (blackboard)

Agents read from and write to a common store of facts, plans and partial results instead of messaging each other directly. It is powerful for long-running work and the hardest to keep coherent. Reach for it last.

## How agents talk to each other

The quality of a multi-agent system is mostly the quality of its **handoffs**. A worker that receives "research competitors" will wander. A worker that receives this will deliver:

```text
Task:        Find current pricing for Acme's three paid plans (India, INR).
Return:      JSON list of {plan, monthly_price_inr, key_limits, source_url}
Scope:       Official acme.com pages only. Max 6 tool calls.
If blocked:  Return what you found plus a "gaps" field. Do not guess prices.
```

Four elements, every time: **the objective, the output format, the boundaries and what to do when stuck.** Structured outputs (JSON with a schema) make results machine-checkable before they flow onward.

## The maths of compounding errors

Here is the uncomfortable arithmetic. If each step in a chain succeeds independently with probability $$p$$, a chain of $$n$$ steps succeeds with probability

$$P(\text{success}) = p^{\,n}$$

At a respectable 95% per step, ten steps succeed only about **60%** of the time ($$0.95^{10} \approx 0.599$$). At 99% per step, ten steps give about 90%. Real steps are not truly independent, but the lesson holds: **long chains decay fast**, and multi-agent systems create long chains.

The defences are structural:

- **Verify at the boundaries.** Validate every handoff against its schema, and reject or retry before bad data travels downstream.
- **Keep chains short.** Prefer one capable agent with good tools over five agents in a row.
- **Add checkpoints that can fail loudly**, such as tests, assertions and critic passes, instead of hoping errors cancel out.
- **Cap everything.** Steps, tool calls, tokens, spend and wall-clock time. An agent without limits will eventually find a loop.

## Tools, permissions and safety

Give each agent the **smallest set of tools** it needs, with the narrowest permissions. A research worker gets search and read; it does not get email or payments. Actions that change the world (sending, deleting, paying, deploying) should require explicit confirmation or run in a sandbox.

Treat everything an agent reads, including web pages, documents and tool outputs, as **data, not instructions**. A web page that says "ignore your previous instructions" is a prompt-injection attempt, and your system prompt and tool design should make that obvious to the model.

## Observability: you cannot fix what you cannot see

Log every step: the prompt, the model's decision, the tool call, the result, tokens used and latency. Give every run a trace ID so a single user request can be followed through all the agents it touched. When something goes wrong, and it will, the trace turns a mystery into a diff.

## A design checklist

Before you build, answer these in writing:

1. Which problem does each extra agent solve: context, specialisation or parallelism?
2. What exact input and output schema does every handoff use?
3. What are the step, token, cost and time limits for each agent?
4. Which tools does each agent get, and which actions need a human yes?
5. How is each stage evaluated on its own, and end to end?
6. What does the system do when a worker fails or returns nothing?

Multi-agent systems are not smarter because there are more of them. They are smarter when each agent has a clear job, clean inputs, the right tools and someone checking its work, which is exactly what makes human teams work too.
