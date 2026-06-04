import './style.css';
import * as THREE from 'three';

const TUNING = {
  lookSensitivity: 0.0034,
  moveSpeed: 3.15,
  dragMoveMultiplier: 0.58,
  attackRange: 2.25,
  interactRange: 2.45,
  guardianDamage: 28,
  attackCooldown: 0.58,
  enemyAttackCooldown: 1.05,
  cameraHeight: 1.65,
  playerRadius: 0.36,
};

type RoomId = 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07';
type StationId = 'blood' | 'bone' | 'gold';
type Processed = Record<StationId, boolean>;

type EnemySpec = {
  name: string; type: 'thief' | 'sellsword' | 'robber' | 'runner' | 'prince' | 'beast';
  health: number; damage: number; speed: number; corpseWeight: number; blood: number; bone: number; gold: number;
  target: RoomId; delay?: number;
};

type Enemy = EnemySpec & { id: number; mesh: THREE.Mesh; hp: number; alive: boolean; attackTimer: number; spawnDelay: number; hitFlash: number; };
type Corpse = { id: number; wave: number; name: string; mesh: THREE.Mesh; weight: number; blood: number; bone: number; gold: number; processed: Processed; grabbed: boolean; spent: boolean; };
type Rect = { id: RoomId | 'C_R01_R02' | 'C_R02_R03' | 'C_R02_R04' | 'C_R02_R05' | 'C_R03_R05' | 'C_R04_R05' | 'C_R02_R06' | 'C_R06_R07'; x1: number; x2: number; z1: number; z2: number; };

const WAVE_DATA: EnemySpec[][] = [
  [{ name: 'Starving Thief', type: 'thief', health: 55, damage: 8, speed: 1.0, corpseWeight: 1, blood: 8, bone: 4, gold: 2, target: 'R02' }],
  [{ name: 'Bronze Sellsword', type: 'sellsword', health: 100, damage: 14, speed: .85, corpseWeight: 1.35, blood: 13, bone: 9, gold: 6, target: 'R06' }],
  [
    { name: 'Tomb Robber', type: 'robber', health: 62, damage: 9, speed: 1.08, corpseWeight: 1, blood: 8, bone: 5, gold: 4, target: 'R02' },
    { name: 'Torch Runner', type: 'runner', health: 48, damage: 6, speed: 1.38, corpseWeight: .92, blood: 7, bone: 4, gold: 5, target: 'R03', delay: .7 },
  ],
  [
    { name: 'Jackal Beast', type: 'beast', health: 72, damage: 11, speed: 1.75, corpseWeight: .85, blood: 10, bone: 7, gold: 0, target: 'R02' },
    { name: 'Jackal Prince', type: 'prince', health: 150, damage: 18, speed: .88, corpseWeight: 1.8, blood: 18, bone: 11, gold: 14, target: 'R06', delay: 1.1 },
  ],
];

const rooms: Rect[] = [
  { id: 'R01', x1: -1.4, x2: 1.4, z1: 8, z2: 15 },
  { id: 'R02', x1: -4.2, x2: 4.2, z1: -3.2, z2: 3.2 },
  { id: 'R03', x1: -11.8, x2: -6.2, z1: -2.5, z2: 2.5 },
  { id: 'R04', x1: 6.2, x2: 11.8, z1: -2.5, z2: 2.5 },
  { id: 'R05', x1: -7.2, x2: 7.2, z1: 5.1, z2: 6.7 },
  { id: 'R06', x1: -3, x2: 3, z1: -10.8, z2: -5.8 },
  { id: 'R07', x1: -2.6, x2: 2.6, z1: -17.3, z2: -13.6 },
];
const corridors: Rect[] = [
  { id: 'C_R01_R02', x1: -.9, x2: .9, z1: 3.2, z2: 8 },
  { id: 'C_R02_R03', x1: -6.2, x2: -4.2, z1: -.9, z2: .9 },
  { id: 'C_R02_R04', x1: 4.2, x2: 6.2, z1: -.9, z2: .9 },
  { id: 'C_R02_R05', x1: -.9, x2: .9, z1: 3.2, z2: 5.1 },
  { id: 'C_R03_R05', x1: -10.5, x2: -8.9, z1: 2.5, z2: 5.1 },
  { id: 'C_R04_R05', x1: 8.9, x2: 10.5, z1: 2.5, z2: 5.1 },
  { id: 'C_R02_R06', x1: -.95, x2: .95, z1: -5.8, z2: -3.2 },
  { id: 'C_R06_R07', x1: -.9, x2: .9, z1: -13.6, z2: -10.8 },
];
const allWalkRects = [...rooms, ...corridors];
const roomCenters: Record<RoomId, THREE.Vector3> = {
  R01: new THREE.Vector3(0, 0, 11.4), R02: new THREE.Vector3(0, 0, 0), R03: new THREE.Vector3(-9, 0, 0),
  R04: new THREE.Vector3(9, 0, 0), R05: new THREE.Vector3(0, 0, 5.9), R06: new THREE.Vector3(0, 0, -8.2), R07: new THREE.Vector3(0, 0, -15.2),
};

