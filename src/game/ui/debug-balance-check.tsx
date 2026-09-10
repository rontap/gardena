import * as Checkbox from '@radix-ui/react-checkbox'

export function Check({
  on,
  label,
  onChange,
}: {
  on: boolean
  label: string
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Checkbox.Root
        checked={on}
        aria-label={label}
        onCheckedChange={v => onChange(v === true)}
        className="size-4 shrink-0 cursor-pointer border-2 border-ink/30 bg-parch outline-none data-[state=checked]:border-ink data-[state=checked]:bg-ink"
      >
        <Checkbox.Indicator className="flex items-center justify-center text-house">
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
            <path d="M2 6.5 L4.75 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span className="text-sm">{label}</span>
    </label>
  )
}
