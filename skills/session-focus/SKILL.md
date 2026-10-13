---
name: session-focus
description: 'One session, one thread. Use at the start of every session to name its thread, whenever a request may belong to a different project, repo or question than the current thread, when the owner says the session became a mess or drifted, and at the end of every work cycle to route the three next-step options: each one either continues here or opens a separate session with a ready prompt.'
---

# Session focus

Born on a day that started with "organise our skills" and ended, in the same
session, with a client site's launch check, a UX audit, code fixes for that
site and a text message for its owner. Every step was asked for; none was
refused; the result was a mess: two threads interleaved, a branch reset in the
wrong repo, the original thread never closed. The owner's verdict: "every time
it becomes a mess". The cure is not discipline but a **thread**: one named goal
per session, and every other goal routed out of it.

A **thread** is one goal with one home: a question, a repo, a done-when. A
session holds exactly one. Sub-steps the goal needs belong to it; a request
whose result would live in another repo, or answer another question, is a
**new thread**.

## Steps

1. **Name the thread** in your first reply that does work, as its own line:
   `**Thread:** <goal> · <repo> · done when <observable result>`
   (in Russian: `**Тема сессии:** …`). The `thread-check.sh` hook finds this
   line in the transcript and repeats it before every owner message, so it
   survives long sessions and compaction. Done when the line is in the
   transcript. A session that resumes an old thread names it again the same way.
2. **Check every request against the thread** before acting. Three cases:
   - *same thread*, including a sub-step it needs → do it;
   - *aside*: a question answered in a few lines with no file change and no
     commit → answer it, then say "back to: <thread>";
   - *new thread* → do not start it. Say in one line that it is a different
     thread and offer the routes below through the picker. Done when the owner
     picked a route, or the request is plainly the same thread.
3. **Route a new thread** the way the owner picks:
   - **new session** (default) → write the handoff prompt (below); then create
     the session yourself when a session-creating tool exists
     (`create_session` with the repo and branch), else give the prompt in one
     code block with the repo to open on the first line;
   - **switch** → close the current thread first (state, what is left, where
     it is written), then name the new thread with a new `Thread:` line;
   - **park** → one line in the repo's inbox file (`INBOX.md` at the root of
     the research folder, or `docs/INBOX.md`): date, the request, the repo it
     belongs to.
4. **End every work cycle with three options, each routed** (P-08): mark each
   `[here]` or `[new session: <owner/repo>]`. A `[new session]` option carries
   its ready prompt. The recommended option comes first. Done when no option
   would pull a second thread into this session.

## Handoff prompt

A new session starts from the prompt alone, so it must stand alone:

- first line: the thread, written as the `Thread:` line for the new session;
- the state: branch, last commit, what is merged or deployed and what is not;
- where the facts live: files by repo-relative path, report folders, PR links;
- what is waiting on the owner or on someone else;
- what the first reply should be (goal line, short state, three options);
- the hard limits: "do not push to main", "do not deploy", whatever applies.

No secrets in it: name the variable, never the value.

## When the owner overrides

The owner may say "do it here anyway". Then it is a deliberate **switch**:
close the old thread in one line and name the new one. A thread changed
silently is the failure this skill exists to prevent; a thread changed on
purpose is fine.