class VisitorsGame {
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 80);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); clock = new THREE.Clock();
  player = { pos: new THREE.Vector3(0, TUNING.cameraHeight, -8), yaw: Math.PI, hp: 100, maxHp: 100, attackTimer: 0, damage: TUNING.guardianDamage };
  resources = { blood: 0, bone: 0, gold: 0 }; waveIndex = 0; waveActive = false; waveAwaitingProcessing = false; prototypeComplete = false;
  enemies: Enemy[] = []; corpses: Corpse[] = []; grabbed?: Corpse; nextId = 1; hitPulse = 0;
  shortcutUnlocked = false; deepDoorUnlocked = false; meleeUpgraded = false; trapActive = false; showRooms = false; showZones = true;
  input = { moveX: 0, moveY: 0, lookDX: 0, attacking: false, interact: false, drop: false };
  joystick = { pointer: -1, cx: 0, cy: 0 }; lookPointer = -1;
  hud = { hp: el('hp'), wave: el('wave'), resources: el('resources'), prompt: el('prompt') };
  stationZones: Record<StationId, { center: THREE.Vector3; radius: number; mesh: THREE.Mesh }> = {} as any;
  roomLabels: THREE.Sprite[] = [];

  constructor() {
    document.getElementById('gameCanvas')!.replaceWith(this.renderer.domElement); this.renderer.domElement.id = 'gameCanvas';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.setSize(innerWidth, innerHeight); this.scene.background = new THREE.Color(0x080604);
    this.camera.position.copy(this.player.pos); this.camera.rotation.order = 'YXZ';
    this.setupWorld(); this.setupControls(); this.startWave(0); this.resize(); addEventListener('resize', () => this.resize());
    requestAnimationFrame(() => this.tick());
  }

  setupWorld() {
    this.scene.add(new THREE.HemisphereLight(0xd9ad6d, 0x120704, 1.5));
    const torch = new THREE.PointLight(0xff8a32, 9, 18); torch.position.set(0, 2.8, 1); this.scene.add(torch);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2119, roughness: .92 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x514332, roughness: .8 });
    for (const r of allWalkRects) {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, .08, r.z2 - r.z1), floorMat);
      floor.position.set((r.x1 + r.x2) / 2, -.04, (r.z1 + r.z2) / 2); this.scene.add(floor);
    }
    this.addBoundaryWalls(wallMat); this.addStations(); this.addDoors(); this.addRoomLabels();
  }

  addBoundaryWalls(mat: THREE.Material) {
    const addWall = (x: number, z: number, sx: number, sz: number) => { const w = new THREE.Mesh(new THREE.BoxGeometry(sx, 2.9, sz), mat); w.position.set(x, 1.35, z); this.scene.add(w); };
    const segs = [
      [0,15,3.2,.25],[0,8,3.2,.25],[-1.6,11.5,.25,7.2],[1.6,11.5,.25,7.2],
      [0,-3.4,8.6,.25],[-4.35,0,.25,6.8],[4.35,0,.25,6.8],[-2.4,3.35,3.8,.25],[2.4,3.35,3.8,.25],
      [-9,-2.65,5.8,.25],[-9,2.65,5.8,.25],[-12,0,.25,5.2],[-6,1.8,.25,1.4],[-6,-1.8,.25,1.4],
      [9,-2.65,5.8,.25],[9,2.65,5.8,.25],[12,0,.25,5.2],[6,1.8,.25,1.4],[6,-1.8,.25,1.4],
      [0,4.95,14.6,.25],[0,6.85,14.6,.25],[-7.35,5.9,.25,2.1],[7.35,5.9,.25,2.1],
      [-3.2,-8.2,.25,5.2],[3.2,-8.2,.25,5.2],[-1.9,-5.65,2.2,.25],[1.9,-5.65,2.2,.25],[0,-10.95,6.2,.25],
      [-2.8,-15.45,.25,3.8],[2.8,-15.45,.25,3.8],[0,-17.45,5.6,.25]
    ];
    segs.forEach(s => addWall(s[0], s[1], s[2], s[3]));
  }

  addStations() {
    const station = (id: StationId, x: number, z: number, color: number) => {
      const zone = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .08, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .38 }));
      zone.position.set(x, .04, z); this.scene.add(zone); this.stationZones[id] = { center: new THREE.Vector3(x, 0, z), radius: 1.55, mesh: zone };
      const marker = new THREE.Mesh(new THREE.BoxGeometry(1.3, .45, .9), new THREE.MeshStandardMaterial({ color })); marker.position.set(x, .27, z); this.scene.add(marker);
    };
    station('blood', -9, 0, 0x8c1712); station('bone', 9, 0, 0xd2c197); station('gold', 0, -8.7, 0xc8892b);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.2, .28, 1.2), new THREE.MeshStandardMaterial({ color: 0x3b302b })); slab.position.set(0, .18, -7.3); this.scene.add(slab);
  }

  addDoors() {
    const shortcut = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.2, .22), new THREE.MeshStandardMaterial({ color: 0x765229 })); shortcut.name = 'shortcutDoor'; shortcut.position.set(0, 1.1, 4.2); this.scene.add(shortcut);
    const deep = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, .32), new THREE.MeshStandardMaterial({ color: 0x1a1613 })); deep.name = 'deepDoor'; deep.position.set(0, 1.4, -13.55); this.scene.add(deep);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, .28), new THREE.MeshStandardMaterial({ color: 0x18110d, emissive: 0x3c180b })); gate.position.set(0, 1.2, 15.05); this.scene.add(gate);
  }

  addRoomLabels() {
    for (const r of rooms) {
      const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 40; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f2d3a1'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(r.id, 64, 27);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, opacity: .85 }));
      const c = roomCenters[r.id as RoomId]; sprite.position.set(c.x, 2.2, c.z); sprite.scale.set(2.2, .7, 1); sprite.visible = false; this.scene.add(sprite); this.roomLabels.push(sprite);
    }
  }

  setupControls() {
    const prevent = (e: Event) => e.preventDefault();
    ['touchstart','touchmove','touchend','touchcancel','gesturestart','gesturechange','gestureend'].forEach(t => document.addEventListener(t, prevent, { passive: false }));
    addEventListener('contextmenu', prevent); addEventListener('blur', () => this.clearInputs()); document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearInputs(); });
    const joy = document.getElementById('joystick')!, knob = document.getElementById('stickKnob')!;
    joy.addEventListener('pointerdown', e => { joy.setPointerCapture(e.pointerId); this.joystick.pointer = e.pointerId; const r = joy.getBoundingClientRect(); this.joystick.cx = r.left + r.width/2; this.joystick.cy = r.top + r.height/2; this.updateJoystick(e, knob); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === this.joystick.pointer) this.updateJoystick(e, knob); });
    const endJoy = (e: PointerEvent) => { if (e.pointerId === this.joystick.pointer) { this.joystick.pointer = -1; this.input.moveX = this.input.moveY = 0; knob.style.transform = 'translate(-50%, -50%)'; } };
    joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);
    const look = document.getElementById('lookPad')!;
    look.addEventListener('pointerdown', e => { look.setPointerCapture(e.pointerId); this.lookPointer = e.pointerId; });
    look.addEventListener('pointermove', e => { if (e.pointerId === this.lookPointer) this.input.lookDX += e.movementX || 0; });
    const endLook = (e: PointerEvent) => { if (e.pointerId === this.lookPointer) this.lookPointer = -1; };
    look.addEventListener('pointerup', endLook); look.addEventListener('pointercancel', endLook);
    this.bindHoldButton('attackBtn', 'attacking'); this.bindTapButton('interactBtn', 'interact'); this.bindTapButton('dropBtn', 'drop');
    byId('devToggle').onclick = () => byId('devPanel').classList.toggle('open');
    byId('restartWave').onclick = () => this.startWave(this.waveIndex); byId('nextWave').onclick = () => this.startWave(Math.min(this.waveIndex + 1, WAVE_DATA.length - 1)); byId('resetTomb').onclick = () => this.resetTomb();
    byId('roomIds').onclick = () => { this.showRooms = !this.showRooms; this.roomLabels.forEach(s => s.visible = this.showRooms); };
    byId('zones').onclick = () => { this.showZones = !this.showZones; Object.values(this.stationZones).forEach(z => z.mesh.visible = this.showZones); };
  }

  bindHoldButton(id: string, key: 'attacking') { const b = byId(id); const on = (e: PointerEvent) => { b.setPointerCapture(e.pointerId); this.input[key] = true; b.classList.add('active'); }; const off = () => { this.input[key] = false; b.classList.remove('active'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); }
  bindTapButton(id: string, key: 'interact' | 'drop') { const b = byId(id); b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); this.input[key] = true; b.classList.add('active'); }); const off = () => b.classList.remove('active'); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); }
  updateJoystick(e: PointerEvent, knob: HTMLElement) { const max = Math.min(70, innerWidth * .17); const dx = e.clientX - this.joystick.cx, dy = e.clientY - this.joystick.cy; const len = Math.hypot(dx, dy) || 1; const cl = Math.min(len, max); this.input.moveX = (dx / len) * (cl / max); this.input.moveY = -(dy / len) * (cl / max); knob.style.transform = `translate(calc(-50% + ${(dx/len)*cl}px), calc(-50% + ${(dy/len)*cl}px))`; }
  clearInputs() { this.input = { moveX:0, moveY:0, lookDX:0, attacking:false, interact:false, drop:false }; this.joystick.pointer = -1; this.lookPointer = -1; byId('stickKnob').style.transform = 'translate(-50%, -50%)'; document.querySelectorAll('.active').forEach(e => e.classList.remove('active')); }

  startWave(i: number) { this.enemies.forEach(e => this.scene.remove(e.mesh)); this.enemies = []; this.waveIndex = Math.min(i, WAVE_DATA.length - 1); this.waveActive = true; this.waveAwaitingProcessing = false; this.prototypeComplete = false; WAVE_DATA[this.waveIndex].forEach(spec => this.spawnEnemy(spec)); }
  spawnEnemy(spec: EnemySpec) { const color = spec.type === 'beast' ? 0x8d5c2f : spec.type === 'prince' ? 0xb6853b : spec.type === 'sellsword' ? 0x8f8064 : 0x9b4b2e; const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .9, 5, 10), new THREE.MeshStandardMaterial({ color })); mesh.position.copy(roomCenters.R01).add(new THREE.Vector3((Math.random()-.5)*.8, .75, 2.3)); this.scene.add(mesh); this.enemies.push({ ...spec, id: this.nextId++, mesh, hp: spec.health, alive: true, attackTimer: 0, spawnDelay: spec.delay ?? 0, hitFlash: 0 }); }

  tick() { const dt = Math.min(this.clock.getDelta(), .033); this.update(dt); this.renderer.render(this.scene, this.camera); requestAnimationFrame(() => this.tick()); }
  update(dt: number) {
    this.player.attackTimer -= dt; this.player.yaw -= this.input.lookDX * TUNING.lookSensitivity; this.input.lookDX = 0; this.camera.rotation.set(0, this.player.yaw, 0);
    const speed = TUNING.moveSpeed * (this.grabbed ? TUNING.dragMoveMultiplier / this.grabbed.weight : 1); const f = new THREE.Vector3(Math.sin(this.player.yaw),0,Math.cos(this.player.yaw)); const r = new THREE.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
    const move = f.multiplyScalar(this.input.moveY).add(r.multiplyScalar(this.input.moveX)); if (move.lengthSq() > .001) { move.normalize().multiplyScalar(speed * dt); this.tryMove(move); }
    this.camera.position.copy(this.player.pos); this.updateGrabbedCorpse(dt);
    if (this.input.attacking) this.attack(); if (this.input.drop) { this.dropCorpse(); this.input.drop = false; } if (this.input.interact) { this.interact(); this.input.interact = false; }
    this.updateEnemies(dt); this.updateHud(); this.hitPulse = Math.max(0, this.hitPulse - dt);
  }
  tryMove(delta: THREE.Vector3) { const np = this.player.pos.clone().add(delta); if (this.isWalkable(np.x, np.z)) this.player.pos.copy(np); }
  isWalkable(x: number, z: number) { if (!this.shortcutUnlocked && z > 2.5 && z < 6.8) return false; if (!this.deepDoorUnlocked && z < -13.45) return false; return allWalkRects.some(r => x > r.x1 + TUNING.playerRadius && x < r.x2 - TUNING.playerRadius && z > r.z1 + TUNING.playerRadius && z < r.z2 - TUNING.playerRadius); }
  updateGrabbedCorpse(dt: number) { if (!this.grabbed) return; const back = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw)).multiplyScalar(1.1); const target = this.player.pos.clone().add(back); target.y = .22; if (this.isWalkable(target.x, target.z)) this.grabbed.mesh.position.lerp(target, Math.min(1, dt * 8)); }

  updateEnemies(dt: number) {
    let alive = 0; for (const e of this.enemies) { if (!e.alive) continue; e.spawnDelay -= dt; if (e.spawnDelay > 0) { e.mesh.visible = false; continue; } e.mesh.visible = true; alive++; e.attackTimer -= dt; e.hitFlash -= dt;
      const target = (e.type === 'runner' && e.mesh.position.distanceTo(this.player.pos) > 2.1) ? roomCenters[e.target] : this.player.pos; const dir = target.clone().sub(e.mesh.position); dir.y = 0; const dist = dir.length();
      if (dist > 1.25) { dir.normalize().multiplyScalar(e.speed * dt); const np = e.mesh.position.clone().add(dir); if (this.isWalkable(np.x, np.z)) e.mesh.position.copy(np); }
      if (e.mesh.position.distanceTo(this.player.pos) < 1.45 && e.attackTimer <= 0) { this.player.hp = Math.max(0, this.player.hp - e.damage); e.attackTimer = TUNING.enemyAttackCooldown; this.hitPulse = .25; }
      if (e.hitFlash > 0) (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x7a120c); else (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    }
    if (this.waveActive && alive === 0 && this.enemies.every(e => e.spawnDelay <= 0 || !e.alive)) this.completeWave(false);
  }
  attack() { if (this.player.attackTimer > 0) return; this.player.attackTimer = TUNING.attackCooldown; let best: Enemy | undefined; let bestDist = Infinity; const forward = new THREE.Vector3(Math.sin(this.player.yaw),0,Math.cos(this.player.yaw));
    for (const e of this.enemies.filter(e => e.alive && e.spawnDelay <= 0)) { const to = e.mesh.position.clone().sub(this.player.pos); to.y = 0; const d = to.length(); if (d < TUNING.attackRange && to.normalize().dot(forward) > .25 && d < bestDist) { best = e; bestDist = d; } }
    if (!best) return; best.hp -= this.player.damage; best.hitFlash = .12; if (best.hp <= 0) this.killEnemy(best);
  }
  killEnemy(e: Enemy) { e.alive = false; this.scene.remove(e.mesh); const corpseMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .92, 4, 8), new THREE.MeshStandardMaterial({ color: 0x5e241b, roughness: .85 })); corpseMesh.position.copy(e.mesh.position); corpseMesh.position.y = .22; corpseMesh.rotation.z = Math.PI / 2; this.scene.add(corpseMesh); this.corpses.push({ id: this.nextId++, wave: this.waveIndex, name: e.name, mesh: corpseMesh, weight: e.corpseWeight, blood: e.blood, bone: e.bone, gold: e.gold, processed: { blood:false, bone:false, gold:false }, grabbed:false, spent:false }); }
  completeWave(skip: boolean) { this.waveActive = false; if (skip) this.enemies.forEach(e => { if (e.alive) this.killEnemy(e); }); this.waveAwaitingProcessing = true; this.advanceWaveIfReady(); }

  interact() {
    const nearbyStation = this.nearStation(); const corpse = this.grabbed || this.nearCorpse();
    if (corpse && !this.grabbed && !nearbyStation) { this.grabbed = corpse; corpse.grabbed = true; return; }
    if (nearbyStation && corpse && corpse.mesh.position.distanceTo(this.stationZones[nearbyStation].center) < this.stationZones[nearbyStation].radius + .75) { this.processCorpse(nearbyStation, corpse); return; }
    if (nearbyStation === 'blood' && this.resources.blood >= 5 && this.player.hp < this.player.maxHp) { this.resources.blood -= 5; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35); return; }
    if (nearbyStation === 'bone' && this.resources.bone >= 8 && !this.meleeUpgraded) { this.resources.bone -= 8; this.meleeUpgraded = true; this.player.damage += 12; return; }
    if (nearbyStation === 'gold' && this.resources.gold >= 8 && !this.shortcutUnlocked) { this.resources.gold -= 8; this.shortcutUnlocked = true; this.unlockDoor('shortcutDoor'); return; }
    if (nearbyStation === 'gold' && this.resources.gold >= 16 && this.waveIndex >= 3 && !this.deepDoorUnlocked) { this.resources.gold -= 16; this.deepDoorUnlocked = true; this.unlockDoor('deepDoor'); }
  }
  processCorpse(st: StationId, c: Corpse) { if (c.processed[st]) return; const value = c[st]; this.resources[st] += value; c.processed[st] = true; const mat = c.mesh.material as THREE.MeshStandardMaterial; if (c.processed.blood && c.processed.bone && c.processed.gold) { c.spent = true; mat.color.setHex(0x312821); } else mat.color.offsetHSL(0, -.15, -.08); this.advanceWaveIfReady(); }
  advanceWaveIfReady() { if (!this.waveAwaitingProcessing) return; const currentCorpses = this.corpses.filter(c => c.wave === this.waveIndex); if (!currentCorpses.length || !currentCorpses.every(c => c.spent)) return; this.waveAwaitingProcessing = false; if (this.waveIndex === 3) { this.deepDoorUnlocked = true; this.unlockDoor('deepDoor'); this.prototypeComplete = true; } else setTimeout(() => this.startWave(this.waveIndex + 1), 1400); }
  dropCorpse() { if (this.grabbed) { this.grabbed.grabbed = false; this.grabbed = undefined; } }
  nearCorpse() { return this.corpses.filter(c => !c.grabbed).sort((a,b) => a.mesh.position.distanceTo(this.player.pos) - b.mesh.position.distanceTo(this.player.pos)).find(c => c.mesh.position.distanceTo(this.player.pos) < TUNING.interactRange); }
  nearStation(): StationId | undefined { return (Object.keys(this.stationZones) as StationId[]).find(k => this.player.pos.distanceTo(this.stationZones[k].center) < TUNING.interactRange); }
  unlockDoor(name: string) { const d = this.scene.getObjectByName(name); if (d) { d.visible = false; d.position.y = -5; } }

  updateHud() { this.hud.hp.textContent = `Health ${Math.ceil(this.player.hp)}/${this.player.maxHp}`; this.hud.wave.textContent = this.prototypeComplete ? 'Seal Open' : `Wave ${this.waveIndex + 1}/4`; this.hud.resources.textContent = `Blood ${this.resources.blood} · Bone ${this.resources.bone} · Gold ${this.resources.gold}`; this.hud.prompt.textContent = this.promptText(); }
  promptText() { if (this.player.hp <= 0) return 'Guardian fell. Use DEV reset tomb.'; const st = this.nearStation(); const corpse = this.grabbed || this.nearCorpse(); if (this.prototypeComplete) return 'R07 opens. Prototype complete: the tomb can grow deeper.'; if (st && corpse && corpse.mesh.position.distanceTo(this.stationZones[st].center) < this.stationZones[st].radius + .75 && !corpse.processed[st]) return `${label(st)}: process ${corpse.name} for ${corpse[st]} ${st}.`; if (!this.grabbed && corpse) return `Grab ${corpse.name}. Drag it to a physical station.`; if (this.grabbed) return `Dragging ${this.grabbed.name}. Drop or place on Blood, Bone, or Gold station.`; if (st === 'blood') return this.resources.blood >= 5 && this.player.hp < this.player.maxHp ? 'Blood Basin: interact to spend 5 blood and heal.' : 'Blood Basin: bring a corpse here.'; if (st === 'bone') return !this.meleeUpgraded && this.resources.bone >= 8 ? 'Bone Forge: spend 8 bone to improve melee damage.' : 'Bone Forge: extract bone from corpses.'; if (st === 'gold') return !this.shortcutUnlocked && this.resources.gold >= 8 ? 'Gold Crucible: spend 8 gold to unlock R05 shortcut.' : 'Gold Crucible: strip gold from corpses.'; if (this.waveAwaitingProcessing) return 'Wave defeated. Process every corpse at Blood, Bone, and Gold before the next visitor enters.'; return 'Thumbs: move left, look right, attack, interact, drop.'; }
  resetTomb() { this.corpses.forEach(c => this.scene.remove(c.mesh)); this.corpses = []; this.resources = { blood:0,bone:0,gold:0 }; this.player.hp = 100; this.player.damage = TUNING.guardianDamage; this.shortcutUnlocked = false; this.deepDoorUnlocked = false; this.meleeUpgraded = false; this.grabbed = undefined; this.scene.getObjectByName('shortcutDoor')!.visible = true; this.scene.getObjectByName('shortcutDoor')!.position.y = 1.1; this.scene.getObjectByName('deepDoor')!.visible = true; this.scene.getObjectByName('deepDoor')!.position.y = 1.4; this.startWave(0); }
  resize() { this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
}

