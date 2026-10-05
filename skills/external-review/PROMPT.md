# Prompt template

Fill in `{{…}}` from the live product (see SKILL.md, "Preparing the prompt")
and hand it to the owner whole. Write it in English if the product's market is
English-speaking: models have more context there and can visit the site.
For an answer in another language, the owner adds a last line such as
`Answer in Spanish.`

```
You are acting as a skeptical product advisor with deep knowledge of {{DOMAIN — e.g. B2B logistics, public-records products, SEO-driven marketplaces}}. I run a live product and I want a hard, specific critique — not encouragement.

Go look at the real site before answering: {{ORIGIN}}
Open at least these: {{URL LIST — each verified 200 today, with one-line labels}}.
If you cannot browse, say so plainly in one line and answer from the facts below — do not pretend you looked.

WHAT IT IS
{{2–4 sentences: what it does, what makes it different, what every date/number on a page means.}}

FACTS (real, as of {{DATE}} — treat these as ground truth, do not invent others)
- {{scale: records, active, pages}}
- {{freshness: cadence, history since}}
- {{surfaces: list of page types}}
- {{traffic: yesterday's requests / uniques / pageviews, source; and honestly what share is unknown}}
- Revenue: {{$0 or figure}}. Infrastructure costs roughly {{range}}.
- Team: {{size, technical or not, hours, capital}}.
- Stack: {{one line}}.

WHAT I DELIBERATELY WILL NOT DO (settled constraints — do not propose anything that violates them)
- {{constraint 1}}
- {{constraint 2}}
- {{…}}

THE COMPETITIVE PICTURE AS I UNDERSTAND IT
- {{competitor — price / positioning}}
- {{…}}
My intended wedge: {{one sentence}}.

WHO I THINK USES IT
{{segments, device, session length; what my own data suggests about the skew}}

WHAT I WANT FROM YOU — answer these in order, with headings

1. WHAT IS ACTUALLY WORKING. Two or three things, and for each the evidence in the product or the numbers that made you say it. If your evidence is only that I told you so, say that.

2. WHAT IS BROKEN OR WEAKEST — ranked, most damaging first. Concrete page, flow, or number. For each: what a visitor loses.

3. THE ONE MISSED OPPORTUNITY that matters most, and why it beats the alternatives. Name the alternatives you rejected.

4. WHAT TO KILL OR STOP BUILDING. Something here is not worth its upkeep. What, and what it costs me to keep it.

5. MONETIZATION. Which single segment for the first dollar, through what mechanism. Say what you would NOT do first, and why.

6. TRAFFIC COMPOSITION. How would you separate humans from bots with {{what the stack can give}}, and what would each answer change about priorities?

7. RANKED PLAN. Five to eight actions, ordered by expected value per unit of my effort. For each, exactly:
   - the action, one sentence
   - the effect, as a number or a direction
   - the assumption it rests on — what, if false, makes it worthless
   - the cheapest test to falsify that assumption inside one week, by one person

RULES FOR YOUR ANSWER
- Rank everything. An unranked list is a refusal to have an opinion.
- Be specific to THIS product. A sentence that fits any website — delete it.
- No generic set — "add an AI chatbot", "do SEO", "build a community", "start a newsletter", "post on LinkedIn", "add social proof" — unless tied to a specific page and number above, with why it beats what I already do.
- Where you guess, write "guess". Where you know, say how.
- Do not soften. I will act on this.
- Missing information: list questions at the END, after your best answer. Do not stall on them.
```
