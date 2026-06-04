# VISITORS — First Four Visitor Waves v0

## Design principle

The visitors should be unique enough to feel memorable, but simple enough to build.

Do not overdesign v0 wave mechanics. The first goal is to prove that a visitor can enter, fight, die, become a corpse, and be processed.

## Threat scale

A wave can concentrate difficulty into one enemy or spread it across several enemies.

For v0:
- Wave 1: one weak enemy
- Wave 2: one stronger enemy
- Wave 3: two enemies
- Wave 4: mini-boss plus beast

## Wave 1 — Starving Thief

Role:
- tutorial invader

Description:
A desperate thief enters with a torch and knife. He is not noble. He is hungry, frightened, and greedy.

Behavior:
- walks from Entry Corridor to Main Kill Hall
- attacks at close range
- low health
- low damage

Corpse:
- light
- easy to drag
- low blood
- low bone
- small gold amount

Purpose:
- teach combat
- teach corpse dragging
- teach Blood Basin

## Wave 2 — Bronze Sellsword

Role:
- first real fighter

Description:
A hired plunderer with a shield, spear, and practical courage. He is here because someone paid him.

Behavior:
- walks from Entry Corridor to Main Kill Hall
- stronger melee attack
- more health than thief
- simple block or slower heavy attack if feasible

Corpse:
- medium weight
- medium blood
- medium bone
- moderate gold

Purpose:
- teach tougher melee
- teach Bone Forge
- give enough resource to open the shortcut or repair first trap

## Wave 3 — Tomb Robber Pair

Role:
- simple multi-enemy wave

Description:
Two robbers enter together. One carries a weapon. The other carries a torch and tries to move deeper.

Behavior:
- robber A fights player
- robber B tries to run toward a station or deeper room
- both are individually weak

Corpse:
- two light corpses
- low/medium combined blood
- low/medium combined bone
- moderate combined gold

Purpose:
- teach target priority
- teach that visitors can damage, steal, or push deeper if ignored

## Wave 4 — Jackal Prince

Role:
- first mini-boss

Description:
A young desert noble enters the tomb with a trained jackal beast. He believes the artifact can grant him power or immortality.

Wave composition:
- Jackal Prince
- Jackal Beast

Prince behavior:
- slower than beast
- higher health
- heavier melee damage
- may back away if hurt

Beast behavior:
- fast
- lower health
- harasses player
- forces movement

Corpse:
- prince corpse is heavy, valuable, and worth processing
- beast corpse gives blood and bone but no gold

Purpose:
- first serious test
- proves multi-threat combat
- unlocks the Locked Deep Door after completion

## v0 implementation note

The wave data should be editable in code.

Suggested simple fields:
- name
- enemy type
- health
- damage
- speed
- corpse weight
- blood value
- bone value
- gold value
- spawn room
- target room

Keep the structure easy to expand.
