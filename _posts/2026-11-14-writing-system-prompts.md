---
title: "How to write a system prompt that holds up in production"
description: "A system prompt is a job description, not a magic spell. The anatomy of a strong one, the principles that make models follow it, the anti-patterns that quietly break it, and how to test prompts like code."
date: 2026-11-14 09:00:00 +0530
category: Prompting
tags: [prompting, system prompts, LLMs, evaluation]
cover: /assets/img/blog/writing-system-prompts.png
---

Teams spend weeks choosing a model and twenty minutes writing the system prompt. Then they wonder why the assistant is verbose with customers, invents policy, or forgets the output format by the third turn.

A system prompt is the briefing a very capable new colleague reads before every conversation. That colleague is brilliant and fast, and knows nothing about your company, your users or what "good" looks like for you. **Everything they need to do the job well has to be on that page.**

## What a system prompt actually does

The system prompt sets the frame for the whole conversation: who the assistant is working for, what it is trying to achieve, what it must never do and what its answers should look like. User messages change turn by turn; the system prompt is the constant.

It is not a security boundary on its own, and it is not a place for every rule you can imagine. It is the most leveraged piece of text in your product, and it deserves the same care as code.

## The anatomy of a strong system prompt

Good prompts tend to contain the same six parts, in roughly this order.

**1. Context.** Who the users are, what product this is and what situation the assistant is in. "You are the support assistant inside Ledgerly, an accounting app for small Indian businesses. Users are shop owners, mostly on mobile, often writing in English mixed with Hindi."

**2. The job.** What success looks like, in one or two sentences. "Help users resolve billing and GST-filing questions so they don't need to contact a human agent."

**3. How to do it.** The approach you want: ask a clarifying question when the request is ambiguous, check the knowledge base before answering, keep replies short because users are on phones.

**4. Boundaries.** What the assistant must not do, *and why*. "Do not give tax advice for a user's specific situation, because we are not licensed tax advisers. Explain the general rule and suggest a chartered accountant."

**5. Output format.** Length, structure, language, tone. If another program parses the output, give the exact schema.

**6. Examples.** Two or three short examples of ideal responses, including one tricky case.

## Principles that make models follow instructions

### Explain the reason, not just the rule

"Never use bullet points" is a rule the model will follow rigidly and sometimes wrongly. "Users read replies inside a WhatsApp chat, where bullet formatting does not render, so write in short plain sentences" gives the model the *why*. It can then generalise correctly to cases you never thought of, such as avoiding tables and headings too.

### Say what to do, not only what to avoid

A wall of "don't" leaves the model guessing about what it should do instead. Pair every prohibition with the desired behaviour. "Don't make up order details" becomes "If the order number isn't found, say so and ask the user to check the confirmation email."

### Be specific where it matters

"Be concise" means different things to different people. "Keep answers under 80 words unless the user asks for detail" does not. Specificity is most valuable for length, format, escalation rules and anything with legal or financial weight.

### Give the model a way out

Models try hard to be helpful, sometimes to the point of inventing an answer. Explicitly permit uncertainty: "If the knowledge base doesn't cover the question, say you don't have that information and offer to connect them with the team." This single line prevents a large share of hallucinations.

### Structure long prompts

Once a prompt passes a few hundred words, organise it. Clear section headings or XML-style tags help the model keep track of which text is instruction and which is reference material:

```xml
<context>
You support shop owners using Ledgerly, an accounting app in India.
</context>

<instructions>
Answer billing and GST-filing questions using the knowledge base below.
Ask one clarifying question if the request could mean two things.
Keep replies under 80 words; users read them on phones.
</instructions>

<boundaries>
Do not give tax advice for a user's specific situation. We are not licensed
advisers. Explain the general rule and suggest consulting a chartered accountant.
</boundaries>

<knowledge_base>
...retrieved articles go here...
</knowledge_base>
```

### Make examples varied

Examples are powerful, often more powerful than instructions, because models imitate them closely. That cuts both ways: three examples that all start with "Great question!" will produce an assistant that always starts with "Great question!". Vary length, phrasing and scenario, and include at least one example of declining or escalating correctly.

## Anti-patterns that quietly break prompts

**Shouting.** ALL CAPS, "CRITICAL" and "YOU MUST" were habits from older, less attentive models. Modern models take instructions seriously already; shouting makes them over-apply a rule in places it doesn't belong.

**Contradictions.** "Always be thorough" in one paragraph, "keep it brief" in another. The model will pick one inconsistently. Read your prompt end to end, looking for conflicts.

**Persona fluff.** "You are a world-class, genius-level expert with 30 years of experience" adds little. Concrete context about users and goals adds a lot.

**Rule sprawl.** Every incident adds a new rule until the prompt is 3,000 words of edge cases. Periodically rewrite from scratch around principles and keep only the rules that tests show are necessary.

**Hidden assumptions.** Internal jargon, unexplained acronyms and references to "the usual process" mean nothing to the model. If a new employee wouldn't understand it, neither will the model.

## Before and after

A prompt we were once asked to fix, in full:

> You are a helpful assistant for our company. Be professional and accurate. Don't make things up. Answer customer questions.

Every sentence is reasonable, and none of it is usable. Which company? Which customers? Accurate according to what? What happens when the answer is unknown?

The rewrite added the six parts above: who the users were, the single goal, an instruction to answer only from retrieved help articles, a clear escalation path, an 80-word limit with plain sentences, and three varied examples. Nothing about the model changed. Escalations to human agents dropped and the complaints about invented answers stopped, because the assistant finally knew what its job was.

## Test prompts like code

A prompt change is a code change. Treat it that way:

1. **Build an evaluation set** of 30–100 real user messages, including awkward ones: off-topic requests, angry users, ambiguous questions, attempts to make the bot ignore its instructions.
2. **Define what good looks like** for each: a reference answer, or a checklist ("asks for order number", "under 80 words", "no tax advice").
3. **Run the whole set on every prompt change**, scoring with simple checks and a model-based grader, and spot-checking by hand.
4. **Version your prompts** alongside your code, with a note on why each change was made.

The teams with the best assistants are rarely the ones with the cleverest prompts. They are the ones who measure.

## A template to start from

```text
CONTEXT
You are [role] inside [product], used by [who] in [situation].

GOAL
Help users [outcome] so that [business reason].

APPROACH
- [How to handle ambiguity]
- [Where to look for information, and what to do when it's missing]
- [Tone and length, with the reason]

BOUNDARIES
- Do not [action], because [reason]. Instead, [alternative].

OUTPUT FORMAT
[Length, structure, language, schema if parsed by code]

EXAMPLES
[2-3 varied examples, including one decline or escalation]
```

Write it the way you would brief a sharp new hire on their first day: context, goal, approach, limits, format, examples. Then test it, because the prompt that reads best is not always the one that works best.
