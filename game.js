(function () {
  "use strict";

  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const startButton = document.getElementById("start-button");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const dialogueBox = document.getElementById("dialogue-box");
  const speakerName = document.getElementById("speaker-name");
  const dialogueLine = document.getElementById("dialogue-line");
  const dialogueNext = document.getElementById("dialogue-next");
  const enemyPortrait = document.getElementById("enemy-portrait");
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  const droneLoops = new Map();

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const PLAYER_FIRE_INTERVAL = 1 / 3;
  const PLAYER_RADIUS = 15;
  const PLAYER_HURT_RADIUS = 8;
  const PLAYER_WAIST_OFFSET_Y = 8;
  const PLAYER_FLINCH_SECONDS = 0.5;
  const PLAYER_KNOCKBACK_DISTANCE = 132;
  const DIALOGUE_AUTO_SECONDS = 2.4;
  const MID_BOSS_DIALOGUE_AUTO_SECONDS = DIALOGUE_AUTO_SECONDS + 1;
  const CHARGE_SECONDS = 1;
  const PLAYER_SPEED = 285;
  const DASH_SPEED = PLAYER_SPEED * 3;
  const DASH_DAMAGE = 9;
  const DASH_COOLDOWN_SECONDS = 4;
  const DRONE_LOOP_BASE_VOLUME = 0.026;
  const PLAYER_SPRITE_COLUMNS = 3;
  const PLAYER_SPRITE_ROWS = 5;
  const PLAYER_SPRITE_DRAW_WIDTH = 132;
  const PLAYER_SPRITE_DRAW_HEIGHT = 99;
  const PLAYER_SPRITE_TOP_EXTENT = Math.ceil(PLAYER_SPRITE_DRAW_HEIGHT * 0.58) + 2;
  const PLAYER_SPRITE_BOTTOM_EXTENT = Math.ceil(PLAYER_SPRITE_DRAW_HEIGHT * 0.42) + 2;
  const BOSS_SPRITE_COLUMNS = 3;
  const BOSS_SPRITE_ROWS = 2;
  const BOSS_SPRITE_DRAW_SIZE = 172;
  const ENEMY_SPRITE_COLUMNS = 3;
  const ENEMY_SPRITE_ROWS = 5;
  const ENEMY_SPRITE_SOURCE_INSET = 4;
  const ENEMY_SPRITE_CONFIG = {
    twintail: { row: 0, width: 185, height: 139, radius: 25, offsetX: 0, offsetY: 0 },
    visorGlasses: { row: 1, width: 185, height: 139, radius: 25, offsetX: 0, offsetY: 0 },
    robotB: { row: 2, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 4 },
    droneA: { row: 3, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 0 },
    droneB: { row: 4, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 0 },
  };
  const HUMANOID_ENEMY_TYPES = new Set(["twintail", "visorGlasses"]);
  const HUMANOID_ENEMY_MIN_Y = Math.round(HEIGHT * 0.68);
  const HUMANOID_ENEMY_MAX_Y = Math.round(HEIGHT * 0.9);
  const PLAYER_SPRITE_ROWS_BY_STATE = {
    forward: 0,
    backward: 1,
    dash: 2,
    idle: 3,
    flinch: 4,
  };
  const PLAYER_SPRITE_FRAME_OFFSETS = {
    forward: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    backward: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    dash: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    idle: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    flinch: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };
  const BOSS_SPRITE_FRAME_OFFSETS = {
    normal: [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 41, y: 0 },
    ],
    powered: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 27, y: 0 },
    ],
  };

  const playerSprite = new Image();
  playerSprite.src = "assets/rin-sprite-sheet.png";
  const tsubameBossSprite = new Image();
  tsubameBossSprite.src = "assets/tsubame-boss-sprite-sheet.png";
  const stageOneEnemySprite = new Image();
  stageOneEnemySprite.src = "assets/stage1-enemy-sprite-sheet.png";
  const stageOneBackground = new Image();
  stageOneBackground.src = "assets/stage1-background-concept.png";
  const BACKGROUND_STOPS = {
    wave1Start: 0,
    midBoss: 0.34,
    wave2Start: 0.48,
    boss: 1,
  };
  const BACKGROUND_PARALLAX_LAYERS = [
    { top: 0, bottom: 0.58, strength: 0 },
    { top: 0.34, bottom: 0.82, strength: 0.08 },
    { top: 0.72, bottom: 1, strength: 0.16 },
  ];

  const phasePlan = {
    wave1: 15,
    wave2: 7,
    midBossTarget: 20,
    midBossRetreatDamage: 10,
    bossPhaseTarget: 15,
    bossDefeatTarget: 25,
  };

  const state = {
    mode: "title",
    phase: "wave1",
    phaseTime: 0,
    elapsed: 0,
    lastTime: 0,
    nextEnemyId: 1,
    fireCooldown: 0,
    score: 0,
    keys: new Set(),
    spawnTimer: 0,
    waveSpawnCounts: { wave1: 0, wave2: 0 },
    player: makePlayer(),
    knives: [],
    enemies: [],
    enemyBullets: [],
    particles: [],
    boss: null,
    dialogue: [],
    dialogueIndex: 0,
    dialogueTimer: 0,
    dialogueAutoSeconds: DIALOGUE_AUTO_SECONDS,
    message: "",
  };

  const dialogues = {
    midBoss: [
      { speaker: "朝比奈 つばめ", line: "ここから先はテニス部のコートよ。無断で通すわけないでしょ。" },
    ],
    boss: [
      { speaker: "朝比奈 つばめ", line: "まだ立ってるなんてね。次は本気のスマッシュで沈める。" },
      { speaker: "黒羽 凛", line: "御門院へ続く道を、あなたで止めるつもりはない。" },
    ],
  };

  function makePlayer() {
    return {
      x: 86,
      y: HEIGHT / 2,
      lives: 3,
      invincible: 0,
      flinchTime: 0,
      chargeTime: 0,
      dashCooldown: 0,
      wasCharging: false,
      chargeReadySoundPlayed: false,
      dashState: "none",
      dashOrigin: { x: 86, y: HEIGHT / 2 },
      dashHits: new Set(),
      trail: [],
      moveX: 0,
      moveY: 0,
    };
  }

  function resetGame() {
    state.mode = "playing";
    state.phase = "wave1";
    state.phaseTime = 0;
    state.elapsed = 0;
    state.lastTime = 0;
    state.nextEnemyId = 1;
    state.fireCooldown = 0;
    state.score = 0;
    state.keys.clear();
    state.spawnTimer = 0.25;
    state.waveSpawnCounts = { wave1: 0, wave2: 0 };
    state.player = makePlayer();
    state.player.invincible = 1.5;
    state.knives = [];
    state.enemies = [];
    state.enemyBullets = [];
    state.particles = [];
    state.boss = null;
    state.message = "";
  }

  function startGame() {
    ensureAudioContext();
    resetGame();
    titleScreen.hidden = true;
    gameScreen.hidden = false;
    dialogueBox.hidden = true;
    window.requestAnimationFrame(loop);
  }

  function startDialogue(kind, nextPhase) {
    state.mode = "dialogue";
    enemyPortrait.src =
      kind === "boss" ? "assets/dialogue-tsubame-boss.png" : "assets/dialogue-tsubame-midboss.png";
    enemyPortrait.alt = "朝比奈 つばめ";
    state.dialogueAutoSeconds = kind === "midBoss" ? MID_BOSS_DIALOGUE_AUTO_SECONDS : DIALOGUE_AUTO_SECONDS;
    state.dialogue = dialogues[kind].map((entry) => ({ ...entry, nextPhase }));
    state.dialogueIndex = 0;
    state.dialogueTimer = 0;
    showDialogueLine();
  }

  function showDialogueLine() {
    const entry = state.dialogue[state.dialogueIndex];
    dialogueBox.hidden = false;
    dialogueNext.hidden = true;
    speakerName.textContent = entry.speaker;
    dialogueLine.textContent = entry.line;
  }

  function advanceDialogue() {
    state.dialogueIndex += 1;
    if (state.dialogueIndex < state.dialogue.length) {
      showDialogueLine();
      return;
    }
    const nextPhase = state.dialogue[state.dialogue.length - 1].nextPhase;
    dialogueBox.hidden = true;
    state.mode = "playing";
    setPhase(nextPhase);
  }

  function updateDialogue(dt) {
    if (state.mode !== "dialogue") return;
    state.dialogueTimer += dt;
    if (state.dialogueTimer >= state.dialogueAutoSeconds) {
      state.dialogueTimer = 0;
      advanceDialogue();
    }
  }

  function setPhase(phase) {
    state.phase = phase;
    state.phaseTime = 0;
    state.knives = [];
    state.enemies = [];
    state.enemyBullets = [];
    state.spawnTimer = 0.25;
    if (phase === "wave1" || phase === "wave2") state.waveSpawnCounts[phase] = 0;
    if (phase === "midBoss") {
      state.boss = makeBoss("朝比奈 つばめ", phasePlan.midBossTarget, 0);
      state.message = "中ボス 朝比奈つばめ";
    } else if (phase === "boss") {
      state.boss = makeBoss("朝比奈 つばめ", phasePlan.bossDefeatTarget, 1);
      state.message = "ボス 朝比奈つばめ";
    } else {
      state.boss = null;
      state.message = phase === "wave2" ? "テニス部 第二陣" : "";
    }
  }

  function makeBoss(name, hp, rank) {
    return {
      name,
      x: WIDTH - 130,
      y: HEIGHT / 2,
      r: rank ? 46 : 38,
      hp,
      maxHp: hp,
      rank,
      fireTimer: 0.2,
      moveTimer: 0,
      changed: false,
      invincible: false,
      retreating: false,
      reinforcementsCalled: false,
    };
  }

  function ensureAudioContext() {
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playShotSound(kind) {
    const audio = ensureAudioContext();
    if (!audio) return;

    if (kind === "knife") {
      playNoiseHit(audio, 0.11, 0.08, "highpass", 1800, 0.13);
      playToneSweep(audio, 0.12, 340, 1260, 0.06, "triangle");
      window.setTimeout(() => playNoiseHit(audio, 0.06, 0.035, "bandpass", 3600, 0.055), 36);
    } else if (kind === "bossSmash") {
      playNoiseHit(audio, 0.16, 0.12, "bandpass", 720, 0.2);
      playToneSweep(audio, 0.14, 170, 86, 0.11, "sine");
    } else {
      playNoiseHit(audio, 0.1, 0.085, "bandpass", 1150, 0.12);
      playToneSweep(audio, 0.08, 260, 160, 0.055, "sine");
    }
  }

  function playNoiseHit(audio, duration, decay, filterType, frequency, volume) {
    const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) data[i] = Math.random() * 2 - 1;

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const now = audio.currentTime;
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.setValueAtTime(2.1, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start(now);
    source.stop(now + duration);
  }

  function playToneSweep(audio, duration, startFrequency, endFrequency, volume, type) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function playDroneTurnSound() {
    const audio = ensureAudioContext();
    if (!audio) return;
    playNoiseHit(audio, 0.18, 0.12, "highpass", 2800, 0.11);
    playToneSweep(audio, 0.14, 520, 980, 0.035, "sawtooth");
  }

  function updateDroneLoopSound() {
    const audio = ensureAudioContext();
    if (!audio) return;
    const now = audio.currentTime;
    const activeDroneIds = new Set();
    for (const enemy of state.enemies) {
      if (!isDroneEnemy(enemy)) continue;
      activeDroneIds.add(enemy.id);
      if (!droneLoops.has(enemy.id)) droneLoops.set(enemy.id, createDroneLoop(audio, enemy.id));
      const loop = droneLoops.get(enemy.id);
      const volume = droneLoopVolume(enemy);
      loop.stopping = false;
      loop.gain.gain.cancelScheduledValues(now);
      loop.gain.gain.setTargetAtTime(volume, now, 0.08);
      loop.filter.frequency.setTargetAtTime(260 + (enemy.id % 5) * 18, now, 0.12);
      loop.oscillator.frequency.setTargetAtTime(96 + (enemy.id % 4) * 7, now, 0.12);
    }
    for (const [id, loop] of droneLoops) {
      if (activeDroneIds.has(id)) continue;
      scheduleDroneLoopStop(id, loop, now);
    }
  }

  function fadeOutDroneLoopSound() {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    for (const [id, loop] of droneLoops) {
      scheduleDroneLoopStop(id, loop, now);
    }
  }

  function scheduleDroneLoopStop(id, loop, now) {
    if (loop.stopping) return;
    loop.stopping = true;
    fadeDroneLoop(loop, now, 0.12);
    window.setTimeout(() => stopDroneLoop(id), 450);
  }

  function fadeDroneLoop(loop, now, timeConstant) {
    loop.gain.gain.cancelScheduledValues(now);
    loop.gain.gain.setTargetAtTime(0.0001, now, timeConstant);
  }

  function droneLoopVolume(enemy) {
    const distanceToRin = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distanceToRin >= WIDTH / 2) return DRONE_LOOP_BASE_VOLUME * 0.3;
    const closeness = 1 - distanceToRin / (WIDTH / 2);
    return DRONE_LOOP_BASE_VOLUME * (0.3 + closeness * 0.7);
  }

  function stopDroneLoop(id) {
    const loop = droneLoops.get(id);
    if (!loop) return;
    const now = audioContext ? audioContext.currentTime : 0;
    try {
      loop.noise.stop(now);
      loop.oscillator.stop(now);
    } catch (error) {
      // The node may already have been stopped by a previous cleanup tick.
    }
    droneLoops.delete(id);
  }

  function createDroneLoop(audio, seed) {
    const sampleCount = Math.floor(audio.sampleRate * 1.2);
    const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) data[i] = Math.random() * 2 - 1;

    const noise = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const oscillator = audio.createOscillator();
    const oscillatorGain = audio.createGain();
    const now = audio.currentTime;
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260 + (seed % 5) * 18, now);
    filter.Q.setValueAtTime(1.4, now);
    gain.gain.setValueAtTime(0.0001, now);
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(96 + (seed % 4) * 7, now);
    oscillatorGain.gain.setValueAtTime(0.014, now);
    noise.connect(filter);
    filter.connect(gain);
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(gain);
    gain.connect(audio.destination);
    noise.start(now);
    oscillator.start(now);
    return { noise, oscillator, filter, gain, stopping: false };
  }

  function playChargeCompleteSound() {
    const audio = ensureAudioContext();
    if (!audio) return;
    playNoiseHit(audio, 0.34, 0.28, "bandpass", 900, 0.055);
    playToneSweep(audio, 0.38, 220, 980, 0.07, "sawtooth");
    window.setTimeout(() => playToneSweep(audio, 0.2, 620, 1480, 0.045, "triangle"), 130);
    window.setTimeout(() => playNoiseHit(audio, 0.16, 0.08, "highpass", 2600, 0.04), 260);
  }

  function playDashLaunchSound() {
    playVoiceLine("ハッ", "cool");
    window.setTimeout(() => {
      const audio = ensureAudioContext();
      if (!audio) return;
      playNoiseHit(audio, 0.18, 0.13, "lowpass", 260, 0.22);
      playToneSweep(audio, 0.16, 95, 48, 0.16, "sine");
    }, 75);
  }

  function playVoiceLine(text, voiceStyle) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice =
      voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ja")) || voices[0];
    if (japaneseVoice) utterance.voice = japaneseVoice;
    utterance.lang = "ja-JP";
    utterance.volume = voiceStyle === "cool" ? 0.62 : 0.82;
    utterance.rate = voiceStyle === "cool" ? 1.12 : 1.08;
    utterance.pitch = voiceStyle === "cool" ? 0.82 : 1.18;
    window.speechSynthesis.speak(utterance);
  }

  function shootKnife() {
    playShotSound("knife");
    state.knives.push({
      x: state.player.x + 34,
      y: state.player.y - 22,
      vx: 640,
      r: 6,
    });
  }

  function spawnEnemy() {
    state.waveSpawnCounts[state.phase] += 1;
    const spawnIndex = state.waveSpawnCounts[state.phase];
    const enemyType = selectRegularEnemyType(state.phase, spawnIndex);
    const y = randomEnemyY(enemyType);
    const enemyConfig = ENEMY_SPRITE_CONFIG[enemyType];
    state.enemies.push({
      id: state.nextEnemyId,
      x: WIDTH + 28,
      y,
      vx: -115 - Math.random() * 55,
      r: enemyConfig.radius,
      fireTimer: 0.45 + Math.random() * 0.8,
      type: enemyType,
      wave: state.phase,
      spawnIndex,
      usedSpecial: false,
    });
    state.nextEnemyId += 1;
  }

  function spawnReinforcementEnemy(type, y) {
    const enemyConfig = ENEMY_SPRITE_CONFIG[type];
    state.enemies.push({
      id: state.nextEnemyId,
      x: WIDTH + 28,
      y: clampEnemyY(type, y),
      vx: -125,
      r: enemyConfig.radius,
      fireTimer: 0.75,
      type,
      wave: "midBossReinforcement",
      spawnIndex: 1,
      usedSpecial: false,
    });
    state.nextEnemyId += 1;
  }

  function randomEnemyY(type) {
    if (isHumanoidEnemyType(type)) {
      return HUMANOID_ENEMY_MIN_Y + Math.random() * (HUMANOID_ENEMY_MAX_Y - HUMANOID_ENEMY_MIN_Y);
    }
    return 76 + Math.random() * (HEIGHT - 152);
  }

  function clampEnemyY(type, y) {
    if (!isHumanoidEnemyType(type)) return y;
    return clamp(y, HUMANOID_ENEMY_MIN_Y, HUMANOID_ENEMY_MAX_Y);
  }

  function isHumanoidEnemyType(type) {
    return HUMANOID_ENEMY_TYPES.has(type);
  }

  function selectRegularEnemyType(wave, spawnIndex) {
    if (wave === "wave2") return "droneB";
    return "droneA";
  }

  function enemyShoot(enemy, speed, soundKind = "enemyReturn") {
    playShotSound(soundKind);
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    state.enemyBullets.push({
      x: enemy.x - 16,
      y: enemy.y,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      r: 8,
    });
  }

  function tennisBallAtAngle(enemy, speed, degrees) {
    const radians = (degrees * Math.PI) / 180;
    state.enemyBullets.push({
      x: enemy.x - 16,
      y: enemy.y,
      vx: -Math.cos(radians) * speed,
      vy: Math.sin(radians) * speed,
      r: 8,
    });
  }

  function shootStraightTwoWay(enemy, speed) {
    playShotSound("enemyReturn");
    tennisBallAtAngle(enemy, speed, 30);
    tennisBallAtAngle(enemy, speed, 330);
  }

  function shootEightWay(enemy, speed) {
    playShotSound("enemyReturn");
    for (const degrees of [0, 45, 90, 135, 180, 225, 270, 315]) {
      tennisBallAtAngle(enemy, speed, degrees);
    }
  }

  function regularEnemyShoot(enemy) {
    if (enemy.spawnIndex <= 3) {
      enemyShoot(enemy, 230);
      return;
    }
    const canUseSpecial = !enemy.usedSpecial && enemy.x >= WIDTH / 2;
    const useSpecial = Math.random() < 0.25;
    if (!canUseSpecial || !useSpecial) {
      enemyShoot(enemy, 230);
    } else if (enemy.wave === "wave2") {
      shootEightWay(enemy, 175);
      enemy.usedSpecial = true;
      reverseEnemyDirection(enemy);
    } else {
      shootStraightTwoWay(enemy, 230);
      enemy.usedSpecial = true;
      reverseEnemyDirection(enemy);
    }
  }

  function reverseEnemyDirection(enemy) {
    if (enemy.vx < 0 && isDroneEnemy(enemy)) playDroneTurnSound();
    enemy.vx = Math.abs(enemy.vx);
  }

  function isDroneEnemy(enemy) {
    return enemy.type === "droneA" || enemy.type === "droneB";
  }

  function bossShoot(dt) {
    const boss = state.boss;
    boss.fireTimer -= dt;
    boss.moveTimer += dt;
    boss.y = HEIGHT / 2 + Math.sin(boss.moveTimer * 1.9) * 120;
    if (boss.fireTimer > 0) return;

    if (boss.rank === 0) {
      boss.fireTimer = 0.62;
      enemyShoot(boss, 245, "bossSmash");
      return;
    }

    boss.changed = boss.hp <= phasePlan.bossPhaseTarget;
    boss.fireTimer = boss.changed ? 0.32 : 0.52;
    playShotSound("bossSmash");
    const angles = boss.changed ? [-0.34, -0.17, 0, 0.17, 0.34] : [-0.18, 0, 0.18];
    for (const angle of angles) {
      const base = Math.PI + angle;
      state.enemyBullets.push({
        x: boss.x - 28,
        y: boss.y,
        vx: Math.cos(base) * (boss.changed ? 275 : 240),
        vy: Math.sin(base) * (boss.changed ? 275 : 240),
        r: 8,
      });
    }
  }

  function update(dt) {
    if (state.mode === "dialogue") {
      updateDialogue(dt);
      fadeOutDroneLoopSound();
      return;
    }
    if (state.mode !== "playing") {
      fadeOutDroneLoopSound();
      return;
    }
    state.elapsed += dt;
    state.phaseTime += dt;
    state.fireCooldown -= dt;
    state.player.invincible = Math.max(0, state.player.invincible - dt);
    state.player.flinchTime = Math.max(0, state.player.flinchTime - dt);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);

    updatePlayer(dt);
    updatePhase(dt);
    updateKnives(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateParticles(dt);
    checkCollisions();
    updateDroneLoopSound();
  }

  function updatePlayer(dt) {
    if (state.player.dashState !== "none") {
      updateDash(dt);
      return;
    }

    const speed = PLAYER_SPEED;
    let dx = 0;
    let dy = 0;
    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) dx -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) dx += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) dy -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    state.player.moveX = dx;
    state.player.moveY = dy;
    state.player.x = clamp(state.player.x + (dx / len) * speed * dt, 34, WIDTH * 0.48);
    state.player.y = clamp(
      state.player.y + (dy / len) * speed * dt,
      PLAYER_SPRITE_TOP_EXTENT,
      HEIGHT - PLAYER_SPRITE_BOTTOM_EXTENT
    );

    updateCharge(dt);

    if (state.keys.has("KeyZ") && state.fireCooldown <= 0) {
      shootKnife();
      state.fireCooldown = PLAYER_FIRE_INTERVAL;
    }
  }

  function updateCharge(dt) {
    const charging = state.keys.has("Space");
    if (state.player.dashCooldown > 0) {
      state.player.wasCharging = charging;
      state.player.chargeTime = 0;
      state.player.chargeReadySoundPlayed = false;
      return;
    }
    if (charging) {
      state.player.chargeTime += dt;
      if (state.player.chargeTime >= CHARGE_SECONDS && !state.player.chargeReadySoundPlayed) {
        playChargeCompleteSound();
        state.player.chargeReadySoundPlayed = true;
      }
      state.player.wasCharging = true;
      return;
    }
    state.player.wasCharging = false;
    state.player.chargeTime = 0;
    state.player.chargeReadySoundPlayed = false;
  }

  function releaseCharge() {
    if (!state.player.wasCharging || state.player.dashState !== "none" || state.mode !== "playing") return;
    if (state.player.chargeTime >= CHARGE_SECONDS && state.player.dashCooldown <= 0) {
      startDash();
    } else if (state.player.chargeTime < CHARGE_SECONDS && state.fireCooldown <= 0) {
      shootKnife();
      state.fireCooldown = PLAYER_FIRE_INTERVAL;
    }
    state.player.wasCharging = false;
    state.player.chargeTime = 0;
    state.player.chargeReadySoundPlayed = false;
  }

  function startDash() {
    playDashLaunchSound();
    state.player.dashState = "dash";
    state.player.dashOrigin = { x: state.player.x, y: state.player.y };
    state.player.dashHits = new Set();
    state.player.trail = [];
    state.player.invincible = 999;
    state.player.dashCooldown = 0;
    state.knives = [];
  }

  function updateDash(dt) {
    const player = state.player;
    player.invincible = 999;
    player.trail.push({ x: player.x, y: player.y, life: 0.22 });
    if (player.trail.length > 20) player.trail.shift();

    if (player.dashState === "dash") {
      player.x += DASH_SPEED * dt;
      if (player.x >= WIDTH - PLAYER_RADIUS) {
        player.x = WIDTH - PLAYER_RADIUS;
        player.dashState = "return";
      }
    } else if (player.dashState === "return") {
      const dx = player.dashOrigin.x - player.x;
      const dy = player.dashOrigin.y - player.y;
      const len = Math.hypot(dx, dy);
      if (len <= PLAYER_SPEED * dt) {
        player.x = player.dashOrigin.x;
        player.y = player.dashOrigin.y;
        player.dashState = "none";
        player.dashCooldown = DASH_COOLDOWN_SECONDS;
        player.invincible = 0.35;
        player.trail = [];
        return;
      }
      player.x += (dx / len) * PLAYER_SPEED * dt;
      player.y += (dy / len) * PLAYER_SPEED * dt;
    }

    for (const trail of player.trail) trail.life -= dt;
    player.trail = player.trail.filter((trail) => trail.life > 0);
  }

  function updatePhase(dt) {
    if (state.phase === "wave1") {
      if (state.phaseTime < phasePlan.wave1) spawnWaveEnemies(dt, 1.35);
      if (state.phaseTime >= phasePlan.wave1 && isStageClearForBoss()) startDialogue("midBoss", "midBoss");
    } else if (state.phase === "wave2") {
      if (state.phaseTime < phasePlan.wave2) spawnWaveEnemies(dt, 1.05);
      if (state.phaseTime >= phasePlan.wave2 && isStageClearForBoss()) startDialogue("boss", "boss");
    } else if (state.phase === "midBoss") {
      if (state.boss && state.boss.retreating) {
        updateMidBossRetreat(dt);
        if (state.boss.x > WIDTH + 120 && state.enemies.length === 0) setPhase("wave2");
        return;
      }
      bossShoot(dt);
    } else if (state.phase === "boss") {
      bossShoot(dt);
    }
  }

  function isStageClearForBoss() {
    return state.enemies.length === 0 && state.enemyBullets.length === 0;
  }

  function spawnWaveEnemies(dt, interval) {
    state.spawnTimer -= dt;
    if (state.spawnTimer > 0) return;
    spawnEnemy();
    state.spawnTimer = interval;
  }

  function updateMidBossRetreat(dt) {
    if (!state.boss) return;
    state.boss.x += 230 * dt;
    state.boss.y += (HEIGHT * 0.5 - state.boss.y) * Math.min(1, dt * 3);
  }

  function updateKnives(dt) {
    for (const knife of state.knives) knife.x += knife.vx * dt;
    state.knives = state.knives.filter((knife) => knife.x < WIDTH + 32);
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      enemy.x += enemy.vx * dt;
      enemy.y = clampEnemyY(enemy.type, enemy.y);
      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = 1.55 + Math.random() * 0.9;
        regularEnemyShoot(enemy);
      }
    }
    state.enemies = state.enemies.filter((enemy) => enemy.x > -40 && enemy.x < WIDTH + 50);
  }

  function updateEnemyBullets(dt) {
    for (const ball of state.enemyBullets) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
    }
    state.enemyBullets = state.enemyBullets.filter((ball) => (
      ball.x > -40 && ball.x < WIDTH + 40 && ball.y > -40 && ball.y < HEIGHT + 40
    ));
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function checkCollisions() {
    checkDashCollisions();

    for (const knife of state.knives) {
      for (const enemy of state.enemies) {
        if (distance(knife, enemy) < knife.r + enemy.r) {
          knife.dead = true;
          enemy.dead = true;
          state.score += 100;
          burst(enemy.x, enemy.y, "#f8d84a");
        }
      }
      if (state.boss && distance(knife, state.boss) < knife.r + state.boss.r) {
        knife.dead = true;
        damageBoss(1, knife.x, knife.y);
      }
    }

    state.knives = state.knives.filter((knife) => !knife.dead);
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);

    if (state.player.invincible <= 0) {
      const hurtPoint = playerHurtPoint();
      for (const ball of state.enemyBullets) {
        if (distance(ball, hurtPoint) < ball.r + PLAYER_HURT_RADIUS) {
          ball.dead = true;
          damagePlayer();
          break;
        }
      }
      for (const enemy of state.enemies) {
        if (distance(enemy, hurtPoint) < enemy.r + PLAYER_HURT_RADIUS) {
          enemy.dead = true;
          damagePlayer();
          break;
        }
      }
    }
    state.enemyBullets = state.enemyBullets.filter((ball) => !ball.dead);
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  }

  function playerHurtPoint() {
    return { x: state.player.x, y: state.player.y + PLAYER_WAIST_OFFSET_Y };
  }

  function checkDashCollisions() {
    if (state.player.dashState !== "dash") return;
    for (const enemy of state.enemies) {
      if (state.player.dashHits.has(`enemy-${enemy.id}`)) continue;
      if (distance(state.player, enemy) < PLAYER_RADIUS + enemy.r) {
        state.player.dashHits.add(`enemy-${enemy.id}`);
        enemy.dead = true;
        state.score += 100;
        burst(enemy.x, enemy.y, "#7ee8ff", 16);
      }
    }
    if (state.boss && !state.player.dashHits.has("boss") && distance(state.player, state.boss) < PLAYER_RADIUS + state.boss.r) {
      state.player.dashHits.add("boss");
      damageBoss(DASH_DAMAGE, state.boss.x, state.boss.y, "#7ee8ff", 24);
    }
  }

  function damageBoss(amount, x, y, color = "#ffffff", count = 5) {
    if (!state.boss || state.boss.invincible) return;
    state.boss.hp -= amount;
    burst(x, y, color, count);
    if (state.phase === "midBoss" && state.boss.hp <= phasePlan.midBossTarget - phasePlan.midBossRetreatDamage) {
      triggerMidBossReinforcements();
      return;
    }
    if (state.boss.hp <= 0) {
      defeatBoss();
    } else if (state.boss.rank === 1 && state.boss.hp <= phasePlan.bossPhaseTarget && !state.boss.changed) {
      triggerBossAttackChange();
    }
  }

  function triggerMidBossReinforcements() {
    if (!state.boss || state.boss.reinforcementsCalled) return;
    state.boss.reinforcementsCalled = true;
    state.boss.invincible = true;
    state.boss.retreating = true;
    state.boss.fireTimer = 999;
    state.enemyBullets = [];
    state.message = "朝比奈 撤退";
    spawnReinforcementEnemy("twintail", HEIGHT * 0.72);
    spawnReinforcementEnemy("visorGlasses", HEIGHT * 0.84);
  }

  function triggerBossAttackChange() {
    state.boss.changed = true;
    state.message = "つばめの攻撃が激しくなった！";
    playVoiceLine("通さない！", "bright");
  }

  function defeatBoss() {
    burst(state.boss.x, state.boss.y, "#7ee8ff", 34);
    if (state.phase === "midBoss") {
      playVoiceLine("本気なの！？", "bright");
      setPhase("wave2");
      return;
    }
    playVoiceLine("うわーっ", "bright");
    state.mode = "clear";
    state.message = "1面クリア";
  }

  function damagePlayer() {
    const hitX = state.player.x;
    const hitY = state.player.y;
    playVoiceLine("くぅっ", "cool");
    state.player.lives -= 1;
    state.player.invincible = 1.4;
    state.player.flinchTime = PLAYER_FLINCH_SECONDS;
    state.player.x = clamp(state.player.x - PLAYER_KNOCKBACK_DISTANCE, 34, WIDTH * 0.48);
    burst(hitX, hitY, "#ff5278", 18);
    if (state.player.lives <= 0) {
      state.mode = "gameOver";
      state.message = "ゲームオーバー";
    }
  }

  function burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.35,
        color,
      });
    }
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    drawBackground();
    drawHud();
    drawDashTrail();
    drawPlayer();
    drawKnives();
    drawEnemies();
    drawBoss();
    drawEnemyBullets();
    drawParticles();
    drawOverlayMessage();
  }

  function pixelRect(x, y, width, height) {
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  function drawDashTrail() {
    for (const trail of state.player.trail) {
      ctx.globalAlpha = Math.max(0, trail.life * 3.8);
      ctx.fillStyle = "#7ee8ff";
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawBackground() {
    if (drawStageOneBackground()) return;
    drawFallbackBackground();
  }

  function drawStageOneBackground() {
    if (!stageOneBackground.complete || stageOneBackground.naturalWidth === 0) return false;
    const sourceHeight = stageOneBackground.naturalHeight;
    const sourceWidth = Math.min(stageOneBackground.naturalWidth, sourceHeight * (WIDTH / HEIGHT));
    const stop = getStageOneBackgroundStop();
    for (const layer of BACKGROUND_PARALLAX_LAYERS) {
      drawStageOneBackgroundLayer(sourceWidth, stop, layer);
    }
    return true;
  }

  function drawStageOneBackgroundLayer(sourceWidth, stop, layer) {
    const sourceHeight = stageOneBackground.naturalHeight;
    const sourceTop = Math.round(sourceHeight * layer.top);
    const sourceBottom = Math.round(sourceHeight * layer.bottom);
    const sourceLayerHeight = Math.max(1, sourceBottom - sourceTop);
    const destTop = Math.round(HEIGHT * layer.top);
    const destBottom = Math.round(HEIGHT * layer.bottom);
    const destLayerHeight = Math.max(1, destBottom - destTop);
    const sourceX = getStageOneBackgroundSourceX(sourceWidth, stop, layer.strength);
    ctx.drawImage(
      stageOneBackground,
      sourceX,
      sourceTop,
      sourceWidth,
      sourceLayerHeight,
      0,
      destTop,
      WIDTH,
      destLayerHeight
    );
  }

  function getStageOneBackgroundStop() {
    let stop = BACKGROUND_STOPS.wave1Start;
    if (state.phase === "wave1") {
      const progress = clamp(state.phaseTime / phasePlan.wave1, 0, 1);
      stop = lerp(BACKGROUND_STOPS.wave1Start, BACKGROUND_STOPS.midBoss, easeInOut(progress));
    } else if (state.phase === "midBoss") {
      stop = BACKGROUND_STOPS.midBoss;
    } else if (state.phase === "wave2") {
      const progress = clamp(state.phaseTime / phasePlan.wave2, 0, 1);
      stop = lerp(BACKGROUND_STOPS.wave2Start, BACKGROUND_STOPS.boss, easeInOut(progress));
    } else if (state.phase === "boss") {
      stop = BACKGROUND_STOPS.boss;
    }
    return stop;
  }

  function getStageOneBackgroundSourceX(sourceWidth, stop, parallaxStrength) {
    const maxSourceX = Math.max(0, stageOneBackground.naturalWidth - sourceWidth);
    const parallaxStop = clamp(stop + (stop - 0.5) * parallaxStrength, 0, 1);
    return Math.round(maxSourceX * parallaxStop);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t);
  }

  function drawFallbackBackground() {
    ctx.fillStyle = "#f09952";
    pixelRect(0, 0, WIDTH, 86);
    ctx.fillStyle = "#a75d52";
    pixelRect(0, 86, WIDTH, 68);
    ctx.fillStyle = "#27314d";
    pixelRect(0, 154, WIDTH, 112);
    ctx.fillStyle = "#101522";
    pixelRect(0, 266, WIDTH, HEIGHT - 266);

    ctx.fillStyle = "#20273a";
    pixelRect(0, 92, WIDTH, 130);
    ctx.fillStyle = "#151b2b";
    pixelRect(0, 204, WIDTH, 18);
    for (let x = 30; x < WIDTH; x += 84) {
      ctx.fillStyle = "#ffcd78";
      pixelRect(x, 112, 42, 58);
      ctx.fillStyle = "#6f6f6f";
      pixelRect(x + 18, 112, 4, 58);
      pixelRect(x, 138, 42, 4);
    }

    ctx.fillStyle = "#0f1e27";
    for (let x = -20; x < WIDTH; x += 80) {
      for (let y = HEIGHT - 112; y < HEIGHT; y += 16) {
        pixelRect(x + y * 0.42 - HEIGHT * 0.42, y, 36, 3);
      }
    }

    ctx.fillStyle = "#246740";
    pixelRect(0, HEIGHT - 116, WIDTH, 116);
    ctx.fillStyle = "#2e8050";
    for (let x = 0; x < WIDTH; x += 32) {
      for (let y = HEIGHT - 116; y < HEIGHT; y += 32) {
        if ((x + y) % 64 === 0) pixelRect(x, y, 32, 32);
      }
    }
    ctx.fillStyle = "#d7e7d4";
    pixelRect(120, HEIGHT - 96, WIDTH - 240, 4);
    pixelRect(120, HEIGHT - 30, WIDTH - 240, 4);
    pixelRect(120, HEIGHT - 96, 4, 70);
    pixelRect(WIDTH - 124, HEIGHT - 96, 4, 70);
    pixelRect(WIDTH / 2 - 2, HEIGHT - 96, 4, 70);
  }

  function drawHud() {
    ctx.fillStyle = "rgba(5, 7, 18, 0.62)";
    ctx.fillRect(0, 0, WIDTH, 48);
    ctx.fillStyle = "#f5f7ff";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(`1面 テニスコート  残機 ${state.player.lives}  得点 ${state.score}`, 18, 30);
    ctx.font = "700 14px sans-serif";
    ctx.fillText("移動: 矢印/WASD  小刀: Z  溜め突進: Space長押し", 18, HEIGHT - 18);
    ctx.textAlign = "right";
    ctx.fillText(phaseLabel(), WIDTH - 18, 30);
    ctx.textAlign = "left";
    if (state.boss) {
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(WIDTH - 340, 54, 300, 12);
      ctx.fillStyle = state.boss.changed ? "#ff5278" : "#f8d84a";
      ctx.fillRect(WIDTH - 340, 54, 300 * (state.boss.hp / state.boss.maxHp), 12);
    }
  }

  function phaseLabel() {
    if (state.phase === "wave1") return "雑魚戦 1";
    if (state.phase === "midBoss") return "中ボス";
    if (state.phase === "wave2") return "雑魚戦 2";
    if (state.phase === "boss") return state.boss && state.boss.changed ? "ボス 強化" : "ボス";
    return "";
  }

  function drawPlayer() {
    const dashActive = state.player.dashState !== "none";
    const flickerRate = dashActive ? 4 : 14;
    const flicker =
      state.player.flinchTime <= 0 && state.player.invincible > 0 && Math.floor(state.elapsed * flickerRate) % 2 === 0;
    if (flicker) return;
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    if (state.player.chargeTime >= CHARGE_SECONDS && !dashActive) {
      const pulse = 20 + Math.sin(state.elapsed * 12) * 5;
      ctx.strokeStyle = "rgba(126, 232, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, PLAYER_WAIST_OFFSET_Y, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(248, 216, 74, 0.78)";
      ctx.beginPath();
      ctx.arc(0, PLAYER_WAIST_OFFSET_Y, pulse + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawPlayerSprite(dashActive);
    ctx.restore();
    drawDashCooldownGauge();
  }

  function drawPlayerSprite(dashActive) {
    if (!playerSprite.complete || playerSprite.naturalWidth === 0) {
      ctx.fillStyle = "#11131f";
      pixelRect(-16, -28, 32, 58);
      ctx.fillStyle = "#ff5278";
      pixelRect(10, -4, 22, 8);
      return;
    }

    const frame = Math.floor(state.elapsed * 8) % PLAYER_SPRITE_COLUMNS;
    const spriteState = getPlayerSpriteState(dashActive);
    const row = PLAYER_SPRITE_ROWS_BY_STATE[spriteState];
    const offset = PLAYER_SPRITE_FRAME_OFFSETS[spriteState][frame];
    const sourceWidth = playerSprite.naturalWidth / PLAYER_SPRITE_COLUMNS;
    const sourceHeight = playerSprite.naturalHeight / PLAYER_SPRITE_ROWS;
    ctx.drawImage(
      playerSprite,
      frame * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      -PLAYER_SPRITE_DRAW_WIDTH * 0.42 + offset.x,
      -PLAYER_SPRITE_DRAW_HEIGHT * 0.58 + offset.y,
      PLAYER_SPRITE_DRAW_WIDTH,
      PLAYER_SPRITE_DRAW_HEIGHT
    );
  }

  function getPlayerSpriteState(dashActive) {
    if (state.player.flinchTime > 0) return "flinch";
    if (state.player.dashState === "dash") return "dash";
    if (state.player.dashState === "return") return "backward";
    if (state.player.moveX > 0) return "forward";
    if (state.player.moveX < 0) return "backward";
    if (state.player.moveY !== 0) return "forward";
    if (dashActive) return "dash";
    return "idle";
  }

  function drawDashCooldownGauge() {
    if (state.player.dashCooldown <= 0 || state.player.dashState !== "none") return;
    const x = state.player.x - 22;
    const y = state.player.y - 56;
    const ratio = state.player.dashCooldown / DASH_COOLDOWN_SECONDS;
    ctx.fillStyle = "#050712";
    pixelRect(x, y, 44, 6);
    ctx.fillStyle = "#7ee8ff";
    pixelRect(x, y, 44 * ratio, 6);
    ctx.fillStyle = "#ffffff";
    pixelRect(x, y - 1, 44, 1);
  }

  function drawKnives() {
    for (const knife of state.knives) {
      ctx.fillStyle = "#eef5ff";
      pixelRect(knife.x - 8, knife.y - 3, 22, 6);
      ctx.fillStyle = "#a9c5df";
      pixelRect(knife.x + 10, knife.y - 1, 6, 2);
      ctx.fillStyle = "#343847";
      pixelRect(knife.x - 14, knife.y - 2, 8, 4);
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      if (drawStageOneEnemySprite(enemy)) {
        ctx.restore();
        continue;
      }
      ctx.restore();
      ctx.fillStyle = "#f3f7ff";
      pixelRect(enemy.x - 12, enemy.y - 18, 24, 16);
      pixelRect(enemy.x - 16, enemy.y - 2, 32, 24);
      ctx.fillStyle = "#6cd68a";
      pixelRect(enemy.x + 10, enemy.y - 16, 6, 36);
      pixelRect(enemy.x + 16, enemy.y + 12, 18, 6);
      pixelRect(enemy.x + 28, enemy.y + 4, 6, 18);
      ctx.fillStyle = "#2b8f53";
      pixelRect(enemy.x + 20, enemy.y + 10, 10, 3);
      pixelRect(enemy.x + 24, enemy.y + 6, 3, 12);
      ctx.fillStyle = "#f8d84a";
      pixelRect(enemy.x - 8, enemy.y - 14, 8, 8);
      ctx.fillStyle = "#1b2330";
      pixelRect(enemy.x - 10, enemy.y + 22, 8, 12);
      pixelRect(enemy.x + 6, enemy.y + 22, 8, 12);
    }
  }

  function drawStageOneEnemySprite(enemy) {
    if (!stageOneEnemySprite.complete || stageOneEnemySprite.naturalWidth === 0) return false;

    const config = ENEMY_SPRITE_CONFIG[enemy.type] || ENEMY_SPRITE_CONFIG.robotB;
    const frame = Math.floor(state.elapsed * 8) % ENEMY_SPRITE_COLUMNS;
    const sourceWidth = stageOneEnemySprite.naturalWidth / ENEMY_SPRITE_COLUMNS;
    const sourceHeight = stageOneEnemySprite.naturalHeight / ENEMY_SPRITE_ROWS;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      stageOneEnemySprite,
      frame * sourceWidth + ENEMY_SPRITE_SOURCE_INSET,
      config.row * sourceHeight + ENEMY_SPRITE_SOURCE_INSET,
      sourceWidth - ENEMY_SPRITE_SOURCE_INSET * 2,
      sourceHeight - ENEMY_SPRITE_SOURCE_INSET * 2,
      -config.width * 0.5 + config.offsetX,
      -config.height * 0.58 + config.offsetY,
      config.width,
      config.height
    );
    ctx.restore();
    return true;
  }

  function drawBoss() {
    const boss = state.boss;
    if (!boss) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    if (drawTsubameBossSprite(boss)) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = boss.rank ? "#ffffff" : "#f3f7ff";
    pixelRect(boss.rank ? -20 : -16, -44, boss.rank ? 40 : 32, boss.rank ? 32 : 28);
    ctx.fillStyle = "#f8d84a";
    pixelRect(-28, -52, 18, 18);
    pixelRect(10, -52, 18, 18);
    ctx.fillStyle = boss.rank ? "#ffffff" : "#f3f7ff";
    pixelRect(-28, -14, 56, 62);
    ctx.fillStyle = boss.changed ? "#ff5278" : "#6cd68a";
    pixelRect(-34, -4, 68, 14);
    pixelRect(-28, 10, 56, 38);
    ctx.fillStyle = "#f8d84a";
    pixelRect(-58, -4, 10, 68);
    pixelRect(-72, 50, 34, 10);
    ctx.fillStyle = "#2b8f53";
    pixelRect(-62, 12, 16, 6);
    pixelRect(-66, 28, 22, 6);
    ctx.fillStyle = "#1b2330";
    pixelRect(-22, 48, 14, 22);
    pixelRect(8, 48, 14, 22);
    ctx.restore();
  }

  function drawTsubameBossSprite(boss) {
    if (!tsubameBossSprite.complete || tsubameBossSprite.naturalWidth === 0) return false;

    const frame = Math.floor(state.elapsed * 7) % BOSS_SPRITE_COLUMNS;
    const stateName = boss.changed ? "powered" : "normal";
    const row = boss.changed ? 1 : 0;
    const offset = BOSS_SPRITE_FRAME_OFFSETS[stateName][frame];
    const sourceWidth = tsubameBossSprite.naturalWidth / BOSS_SPRITE_COLUMNS;
    const sourceHeight = tsubameBossSprite.naturalHeight / BOSS_SPRITE_ROWS;
    ctx.drawImage(
      tsubameBossSprite,
      frame * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      -BOSS_SPRITE_DRAW_SIZE * 0.55 + offset.x,
      -BOSS_SPRITE_DRAW_SIZE * 0.56 + offset.y,
      BOSS_SPRITE_DRAW_SIZE,
      BOSS_SPRITE_DRAW_SIZE
    );
    return true;
  }

  function drawEnemyBullets() {
    for (const ball of state.enemyBullets) {
      const spin = state.elapsed * 10 + ball.x * 0.04 + ball.y * 0.02;
      ctx.fillStyle = "#d8fb4b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.76)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        ball.x + Math.cos(spin) * 1.5,
        ball.y,
        Math.max(2, ball.r * (0.35 + Math.abs(Math.cos(spin)) * 0.38)),
        ball.r - 2,
        Math.sin(spin) * 0.6,
        -Math.PI * 0.62,
        Math.PI * 0.62
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        ball.x - Math.cos(spin) * 1.5,
        ball.y,
        Math.max(2, ball.r * (0.35 + Math.abs(Math.sin(spin)) * 0.38)),
        ball.r - 2,
        -Math.sin(spin) * 0.6,
        Math.PI * 0.38,
        Math.PI * 1.62
      );
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(ball.x - ball.r * 0.3, ball.y - ball.r * 0.32, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life * 2.5);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 4, 4);
      ctx.globalAlpha = 1;
    }
  }

  function drawOverlayMessage() {
    if (state.message) {
      ctx.fillStyle = "rgba(5, 7, 18, 0.58)";
      ctx.fillRect(WIDTH / 2 - 190, 76, 380, 42);
      ctx.fillStyle = "#f5f7ff";
      ctx.font = "800 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(state.message, WIDTH / 2, 104);
      ctx.textAlign = "left";
    }
    if (state.mode === "clear" || state.mode === "gameOver") {
      ctx.fillStyle = "rgba(5, 7, 18, 0.78)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = state.mode === "clear" ? "#7ee8ff" : "#ff5278";
      ctx.font = "900 52px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(state.mode === "clear" ? "1面クリア" : "ゲームオーバー", WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = "#f5f7ff";
      ctx.font = "700 20px sans-serif";
      ctx.fillText("Enterでタイトルへ戻る", WIDTH / 2, HEIGHT / 2 + 42);
      ctx.textAlign = "left";
    }
  }

  function loop(time) {
    const seconds = time / 1000;
    const dt = state.lastTime ? Math.min(0.033, seconds - state.lastTime) : 0;
    state.lastTime = seconds;
    update(dt);
    draw();
    if (state.mode !== "title") window.requestAnimationFrame(loop);
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  startButton.addEventListener("click", startGame);
  dialogueNext.addEventListener("click", advanceDialogue);

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if ((state.mode === "clear" || state.mode === "gameOver") && event.code === "Enter") {
      state.mode = "title";
      gameScreen.hidden = true;
      titleScreen.hidden = false;
      return;
    }
    state.keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") releaseCharge();
    state.keys.delete(event.code);
  });
})();
