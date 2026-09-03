# Lexicon

Words that leave the code. Agents obey this. They do not restate it.

## Scope

`lex.term` — Bound text is anything a person reads. Every game noun and verb in it is a term its owning note defines, a `src/` identifier in backticks, or plain English about a plain thing. There is no fourth bucket. No coinage. No metaphor. No livelier synonym.

| bound | free |
|---|---|
| Text to the user. Player copy. Every `docs/**/*.md`. Commit, PR, and review text. | Identifiers, locals, and test fixtures in `src/`. |

Chat with the developer, update notes, HUD, prompts, callouts, almanac, shop, inspect: exact word from [[standards/user-facing-text]]. Vault notes stay this file's developer register.

Code names itself. `blurb`, `thirsty`, `smartHold` are the codebase's business and nobody reads them as sentences. A word is bound the moment it leaves `src/` and enters something a person reads.

## Two registers

| audience | register |
|---|---|
| Vault — `docs/**/*.md`, commits, reviews | the vault term, exact. Identifiers backticked. Precision first. |
| User-facing — chat with the developer, update notes, HUD, player copy | [[standards/user-facing-text]] **say** column. Words a stranger reads once and understands. No identifier, no constant, no vault shorthand. |

The vault word and the player word are often not the same word. `Net` is a water **network**. `high` is a **signal**. `blurb` is a **description**. Translating is the job. Inventing a third word is the fault.

## Owner

Each term belongs to one note. Find it through the id map in [[mechanics/_index]], then reuse it exactly in developer text and translate it once for the player.

A vault term used outside its owner is as wrong as an invented one. `starve` is fertilizer on a growing plant. A pipe cannot starve.

| term | owner | is | is not |
|---|---|---|---|
| **drink** | [[mechanics/plants]] `plants.drink` | a growing plant or grass spending its plot's water | a machine, still, tap, bucket, or vehicle — those **pull** or **fill** |
| **starve** | [[mechanics/plants]] `plants.happy` | fertilizer band red, happiness draining | any other shortage, anywhere |
| **wilt** | [[mechanics/plants]] `plants.happy` | water band red, plot dry | a machine, a network, a contract |
| **drown** | [[mechanics/plants]] `plants.happy` | water band red, plot drowning | flooding of anything else |
| **rot** | [[mechanics/plants]] | freshness at 0; the plot or slot becomes `rotten` | decay, staleness, or expiry of anything that is not fruit |
| **thirsty** | [[mechanics/machines]] | the `thirsty` `Craft` state, a still with no water; the player reads **Needs water** | a plant. A plant short of water is **dry**, or **wilting** |
| **dry** | [[mechanics/water]] | a network whose tanks hold nothing; soil under the green band | empty inventory, idle machine |
| **pull** | [[mechanics/water]] | `pull(sources, want)`, in proportion to `stored` | a plant taking water from its plot |
| **net** | overloaded | `Net` in `sim/world.ts` is water; [[architecture/net]] is multiplayer | player copy, ever. The player reads **water network** |
| **signal** | [[mechanics/sensors]] | what a wire carries, on or off | power, current, juice, a "high output" to the player |
| **blurb** | none | nothing. `CatalogEntry.blurb` is a field, cite it backticked | the word for written text — that is a **description** |

Trade words from streams, queues, functional programming, and distributed systems — fold, backpressure, flush, buffer, throttle, starvation, poll — name nothing in this game. In bound text they are legal only backticked, naming the `src/` thing that carries the name.

## To the developer

Terse per [[canon]], and interpretable. Same bans: no coined term, no borrowed one, no metaphor for a rule that has a name.

Name the identifier rather than a phrase for it. Qualify an overloaded word on first use in a note. Describe the rule, not the shape of the code that carries it — `bio` going false is `soil` marking a plant as not organic, and that is what the note says.

An unqualified comparison is unreadable to a reader who was not in the session. "Works the same", "as usual", "normal", "better": name the other side or cut the sentence.

## Player copy

`lex.copy` — Player-facing strings say what the player sees, what it is for, and what they will do with it. They are pasted from the owning [[ui/_index]] note, never paraphrased elsewhere. Engine state and player copy are different strings: the still is `thirsty`, the player reads **Needs water**.

- **Say why.** A research row, a skill, a machine: what the player can do after that they could not do before, and what it saves them. A description that only restates the kind is not a description.
- **Name the other side of every comparison.** Never "the same", "as usual", "normal", "mid", "better". Cheaper *than what*, faster *than what*.
- **Name the thing that carries the property.** Synthetic fertilizer is a property of the **soil**, and of the fruit grown in it after.
- **Describe the world, not the transition.** The player sees a fruit that is not organic. They do not see a flag stop being true.
- **Describe this state, not the absence of the others.** A calm day is what a calm day does. Do not define it by what rain is not, and do not narrate what tomorrow will be — sequencing changes.
- **Stay inside the subject.** A tree's description covers that tree. Not tending, not fertilizer, not the other species.
- **Do not encode the table.** A constant is printable only once the concept it tunes has a name in the sentence. `TREE_YIELD_DAYS` days of what? Seasons. Say seasons first.
- **Do not enumerate what data owns.** A typed list of crops, goods, or machines goes stale the day one is added. Compose it from the id list, or describe the category.
- **Do not name gates.** Research topology moves. A description that says what unlocks what is wrong within a version.
- **One word per thing, and it matches the prompt.** If the world prompt is **Flip lever**, the description does not say throw.
- **Flavour text carries flavour.** A distinctive, true, human line about that subject. No slang. If nothing distinctive is true, it is a stats row, not flavour.

Numbers arrive through `fill` from `src/game/defs/`. Never digits. Never a multiplier against an unnamed base.

Systemic wording — one word used across a whole shelf of strings — moves as a set or not at all. Propose it, do not fix one string and leave fourteen.

Authorship of new copy: [[agents/game-text-writer]]. Changelog file: [[standards/update-notes]]. Coder marks new strings `<needs-game-text-writer>`.

## No term

There is probably no concept. Do not name one. State the rule in plain words and say it is new, per [[canon]] — ask before a write, one-line assumption after.
