# VISITORS — Actionable Prototype Scope

## Prototype name

**Test Tomb**

The Test Tomb is the first playable engineering prototype. It is not the final first dungeon. It exists to prove that the main loop is fun and technically workable.

## Build target

A small first-person Three.js dungeon where the player:

1. Starts as the Guardian.
2. Waits inside the tomb.
3. Fights four simple visitor waves.
4. Kills visitors directly through melee-heavy combat.
5. Drags corpses to processing stations.
6. Uses processed resources to trigger simple upgrades.
7. Unlocks at least one shortcut or deeper door.

## Keep v0 small

Do not build the full game yet.

Do not build:
- procedural adventuring parties
- deep faction systems
- giant lore menus
- complex body-part simulation
- elaborate spell trees
- huge tomb generation
- complex servant command AI
- late-game legendary visitors

The first version should be ugly if necessary, but it must make the central loop playable.

## Core prototype features

### 1. First-person movement

The player moves through the tomb in first person.

Minimum controls:
- move forward/back
- strafe
- turn/look
- melee attack
- interact/grab
- release/drop corpse or object

Mobile controls can come later unless the repo is already mobile-first from the start.

### 2. Melee combat

Combat should be direct and readable.

Minimum:
- player melee attack
- enemy health
- player health
- enemy attacks
- hit reaction
- death state
- corpse state

### 3. Corpse dragging

After death, each visitor becomes a draggable corpse.

This is mandatory. It is not flavor. It is the upgrade interface.

Minimum:
- player can grab corpse
- corpse follows/drag-lags behind player
- player movement slows while dragging
- corpse can be dropped
- corpse can trigger station interactions when placed in correct zone

### 4. Three processing stations

For v0, build only:

1. Blood Basin
2. Bone Forge
3. Gold Crucible

No Organ Altar yet. No Offering Pit yet. No soul system yet.

### 5. Four visitor waves

Use four simple waves:
1. Starving Thief
2. Bronze Sellsword
3. Tomb Robber Pair
4. Jackal Prince and Jackal Beast

See `04_visitor_waves_v0.md`.

### 6. Simple upgrades

Use visible, practical upgrades only.

Examples:
- repair one trap
- strengthen one door
- unlock one shortcut
- increase Guardian melee damage
- increase Guardian max health
- unlock one spell

Avoid vague upgrade labels. Every upgrade should change something visible or mechanical.

## Minimum successful prototype

The prototype succeeds if the player can say:

“I killed the visitor, dragged his corpse through the tomb, fed it into a station, changed the tomb, and faced the next stronger visitor.”

Nothing else matters until that works.