function label(st: StationId) { return st === 'blood' ? 'Blood Basin' : st === 'bone' ? 'Bone Forge' : 'Gold Crucible'; }
function byId(id: string) { return document.getElementById(id)!; }
function el(id: string) { return document.getElementById(id)!; }

document.getElementById('app')!.innerHTML = `
  <main id="game" aria-label="VISITORS Test Tomb mobile prototype">
    <canvas id="gameCanvas"></canvas>
    <section class="hud"><div class="statRow"><span id="hp" class="badge"></span><span id="wave" class="badge"></span></div><span id="resources" class="badge"></span><div id="prompt" class="prompt"></div></section>
    <section class="controls" aria-label="Touch controls"><div id="joystick" class="joystick"><div id="stickKnob" class="stickKnob"></div></div><div id="lookPad" class="lookPad"></div><div class="actionCluster"><button id="attackBtn" class="actionBtn attack">ATTACK</button><button id="interactBtn" class="actionBtn interact">GRAB<br/>USE</button><button id="dropBtn" class="actionBtn drop">DROP</button></div></section>
    <button id="devToggle" class="devToggle">DEV</button><section id="devPanel" class="devPanel"><button id="restartWave">Restart wave</button><button id="nextWave">Skip wave</button><button id="resetTomb">Reset tomb</button><button id="roomIds">Room IDs</button><button id="zones">Station zones</button></section>
    <div class="orientationNote">VISITORS is portrait-first. Rotate your iPhone upright to play.</div>
  </main>`;
new VisitorsGame();
