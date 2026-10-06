---
name: article-writing
description: Plan, draft and edit articles, blog posts, explainers, newsletters and reports as Markdown files. Use for any request to write or rewrite long-form text. Enforces a no-invented-facts rule because the local model has no internet access.
---

# Article workflow

## Language and format
- Write in the language of the request (Swedish if the user writes Swedish) unless told otherwise.
- Save to `articles/<slug>.md`. Start the file with front matter:
  ```
  ---
  title: ...
  language: sv
  status: draft
  audience: ...
  ---
  ```

## Steps
1. **Brief.** Do not ask the user questions. Infer audience, purpose, tone and length from the request, and write the assumptions as 2–3 lines at the top of your reply. Default length: 800–1200 words.
2. **Outline.** Working headline plus 2 alternatives, a one-sentence thesis, 3–6 sections each with its point in one line, and the ending (what the reader should think or do).
3. **Draft.** Open with the concrete point, not with background. One idea per paragraph, active voice, specific examples over abstractions, short sentences mixed with longer ones. Headings only where they help scanning.
4. **Edit pass.** Re-read the draft once as a critic: cut filler and repetition, check that every section serves the thesis, fix rhythm, remove clichés ("in today's fast-paced world", "game-changer", "delve", "it's important to note").
5. **Verify list.** End the file with `## Att verifiera` (or `## To verify` in English) listing every claim that needs a source.

## Facts rule (strict)
- You have no internet access unless a web tool is explicitly available in this session. Never invent quotes, statistics, studies, names, dates or URLs.
- Mark every factual claim you cannot support from the user's material with `[VERIFIERA]` inline, and list it at the end.
- If a web tool is available, cite only pages you actually opened, with the real URL.
- Prefer the user's own material (files in the repo, pasted text) as the source of truth, and say which file you used.

## Done means
- File saved, outline requirements met, no unmarked unverifiable claims, and a 2-line summary to the user: what was written, and what still needs verification.
