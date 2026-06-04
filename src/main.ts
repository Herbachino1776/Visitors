import './style.css';
import * as THREE from 'three';

const TUNING = {
  lookSensitivity: 0.0034,
  moveSpeed: 3.15,
  dragMoveMultiplier: 0.58,
  attackRange: 2.25,
  interactRange: 2.55,
  guardianDamage: 28,
  attackCooldown: 0.58,
  enemyAttackCooldown: 1.05,
  cameraHeight: 1.65,
  playerRadius: 0.36,
};

type RoomId = 'VG-01' | 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08';
type DoorId = 'D01' | 'D02' | 'D03' | 'D04' | 'D05' | 'D06' | 'D07' | 'D08' | 'D09';
type StationId = 'blood' | 'bone' | 'gold';
type Processed = Record<StationId, boolean>;
type RectId = RoomId | `C_${DoorId}`;

type EnemySpec = {
  name: string; type: 'thief' | 'sellsword' | 'robber' | 'runner' | 'prince' | 'beast';
  health: number; damage: number; speed: number; corpseWeight: number; blood: number; bone: number; gold: number;
  target: RoomId; delay?: number;
};

type Enemy = EnemySpec & { id: number; mesh: THREE.Mesh; hp: number; alive: boolean; attackTimer: number; spawnDelay: number; hitFlash: number; };
type Corpse = { id: number; wave: number; name: string; mesh: THREE.Mesh; weight: number; blood: number; bone: number; gold: number; processed: Processed; grabbed: boolean; spent: boolean; };
type Rect = { id: RectId; x1: number; x2: number; z1: number; z2: number; height?: number; lockedBy?: 'shortcut' | 'deep'; };
type RoomSpec = { id: RoomId; name: string; x: number; z: number; w: number; d: number; h: number; };
type DoorSpec = { id: DoorId; from: RoomId; to: RoomId; x: number; z: number; width: number; lockedBy?: 'shortcut' | 'deep'; };

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

const ROOM_SPECS: RoomSpec[] = [
  { id: 'VG-01', name: 'Visitor Gate', x: 0, z: 28, w: 8, d: 10, h: 5 },
  { id: 'R01', name: 'Entry Corridor', x: 0, z: 16, w: 4, d: 14, h: 3.5 },
  { id: 'R02', name: 'Main Kill Hall', x: 0, z: 4, w: 10, d: 12, h: 4 },
  { id: 'R03', name: 'Blood Basin', x: -10, z: 4, w: 7, d: 8, h: 4 },
  { id: 'R04', name: 'Bone Forge', x: 10, z: 4, w: 7, d: 8, h: 4 },
  { id: 'R05', name: 'Shortcut Passage', x: 0, z: -5, w: 24, d: 4, h: 3 },
  { id: 'R06', name: 'Guardian Rest Slab', x: 0, z: -14, w: 8, d: 8, h: 4 },
  { id: 'R07', name: 'Locked Deep Door', x: 0, z: -21, w: 5, d: 4, h: 5 },
  { id: 'R08', name: 'Gold Crucible Alcove', x: 8, z: -12, w: 6, d: 6, h: 4 },
];

const DOOR_SPECS: DoorSpec[] = [
  { id: 'D01', from: 'VG-01', to: 'R01', x: 0, z: 23, width: 3.5 },
  { id: 'D02', from: 'R01', to: 'R02', x: 0, z: 10, width: 3.5 },
  { id: 'D03', from: 'R02', to: 'R03', x: -5, z: 4, width: 3.5 },
  { id: 'D04', from: 'R02', to: 'R04', x: 5, z: 4, width: 3.5 },
  { id: 'D05', from: 'R03', to: 'R05', x: -10, z: 0, width: 3.0, lockedBy: 'shortcut' },
  { id: 'D06', from: 'R04', to: 'R05', x: 10, z: 0, width: 3.0, lockedBy: 'shortcut' },
  { id: 'D07', from: 'R02', to: 'R06', x: 0, z: -2, width: 3.5 },
  { id: 'D08', from: 'R06', to: 'R07', x: 0, z: -18, width: 3.0, lockedBy: 'deep' },
  { id: 'D09', from: 'R06', to: 'R08', x: 5, z: -12, width: 3.0 },
];

