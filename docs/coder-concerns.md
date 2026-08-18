# Coder concerns (killed run)

The coder never wrote `src/game/`. He reread the contracts for ~12 minutes and would not start without these answers.

Fill each **Answer** (one line is enough). Leave it blank only if you want it sent back to game-dev / architect.

Already locked in [[mechanics/beta-1]] / [[architecture/beta-1]] / [[ui/beta-1]] is noted under **Spec** — confirm or override.

---

### 1. Walk speed

**Coder:** Continuous position, walk-then-act, but no tiles/s or px/s.

**Spec:** missing.

**Answer:** walk then act, 4 tiles / sec


---

### 2. Walk arrival

**Coder:** Distance threshold to count as arrived at the target tile / pump / door.

**Spec:** missing.

**Answer:** ? question is not well specified


---

### 3. Pathfinding

**Coder:** Straight line vs grid path.

**Spec:** missing.

**Answer:** straight line


---

### 4. Walking through buildings

**Coder:** Can the actor walk through house / pump occupied cells?

**Spec:** occupancy is for hoe/plant, not walk.

**Answer:** no collision 


---

### 5. Initial thirst on plant

**Coder:** Watering sets thirst to `1`. What is thirst at the moment a seed is planted?

**Spec:** missing.

**Answer:** 0.7


---

### 6. `Item` / `ItemDef` shape

**Coder:** Exact union for toolbar contents (seed vs shovel vs container vs box vs hands). Complete `ItemDef` fields.

**Spec:** architecture names classes (`Container`, shovel with `usesLeft` / `workSeconds`) but does not write the TS union.

**Answer:** coding decision, you can make it


---

### 7. `ResearchDef` / `CropDef` fields

**Coder:** Complete record shapes. Especially `diseaseResistance` type and Beta-1 value.

**Spec:** disease unused in Beta-1; field “exists on the def.”

**Answer:** exactly, not implemented now


---

### 8. Seeds in inventory

**Coder:** How a pack becomes slot contents. Stacking on shop buy (same crop+rarity).

**Spec:** start is carrot×5 in slot 3. Buy fills first empty among slots 1–7. Pack = 5 seeds.

**Answer:** important: User has 1 item that it can hold at any time in hand. But, if it hold a box, for example, it "picks up" seeds of same type _into_ the box, up to five. The hotbar should be changed in specs


---

### 9. Shop when slots 1–7 are full

**Coder:** What happens if you buy and there is no empty tool slot.

**Spec:** missing.

**Answer:** see above. Tools and stuff not in use are dropped to the ground and can be picked up by clicking it 


---

### 10. Fill vs other work

**Coder:** Does fill block shovel / plant / water / harvest the same way a work timer does?

**Spec:** “Cannot start shovel / plant / water / harvest while a work timer is running.” Fill is a work-like occupy-the-pump action. Duration = missing liters / output.

**Answer:** action queue


---

### 11. Shovel replacement

**Coder:** Buy shovel while one is in the toolbar (0 uses destroyed vs still holding one).

**Spec:** at 0 uses the item is destroyed; shop sells replacement shovel $15.

**Answer:** see above no toolbar


---

### 12. Pumpjack purchase

**Coder:** What buying pumpjack does to the world pump.

**Spec:** no second pump. Sets existing `Pump.outputLitersPerSec` from `2` to `5`. Same base, same tiles.

**Answer:** yes, no issue here


---

### 13. SVG import

**Coder:** How view mounts `src/assets/*.svg` (inline vs `<image href>` vs `?raw`).

**Spec:** art docs define viewBox and stage groups `sprout|grow|ripe|dead`. Import method not named.

**Answer:** coding decision

