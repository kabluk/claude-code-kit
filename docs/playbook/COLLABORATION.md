# Playbook: how we build projects (cross-project)

This is NOT about one project. These are process agreements that apply in every
project. A specific project's decisions live in its `docs/project/DECISIONS.md`;
only what transfers between projects goes here.

The canonical source is this file. Improve it here, then roll it out to other
repositories the same way the skills are rolled out (`.claude/` + SessionStart).
Every agreement is numbered (P-NN), so it can be referenced and replaced by a new
version instead of argued over again.

Structure: **start ritual → working rules → closing ritual**.

---

## Start ritual

### P-00 — What a session does first (enforced by a hook, not by memory)

In every repository that uses it, the start hook `.claude/hooks/session-start.sh`:

1. **Turns the style on instead of asking for it.** The hook injects the
   `caveman` rules (level full) into context verbatim from
   `.claude/skills/caveman/SKILL.md`; there is no longer a "load it as your first
   action" step, because that step can be skipped (a model once did exactly that
   for a whole session). Only the user changes the level. `project-orchestrator`
   is for large multi-role work.
2. **Reads context.** `docs/playbook/COLLABORATION.md` (this file) and
   `docs/project/HANDOFF.md` (where the project stopped), before any action.
3. **Checks the key inventory, by name, not by value.** The hook prints which
   standard variables are present and which are missing:
   `DATAFORSEO_LOGIN/PASSWORD`, `FIRECRAWL_API_KEY`, `APIFY_TOKEN`,
   `CLOUDFLARE_API_TOKEN`, `GITHUB_TOKEN`. If a task hits a missing key, the
   assistant says so once and says **where** it should be put. The value is never
   requested in chat.

### P-01 — Access model: one scoped key for the duration of the project

**Problem.** Manual "go there, delete, change" steps in someone else's dashboards
slow a project down. The cause is not a missing key but where it lives and what
it may do.

**Agreement.**
1. At the start of the project the owner creates **one API token scoped to the
   project's resources** (for a web project, a specific zone/domain) with
   permissions for the tasks (DNS, Email Routing, Workers and so on). **Not a
   Global API Key**: it cannot be restricted and is dangerous to keep.
2. The token goes where the assistant can use it without seeing it:
   - an **environment variable**, if the assistant calls the API directly from
     the terminal (then the owner has zero actions);
   - a **GitHub Secret**, if a workflow does the work.
   **Never in chat.** Conversations are stored; a key from chat has leaked for good.
3. **The access architecture is drawn up at the start**, not along the way: the
   list of the project's services and keys and **where each one lives** (variable
   name / secret name) is recorded in the project's HQ (`CLAUDE.md`, "Keys and
   services" section). Then any session knows what is available without asking
   the owner.
4. The assistant does the routine work itself and prints the token's
   **permissions**, not the token.
5. At the end of the project the owner deletes the token with one click and
   removes the variable. The blast radius was one domain; nothing else to roll back.

### P-01b — A key being present ≠ the key being usable

**Problem.** The P-00 hook says "the key is there", which only means a non-empty
variable. In one project the token in the environment was "active" and could not
see a single account; the deploy token in GitHub Secrets was alive and could do
nothing. A day went into guessing permissions that a provider response would have
revealed in a minute.

**Agreement.** Before relying on a key, fixing a workflow that failed silently, or
asking the owner to press a button, the session calls the `secrets-and-buttons`
skill and follows it: probe capabilities instead of presence (a provider answer,
not an assumption), print the error before the step dies, replace an owner button
with a push trigger instead of handing it over. The probe result is written to the
project's `CLAUDE.md` ("Keys and services"), so the next session reads it instead
of asking. The skill ships together with `project-orchestrator`.

### P-01a — The standard research kit

The owner has **DataForSEO** (SERP, on-page), **Firecrawl** (reading and rendering
pages) and **Apify** (actors/scraping). This is not "just in case" but a working
tool: the assistant uses them **proactively** in research, fact-checking and data
collection, rather than guessing or waiting to be asked. If a service's key is
missing from the environment, the P-00 hook shows it, and the assistant asks for it
to be connected (as an environment variable) rather than silently working around it.

---

## Working rules

### P-02 — Autonomy, and what remains for the owner

- The assistant acts and checks the result itself. The owner gets only what
  physically requires a human: a toggle with no API, an approval, creating an account.
- Every remaining manual step comes with the **exact reason** it cannot be
  automated (example: the GitHub integration gets `403` when triggering a
  workflow → one click needed; fixed by granting `Actions: write`).
- Anything destructive (deleting, overwriting) the assistant shows before doing
  it: what exactly will go. Data comes with a source and a date.

### P-03 — Check against reality, not against memory

- Facts are checked against the live site/API (`curl`, a screenshot, a server
  response), not from memory. "The deploy returned" ≠ "the deploy arrived":
  post-deploy checks know how to wait.
- What is not in the repository, look for in the server response (headers,
  redirects, status).