const rooms: Rect[] = ROOM_SPECS.map(r => ({ id: r.id, x1: r.x - r.w / 2, x2: r.x + r.w / 2, z1: r.z - r.d / 2, z2: r.z + r.d / 2, height: r.h, lockedBy: r.id === 'R05' ? 'shortcut' : undefined }));
const connectors: Rect[] = [
  { id: 'C_D03', x1: -6.7, x2: -4.8, z1: 2.25, z2: 5.75 },
  { id: 'C_D04', x1: 4.8, x2: 6.7, z1: 2.25, z2: 5.75 },
  { id: 'C_D05', x1: -11.5, x2: -8.5, z1: -3.2, z2: .2, lockedBy: 'shortcut' },
  { id: 'C_D06', x1: 8.5, x2: 11.5, z1: -3.2, z2: .2, lockedBy: 'shortcut' },
  { id: 'C_D07', x1: -1.75, x2: 1.75, z1: -10.2, z2: -1.8 },
  { id: 'C_D08', x1: -1.5, x2: 1.5, z1: -19.2, z2: -17.8, lockedBy: 'deep' },
  { id: 'C_D09', x1: 3.8, x2: 5.2, z1: -13.5, z2: -10.5 },
];
const allWalkRects = [...rooms, ...connectors];
const roomCenters: Record<RoomId, THREE.Vector3> = Object.fromEntries(ROOM_SPECS.map(r => [r.id, new THREE.Vector3(r.x, 0, r.z)])) as Record<RoomId, THREE.Vector3>;
const doorCenters: Record<DoorId, THREE.Vector3> = Object.fromEntries(DOOR_SPECS.map(d => [d.id, new THREE.Vector3(d.x, 0, d.z)])) as Record<DoorId, THREE.Vector3>;

