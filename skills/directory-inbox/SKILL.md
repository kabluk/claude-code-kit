---
name: directory-inbox
description: 'Triage inbound mail to a directory or listing site we run: classify each letter, check the sender (site, domain age, rank, already listed), decide, reply from a template, hand listing changes to the directory repo, log the triage. Use when letters arrive at the directory (screenshots of its info@ inbox included), for a claim listing request, a listing request or "add us to the directory" (in any language), and for replies to our outreach.'
---

# Directory inbox

The same triage ran three times in one session (a claim, an "add us", then
eight letters at once) with the same steps each time. This file is those
steps; the filled-in replies of the directory you run live in its project
report, and [`TEMPLATES.md`](TEMPLATES.md) holds their skeletons.

## Steps

1. **Classify every letter.** One type per letter:
   - **claim**: the sender wants control of a profile already on the directory;
   - **add-us**: the sender wants a new profile;
   - **auto-reply**: an out-of-office, ticket number or bounce answering our outreach;
   - **live reply**: a person answering our outreach.

   Done when every letter in the batch has exactly one type. A letter that fits
   two (a live reply that also asks to be added) is the type of its request.

2. **Check the sender** (claim and add-us; for a live reply, the site only).
   Run each check and keep the numbers for the log:
   - **Site**: `curl -sIL https://<domain>` answers 200, and the page is the
     business the letter describes.
   - **Domain age**: RDAP. For `.com`/`.net`:
     `curl -s https://rdap.verisign.com/com/v1/domain/<domain>`; any other TLD:
     `curl -sL https://rdap.org/domain/<domain>`. Read the `registration` event.
   - **Authority**: DataForSEO `backlinks/summary/live`, one task per target
     (a batch of targets in one task returns one merged answer). Keep `rank` and
     `referring_domains`; referring domains from spam hosts with rank 0 do not
     count toward the total.
   - **Already listed**: `curl -s -o /dev/null -w '%{http_code}' https://<directory>/<section>/<slug>/`
     is 200 (listed) or 404 (not). Try the slug the directory's own rule would give.
   - **Sender address**: is the From address on the business's own domain?

   Done when every claim and add-us letter has all five answers or a written
   reason one could not be run (no API key → `secrets-and-buttons`).

3. **Decide.** One decision per letter:

   | Type | Evidence | Decision |
   |---|---|---|
   | add-us / claim | live site, business fits the directory | **add** (claim: profile stays, contact updated) |
   | add-us / claim | as above, and From is on the business's domain | **add + verified** |
   | add-us / claim | no site, parked domain, or off-topic | **decline**, short and polite |
   | auto-reply | out-of-office, bounce | **nothing** |
   | auto-reply | ticket number, "a person will answer" | **wait for the person**; note the ticket |
   | live reply | a person engaged | **reply**: this is a warm contact |

   Domain age and rank set priority and tone, not the yes/no: a young domain
   with a real business is still added.

4. **Reply from the template** in [`TEMPLATES.md`](TEMPLATES.md), filled with
   the letter's names and the checks. Two rules hold in every reply:
   - The **"Verified on <Directory>" badge** linking to the sender's own
     profile is offered as one way to confirm ownership, beside the others
     (a reply from an address on the domain, a DNS TXT record). The listing never
     depends on it: a link required in exchange for a listing is a link scheme
     under Google's spam policies, for us and for them.
   - Link straight to the **category page** the profile sits in, not the home
     page or a generic "browse" page.

   Done when every letter decided add, add + verified, decline or reply has
   a draft, shown to the owner before it goes out (it reaches a third party).

5. **Hand the listing change to the directory's repo.** Write a ready prompt
   for a session in that repo (`session-focus`): name, domain, category,
   location, services, contact, verified yes/no, each value marked with where it
   came from (letter or site). Add, claim and verified flags change there,
   in that repo's session, never from this one.

6. **Log the triage** in the project's report, one table per batch:

   | Date | From (domain) | Type | Checks (age · rank · RD · listed) | Decision | Status |
   |---|---|---|---|---|---|

   Done when every letter of the batch has a row and every "wait" row names
   what it waits for.

The batch is done when steps 3–6 hold for every letter. A new kind of
letter that the four types do not cover goes to `harvest`.
