# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: irrigation.spec.ts >> connected sprinkler waters
- Location: e2e\irrigation.spec.ts:89:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div.font-medium').filter({ hasText: /^Inventory$/ })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('div.font-medium').filter({ hasText: /^Inventory$/ })

```

```yaml
- dialog "Inventory":
  - text: Inventory
  - button "×"
  - heading "Inventory" [level=2]
  - button "5":
    - img
    - text: "5"
  - text: Carrot seed - 5, plant it
  - button "2":
    - img
    - text: "2"
  - text: Carrot seed - 2, plant it
  - button "2":
    - img
    - text: "2"
  - text: Tomato seed - 2, plant it
  - button "2":
    - img
    - text: "2"
  - text: Potato seed - 2, plant it
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
  - button
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   | import { DAY_SECONDS } from '../src/game/sim/clock.ts'
  3   | 
  4   | const TILE = 48
  5   | const CAM_X = 15.5
  6   | const CAM_Y = 9.5
  7   | 
  8   | test.beforeEach(async ({ page }) => {
  9   |   await page.goto('/')
  10  |   await expect(page.locator('svg.bg-grass')).toBeVisible()
  11  |   await expect(hudMoney(page)).toHaveText('50')
  12  | })
  13  | 
  14  | test('hover outline', async ({ page }) => {
  15  |   const stroke = page.locator('[data-cell-stroke]')
  16  |   await hoverWorld(page, 12.5, 10.5)
  17  |   await expect(stroke).toHaveCount(1)
  18  |   await expect(stroke).toHaveClass(/stroke-ink/)
  19  |   await unlockAll(page)
  20  |   await armSku(page, 'Pipe 4')
  21  |   await hoverWorld(page, 12.5, 10.5)
  22  |   await expect(stroke).toHaveCount(1)
  23  |   await expect(stroke).toHaveClass(/stroke-ink/)
  24  |   await armSku(page, 'Sprinkler 15')
  25  |   await hoverWorld(page, 12.5, 10.5)
  26  |   await expect(stroke).toHaveCount(1)
  27  |   await expect(stroke).toHaveClass(/stroke-ink/)
  28  |   await page.getByRole('button', { name: 'Delete' }).click({ force: true })
  29  |   await hoverWorld(page, 12.5, 10.5)
  30  |   await expect(stroke).toHaveCount(1)
  31  |   await expect(stroke).toHaveClass(/stroke-ink/)
  32  |   await page.getByRole('button', { name: 'Almanac', exact: true }).hover()
  33  |   await expect(stroke).toHaveCount(0)
  34  | })
  35  | 
  36  | test('shop close exits pipe layer', async ({ page }) => {
  37  |   await unlockAll(page)
  38  |   await armSku(page, 'Pipe 4')
  39  |   await tapWorld(page, 18.5, 7)
  40  |   await hoverWorld(page, 12.5, 10.5)
  41  |   await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  42  |   await setPipesLens(page)
  43  |   await page.getByRole('button', { name: '×' }).click()
  44  |   await expectPipeLayerOff(page)
  45  |   await setPipesLens(page)
  46  |   await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  47  |   await openShop(page)
  48  |   await page.getByRole('button', { name: 'Shop', exact: true }).click()
  49  |   await expect(page.getByText('General store')).toHaveCount(0)
  50  |   await expectPipeLayerOff(page)
  51  |   await setPipesLens(page)
  52  |   await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  53  |   await openShop(page)
  54  |   await page.keyboard.press('Escape')
  55  |   await expectPipeLayerOff(page)
  56  | })
  57  | 
  58  | test('sprinkler place without pipes', async ({ page }) => {
  59  |   await unlockAll(page)
  60  |   const before = moneyValue(await hudMoney(page).textContent())
  61  |   await armSku(page, 'Sprinkler 15')
  62  |   await tapWorld(page, 19, 7)
  63  |   await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  64  |   await expect.poll(async () => moneyValue(await hudMoney(page).textContent())).toBe(before - 15)
  65  | })
  66  | 
  67  | test('pipe ghost is pipe art', async ({ page }) => {
  68  |   await unlockAll(page)
  69  |   await armSku(page, 'Pipe 4')
  70  |   await hoverWorld(page, 18.5, 7)
  71  |   const ghost = page.locator('[data-pipe-ghost]').first()
  72  |   await expect(ghost).toBeVisible()
  73  |   const html = await ghost.innerHTML()
  74  |   expect(html.includes('<rect')).toBe(true)
  75  |   expect(html.trim().startsWith('<line') && !html.includes('<rect')).toBe(false)
  76  | })
  77  | 
  78  | test('dry pipes', async ({ page }) => {
  79  |   await unlockAll(page)
  80  |   await armSku(page, 'Pipe 4')
  81  |   await tapWorld(page, 10.5, 20)
  82  |   await hoverWorld(page, 10.5, 20.5)
  83  |   const dry = page.locator('[data-pipe][data-wet="0"]').first()
  84  |   await expect(dry).toBeVisible()
  85  |   const html = await dry.innerHTML()
  86  |   expect(html.includes('#3d7ea6')).toBe(false)
  87  | })
  88  | 
  89  | test('connected sprinkler waters', async ({ page }) => {
  90  |   test.setTimeout(90_000)
  91  |   await unlockAll(page)
  92  |   await armSku(page, 'Pipe 4')
  93  |   await tapWorld(page, 18.5, 7)
  94  |   await armSku(page, 'Sprinkler 15')
  95  |   await tapWorld(page, 19, 7)
  96  |   await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  97  |   await page.keyboard.press('Escape')
  98  |   await tapWorld(page, 18.5, 6.5)
  99  |   await tapWorld(page, 15.5, 8.5)
  100 |   const inv = page.locator('div.font-medium').filter({ hasText: /^Inventory$/ })
> 101 |   await expect(inv).toBeVisible({ timeout: 15_000 })
      |                     ^ Error: expect(locator).toBeVisible() failed
  102 |   await page.getByText('Carrot seed - 5, plant it').locator('..').getByRole('button').click()
  103 |   await inv.locator('..').getByRole('button', { name: '×' }).click()
  104 |   await expect(inv).toHaveCount(0)
  105 |   await tapWorld(page, 18.5, 6.5)
  106 |   await expect(page.locator('[data-queue-bar]')).toBeVisible()
  107 |   await expect(page.locator('[data-queue-bar]')).toHaveCount(0, { timeout: 15_000 })
  108 |   await hoverWorld(page, 18.5, 6.5)
  109 |   await expect(page.getByText(/Carrot - growing/)).toBeVisible()
  110 |   const t0 = await remaining(page)
  111 |   await expect
  112 |     .poll(async () => t0 - (await remaining(page)), { timeout: 80_000 })
  113 |     .toBeGreaterThanOrEqual(31)
  114 |   await hoverWorld(page, 18.5, 6.5)
  115 |   await expect(page.getByText(/Carrot - growing/)).toBeVisible()
  116 |   await expect(page.locator('[data-thirst="18,6"]')).toHaveCount(0)
  117 | })
  118 | 
  119 | function hudMoney(page: Page) {
  120 |   return page.locator('[data-hud-money] span').last()
  121 | }
  122 | 
  123 | function moneyValue(text: string | null): number {
  124 |   if (text === null) throw new Error('money')
  125 |   return Number(text.trim())
  126 | }
  127 | 
  128 | async function svgBox(page: Page) {
  129 |   const box = await page.locator('svg.bg-grass').boundingBox()
  130 |   if (box === null) throw new Error('map svg')
  131 |   return box
  132 | }
  133 | 
  134 | async function screenOf(page: Page, wx: number, wy: number) {
  135 |   const b = await svgBox(page)
  136 |   return {
  137 |     x: b.x + b.width / 2 + (wx - CAM_X) * TILE,
  138 |     y: b.y + b.height / 2 + (wy - CAM_Y) * TILE,
  139 |   }
  140 | }
  141 | 
  142 | async function hoverWorld(page: Page, wx: number, wy: number) {
  143 |   const p = await screenOf(page, wx, wy)
  144 |   await page.mouse.move(p.x, p.y)
  145 | }
  146 | 
  147 | async function tapWorld(page: Page, wx: number, wy: number) {
  148 |   const p = await screenOf(page, wx, wy)
  149 |   await page.mouse.move(p.x, p.y)
  150 |   await page.mouse.down()
  151 |   await page.mouse.up()
  152 | }
  153 | 
  154 | async function unlockAll(page: Page) {
  155 |   await page.getByRole('button', { name: 'Research', exact: true }).click()
  156 |   const unlock = page.getByRole('button', { name: 'unlock all instantly' })
  157 |   await expect(unlock).toBeVisible()
  158 |   await unlock.click()
  159 |   await expect(hudMoney(page)).toHaveText('1049')
  160 |   await page.getByRole('button', { name: '×' }).click()
  161 |   await expect(unlock).toHaveCount(0)
  162 | }
  163 | 
  164 | async function openShop(page: Page) {
  165 |   const dock = page.getByText('General store')
  166 |   if (await dock.isVisible()) return
  167 |   await page.getByRole('button', { name: 'Shop', exact: true }).click()
  168 |   await expect(dock).toBeVisible({ timeout: 10_000 })
  169 | }
  170 | 
  171 | async function armSku(page: Page, sku: string) {
  172 |   await openShop(page)
  173 |   await page.getByRole('tab', { name: 'Automation' }).click()
  174 |   await page.getByRole('button', { name: sku }).click()
  175 | }
  176 | 
  177 | async function setPipesLens(page: Page) {
  178 |   const on = page.getByRole('button', { name: 'Lens · Pipes', exact: true })
  179 |   if (await on.isVisible()) return
  180 |   await page.getByRole('button', { name: 'Lens', exact: true }).click()
  181 |   await page.getByRole('button', { name: 'Pipes', exact: true }).click()
  182 |   await expect(on).toBeVisible()
  183 | }
  184 | 
  185 | async function expectPipeLayerOff(page: Page) {
  186 |   await expect(page.getByRole('button', { name: 'Lens', exact: true })).toBeVisible()
  187 |   await expect(page.getByRole('button', { name: 'Lens · Pipes', exact: true })).toHaveCount(0)
  188 |   await expect(page.locator('[data-pipe]')).toHaveCount(0)
  189 | }
  190 | 
  191 | async function remaining(page: Page): Promise<number> {
  192 |   const t = await page.locator('[data-clock]').getAttribute('data-clock-t')
  193 |   if (t === null) throw new Error('clock')
  194 |   return DAY_SECONDS - Number(t)
  195 | }
  196 | 
```