class VisitorsGame {
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .05, 90);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); clock = new THREE.Clock();
  player = { pos: new THREE.Vector3(0, TUNING.cameraHeight, -14), yaw: Math.PI, hp: 100, maxHp: 100, attackTimer: 0, damage: TUNING.guardianDamage };
  resources = { blood: 0, bone: 0, gold: 0 }; waveIndex = 0; waveActive = false; waveAwaitingProcessing = false; prototypeComplete = false;
  enemies: Enemy[] = []; corpses: Corpse[] = []; grabbed?: Corpse; nextId = 1; hitPulse = 0;
  shortcutUnlocked = false; deepDoorUnlocked = false; meleeUpgraded = false; trapActive = false;
  showRooms = false; showDoors = false; showCollision = false; showZones = false;
  input = { moveX: 0, moveY: 0, lookDX: 0, attacking: false, interact: false, drop: false };
  joystick = { pointer: -1, cx: 0, cy: 0 }; lookPointer = -1;
  hud = { hp: el('hp'), wave: el('wave'), resources: el('resources'), prompt: el('prompt'), coords: el('coords') };
  stationZones: Record<StationId, { center: THREE.Vector3; radius: number; mesh: THREE.Mesh }> = {} as any;
  roomLabels: THREE.Sprite[] = []; doorLabels: THREE.Sprite[] = []; collisionDebug: THREE.Mesh[] = [];

  constructor() {
    document.getElementById('gameCanvas')!.replaceWith(this.renderer.domElement); this.renderer.domElement.id = 'gameCanvas';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.setSize(innerWidth, innerHeight); this.scene.background = new THREE.Color(0x080604);
    this.camera.position.copy(this.player.pos); this.camera.rotation.order = 'YXZ';
    this.setupWorld(); this.setupControls(); this.startWave(0); this.resize(); addEventListener('resize', () => this.resize());
    requestAnimationFrame(() => this.tick());
  }

  setupWorld() {
    this.scene.add(new THREE.HemisphereLight(0xd9ad6d, 0x120704, 1.5));
    const torch = new THREE.PointLight(0xff8a32, 10, 20); torch.position.set(0, 2.8, 3.8); this.scene.add(torch);
    const restLight = new THREE.PointLight(0xff6a26, 5, 13); restLight.position.set(3, 2.4, -12); this.scene.add(restLight);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2119, roughness: .92 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x514332, roughness: .8 });
    for (const r of allWalkRects) {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, .08, r.z2 - r.z1), floorMat);
      floor.position.set((r.x1 + r.x2) / 2, -.04, (r.z1 + r.z2) / 2); this.scene.add(floor);
    }
    this.addBoundaryWalls(wallMat); this.addStations(); this.addDoors(); this.addRoomLabels(); this.addDoorLabels();
  }

  addBoundaryWalls(mat: THREE.Material) {
    const addWall = (x: number, z: number, sx: number, sz: number) => {
      if (sx < .05 || sz < .05) return;
      const w = new THREE.Mesh(new THREE.BoxGeometry(sx, 3.05, sz), mat); w.position.set(x, 1.48, z); this.scene.add(w);
      const dbg = new THREE.Mesh(new THREE.BoxGeometry(sx, 3.12, sz), new THREE.MeshBasicMaterial({ color: 0x36d7ff, wireframe: true, transparent: true, opacity: .7 }));
      dbg.position.copy(w.position); dbg.visible = false; this.scene.add(dbg); this.collisionDebug.push(dbg);
    };
    const eps = .001;
    for (const r of allWalkRects) {
      const verticals = [
        { x: r.x1, z1: r.z1, z2: r.z2, side: 'left' },
        { x: r.x2, z1: r.z1, z2: r.z2, side: 'right' },
      ];
      for (const e of verticals) {
        const cuts = allWalkRects.filter(o => o !== r && e.x > o.x1 - eps && e.x < o.x2 + eps).map(o => [Math.max(e.z1, o.z1), Math.min(e.z2, o.z2)]).filter(([a,b]) => b > a);
        for (const [a,b] of subtractIntervals(e.z1, e.z2, cuts)) addWall(e.x, (a+b)/2, .24, b-a+.24);
      }
      const horizontals = [
        { z: r.z1, x1: r.x1, x2: r.x2, side: 'bottom' },
        { z: r.z2, x1: r.x1, x2: r.x2, side: 'top' },
      ];
      for (const e of horizontals) {
        const cuts = allWalkRects.filter(o => o !== r && e.z > o.z1 - eps && e.z < o.z2 + eps).map(o => [Math.max(e.x1, o.x1), Math.min(e.x2, o.x2)]).filter(([a,b]) => b > a);
        for (const [a,b] of subtractIntervals(e.x1, e.x2, cuts)) addWall((a+b)/2, e.z, b-a+.24, .24);
      }
    }
  }

  addStations() {
    const station = (id: StationId, x: number, z: number, color: number) => {
      const zone = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, .08, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .32 }));
      zone.position.set(x, .04, z); zone.visible = this.showZones; this.scene.add(zone); this.stationZones[id] = { center: new THREE.Vector3(x, 0, z), radius: 2.0, mesh: zone };
      const marker = new THREE.Mesh(new THREE.BoxGeometry(1.45, .45, .95), new THREE.MeshStandardMaterial({ color })); marker.position.set(x, .27, z); this.scene.add(marker);
    };
    station('blood', -10, 4, 0x8c1712); station('bone', 10, 4, 0xd2c197); station('gold', 8, -12, 0xc8892b);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.4, .28, 1.25), new THREE.MeshStandardMaterial({ color: 0x3b302b })); slab.position.set(0, .18, -14.8); this.scene.add(slab);
  }

  addDoors() {
    const shortcutMat = new THREE.MeshStandardMaterial({ color: 0x765229 });
    const d05 = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, .28), shortcutMat); d05.name = 'shortcutDoorD05'; d05.position.set(-10, 1.1, -.1); this.scene.add(d05);
    const d06 = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, .28), shortcutMat); d06.name = 'shortcutDoorD06'; d06.position.set(10, 1.1, -.1); this.scene.add(d06);
    const deep = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.8, .32), new THREE.MeshStandardMaterial({ color: 0x1a1613 })); deep.name = 'deepDoor'; deep.position.set(0, 1.4, -18.05); this.scene.add(deep);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, .28), new THREE.MeshStandardMaterial({ color: 0x18110d, emissive: 0x3c180b })); gate.position.set(0, 1.2, 23.05); this.scene.add(gate);
  }

  addRoomLabels() {
    for (const r of ROOM_SPECS) {
      const sprite = makeLabel(`${r.id}\n${r.name}`, 220, 70, 18, '#f2d3a1');
      sprite.position.set(r.x, 2.35, r.z); sprite.scale.set(3.2, 1.0, 1); sprite.visible = this.showRooms; this.scene.add(sprite); this.roomLabels.push(sprite);
    }
  }

  addDoorLabels() {
    for (const d of DOOR_SPECS) {
      const sprite = makeLabel(d.id, 96, 42, 22, '#9ef3ff');
      sprite.position.set(d.x, 2.1, d.z); sprite.scale.set(1.5, .65, 1); sprite.visible = this.showDoors; this.scene.add(sprite); this.doorLabels.push(sprite);
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
    joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy); joy.addEventListener('lostpointercapture', endJoy);
    const look = document.getElementById('lookPad')!;
    look.addEventListener('pointerdown', e => { look.setPointerCapture(e.pointerId); this.lookPointer = e.pointerId; });
    look.addEventListener('pointermove', e => { if (e.pointerId === this.lookPointer) this.input.lookDX += e.movementX || 0; });
    const endLook = (e: PointerEvent) => { if (e.pointerId === this.lookPointer) this.lookPointer = -1; };
    look.addEventListener('pointerup', endLook); look.addEventListener('pointercancel', endLook); look.addEventListener('lostpointercapture', endLook);
    this.bindHoldButton('attackBtn', 'attacking'); this.bindTapButton('interactBtn', 'interact'); this.bindTapButton('dropBtn', 'drop');
    byId('devToggle').onclick = () => byId('devPanel').classList.toggle('open');
    byId('restartWave').onclick = () => this.startWave(this.waveIndex); byId('nextWave').onclick = () => this.startWave(Math.min(this.waveIndex + 1, WAVE_DATA.length - 1)); byId('resetTomb').onclick = () => this.resetTomb();
    byId('roomIds').onclick = () => { this.showRooms = !this.showRooms; this.roomLabels.forEach(s => s.visible = this.showRooms); };
    byId('doorIds').onclick = () => { this.showDoors = !this.showDoors; this.doorLabels.forEach(s => s.visible = this.showDoors); };
    byId('collision').onclick = () => { this.showCollision = !this.showCollision; this.collisionDebug.forEach(s => s.visible = this.showCollision); };
    byId('zones').onclick = () => { this.showZones = !this.showZones; Object.values(this.stationZones).forEach(z => z.mesh.visible = this.showZones); };
  }

  bindHoldButton(id: string, key: 'attacking') { const b = byId(id); const on = (e: PointerEvent) => { b.setPointerCapture(e.pointerId); this.input[key] = true; b.classList.add('active'); }; const off = () => { this.input[key] = false; b.classList.remove('active'); }; b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }
  bindTapButton(id: string, key: 'interact' | 'drop') { const b = byId(id); b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); this.input[key] = true; b.classList.add('active'); }); const off = () => b.classList.remove('active'); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }
  updateJoystick(e: PointerEvent, knob: HTMLElement) { const max = Math.min(70, innerWidth * .17); const dx = e.clientX - this.joystick.cx, dy = e.clientY - this.joystick.cy; const len = Math.hypot(dx, dy) || 1; const cl = Math.min(len, max); this.input.moveX = (dx / len) * (cl / max); this.input.moveY = -(dy / len) * (cl / max); knob.style.transform = `translate(calc(-50% + ${(dx/len)*cl}px), calc(-50% + ${(dy/len)*cl}px))`; }
  clearInputs() { this.input = { moveX:0, moveY:0, lookDX:0, attacking:false, interact:false, drop:false }; this.joystick.pointer = -1; this.lookPointer = -1; byId('stickKnob').style.transform = 'translate(-50%, -50%)'; document.querySelectorAll('.active').forEach(e => e.classList.remove('active')); }

  startWave(i: number) { this.enemies.forEach(e => this.scene.remove(e.mesh)); this.enemies = []; this.waveIndex = Math.min(i, WAVE_DATA.length - 1); this.waveActive = true; this.waveAwaitingProcessing = false; this.prototypeComplete = false; WAVE_DATA[this.waveIndex].forEach(spec => this.spawnEnemy(spec)); }
  spawnEnemy(spec: EnemySpec) { const color = spec.type === 'beast' ? 0x8d5c2f : spec.type === 'prince' ? 0xb6853b : spec.type === 'sellsword' ? 0x8f8064 : 0x9b4b2e; const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .9, 5, 10), new THREE.MeshStandardMaterial({ color })); mesh.position.copy(roomCenters['VG-01']).add(new THREE.Vector3((Math.random()-.5)*.8, .75, -2.3)); this.scene.add(mesh); this.enemies.push({ ...spec, id: this.nextId++, mesh, hp: spec.health, alive: true, attackTimer: 0, spawnDelay: spec.delay ?? 0, hitFlash: 0 }); }

  tick() { const dt = Math.min(this.clock.getDelta(), .033); this.update(dt); this.renderer.render(this.scene, this.camera); requestAnimationFrame(() => this.tick()); }
  update(dt: number) {
    this.player.attackTimer -= dt; this.player.yaw -= this.input.lookDX * TUNING.lookSensitivity; this.input.lookDX = 0; this.camera.rotation.set(0, this.player.yaw, 0);
    const speed = TUNING.moveSpeed * (this.grabbed ? TUNING.dragMoveMultiplier / this.grabbed.weight : 1); const f = this.forwardDir(); const r = this.rightDir();
    const move = f.multiplyScalar(this.input.moveY).add(r.multiplyScalar(this.input.moveX)); if (move.lengthSq() > .001) { move.normalize().multiplyScalar(speed * dt); this.tryMove(move); }
    this.camera.position.copy(this.player.pos); this.updateGrabbedCorpse(dt);
    if (this.input.attacking) this.attack(); if (this.input.drop) { this.dropCorpse(); this.input.drop = false; } if (this.input.interact) { this.interact(); this.input.interact = false; }
    this.updateEnemies(dt); this.updateHud(); this.hitPulse = Math.max(0, this.hitPulse - dt);
  }
  tryMove(delta: THREE.Vector3) { const np = this.player.pos.clone().add(delta); if (this.isWalkable(np.x, np.z)) this.player.pos.copy(np); else { const xOnly = this.player.pos.clone().add(new THREE.Vector3(delta.x, 0, 0)); const zOnly = this.player.pos.clone().add(new THREE.Vector3(0, 0, delta.z)); if (this.isWalkable(xOnly.x, xOnly.z)) this.player.pos.copy(xOnly); if (this.isWalkable(zOnly.x, zOnly.z)) this.player.pos.copy(zOnly); } }
  isWalkable(x: number, z: number) {
    const samples = [
      [0, 0], [TUNING.playerRadius, 0], [-TUNING.playerRadius, 0], [0, TUNING.playerRadius], [0, -TUNING.playerRadius],
      [TUNING.playerRadius * .7, TUNING.playerRadius * .7], [TUNING.playerRadius * .7, -TUNING.playerRadius * .7], [-TUNING.playerRadius * .7, TUNING.playerRadius * .7], [-TUNING.playerRadius * .7, -TUNING.playerRadius * .7],
    ];
    return samples.every(([sx, sz]) => this.isOpenWalkPoint(x + sx, z + sz));
  }
  isOpenWalkPoint(x: number, z: number) {
    return allWalkRects.some(r => {
      if (r.lockedBy === 'shortcut' && !this.shortcutUnlocked) return false;
      if (r.lockedBy === 'deep' && !this.deepDoorUnlocked) return false;
      return x > r.x1 && x < r.x2 && z > r.z1 && z < r.z2;
    });
  }
  forwardDir() { return new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw)); }
  rightDir() { return new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw)); }
  updateGrabbedCorpse(dt: number) { if (!this.grabbed) return; const back = this.forwardDir().multiplyScalar(-1.1); const target = this.player.pos.clone().add(back); target.y = .22; if (this.isWalkable(target.x, target.z)) this.grabbed.mesh.position.lerp(target, Math.min(1, dt * 8)); }

  updateEnemies(dt: number) {
    let alive = 0; for (const e of this.enemies) { if (!e.alive) continue; e.spawnDelay -= dt; if (e.spawnDelay > 0) { e.mesh.visible = false; continue; } e.mesh.visible = true; alive++; e.attackTimer -= dt; e.hitFlash -= dt;
      const target = (e.type === 'runner' && e.mesh.position.distanceTo(this.player.pos) > 2.1) ? roomCenters[e.target] : this.player.pos; const dir = target.clone().sub(e.mesh.position); dir.y = 0; const dist = dir.length();
      if (dist > 1.25) { dir.normalize().multiplyScalar(e.speed * dt); const np = e.mesh.position.clone().add(dir); if (this.isWalkable(np.x, np.z)) e.mesh.position.copy(np); }
      if (e.mesh.position.distanceTo(this.player.pos) < 1.45 && e.attackTimer <= 0) { this.player.hp = Math.max(0, this.player.hp - e.damage); e.attackTimer = TUNING.enemyAttackCooldown; this.hitPulse = .25; }
      if (e.hitFlash > 0) (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x7a120c); else (e.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    }
    if (this.waveActive && alive === 0 && this.enemies.every(e => e.spawnDelay <= 0 || !e.alive)) this.completeWave(false);
  }
  attack() { if (this.player.attackTimer > 0) return; this.player.attackTimer = TUNING.attackCooldown; let best: Enemy | undefined; let bestDist = Infinity; const forward = this.forwardDir();
    for (const e of this.enemies.filter(e => e.alive && e.spawnDelay <= 0)) { const to = e.mesh.position.clone().sub(this.player.pos); to.y = 0; const d = to.length(); if (d < TUNING.attackRange && to.normalize().dot(forward) > .25 && d < bestDist) { best = e; bestDist = d; } }
    if (!best) return; best.hp -= this.player.damage; best.hitFlash = .12; if (best.hp <= 0) this.killEnemy(best);
  }
  killEnemy(e: Enemy) { e.alive = false; this.scene.remove(e.mesh); const corpseMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .92, 4, 8), new THREE.MeshStandardMaterial({ color: 0x5e241b, roughness: .85 })); corpseMesh.position.copy(e.mesh.position); corpseMesh.position.y = .22; corpseMesh.rotation.z = Math.PI / 2; this.scene.add(corpseMesh); this.corpses.push({ id: this.nextId++, wave: this.waveIndex, name: e.name, mesh: corpseMesh, weight: e.corpseWeight, blood: e.blood, bone: e.bone, gold: e.gold, processed: { blood:false, bone:false, gold:false }, grabbed:false, spent:false }); }
  completeWave(skip: boolean) { this.waveActive = false; if (skip) this.enemies.forEach(e => { if (e.alive) this.killEnemy(e); }); this.waveAwaitingProcessing = true; this.advanceWaveIfReady(); }

  interact() {
    if (this.prototypeComplete && this.player.pos.distanceTo(doorCenters.D08) < TUNING.interactRange + 1) return;
    const nearbyStation = this.nearStation(); const corpse = this.grabbed || this.nearCorpse();
    if (corpse && !this.grabbed && !nearbyStation) { this.grabbed = corpse; corpse.grabbed = true; return; }
    if (nearbyStation && corpse && corpse.mesh.position.distanceTo(this.stationZones[nearbyStation].center) < this.stationZones[nearbyStation].radius + .75) { this.processCorpse(nearbyStation, corpse); return; }
    if (nearbyStation === 'blood' && this.resources.blood >= 5 && this.player.hp < this.player.maxHp) { this.resources.blood -= 5; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35); return; }
    if (nearbyStation === 'bone' && this.resources.bone >= 8 && !this.meleeUpgraded) { this.resources.bone -= 8; this.meleeUpgraded = true; this.player.damage += 12; return; }
    if (nearbyStation === 'gold' && this.resources.gold >= 8 && !this.shortcutUnlocked) { this.resources.gold -= 8; this.shortcutUnlocked = true; this.unlockDoor('shortcutDoorD05'); this.unlockDoor('shortcutDoorD06'); return; }
  }
  processCorpse(st: StationId, c: Corpse) { if (c.processed[st]) return; const value = c[st]; this.resources[st] += value; c.processed[st] = true; const mat = c.mesh.material as THREE.MeshStandardMaterial; if (c.processed.blood && c.processed.bone && c.processed.gold) { c.spent = true; mat.color.setHex(0x312821); } else mat.color.offsetHSL(0, -.15, -.08); this.advanceWaveIfReady(); }
  advanceWaveIfReady() { if (!this.waveAwaitingProcessing) return; const currentCorpses = this.corpses.filter(c => c.wave === this.waveIndex); if (!currentCorpses.length || !currentCorpses.every(c => c.spent)) return; this.waveAwaitingProcessing = false; if (this.waveIndex === 3) { this.deepDoorUnlocked = true; this.unlockDoor('deepDoor'); this.prototypeComplete = true; } else setTimeout(() => this.startWave(this.waveIndex + 1), 1400); }
  dropCorpse() { if (this.grabbed) { this.grabbed.grabbed = false; this.grabbed = undefined; } }
  nearCorpse() { return this.corpses.filter(c => !c.grabbed).sort((a,b) => a.mesh.position.distanceTo(this.player.pos) - b.mesh.position.distanceTo(this.player.pos)).find(c => c.mesh.position.distanceTo(this.player.pos) < TUNING.interactRange); }
  nearStation(): StationId | undefined { return (Object.keys(this.stationZones) as StationId[]).find(k => this.player.pos.distanceTo(this.stationZones[k].center) < TUNING.interactRange); }
  unlockDoor(name: string) { const d = this.scene.getObjectByName(name); if (d) { d.visible = false; d.position.y = -5; } }

  updateHud() { this.hud.hp.textContent = `Health ${Math.ceil(this.player.hp)}/${this.player.maxHp}`; this.hud.wave.textContent = this.prototypeComplete ? 'Seal Open' : `Wave ${this.waveIndex + 1}/4`; this.hud.resources.textContent = `Blood ${this.resources.blood} · Bone ${this.resources.bone} · Gold ${this.resources.gold}`; this.hud.prompt.textContent = this.promptText(); this.hud.coords.textContent = `x ${this.player.pos.x.toFixed(1)} · z ${this.player.pos.z.toFixed(1)}`; }
  promptText() { if (this.player.hp <= 0) return 'Guardian fell. Use DEV reset tomb.'; const st = this.nearStation(); const corpse = this.grabbed || this.nearCorpse(); if (this.prototypeComplete && this.player.pos.distanceTo(doorCenters.D08) < 4) return 'R07 Locked Deep Door opens. Prototype complete: the tomb can grow deeper.'; if (this.prototypeComplete) return 'Wave 4 defeated. Return to R07 and face the open deep door.'; if (st && corpse && corpse.mesh.position.distanceTo(this.stationZones[st].center) < this.stationZones[st].radius + .75 && !corpse.processed[st]) return `${label(st)}: process ${corpse.name} for ${corpse[st]} ${st}.`; if (!this.grabbed && corpse) return `Grab ${corpse.name}. Drag it to Blood, Bone, and Gold.`; if (this.grabbed) return `Dragging ${this.grabbed.name}. Drop or place on Blood, Bone, or Gold station.`; if (st === 'blood') return this.resources.blood >= 5 && this.player.hp < this.player.maxHp ? 'Blood Basin: interact to spend 5 blood and heal.' : 'ST_BLOOD: bring a corpse here.'; if (st === 'bone') return !this.meleeUpgraded && this.resources.bone >= 8 ? 'Bone Forge: spend 8 bone to improve melee damage.' : 'ST_BONE: extract bone from corpses.'; if (st === 'gold') return !this.shortcutUnlocked && this.resources.gold >= 8 ? 'Gold Crucible: spend 8 gold to unlock R05 shortcut.' : 'ST_GOLD: strip gold from corpses.'; if (this.waveAwaitingProcessing) return 'Wave defeated. Process every corpse at Blood, Bone, and Gold before the next visitor enters.'; return 'Start in R06. Thumbs: move left, look right, attack, interact, drop.'; }
  resetTomb() { this.corpses.forEach(c => this.scene.remove(c.mesh)); this.corpses = []; this.resources = { blood:0,bone:0,gold:0 }; this.player.hp = 100; this.player.damage = TUNING.guardianDamage; this.player.pos.set(0, TUNING.cameraHeight, -14); this.player.yaw = Math.PI; this.shortcutUnlocked = false; this.deepDoorUnlocked = false; this.meleeUpgraded = false; this.grabbed = undefined; ['shortcutDoorD05','shortcutDoorD06'].forEach(n => { const d = this.scene.getObjectByName(n); if (d) { d.visible = true; d.position.y = 1.1; } }); const deep = this.scene.getObjectByName('deepDoor'); if (deep) { deep.visible = true; deep.position.y = 1.4; } this.startWave(0); }
  resize() { this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
}

