# Pipe and valve

| | Pipe | Valve |
|---|---|---|
| SKU | `buy-pipe` | `buy-valve` |
| price | `SKUS['buy-pipe'].price` | `SKUS['buy-valve'].price` |
| unlocked by | `unlock-irrigation` | `unlock-auto-irrigation` |
| placed on | the edge between two tiles | a pipe edge |

Pipes connect water sources, taps, sprinklers and stills into a water network. A valve opens or closes one pipe edge.

## Pipe

Placed along tile edges, not on tiles. Dragging with the Pipe tool lays a run of edges; the whole run is placed or none of it. A pipe that touches a building's corner connects to it ([[features/water]]).

## Valve

Placed on an edge: on a bare edge it lays the pipe and the valve together and charges both; on a pipe edge it charges the valve only; an edge that already has one is refused with **Pipe already has a valve**. A closed valve blocks its own edge only; water still reaches other tiles by any other open route.

- Not wired: **Open valve** / **Close valve** sends the gardener to switch it.
- Wired, after `unlock-smart-irrigation`: open while its signal input is on, closed while off; clicking it does nothing (**Valve - wired**). Its own open/closed setting returns when the last wire is removed ([[systems/signals]]).

## Art

Drawn by the pipe layer; valve: `pipe-valve-jack` group `jack`.
