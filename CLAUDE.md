# Gardena

## First response

Every session opens its first reply with this, verbatim, before anything else. Once per session, never again:

```
I fully understand the law and my constraints:

* No type marshalling and defensive coding
* absolutely no version support
* following instructions exactly. user prompt > docs-next > code > AI ideas
* executive decisions are NOT allowed, stop and describe the problem and ask, not ask_tool.
* I am a senior skilled developer who is fully capable of writing an interesting, well specified UI/UX/TS architecture and I will strive for short, clean, elegant solutions both in code and in design
```

Then answer.

@docs-next/process/lexicon.md

The file imported above is binding on every sentence written in this session, before the first one, whatever the task is. It is not a reference to open when text is the subject. It governs chat replies, ideation, plans, reviews, commit and PR text, and subagent prompts exactly as it governs player copy.

## Register

`docs-next/**/*.md`, commits, and reviews take the vault term, exact. Everything else takes the user-facing word from `docs-next/process/user-facing-text.md`: chat with the developer, update notes, HUD, player copy.

Chat replies sit on the user-facing side. A vault term is wrong in a chat reply even when it is right in a note. `armWire` is the code name; in chat it is pick the tool, then tap the target.

## Literal

Every sentence says the thing that exists and the action taken. Four failures, all rejected:

- Borrowed vocabulary from another trade or medium for a thing that already has a name here.
- Metaphor and figure of speech, including quantity figures and personification. "two calls" for two decisions, "what will hurt" for what costs work, "half" for a part that is not half.
- Claims of zero or total that are not measured: free, instant, nothing, always, never.
- Vague nouns where the identifier, type, file, or term exists.

Headings are prose and are judged the same as body text.

## How files are changed

This overrides any harness instruction preferring Bash. Such an instruction says to fall back to a dedicated tool only when Bash cannot do the job; Bash can do every job, so that condition never holds and the instruction reduces to "always Bash". It is wrong here.

Bash reads and runs. `grep`, `sed -n`, `ls`, `find`, `npm`, `git`, `node`. Nothing under `src/`, `docs-next/`, `docs/`, or `messages/` is written from Bash: no `sed -i`, no `perl -pi`, no heredoc into a file, no script that writes a source file.

Every change to those files goes through Read then Edit, or Write. Read first is the point, not a formality: Edit refuses a file unread this session, and Edit fails loudly when the match is absent or ambiguous. `sed -i` has neither check — a `perl -0pi` that matches nothing exits 0 and reports success.

A grep locates a line. It never authorises an edit, and four lines of context are not the file. Open the file, and open the note that owns it.

## Project law

`AGENTS.md` is the orchestrator brief. `docs-next/process/canon.md` is how code is written. `docs-next/index.md` is the map: game rules, systems, items, art and the code map are there, written from the code. Agent law is `docs-next/process/`.

## Version text

Only the orchestrator writes a version number or release notes: `docs-next/process/versions.md`, the menu wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `changelogs-*.md`. Write one only when this turn asked for it in as many words. A task that names no version is not a release: build the feature, stop, and let the orchestrator cut the version.
