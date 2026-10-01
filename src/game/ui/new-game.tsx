import { m } from '../../paraglide/messages.js'
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import type { Difficulty, Rules, Speed } from '../defs/rules.ts'
import { Btn, Label, tabSelectClass, tabSelectListClass } from './frame.tsx'

type Choice<T extends string> = { id: T; name: () => string; body: () => string }

const DIFFICULTY: readonly Choice<Difficulty>[] = [
  { id: 'peaceful', name: () => m.menu_difficulty_peaceful(), body: () => m.menu_difficulty_peaceful_body() },
  { id: 'normal', name: () => m.menu_difficulty_normal(), body: () => m.menu_difficulty_normal_body() },
  { id: 'hard', name: () => m.menu_difficulty_hard(), body: () => m.menu_difficulty_hard_body() },
]

const SPEED: readonly Choice<Speed>[] = [
  { id: 'leisurely', name: () => m.menu_speed_leisurely(), body: () => m.menu_speed_leisurely_body() },
  { id: 'normal', name: () => m.menu_speed_normal(), body: () => m.menu_speed_normal_body() },
  { id: 'fast', name: () => m.menu_speed_fast(), body: () => m.menu_speed_fast_body() },
]

function Pick<T extends string>({
  title,
  value,
  choices,
  onChange,
}: {
  title: string
  value: T
  choices: readonly Choice<T>[]
  onChange: (v: T) => void
}) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={v => {
        const next = choices.find(c => c.id === v)
        if (next === undefined) throw new Error(v)
        onChange(next.id)
      }}
    >
      <Label>{title}</Label>
      <Tabs.List aria-label={title} className={`mb-1.5 w-full ${tabSelectListClass}`}>
        {choices.map(c => (
          <Tabs.Trigger key={c.id} value={c.id} className={`flex-1 ${tabSelectClass}`}>
            {c.name()}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {choices.map(c => (
        <Tabs.Content key={c.id} value={c.id} className="text-xs text-ink/55">
          {c.body()}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}

export function NewGamePage({ onPlay }: { onPlay: (rules: Rules) => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [speed, setSpeed] = useState<Speed>('normal')
  return (
    <div className="flex flex-col gap-2">
      <Btn className="w-full" onClick={() => onPlay({ difficulty, speed })}>
        {m.menu_play_now()}
      </Btn>
      <Pick title={m.menu_difficulty()} value={difficulty} choices={DIFFICULTY} onChange={setDifficulty} />
      <Pick title={m.menu_speed()} value={speed} choices={SPEED} onChange={setSpeed} />
    </div>
  )
}