### P-04 — Memory discipline

- Project decisions → `docs/project/DECISIONS.md`; state → `STATUS.md`;
  risks → `RISKS.md`; queue → `BACKLOG.md`; session entry → `HANDOFF.md`;
  lessons → `LEARNING_LOG.md`. Cross-project material → this playbook.
- Memory is kept in sync with the code: the orchestrator periodically compares
  what is claimed with the repository and the live site and fixes mismatches.

### P-05 — Communication

- Terse by default (`caveman`, level full).
- Full prose, no compression, for: security warnings, irreversible actions,
  multi-step instructions, where compression risks a wrong step.
- Manual steps as direct clickable links, not a description of "where to click".

### P-06 — Default skills

- Every session runs in `caveman` from the first reply (the hook injects the
  rules, there is nothing to step over), keeps `project-orchestrator` available
  and runs it for large multi-role work, instead of pulling everything into one thread.

---

### P-09 — A repeat becomes a method (harvest)

**Problem.** Six projects, each from a blank sheet. Lessons went into one repo's
DECISIONS and died there; the next project never saw them. The assistant never
once offered on its own to extract a skill from a repeat.

**Agreement.** A repeat is the same steps, the same explanation, the same request
to the owner a second time, a "lesson" entry in DECISIONS, the owner saying
"again / every time". At three points of the ritual the assistant calls the
`harvest` skill: at the end of every work cycle (before the three P-08 options),
before a session handoff (P-07), and immediately on the word "again". Every repeat
gets a home: a skill (a procedure for all projects), a playbook rule (an
agreement), a gotcha in `CLAUDE.md` (a fact about one repo). The entry goes to
`docs/playbook/HARVEST.md`, the cross-project ledger that travels with the
playbook. Three cycles without a single candidate are a reason to re-read the
session, not a sign of cleanliness.

### P-10 — Print what was computed first, write assertions after

**Problem.** Three times in one project a test failed while the code was right.
Twice in one cycle on a loan calculator: the assertion "the balance at the end of
the promo window is lower than at the start", but it **grows**, because the promo
payment is below the interest on the real debt; the assertion "the payment stays
the same if you add a credit", but it rises, because the debt grew during the
window. Both times my assumption about the behaviour was wrong, not the
implementation. A red test eats a cycle and pushes you to "fix" correct code.

**Agreement.** For a new pure function, first **run it on a reference input and
print all outputs**, read them, and only then write assertions, from what you saw,
not from what you expected. If what you saw contradicts the expectation, first
explain why the model is right; if there is no explanation, then it is a bug. A
contradiction found is worth more than a smooth test: it is the very fact the page
exists for, and it goes into the page's text.

A corollary about output itself: judging by a **slice** of output (`head`, `tail`,
the last lines of a log) is the same sin. In one cycle a glued `head -8` and
`tail -3` made me attribute one line to its neighbour and spend half a minute
hunting a non-existent bug in my own script. The full output costs less than a
diagnosis from a fragment.

### P-11 — Zero out of dozens of attempts: change the method, not the effort

**Problem.** Collecting fixed rates for a loan product: trying lenders "from
memory" gave **0 of 26**. Changing the method (a DataForSEO SERP for "rates"-style
queries → the lenders' own domains → reading via Firecrawl) gave **4 of 5** in one
pass. Earlier in the same project the conclusion "the pages are rendered with JS"
failed the same way: checking the premise showed that 5 of 8 failures were simply
URLs that had not been found.

**Agreement.** The threshold is roughly ten similar failures in a row. After it,
do not add attempts; ask what is wrong with the **method** itself. Usually the
answer is the source of candidates (guessing instead of searching), the reading
layer (raw fetch instead of render) or the premise itself. Record the change of
method and its result: the next session starts from the working method.

### P-12 — Data opens a gate, never a hand

**Problem.** A target number tempts you to bend the rule. In one cycle a "20+ URLs"
criterion nearly made me build a Tier-4 page (KD 26; the plan allows it from month
three) in the site's first week, for the sake of the counter and against the plan's
own gate.

**Agreement.** A quality threshold lives in **one exported function** that every
surface reads at once: the page's `robots` directive, the sitemap, the notice on the
page itself. Then it opens by itself once there is enough data, and that is checked
by an invariant test ("page in sitemap <=> gate passed"), not edited by hand. Confirmed
twice: two rate pages entered the index without a single edit as soon as they had
ten rows.

Hence the corollary: **a target number is no reason to open a gate**. If the counter
needs a page and the gate does not let it through, take another page the gate does
let through, or admit the counter has not been reached yet. Changing the threshold
so the data passes is fitting the rule to the data.

---

### P-13 — The check's trigger reads the same input as the check itself

**Problem.** A rate re-check script decided "the page is unreadable, pay for a
render" from the raw text, but compared APRs using quoted lines (no longer than
300 characters). For one lender the figure sat in a block longer than the limit:
the raw text said "rates present", the render did not run, and the row reported
"no data". The check silently stopped checking: the most expensive kind of
breakage, because it looks like work.

