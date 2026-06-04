# VISITORS — Test Tomb Blueprint v0

## Purpose

The Test Tomb must prove the basic game loop in a small, readable, interconnected space.

The layout should support:
- visitor entry
- direct combat
- corpse dragging
- processing stations
- one shortcut loop
- one deeper locked door

## Top-down concept map

This is a functional blueprint, not final art.

```text
                         [R07: Locked Deep Door]
                                  |
                                  |
                         [R06: Guardian Rest Slab]
                                  |
                                  |
[R03: Blood Basin] --- [R02: Main Kill Hall] --- [R04: Bone Forge]
          |                     |                         |
          |                     |                         |
          +-------- [R05: Shortcut Passage] --------------+
                                |
                                |
                         [R01: Entry Corridor]
                                |
                         [Visitor Spawn Gate]
```

## Room IDs

### R01 — Entry Corridor

Purpose:
- visitor spawn route
- first sightline into tomb
- teaches that visitors enter from outside

Design:
- narrow
- candlelit
- simple stone walls
- one or two dead servant bodies for atmosphere later

Gameplay:
- visitors enter here
- player can ambush at the far end
- corpse can be dragged back toward R02

### R02 — Main Kill Hall

Purpose:
- primary combat room
- central hub
- routes to stations and shortcut

Design:
- slightly wider than corridor
- enough room to circle enemies
- clear exits to R03, R04, R05, R06

Gameplay:
- main fight space for early waves
- can contain one simple trap in later prototype
- should be easy to understand spatially

### R03 — Blood Basin

Purpose:
- corpse blood processing
- healing / blood storage

Design:
- stone basin or drain floor
- red-black channels
- interact zone clearly marked

Gameplay:
- drag corpse onto basin zone
- interact to drain blood
- blood can heal Guardian or fuel one spell

### R04 — Bone Forge

Purpose:
- corpse bone processing
- weapon/trap/door upgrade station

Design:
- stone slab
- crude forge shape
- bone slots or lever

Gameplay:
- drag corpse onto slab zone
- interact to extract bone
- bone can repair a trap or strengthen melee

### R05 — Shortcut Passage

Purpose:
- shows interconnected tomb design
- gives corpse-dragging a useful loop
- prevents the map from feeling like a straight hallway

Design:
- narrow side passage
- starts locked or blocked
- opens after Wave 2 or after spending gold/bone

Gameplay:
- connects Blood Basin side to Bone Forge side
- lets player move bodies and retreat faster

### R06 — Guardian Rest Slab

Purpose:
- player start / between-wave reset point
- upgrade selection area if menus are needed

Design:
- resting slab, ritual stone, or sarcophagus alcove
- should feel like the Guardian’s den, not a safe cozy room

Gameplay:
- player begins here
- wave start trigger can be here
- health reset or partial recovery can happen here

### R07 — Locked Deep Door

Purpose:
- forward promise
- prototype endpoint
- shows that the Test Tomb can grow

Design:
- large sealed door
- visible but inaccessible at first

Gameplay:
- unlocks after Wave 4
- can simply show “prototype complete” for now

## Visitor routes

### Wave 1 route

Visitor enters from R01 and walks toward R02.

### Wave 2 route

Visitor enters from R01, reaches R02, may push toward R06 if not stopped.

### Wave 3 route

Two visitors enter from R01. One fights in R02. One tries to move toward R03 or R04 as a simple objective runner.

### Wave 4 route

Jackal beast enters first and moves quickly into R02. Prince follows and fights in R02/R06 approach.

## Corpse-drag routes

Primary drag route:
R02 → R03 Blood Basin

Secondary drag route:
R02 → R04 Bone Forge

Optional loop after shortcut:
R03 → R05 → R04

The route must be physically readable. Do not hide stations behind confusing geometry in v0.

## Spatial requirements for Codex

Use simple geometry first:
- rectangular rooms
- straight corridors
- clear doorways
- collision walls
- station trigger zones

Do not overbuild art before the loop works.
