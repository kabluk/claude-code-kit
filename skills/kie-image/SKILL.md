---
name: kie-image
description: 'Images of one consistent person or character from reference photos through kie.ai, with an ArcFace likeness score. Use for a character sheet, a consistent character across shots, a character or person from photos, an AI model or influencer built from a reference, image generation through kie.ai, or when KIE_API_KEY is in play and a face has to stay the same. For backgrounds and 3D icons use glass-stage.'
---

# kie-image

Generate a person from their photos and prove the face held. Built on a run of
nine kie.ai models in `lab` (2026-10-25/26): which model keeps a face, how to
measure it, and where the measure lies.

| File | What it is |
|---|---|
| `scripts/pipeline.mjs` | kie.ai client: upload refs, create task, poll, download; the `MODELS` table (photo field and limit per model) |
| `scripts/face-score.py` | ArcFace likeness of every face on a sheet to the refs' centroid, the real-photo ceiling, face count |
| `templates/character-sheet.txt` | five-view sheet prompt with an IDENTITY LOCK block; `{{CHARACTER}}`, `{{WARDROBE}}` |
| `templates/characters/example.json` | values for the placeholders; expression goes into `CHARACTER` |

## Rules

- **Consent.** A real person's photos only with that person's consent, stated by
  the owner in this session. Without it, a fictional character from a description.
- **Refs and results stay out of git.** `refs/` and `out/` go into the project's
  `.gitignore` before the first run; `pipeline.mjs` refuses to read or write
  inside a work tree where they are not ignored.
- **The key.** `KIE_API_KEY` from the environment only (see `secrets-and-buttons`).
  Uploads are free and expire after 24 h; generations cost credits.

## Steps

1. **Refs.** 3–8 photos of one person: sharp face, different angles and light,
   no sunglasses, no other faces. Put them into `refs/`.
   Done when `python3 scripts/face-score.py --refs refs/ refs/` finds one face per
   photo and the ceiling it prints is above 0.5 (lower means the refs disagree:
   drop the odd one out).
2. **Prompt.** Copy `templates/characters/example.json` next to the refs and fill
   `CHARACTER` (age, build, expression) and `WARDROBE`. Keep IDENTITY LOCK as is.
   Done when `node scripts/pipeline.mjs --dry --model wan/2-7-image-pro --refs refs/ --template templates/character-sheet.txt --character <json>`
   prints the request with every placeholder filled.
3. **Generate.** Same command without `--dry`, `--out out/`. Start with the
   leader; `--runs 2` on a second model gives a comparison. `--set aspect_ratio=3:2`
   and similar go into `input` as given.
   Done when every run has its files and a `.json` beside them in `out/`.
4. **Score, then look.** `python3 scripts/face-score.py --refs refs/ out/*.png out/*.jpg`.
   Open every sheet and keep only those with the layout the template asks for:
   front, three-quarter, strict profile, full body front and back. Then rank the
   survivors by mean score.
   Done when each sheet is marked kept or dropped with a reason, and no kept one
   is flagged `broken layout`.
5. **Show the owner.** The kept sheets side by side with refs, scores and the
   ceiling. The owner decides whether it is the person.
   Done when the owner has picked one or asked for another round.

## Models

Measured 2026-10-25/26 in `lab` on one person's refs; score = mean ArcFace
cosine to the refs' centroid; real photos against each other scored 0.60.

| Model | Score | Verdict |
|---|---|---|
| `wan/2-7-image-pro` | 0.69–0.79 | Leader. Four sheets per call. |
| `gpt-image-2-image-to-image` | 0.67 | Second choice. |
| `gpt-image-2-5-flare-image-to-image` | 0.62 | Third. |
| `nano-banana-pro` | 0.10 | A stranger. Not for likeness. |
| `flux-2/pro-image-to-image` | — | HTTP 500 twice; retry before counting on it. |

Each model takes its photos in a different `input` field (`input_urls`,
`image_urls`, `image_input`, `reference_image_urls`) with its own limit;
`node scripts/pipeline.mjs --models` shows the table. A wrong field fails silently
as a stranger's face, so a new model's field comes from its page on kie.ai/docs,
then a row in `MODELS`, or `--field` and `--max` for a one-off.

## Reading the score

- **Cheated layouts score higher.** Three front views in place of a profile beat
  an honest sheet, because a frontal face is easiest to match. Compare numbers
  only among sheets with the right layout (step 4).
- **More faces than the template draws** (`broken layout`: six on this template)
  means repeated or extra views. Fewer is usually a profile the detector missed.
- **Above the ceiling** is suspect, not better: refs disagree with each other more
  than a smoothed, frontal generated face does.
- kie.ai answers HTTP 200 on errors; `pipeline.mjs` reads `code` in the body and
  prints `msg`.

## Lessons

After every use, add what broke or worked unexpectedly here, with the date and
the project. A lesson repeated twice moves into the rules or the code.

- 26.10 · lab · picked by score alone, the "best" sheet had three front views
  in place of a profile → step 4 looks first, ranks second.
