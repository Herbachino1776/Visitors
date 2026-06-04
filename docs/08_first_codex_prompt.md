# VISITORS — First Codex Prompt

Use this prompt after creating the repo.

---

You are working on a Three.js first-person game prototype called VISITORS.

Build the first playable Test Tomb prototype.

Read the repo docs before coding, especially:

- `00_vision_and_tone.md`
- `01_actionable_prototype_scope.md`
- `02_core_loop_corpse_processing.md`
- `03_test_tomb_blueprint_v0.md`
- `04_visitor_waves_v0.md`
- `06_codex_handoff_rules.md`

Primary goal:

Create a small first-person dungeon where a visitor enters, the Guardian fights and kills the visitor, the corpse remains in the world, the Guardian drags the corpse to processing stations, and the stations extract blood/bone/gold resources that visibly affect the tomb.

Build only the Test Tomb scope. Do not expand into the full game.

Required features:

1. Basic Three.js first-person dungeon scene.
2. Room layout matching `03_test_tomb_blueprint_v0.md`.
3. Player movement and simple melee attack.
4. Enemy wave manager with four waves from `04_visitor_waves_v0.md`.
5. Enemy health, attack, death, and corpse conversion.
6. Corpse dragging:
   - interact to grab corpse
   - drag behind player
   - slower movement while dragging
   - release/drop corpse
7. Three station trigger zones:
   - Blood Basin
   - Bone Forge
   - Gold Crucible
8. Station processing:
   - corpse blood extracted at Blood Basin
   - corpse bone extracted at Bone Forge
   - corpse gold extracted at Gold Crucible
   - corpse tracks processed states so values are not duplicated
9. Simple visible upgrade:
   - use blood to heal
   - use bone to repair or activate one trap
   - use gold to unlock the shortcut passage or deep door
10. Minimal HUD:
   - health
   - wave number/name
   - blood/bone/gold
   - interact prompt

Rules:

- Keep the first build simple and functional.
- Use clear room IDs in code.
- Use placeholder geometry and materials.
- Do not create abstract resources like “favor” or “essence.”
- Do not add large lore systems yet.
- Do not add procedural party generation.
- Do not overbuild art before the loop works.
- Make the prototype easy to test locally.

After implementation, provide:
- a summary of changed files
- how to run locally
- what is currently playable
- known limitations
- next recommended step
