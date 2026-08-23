# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: water.spec.ts >> two sources join one network
- Location: e2e\water.spec.ts:83:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('button', { name: 'Unlock all instantly' })
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Unlock all instantly' })
    11 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - img [ref=e5]:
    - generic [ref=e31585]:
      - generic "Bucket - 3/3L" [ref=e31878]
      - generic [ref=e31997] [cursor=pointer]:
        - generic:
          - generic:
            - text: Expand
            - generic: "40"
      - generic [ref=e31999] [cursor=pointer]:
        - generic:
          - generic:
            - text: Expand
            - generic: "40"
      - generic [ref=e32001] [cursor=pointer]:
        - generic:
          - generic:
            - text: Expand
            - generic: "40"
      - generic [ref=e32003] [cursor=pointer]:
        - generic:
          - generic:
            - text: Expand
            - generic: "40"
  - generic:
    - generic:
      - generic: Gardena
      - generic: "1049"
      - generic:
        - generic:
          - generic: Day 1 · Sunrise
          - progressbar
      - generic:
        - generic:
          - generic: digs 0
          - generic: ·
          - generic: mines 0
        - button "Pause" [ref=e32005] [cursor=pointer]
        - button "Gear" [ref=e32006] [cursor=pointer]
  - generic:
    - generic:
      - button "Shop" [ref=e32007] [cursor=pointer]
      - button "Research" [ref=e32009] [cursor=pointer]
      - button "Market" [ref=e32011] [cursor=pointer]
      - button "Lens" [ref=e32013] [cursor=pointer]
      - button "Family" [ref=e32015] [cursor=pointer]
      - button "Almanac" [ref=e32017] [cursor=pointer]
      - button "Cheat" [ref=e32019] [cursor=pointer]
  - generic:
    - generic:
      - generic: Shovel - 80/80 uses left
      - generic: —
  - generic [ref=e32023]:
    - generic [ref=e32024]:
      - generic [ref=e32025]: Cheat
      - button "Close" [ref=e32026] [cursor=pointer]: ×
    - generic [ref=e32028]:
      - button "Unlock all instantly" [ref=e32029] [cursor=pointer]
      - button "Research speed 3×" [active] [ref=e32031] [cursor=pointer]
      - button "Gain 200" [ref=e32048] [cursor=pointer]:
        - generic [ref=e32050]:
          - text: Gain
          - generic [ref=e32051]: "200"
      - button "Gain 10 skill points" [ref=e32066] [cursor=pointer]
```

# Test source

```ts
  178 | 
  179 | async function placeEdge(page: Page, axis: 'h' | 'v', col: number, row: number): Promise<void> {
  180 |   const key = `${axis}:${col},${row}`
  181 |   await armSku(page, 'Pipe 4')
  182 |   const wx = axis === 'h' ? col + 0.5 : col
  183 |   const wy = axis === 'h' ? row : row + 0.5
  184 |   await expect
  185 |     .poll(async () => {
  186 |       const has = await readWorld<boolean>(page, key, 'w.segments.has(at)')
  187 |       if (!has) await tapWorld(page, wx, wy)
  188 |       return has
  189 |     }, { timeout: 20_000 })
  190 |     .toBe(true)
  191 | }
  192 | 
  193 | async function convertToValve(page: Page, col: number, row: number): Promise<void> {
  194 |   const key = `h:${col},${row}`
  195 |   await armSku(page, 'Manual valve 6')
  196 |   await expect
  197 |     .poll(
  198 |       async () => {
  199 |         const kind = await readWorld<string | null>(
  200 |           page,
  201 |           key,
  202 |           'w.segments.has(at) ? w.segments.get(at).gate.kind : null',
  203 |         )
  204 |         if (kind !== 'valve') await tapWorld(page, col + 0.5, row)
  205 |         return kind
  206 |       },
  207 |       { timeout: 20_000 },
  208 |     )
  209 |     .toBe('valve')
  210 | }
  211 | 
  212 | async function confirmWellEdge(page: Page, col: number, row: number): Promise<void> {
  213 |   const key = `h:${col},${row}`
  214 |   await expect
  215 |     .poll(async () => {
  216 |       const has = await readWorld<boolean>(page, key, 'w.wells.has(at)')
  217 |       if (!has) await tapWorld(page, col + 0.5, row)
  218 |       return has
  219 |     }, { timeout: 20_000 })
  220 |     .toBe(true)
  221 | }
  222 | 
  223 | async function wetCount(page: Page): Promise<number> {
  224 |   return page.locator('[data-pipe][data-wet="1"]').count()
  225 | }
  226 | 
  227 | async function valveOpen(page: Page): Promise<boolean | null> {
  228 |   return page.evaluate(() => {
  229 |     const w = (
  230 |       window as unknown as {
  231 |         __world?: { segments: Map<string, { gate?: { kind: string; open?: boolean } }> }
  232 |       }
  233 |     ).__world
  234 |     if (w === undefined) return null
  235 |     for (const seg of w.segments.values()) {
  236 |       if (seg.gate !== undefined && seg.gate.kind === 'valve') return seg.gate.open ?? null
  237 |     }
  238 |     return null
  239 |   })
  240 | }
  241 | 
  242 | async function svgBox(page: Page) {
  243 |   const box = await page.locator('svg.bg-grass').boundingBox()
  244 |   if (box === null) throw new Error('map svg')
  245 |   return box
  246 | }
  247 | 
  248 | async function screenOf(page: Page, wx: number, wy: number) {
  249 |   const b = await svgBox(page)
  250 |   return {
  251 |     x: b.x + b.width / 2 + (wx - CAM_X) * TILE,
  252 |     y: b.y + b.height / 2 + (wy - CAM_Y) * TILE,
  253 |   }
  254 | }
  255 | 
  256 | async function tapWorld(page: Page, wx: number, wy: number) {
  257 |   const p = await screenOf(page, wx, wy)
  258 |   await page.mouse.move(p.x, p.y)
  259 |   await page.mouse.down()
  260 |   await page.mouse.up()
  261 | }
  262 | 
  263 | async function tapValveMid(page: Page, wx: number, wy: number) {
  264 |   const p = await screenOf(page, wx, wy)
  265 |   await page.mouse.move(p.x + 1, p.y + 1)
  266 |   await page.mouse.move(p.x, p.y)
  267 |   await page.mouse.down()
  268 |   await page.mouse.up()
  269 | }
  270 | 
  271 | async function unlockAll(page: Page) {
  272 |   await page.getByRole('button', { name: 'Cheat', exact: true }).click()
  273 |   const unlock = page.getByRole('button', { name: 'Unlock all instantly' })
  274 |   await expect(unlock).toBeVisible()
  275 |   await unlock.click()
  276 |   await expect(page.locator('[data-hud-money] span').last()).toHaveText('1049')
  277 |   await page.getByRole('button', { name: '×' }).click()
> 278 |   await expect(unlock).toHaveCount(0)
      |                        ^ Error: expect(locator).toHaveCount(expected) failed
  279 | }
  280 | 
  281 | async function openShop(page: Page) {
  282 |   const dock = page.getByText('General store')
  283 |   if (await dock.isVisible()) return
  284 |   await page.getByRole('button', { name: 'Shop', exact: true }).click()
  285 |   await expect(dock).toBeVisible({ timeout: 10_000 })
  286 | }
  287 | 
  288 | async function armSku(page: Page, sku: string) {
  289 |   await openShop(page)
  290 |   await page.getByRole('tab', { name: 'Automation' }).click()
  291 |   await page.getByRole('button', { name: sku }).click()
  292 | }
  293 | 
```