function subtractIntervals(start: number, end: number, cuts: number[][]) {
  const sorted = cuts.sort((a,b) => a[0] - b[0]); const out: number[][] = []; let cursor = start;
  for (const [a,b] of sorted) { if (a > cursor) out.push([cursor, a]); cursor = Math.max(cursor, b); }
  if (cursor < end) out.push([cursor, end]); return out;
}
function makeLabel(text: string, w: number, h: number, px: number, color: string) { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d')!; ctx.fillStyle = color; ctx.font = `bold ${px}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; text.split('\n').forEach((line, i, lines) => ctx.fillText(line, w/2, h/2 + (i - (lines.length-1)/2) * (px + 3))); return new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, opacity: .9 })); }
function label(st: StationId) { return st === 'blood' ? 'Blood Basin' : st === 'bone' ? 'Bone Forge' : 'Gold Crucible'; }
function byId(id: string) { return document.getElementById(id)!; }
function el(id: string) { return document.getElementById(id)!; }

document.getElementById('app')!.innerHTML = `
  <main id="game" aria-label="VISITORS Test Tomb mobile prototype">
    <canvas id="gameCanvas"></canvas>
    <section class="hud"><div class="statRow"><span id="hp" class="badge"></span><span id="wave" class="badge"></span></div><span id="resources" class="badge"></span><div id="prompt" class="prompt"></div></section>
    <section class="controls" aria-label="Touch controls"><div id="joystick" class="joystick"><div id="stickKnob" class="stickKnob"></div></div><div id="lookPad" class="lookPad"></div><div class="actionCluster"><button id="attackBtn" class="actionBtn attack">ATTACK</button><button id="interactBtn" class="actionBtn interact">GRAB<br/>USE</button><button id="dropBtn" class="actionBtn drop">DROP</button></div></section>
    <button id="devToggle" class="devToggle">DEV</button><section id="devPanel" class="devPanel"><button id="restartWave">Restart wave</button><button id="nextWave">Skip wave</button><button id="resetTomb">Reset tomb</button><button id="roomIds">Room IDs</button><button id="doorIds">Door IDs</button><button id="collision">Collision walls</button><button id="zones">Station zones</button><div id="coords" class="coords"></div></section>
    <div class="orientationNote">VISITORS is portrait-first. Rotate your iPhone upright to play.</div>
  </main>`;
new VisitorsGame();
