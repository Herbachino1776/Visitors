# VISITORS — Codex Handoff Rules

## Main priority

Build the central loop before expanding lore or art.

The prototype is successful only when this works:

**visitor enters → Guardian fights → visitor dies → corpse is dragged → corpse is processed → tomb changes → next visitor begins**

## Implementation attitude

Keep systems simple, visible, and testable.

Do not create abstract lore resources unless they have a direct mechanic.

Bad:
- altar focus
- tomb favor
- royal essence
- hidden resonance

Good:
- blood
- bone
- gold
- corpse
- door unlock
- trap repair
- health increase
- melee damage increase

## Geometry first

Use simple rooms and corridors.

Do not spend early work on beautiful environment art if the collision, movement, wave spawning, corpse dragging, and processing stations do not work.

## Map rules

The Test Tomb should use:
- clear room IDs
- rectangular room volumes
- simple corridors
- visible station trigger zones
- one shortcut loop
- one locked deeper door

The map should be authored in a way that can later be replaced by better art.

## Combat rules

Start melee-heavy.

Minimum:
- player health
- enemy health
- player attack
- enemy attack
- hit feedback
- death state
- corpse conversion

Magic should be rare and costly. For v0, either omit magic or include one simple spell only.

## Corpse rules

The corpse system is not optional.

Minimum:
- corpse remains in world
- player can grab corpse
- dragging slows player
- corpse can be dropped
- stations can detect corpse
- stations extract stored values from corpse

## UI rules

Keep UI minimal.

Show only:
- Guardian health
- current wave
- stored blood / bone / gold if needed
- interact prompts
- station prompts

Avoid dense menus in v0.

## Save rules

For the earliest prototype, persistent saving is optional.

Runtime state is enough:
- current wave
- player health
- resources
- station processed state
- shortcut unlocked state

## Expansion rules

Do not add future-lane features until the Test Tomb loop works.

Park ideas in documentation rather than building them too early.
