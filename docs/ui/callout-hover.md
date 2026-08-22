# Callout hover

`CalloutHover` in `src/game/ui/callout-hover.tsx`. Chrome card, same rails as a main window. `w-64`. Title in `font-display` `text-xs`, then description `text-sm` `text-ink/75`, `whitespace-pre-line`.

`description` is a `ReactNode`, not a string. Panels pass a fragment: the blurb, then — when the thing is blocked — a `mt-2 block font-bold text-roof` line saying **why**. That reason line is the contract: any disabled control that has a callout must explain itself there rather than just going gray.

Sits `absolute top-0 left-full ml-2` of a `relative` host, so it hangs off the **right** of the open panel. `pointer-events-none`. Does not move the panel.

Host:

- [[ui/family]] — wrap around the Family `Chrome`
- Shop / Research — `Dock` `aside`

Hover sets the tip, leave clears it. Hosts hold `{ title, description, why? }` and render `why` as the roof line.

Blocked controls use `aria-disabled` + a guarded `onClick`, never the `disabled` attribute — a disabled button dispatches no pointer events and would silently kill its own explanation.

Not used for held-item inspect.