# VISITORS — Core Loop and Corpse Processing

## Core loop

**Fight. Kill. Drag. Process. Upgrade. Wait.**

The corpse is the bridge between combat and progression.

The player should not receive abstract rewards immediately after a kill. The dead visitor remains in the world. The Guardian must physically move the body to useful places.

## Corpse dragging

When a visitor dies, the body becomes a corpse object.

Required behavior:
- corpse remains where it fell
- player can grab corpse with interact
- corpse drags behind player
- movement speed is reduced while dragging
- corpse can collide or snag lightly on walls
- corpse leaves a visible blood smear if feasible
- corpse can be released
- corpse can be placed on or near processing stations

The corpse should feel like weight, not loot.

## Corpse value

Each corpse should carry simple stored values.

For v0:
- blood amount
- bone amount
- gold amount

These values are not awarded on death. They are extracted by stations.

Example:
- thief corpse: low blood, low bone, low gold
- sellsword corpse: medium blood, medium bone, some gold
- jackal beast corpse: blood and bone, no gold
- prince corpse: high blood, medium bone, high gold

## Processing stations

### Blood Basin

Purpose:
- drains blood from corpse
- fills the tomb’s blood pool
- blood can heal the Guardian or fuel one spell

Prototype interaction:
1. Drag corpse onto basin grate.
2. Press interact.
3. Corpse blood value is transferred into stored blood.
4. Corpse becomes marked as drained.

Visual target:
A stone basin or floor grate with dark red liquid channels.

### Bone Forge

Purpose:
- extracts bone from corpse
- bone repairs traps, reinforces doors, or upgrades melee weapon

Prototype interaction:
1. Drag corpse to forge slab.
2. Press interact.
3. Corpse bone value transfers into stored bone.
4. Corpse becomes marked as broken/extracted.

Visual target:
Stone table, crude forge machinery, bone sockets, heavy lever.

### Gold Crucible

Purpose:
- strips and melts valuables
- gold activates mechanisms, unlocks doors, or builds upgrades

Prototype interaction:
1. Drag corpse or dropped valuables near crucible.
2. Press interact.
3. Corpse gold value transfers into stored gold.
4. Corpse becomes marked as stripped.

Visual target:
Small furnace or crucible with a pouring mold.

## Corpse state model

A corpse can pass through several states:

- fresh
- drained
- bones extracted
- stripped
- spent

For v0, the corpse does not need visible mutilation states if time is limited, but the state should exist in code.

## Upgrade station usage

After processing, the player spends stored resources on simple actions.

Examples:
- Blood Basin: heal player
- Bone Forge: repair spike trap
- Gold Crucible: open shortcut door

Do not make upgrade names decorative unless the mechanic is real.

Bad:
- “Altar Focus”
- “Royal Essence”
- “Tomb Favor”

Good:
- “Repair Spike Trap”
- “Unlock Shortcut Door”
- “Increase Max Health”
- “Unlock Seal Door Spell”

## Design principle

The player should remember the physical act.

The reward is not “+12 blood.”

The reward is:
“I dragged the body to the basin, drained it, and used that blood to survive the next visitor.”