**Agreement.** The condition that launches a check and the check itself take **the
same input**: one normalisation function, one list, one sample. If the condition
needs a "raw" view and the check a cleaned one, those are two different facts about
the page and must be named differently. Related to P-12: there, one threshold is
read by every surface; here, one input is read by the trigger and the judgement.

From the same case: **"could not read" ≠ "no data"**. A network failure, an empty
render and a page without numbers are three different outcomes, and the report must
distinguish them, otherwise a tool's silent failure reads as a fact about the world.

---

### P-14 — Long-running work: cut it into pieces, read the time from the clock

**Problem.** A SERP crawl over sixteen queries outlived the shell that launched it:
the process restarted, output piled up in a `tail` buffer and never appeared. Then
two own goals. First, `pkill -f <name>` killed not only the script but my own
command, because its command line contained the same text: `exit 144` twice.
Second, I declared a build "stuck for twenty minutes" without looking at the clock:
twenty-three seconds had passed since it started. The number of conversation turns
feels like time and is not.

**Agreement.**

- A long crawl accepts a slice (`START`/`END`, page, chunk) and prints each result
  immediately. A piece must fit in one call; a partial result is worth more than a
  complete one that does not exist.
- Write output to a file directly, not through `| tail` or `| head`: the pipe
  buffer hands everything over at the end, that is, never if the process is killed.
- Before calling something stuck, check `date` against the start stamp. A feeling
  of "long" from the number of turns does not count as a measurement (related to P-03).
- Kill a process by the exact PID from `pgrep -f "<exact command>"`, never `pkill`
  by a substring that also appears in your own command line.
- Wait not with a `sleep; cat` chain (each check is a separate turn, and between
  turns a background task may start over) but with one call with a condition:
  `until <check>; do sleep 15; done` followed by the output itself. One turn, one
  answer, no guessing from fragments.

---

### P-15 — Your own derived number is labelled as yours and checked against someone else's

**Problem.** Cost-estimate pages compute from published ranges, but something of
ours always gets between the source and the answer: a garage conversion priced at
65 % of new-construction cost per foot, a fenced pool deck at 25 %, four renovation
"depths" placed inside a $15–150 range by our own decision. The source never
published that. Presenting such a number without a label passes off our assumption
as someone else's fact, and that is exactly how competitors' thin pages manage to
look convincing.

**Agreement.** A derived number that is not in the source:

1. **is called ours** right in the page text ("this factor is ours, not the
   source's"), not just in the code;
2. **is checked against an independent publication**, usually a published total
   for the whole project: the itemised calculation must land on it. When it does
   not, the page tells the reader so itself instead of staying silent;
3. **stays an input** if the reader may know better: a slider, not a constant.

Same root as the "numbers come with a source" rule and P-13: the check and the
input are one thing, and when our own number is passed off as the source, there
is nothing left to check against.

---

### P-16 — An instruction that has to be remembered will be skipped

**Problem.** The same thing twice. A session worked a whole day without caveman,
although the rule "turn on caveman" was written down. Twice more the owner asked
why we were working without the orchestrator, while the hook said the command was
"available and must be used for large work". Both times the rule existed and both
times it did not fire: each required the model to **remember** and to **decide
itself** that the case qualified.

**Agreement.** If a rule must always apply, it is not phrased as a reminder. Three
levels, by decreasing reliability:

1. **Put the content into context**, like caveman: the hook injects the rules
   verbatim; there is no "load the skill" step.
2. **Name the trigger and the action as a ritual step**, like the orchestrator
   now: "before planning any work that touches more than one file or more than
   one cycle, run /project-orchestrator". Not "available", not "for large work":
   largeness is judged by the same party that skips it.
3. **Check that the thing exists**, and say so if it does not: the hook checks
   for the command file and reports where to get it.

The phrasing "X is available and should be used when appropriate" is not a rule but
a hope. Related to P-12: data opens a gate, not a hand; here, the ritual performs
the step, not memory.

---

## Closing ritual

### P-07 — Session context and handing over

- The assistant watches how full the context is. When approaching the threshold
  (guide: **~75 %**) or when a compaction summary appears, it **immediately**:
  1. updates `docs/project/HANDOFF.md` to a "you can continue from here" state;
  2. gives the owner a **ready prompt** for a new session (what to open, what is
     done, the next node);
  3. suggests moving to a new session without waiting for degradation.
- Honest caveat: the model cannot read the exact percentage from inside the
  session; it goes by signs (length, compaction). The `context_monitor.py` hook
  fills that gap by reading real usage from the transcript. Even so, `HANDOFF.md`
  is kept current after **every** closed node, not only near the threshold.

### P-08 — Every work cycle ends with three options

- At the end of a node or iteration the assistant always offers **exactly three**
  options for the next step, through the picker (AskUserQuestion), not in prose;
  the first is the recommended one, marked as such. The owner chooses, the
  assistant executes.
