(function () {
  "use strict";

  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const startButton = document.getElementById("start-button");
  /* DEV_DEBUG_ONLY_START */
  const debugStartPanel = document.getElementById("debug-start-panel");
  const debugStageSelect = document.getElementById("debug-stage-select");
  const debugPhaseSelect = document.getElementById("debug-phase-select");
  const debugStartButton = document.getElementById("debug-start-button");
  /* DEV_DEBUG_ONLY_END */
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const dialogueBox = document.getElementById("dialogue-box");
  const speakerName = document.getElementById("speaker-name");
  const dialogueLine = document.getElementById("dialogue-line");
  const dialogueNext = document.getElementById("dialogue-next");
  const enemyPortrait = document.getElementById("enemy-portrait");
  const mobileControls = document.getElementById("mobile-controls");
  const movePad = document.getElementById("move-pad");
  const moveThumb = document.getElementById("move-thumb");
  const attackButton = document.getElementById("attack-button");
  const touchControlsEnabled =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;
  const portraitOrientation = window.matchMedia("(orientation: portrait)");
  const touchInput = {
    movePointerId: null,
    moveX: 0,
    moveY: 0,
    attackPointerId: null,
  };

  if (touchControlsEnabled) gameScreen.classList.add("touch-controls-enabled");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const CONFIG = window.YOKOSHOOT_CONFIG;
  const bulletPatternsPromise = fetch("bullet-patterns.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load bullet-patterns.json: ${response.status}`);
      return response.json();
    });
  let bulletPatterns = null;
  const PLAYER_FIRE_INTERVAL = 1 / CONFIG.player.fireRatePerSecond;
  const PLAYER_KNIFE_SPEED = CONFIG.player.knifeSpeed;
  const PLAYER_AIM_ANGLE = (CONFIG.player.aimAngleDegrees * Math.PI) / 180;
  const PLAYER_UP_AIM_CHAIN_SECONDS = CONFIG.player.upAimChainSeconds;
  const PLAYER_UP_AIM_ACQUIRE_ANGLE = (CONFIG.player.upAimAcquireAngleDegrees * Math.PI) / 180;
  const PLAYER_UP_AIM_HOMING_SECONDS = CONFIG.player.upAimHomingSeconds;
  const PLAYER_UP_AIM_TURN_SPEED = (CONFIG.player.upAimTurnDegreesPerSecond * Math.PI) / 180;
  const PLAYER_UP_AIM_MAX_TARGET_DISTANCE = CONFIG.player.upAimMaxTargetDistance;
  const PLAYER_THROW_SECONDS = 0.16;
  const PLAYER_RADIUS = 15;
  const PLAYER_HURT_RADIUS = 8;
  const PLAYER_WAIST_OFFSET_Y = 8;
  const PLAYER_FLINCH_SECONDS = CONFIG.player.flinchSeconds;
  const PLAYER_KNOCKBACK_DISTANCE = CONFIG.player.knockbackDistance;
  const PLAYER_MAX_LIFE = CONFIG.player.maxLife;
  const LIFE_WIPE_SECONDS = CONFIG.player.lifeWipeSeconds;
  const LIFE_RECOVERY_STEP_SECONDS = CONFIG.player.lifeRecoveryStepSeconds;
  const DIALOGUE_AUTO_SECONDS = CONFIG.dialogue.autoSeconds;
  const MID_BOSS_DIALOGUE_AUTO_SECONDS = DIALOGUE_AUTO_SECONDS + CONFIG.dialogue.midBossExtraSeconds;
  const CHARGE_SECONDS = CONFIG.player.dash.chargeSeconds;
  const PLAYER_SPEED = CONFIG.player.moveSpeed;
  const DASH_SPEED = PLAYER_SPEED * CONFIG.player.dash.speedMultiplier;
  const DASH_DAMAGE = CONFIG.player.dash.damage;
  const DASH_COOLDOWN_SECONDS = CONFIG.player.dash.cooldownSeconds;
  const DRONE_LOOP_BASE_VOLUME = 0.026;
  const FINAL_STAGE = 3;
  const PLAYER_SPRITE_COLUMNS = 3;
  const PLAYER_SPRITE_ROWS = 7;
  const PLAYER_SPRITE_DRAW_WIDTH = 132;
  const PLAYER_SPRITE_DRAW_HEIGHT = 99;
  const PLAYER_SPRITE_TOP_EXTENT = Math.ceil(PLAYER_SPRITE_DRAW_HEIGHT * 0.58) + 2;
  const PLAYER_SPRITE_BOTTOM_EXTENT = Math.ceil(PLAYER_SPRITE_DRAW_HEIGHT * 0.42) + 2;
  const BOSS_SPRITE_COLUMNS = 3;
  const BOSS_SPRITE_ROWS = 2;
  const BOSS_SPRITE_DRAW_SIZE = 172;
  const RITSUKO_BOSS_SPRITE_DRAW_WIDTH = Math.round(BOSS_SPRITE_DRAW_SIZE * (576 / 512));
  const BOSS_SPRITE_FOOT_OFFSET_Y = Math.round(BOSS_SPRITE_DRAW_SIZE * 0.44);
  const ENEMY_SPRITE_COLUMNS = 3;
  const ENEMY_SPRITE_ROWS = 5;
  const ENEMY_SPRITE_SOURCE_INSET = 4;
  const STAGE_TWO_ENEMY_SPRITE_ROWS = 3;
  const STAGE_TWO_ENEMY_SPRITE_CONFIG = {
    cleaningRobot: { row: 0, width: 118, height: 118, offsetY: 10 },
    barrageRobot: { row: 1, width: 92, height: 92, offsetY: 6 },
    disciplineRobot: { row: 2, width: 100, height: 100, offsetY: 4 },
  };
  const STAGE_TWO_REINFORCEMENT_SPRITE_COLUMNS = 4;
  const STAGE_TWO_REINFORCEMENT_SPRITE_ROWS = 2;
  const STAGE_TWO_REINFORCEMENT_SPRITE_CONFIG = {
    glassesEnforcer: { row: 0, width: 180, height: 135, offsetY: 0 },
    yankeeEnforcer: { row: 1, width: 180, height: 135, offsetY: 0 },
  };
  const STAGE_TWO_GLASSES_RUN_SPRITE_COLUMNS = 6;
  const STAGE_TWO_GLASSES_RUN_SPRITE_FPS = 8;
  const STAGE_TWO_REINFORCEMENT_CHASE_DELAY_SECONDS = 0.6;
  const ENEMY_SPRITE_CONFIG = {
    twintail: { row: 0, width: 185, height: 139, radius: 25, offsetX: 0, offsetY: 0 },
    visorGlasses: { row: 1, width: 185, height: 139, radius: 25, offsetX: 0, offsetY: 0 },
    robotB: { row: 2, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 4 },
    droneA: { row: 3, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 0 },
    droneB: { row: 4, width: 96, height: 72, radius: 14, offsetX: 0, offsetY: 0 },
    cleaningRobot: { radius: 18 },
    barrageRobot: { radius: 20 },
    disciplineRobot: { radius: 18 },
    glassesEnforcer: { radius: 24 },
    yankeeEnforcer: { radius: 25 },
  };
  const HUMANOID_MIN_Y = Math.round(HEIGHT * 0.68);
  const HUMANOID_MAX_Y = Math.round(HEIGHT * 0.9);
  const HUMANOID_CENTER_Y = Math.round((HUMANOID_MIN_Y + HUMANOID_MAX_Y) / 2);
  const STAGE_TWO_GROUND_MIN_Y = Math.round(HEIGHT * 0.76);
  const STAGE_TWO_GROUND_MAX_Y = Math.round(HEIGHT * 0.9);
  const BOSS_MIN_Y = HUMANOID_MIN_Y - BOSS_SPRITE_FOOT_OFFSET_Y;
  const BOSS_MAX_Y = HUMANOID_MAX_Y - BOSS_SPRITE_FOOT_OFFSET_Y;
  const BOSS_CENTER_Y = Math.round((BOSS_MIN_Y + BOSS_MAX_Y) / 2);
  const BOSS_MOVE_AMPLITUDE = Math.round((BOSS_MAX_Y - BOSS_MIN_Y) / 2);
  const HUMANOID_ENEMY_TYPES = new Set(["twintail", "visorGlasses", "glassesEnforcer", "yankeeEnforcer"]);
  const PLAYER_SPRITE_ROWS_BY_STATE = {
    forward: 0,
    backward: 1,
    dash: 2,
    idle: 3,
    flinch: 4,
    throw: 5,
    scrollWalk: 6,
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
    throw: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    scrollWalk: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };
  const BOSS_SPRITE_FRAME_OFFSETS = {
    normal: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    powered: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };

  const {
    playerSprite,
    tsubameBossSprite,
    ritsukoBossSprite,
    sayoBossSprite,
    stageOneEnemySprite,
    stageTwoEnemySprite,
    stageTwoReinforcementSprite,
    stageTwoGlassesEnforcerRun6Sprite,
    stageOneBackground,
    stageTwoBackground,
    lifeScarfIcon,
  } = window.YOKOSHOOT_ASSETS.createImages();
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
  const START_PHASES = new Set([
    "wave1",
    "midBossDialogue",
    "midBoss",
    "wave2",
    "bossDialogue",
    "boss",
    "bossDefeatedDialogue",
  ]);

  const phasePlan = makeStagePlan(CONFIG.stages[1]);
  const STAGE_TWO_PLAN = makeStagePlan(CONFIG.stages[2]);

  const state = {
    mode: "title",
    stage: 1,
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
    pendingEnemySpawns: [],
    enemyBullets: [],
    particles: [],
    boss: null,
    waitingForMidBossReinforcementsClear: false,
    dialogue: [],
    dialogueIndex: 0,
    dialogueTimer: 0,
    dialogueAutoSeconds: DIALOGUE_AUTO_SECONDS,
    lifeRecovery: null,
    foregroundScrollPosition: null,
    foregroundScrolling: false,
    message: "",
  };

  const dialogues = CONFIG.dialogues;
  const audio = window.YOKOSHOOT_AUDIO.createAudioSystem({
    windowRef: window,
    getState: () => state,
    isDroneEnemy,
    width: WIDTH,
    droneLoopBaseVolume: DRONE_LOOP_BASE_VOLUME,
    clamp,
  });
  const {
    ensureAudioContext,
    playShotSound,
    playDroneTurnSound,
    playLifeRecoverySound,
    updateDroneLoopSound,
    fadeOutDroneLoopSound,
    playChargeCompleteSound,
    playDashLaunchSound,
    playVoiceLine,
  } = audio;

  function makeStagePlan(config) {
    return {
      wave1: config.wave1Seconds,
      wave2: config.wave2Seconds,
      wave1SpawnInterval: config.wave1SpawnInterval,
      wave2SpawnInterval: config.wave2SpawnInterval,
      midBossTarget: config.midBossHp,
      midBossRetreatDamage: config.midBossRetreatDamage,
      bossPhaseTarget: config.bossPhaseChangeHp,
      bossDefeatTarget: config.bossHp,
    };
  }

  function makePlayer() {
    return {
      x: 86,
      y: HUMANOID_CENTER_Y,
      life: CONFIG.player.life,
      lifeWipe: null,
      lifeReveal: null,
      invincible: 0,
      flinchTime: 0,
      throwTime: 0,
      upAimChain: 0,
      chargeTime: 0,
      dashCooldown: 0,
      wasCharging: false,
      chargeReadySoundPlayed: false,
      dashState: "none",
      dashOrigin: { x: 86, y: HUMANOID_CENTER_Y },
      dashVector: { x: 1, y: 0 },
      dashHits: new Set(),
      trail: [],
      moveX: 0,
      moveY: 0,
    };
  }

  function resetGame(stage = 1) {
    state.mode = "playing";
    state.stage = clamp(Math.round(Number(stage) || 1), 1, 3);
    state.phase = "wave1";
    state.phaseTime = 0;
    state.elapsed = 0;
    state.lastTime = 0;
    state.nextEnemyId = 1;
    state.fireCooldown = 0;
    state.score = 0;
    state.keys.clear();
    resetTouchInput();
    state.spawnTimer = 0.25;
    state.waveSpawnCounts = { wave1: 0, wave2: 0 };
    state.player = makePlayer();
    state.player.invincible = 1.5;
    state.knives = [];
    state.enemies = [];
    state.pendingEnemySpawns = [];
    state.enemyBullets = [];
    state.particles = [];
    state.boss = null;
    state.waitingForMidBossReinforcementsClear = false;
    state.lifeRecovery = null;
    state.message = "";
  }

  async function startGame(options = {}) {
    bulletPatterns = bulletPatterns || (await bulletPatternsPromise);
    ensureAudioContext();
    const requestedPhase = options.phase || "wave1";
    const phase = START_PHASES.has(requestedPhase) ? requestedPhase : "wave1";
    resetGame(options.stage);
    titleScreen.hidden = true;
    gameScreen.hidden = false;
    dialogueBox.hidden = true;
    if (phase === "midBossDialogue") {
      startDialogue("midBoss", "midBoss");
    } else if (phase === "bossDialogue") {
      startDialogue("boss", "boss");
    } else if (phase === "bossDefeatedDialogue") {
      startBossDefeatedDialogue();
    } else {
      setPhase(phase);
    }
    window.requestAnimationFrame(loop);
  }

  function startDialogue(kind, nextPhase) {
    state.mode = "dialogue";
    const dialogueKey = getDialogueKey(kind);
    const bossPortrait = kind === "boss" || kind === "bossDefeated";
    enemyPortrait.src = state.stage === 2
      ? kind === "midBoss"
        ? "assets/dialogue-ritsuko-midboss.png"
        : kind === "bossDefeated"
          ? "assets/dialogue-sayo-defeated.png"
          : "assets/dialogue-sayo-boss.png"
      : kind === "bossDefeated"
        ? "assets/dialogue-tsubame-defeated.png"
        : bossPortrait ? "assets/dialogue-tsubame-boss.png" : "assets/dialogue-tsubame-midboss.png";
    enemyPortrait.alt = state.stage === 2 ? (bossPortrait ? "一文字 小夜" : "鬼塚 律子") : "朝比奈 つばめ";
    state.dialogueAutoSeconds = kind === "midBoss" ? MID_BOSS_DIALOGUE_AUTO_SECONDS : DIALOGUE_AUTO_SECONDS;
    state.dialogue = dialogues[dialogueKey].map((entry) => ({ ...entry, nextPhase }));
    state.dialogueIndex = 0;
    state.dialogueTimer = 0;
    showDialogueLine();
  }

  function getDialogueKey(kind) {
    if (kind === "bossDefeated" && state.stage >= FINAL_STAGE) return "finalBossDefeated";
    if (state.stage === 2) {
      if (kind === "bossDefeated") return "stage2BossDefeated";
      return `stage2${kind === "boss" ? "Boss" : "MidBoss"}`;
    }
    return kind;
  }

  function startBossDefeatedDialogue() {
    state.knives = [];
    state.enemies = [];
    state.pendingEnemySpawns = [];
    state.enemyBullets = [];
    state.boss = null;
    state.waitingForMidBossReinforcementsClear = false;
    startDialogue("bossDefeated", state.stage < FINAL_STAGE ? "nextStage" : "gameClear");
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
    if (nextPhase === "nextStage" || nextPhase === "gameClear") {
      startLifeRecovery(nextPhase);
      return;
    }
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
    state.waitingForMidBossReinforcementsClear = false;
    state.foregroundScrollPosition = null;
    state.foregroundScrolling = false;
    if (phase === "wave1" || phase === "wave2") state.waveSpawnCounts[phase] = 0;
    if (state.stage === 2) {
      setStageTwoPhase(phase);
      return;
    }
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
      y: BOSS_CENTER_Y,
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

  function shootKnife() {
    playShotSound("knife");
    const target = findUpAimTarget();
    const angle = getPlayerAimAngle(target);
    if (angle < 0) state.player.upAimChain = PLAYER_UP_AIM_CHAIN_SECONDS;
    if (canShowThrowMotion()) state.player.throwTime = PLAYER_THROW_SECONDS;
    state.knives.push({
      x: state.player.x + 34,
      y: state.player.y - 22,
      vx: Math.cos(angle) * PLAYER_KNIFE_SPEED,
      vy: Math.sin(angle) * PLAYER_KNIFE_SPEED,
      homingTarget: angle < 0 ? target : null,
      homingTime: angle < 0 && target ? PLAYER_UP_AIM_HOMING_SECONDS : 0,
      r: 6,
    });
  }

  function getPlayerAimAngle(target = null) {
    const movement = getMovementInput();
    const aimingHorizontally = movement.x > 0;
    if (aimingHorizontally) return 0;
    const aimingUp = movement.y < 0;
    if (!aimingUp && state.player.upAimChain <= 0) return 0;
    return target ? angleToTarget(getKnifeSpawnPoint(), target) : -PLAYER_AIM_ANGLE;
  }

  function setStageTwoPhase(phase) {
    if (phase === "midBoss") {
      state.boss = makeBoss("鬼塚 律子", STAGE_TWO_PLAN.midBossTarget, 2);
      state.message = "中ボス 鬼塚律子";
    } else if (phase === "boss") {
      state.boss = makeBoss("一文字 小夜", STAGE_TWO_PLAN.bossDefeatTarget, 3);
      state.boss.dashTimer = CONFIG.bosses.sayo.dashIntervalSeconds;
      state.boss.dashState = "idle";
      state.message = "ボス 一文字小夜";
    } else {
      state.boss = null;
      state.message = phase === "wave2" ? "風紀ロボ 第二陣" : "お掃除ロボ";
    }
  }

  function getKnifeSpawnPoint() {
    return {
      x: state.player.x + 34,
      y: state.player.y - 22,
    };
  }

  function findUpAimTarget() {
    const origin = getKnifeSpawnPoint();
    let closestTarget = null;
    let closestDistance = Infinity;
    const targets = state.boss ? [...state.enemies, state.boss] : state.enemies;
    for (const target of targets) {
      if (target.dead || target.x <= origin.x || target.y >= state.player.y) continue;
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const angle = Math.atan2(dy, dx);
      if (angle <= -PLAYER_UP_AIM_ACQUIRE_ANGLE || angle >= 0) continue;
      const targetDistance = Math.hypot(dx, dy);
      if (targetDistance > PLAYER_UP_AIM_MAX_TARGET_DISTANCE) continue;
      if (targetDistance < closestDistance) {
        closestTarget = target;
        closestDistance = targetDistance;
      }
    }
    return closestTarget;
  }

  function angleToTarget(origin, target) {
    return Math.atan2(target.y - origin.y, target.x - origin.x);
  }

  function canShowThrowMotion() {
    return (
      state.player.dashState === "none" &&
      state.player.flinchTime <= 0 &&
      state.player.moveX >= 0
    );
  }

  function spawnEnemy() {
    state.waveSpawnCounts[state.phase] += 1;
    const spawnIndex = state.waveSpawnCounts[state.phase];
    const enemyType = selectRegularEnemyType(state.phase, spawnIndex);
    const y = randomEnemyY(enemyType);
    const enemyConfig = ENEMY_SPRITE_CONFIG[enemyType];
    const gameplay = getEnemyGameplay(enemyType);
    state.enemies.push({
      id: state.nextEnemyId,
      x: WIDTH + 28,
      y,
      vx: getEnemySpawnSpeed(enemyType),
      r: enemyConfig.radius,
      hp: gameplay.hp,
      fireTimer: getEnemyFirstShotTimer(gameplay),
      type: enemyType,
      wave: state.phase,
      spawnIndex,
      usedSpecial: false,
      chargeState: enemyType === "cleaningRobot" ? "windup" : "idle",
      windupTime: enemyType === "cleaningRobot" ? gameplay.windupSeconds : 0,
      groundY: y,
      zigzagDirection: Math.random() < 0.5 ? -1 : 1,
      motionTime: enemyType === "disciplineRobot"
        ? Math.random() * gameplay.jumpSeconds
        : 0,
    });
    if (enemyType === "cleaningRobot") playShotSound("robotSpin");
    state.nextEnemyId += 1;
  }

  function spawnReinforcementEnemy(type, y) {
    const enemyConfig = ENEMY_SPRITE_CONFIG[type];
    const gameplay = getEnemyGameplay(type);
    state.enemies.push({
      id: state.nextEnemyId,
      x: WIDTH + 28,
      y: clampEnemyY(type, y),
      vx: -gameplay.moveSpeed,
      r: enemyConfig.radius,
      hp: gameplay.hp,
      fireTimer: 0.75,
      type,
      wave: "midBossReinforcement",
      spawnIndex: 1,
      usedSpecial: false,
      chargeState: "rush",
      windupTime: 0,
      reinforcementPass: "toLeft",
    });
    state.nextEnemyId += 1;
  }

  function scheduleReinforcementEnemy(type, y, delaySeconds) {
    state.pendingEnemySpawns.push({
      type,
      y,
      delay: delaySeconds,
    });
  }

  function randomEnemyY(type) {
    if (type === "cleaningRobot" || type === "disciplineRobot") {
      return STAGE_TWO_GROUND_MIN_Y + Math.random() * (STAGE_TWO_GROUND_MAX_Y - STAGE_TWO_GROUND_MIN_Y);
    }
    if (isHumanoidEnemyType(type)) {
      return HUMANOID_MIN_Y + Math.random() * (HUMANOID_MAX_Y - HUMANOID_MIN_Y);
    }
    return 76 + Math.random() * (HEIGHT - 152);
  }

  function clampEnemyY(type, y) {
    if (!isHumanoidEnemyType(type)) return y;
    return clampHumanoidY(y);
  }

  function isHumanoidEnemyType(type) {
    return HUMANOID_ENEMY_TYPES.has(type);
  }

  function clampHumanoidY(y) {
    return clamp(y, HUMANOID_MIN_Y, HUMANOID_MAX_Y);
  }

  function clampBossY(y) {
    return clamp(y, BOSS_MIN_Y, BOSS_MAX_Y);
  }

  function selectRegularEnemyType(wave, spawnIndex) {
    if (state.stage === 2) {
      if (wave === "wave2") return "disciplineRobot";
      if (spawnIndex === 6 || spawnIndex === 10 || spawnIndex === 14) return "barrageRobot";
      return "cleaningRobot";
    }
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

  function shootReinforcementEightWay(enemy, speed) {
    playShotSound("enemyReturn");
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      state.enemyBullets.push({
        x: enemy.x,
        y: enemy.y - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        kind: "reinforcementBurst",
        spin: 0,
        r: 7,
      });
    }
  }

  function shootSpeechBubble(enemy) {
    playShotSound("enemyReturn");
    const direction = enemy.vx >= 0 ? 1 : -1;
    state.enemyBullets.push({
      x: enemy.x + direction * 34,
      y: enemy.y - 42,
      vx: direction * getEnemyGameplay(enemy.type).speechBubbleSpeed,
      vy: 0,
      kind: "speechBubble",
      direction,
      spin: 0,
      r: 18,
    });
  }

  function regularEnemyShoot(enemy) {
    if (state.stage === 2) {
      stageTwoEnemyShoot(enemy);
      return;
    }
    if (enemy.spawnIndex <= 3) {
      enemyShoot(enemy, getEnemyGameplay(enemy.type).bulletSpeed);
      return;
    }
    const canUseSpecial = !enemy.usedSpecial && enemy.x >= WIDTH / 2;
    const useSpecial = Math.random() < 0.25;
    if (!canUseSpecial || !useSpecial) {
      enemyShoot(enemy, getEnemyGameplay(enemy.type).bulletSpeed);
    } else if (enemy.wave === "wave2") {
      shootEightWay(enemy, getEnemyGameplay(enemy.type).radialBulletSpeed);
      enemy.usedSpecial = true;
      reverseEnemyDirection(enemy);
    } else {
      shootStraightTwoWay(enemy, getEnemyGameplay(enemy.type).bulletSpeed);
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
    if (state.stage === 2) {
      stageTwoBossShoot(boss, dt);
      return;
    }
    boss.fireTimer -= dt;
    boss.moveTimer += dt;
    boss.y = clampBossY(BOSS_CENTER_Y + Math.sin(boss.moveTimer * 1.9) * BOSS_MOVE_AMPLITUDE);
    if (boss.fireTimer > 0) return;

    if (boss.rank === 0) {
      boss.fireTimer = CONFIG.bosses.stage1MidBoss.shotIntervalSeconds;
      enemyShoot(boss, CONFIG.bosses.stage1MidBoss.bulletSpeed, "bossSmash");
      return;
    }

    boss.changed = boss.hp <= phasePlan.bossPhaseTarget;
    boss.fireTimer = boss.changed
      ? CONFIG.bosses.stage1Boss.poweredShotIntervalSeconds
      : CONFIG.bosses.stage1Boss.normalShotIntervalSeconds;
    playShotSound("bossSmash");
    const angles = boss.changed ? [-0.34, -0.17, 0, 0.17, 0.34] : [-0.18, 0, 0.18];
    for (const angle of angles) {
      const base = Math.PI + angle;
      state.enemyBullets.push({
        x: boss.x - 28,
        y: boss.y,
        vx: Math.cos(base) * (boss.changed
          ? CONFIG.bosses.stage1Boss.poweredBulletSpeed
          : CONFIG.bosses.stage1Boss.normalBulletSpeed),
        vy: Math.sin(base) * (boss.changed
          ? CONFIG.bosses.stage1Boss.poweredBulletSpeed
          : CONFIG.bosses.stage1Boss.normalBulletSpeed),
        r: 8,
      });
    }
  }

  function update(dt) {
    if (touchControlsEnabled && portraitOrientation.matches) {
      fadeOutDroneLoopSound();
      return;
    }
    updateLifeIndicatorAnimations(dt);
    if (state.mode === "dialogue") {
      updateDialogue(dt);
      fadeOutDroneLoopSound();
      return;
    }
    if (state.mode === "lifeRecover") {
      updateLifeRecovery(dt);
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
    state.player.throwTime = Math.max(0, state.player.throwTime - dt);
    state.player.upAimChain = Math.max(0, state.player.upAimChain - dt);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);

    updateForegroundScrollState();
    updatePlayer(dt);
    updatePhase(dt);
    updateKnives(dt);
    updatePendingEnemySpawns(dt);
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
    const movement = getMovementInput();
    const dx = movement.x;
    const dy = movement.y;
    const len = Math.hypot(dx, dy) || 1;
    state.player.moveX = dx;
    state.player.moveY = dy;
    state.player.x = clamp(state.player.x + (dx / len) * speed * dt, 34, WIDTH * 0.48);
    state.player.y = clamp(
      state.player.y + (dy / len) * speed * dt,
      Math.max(HUMANOID_MIN_Y, PLAYER_SPRITE_TOP_EXTENT),
      Math.min(HUMANOID_MAX_Y, HEIGHT - PLAYER_SPRITE_BOTTOM_EXTENT)
    );

    updateCharge(dt);

    if (state.keys.has("KeyZ") && state.fireCooldown <= 0) {
      shootKnife();
      state.fireCooldown = PLAYER_FIRE_INTERVAL;
    }
  }

  function updateCharge(dt) {
    const charging = isChargePressed();
    if (state.player.dashCooldown > 0) {
      state.player.wasCharging = charging;
      state.player.chargeTime = 0;
      state.player.chargeReadySoundPlayed = false;
      syncAttackButtonState();
      return;
    }
    if (charging) {
      state.player.chargeTime += dt;
      if (state.player.chargeTime >= CHARGE_SECONDS && !state.player.chargeReadySoundPlayed) {
        playChargeCompleteSound();
        state.player.chargeReadySoundPlayed = true;
      }
      state.player.wasCharging = true;
      syncAttackButtonState();
      return;
    }
    state.player.wasCharging = false;
    state.player.chargeTime = 0;
    state.player.chargeReadySoundPlayed = false;
    syncAttackButtonState();
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
    syncAttackButtonState();
  }

  function startDash() {
    playDashLaunchSound();
    const angle = getPlayerAimAngle();
    state.player.dashState = "dash";
    state.player.dashOrigin = { x: state.player.x, y: state.player.y };
    state.player.dashVector = { x: Math.cos(angle), y: Math.sin(angle) };
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
      player.x += player.dashVector.x * DASH_SPEED * dt;
      player.y = clampHumanoidY(player.y + player.dashVector.y * DASH_SPEED * dt);
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
    const plan = state.stage === 2 ? STAGE_TWO_PLAN : phasePlan;
    if (state.phase === "wave1") {
      if (state.phaseTime < plan.wave1) spawnWaveEnemies(dt, plan.wave1SpawnInterval);
      if (state.phaseTime >= plan.wave1 && isStageClearForBoss()) startDialogue("midBoss", "midBoss");
    } else if (state.phase === "wave2") {
      if (state.phaseTime < plan.wave2) spawnWaveEnemies(dt, plan.wave2SpawnInterval);
      if (state.phaseTime >= plan.wave2 && isStageClearForBoss()) startDialogue("boss", "boss");
    } else if (state.phase === "midBoss") {
      if (state.stage === 2 && state.waitingForMidBossReinforcementsClear) {
        if (!hasStageTwoReinforcementPresence()) setPhase("wave2");
        return;
      }
      if (state.stage !== 2 && state.boss && state.boss.retreating) {
        updateMidBossRetreat(dt);
        if (state.boss.x > WIDTH + 120 && state.enemies.length === 0) setPhase("wave2");
        return;
      }
      if (!state.boss) return;
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
    state.boss.y += (BOSS_CENTER_Y - state.boss.y) * Math.min(1, dt * 3);
    state.boss.y = clampBossY(state.boss.y);
  }

  function updateKnives(dt) {
    for (const knife of state.knives) {
      updateHomingKnife(knife, dt);
      knife.x += knife.vx * dt;
      knife.y += knife.vy * dt;
    }
    state.knives = state.knives.filter((knife) => (
      knife.x < WIDTH + 32 && knife.y > -32 && knife.y < HEIGHT + 32
    ));
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      if (enemy.type === "cleaningRobot" && enemy.chargeState === "windup") {
        enemy.windupTime -= dt;
        if (enemy.windupTime <= 0) {
          enemy.chargeState = "charge";
          enemy.vx = -getEnemyGameplay(enemy.type).chargeSpeed;
        }
        continue;
      }
      enemy.x += enemy.vx * dt;
      updateReinforcementEnemyMovement(enemy);
      updateStageTwoEnemyMovement(enemy, dt);
      enemy.y = clampEnemyY(enemy.type, enemy.y);
      if (updateStageTwoReinforcementAttack(enemy, dt)) continue;
      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0) {
        const gameplay = getEnemyGameplay(enemy.type);
        enemy.fireTimer = gameplay.shotIntervalMinSeconds === undefined
          ? 999
          : randomBetween(gameplay.shotIntervalMinSeconds, gameplay.shotIntervalMaxSeconds);
        regularEnemyShoot(enemy);
      }
    }
    state.enemies = state.enemies.filter((enemy) => enemy.x > -40 && enemy.x < WIDTH + 50);
  }

  function updatePendingEnemySpawns(dt) {
    if (state.pendingEnemySpawns.length === 0) return;
    for (const pendingSpawn of state.pendingEnemySpawns) {
      pendingSpawn.delay -= dt;
      if (pendingSpawn.delay <= 0.000001) {
        spawnReinforcementEnemy(pendingSpawn.type, pendingSpawn.y);
      }
    }
    state.pendingEnemySpawns = state.pendingEnemySpawns.filter((pendingSpawn) => pendingSpawn.delay > 0.000001);
  }

  function updateStageTwoReinforcementAttack(enemy, dt) {
    if (!isStageTwoReinforcementEnemy(enemy)) return false;
    enemy.fireTimer -= dt;
    if (enemy.fireTimer > 0) return true;

    const activeReinforcements = getActiveStageTwoReinforcements();
    if (activeReinforcements.length === 2 && enemy.type === "glassesEnforcer") {
      enemy.fireTimer = getEnemyGameplay(enemy.type).speechBubbleIntervalSeconds;
      shootSpeechBubble(enemy);
    } else if (activeReinforcements.length === 1 && !hasPendingStageTwoReinforcements()) {
      const gameplay = getEnemyGameplay(enemy.type);
      enemy.fireTimer = gameplay.soloShotIntervalSeconds;
      shootReinforcementEightWay(enemy, gameplay.soloBulletSpeed);
    } else {
      enemy.fireTimer = 0.12;
    }
    return true;
  }

  function getActiveStageTwoReinforcements() {
    return state.enemies.filter((enemy) => isStageTwoReinforcementEnemy(enemy) && !enemy.dead);
  }

  function hasPendingStageTwoReinforcements() {
    return state.pendingEnemySpawns.some((pendingSpawn) => isStageTwoReinforcementType(pendingSpawn.type));
  }

  function hasStageTwoReinforcementPresence() {
    return getActiveStageTwoReinforcements().length > 0 || hasPendingStageTwoReinforcements();
  }

  function isStageTwoReinforcementEnemy(enemy) {
    return state.stage === 2 && enemy.wave === "midBossReinforcement" && isStageTwoReinforcementType(enemy.type);
  }

  function isStageTwoReinforcementType(type) {
    return type === "glassesEnforcer" || type === "yankeeEnforcer";
  }

  function updateReinforcementEnemyMovement(enemy) {
    if (state.stage !== 2 || enemy.wave !== "midBossReinforcement") return;
    const moveSpeed = getEnemyGameplay(enemy.type).moveSpeed;
    if (enemy.reinforcementPass === "toLeft" && enemy.x <= 0) {
      enemy.x = 0;
      enemy.vx = moveSpeed;
      enemy.reinforcementPass = "toRight";
    } else if (enemy.reinforcementPass === "toRight" && enemy.x >= WIDTH) {
      enemy.x = WIDTH;
      enemy.vx = -moveSpeed;
      enemy.reinforcementPass = "exitLeft";
    }
  }

  function updateHomingKnife(knife, dt) {
    if (!knife.homingTarget || knife.homingTime <= 0 || knife.homingTarget.dead) return;
    knife.homingTime = Math.max(0, knife.homingTime - dt);
    const currentAngle = Math.atan2(knife.vy, knife.vx);
    const targetAngle = angleToTarget(knife, knife.homingTarget);
    const turn = clamp(normalizeAngle(targetAngle - currentAngle), -PLAYER_UP_AIM_TURN_SPEED * dt, PLAYER_UP_AIM_TURN_SPEED * dt);
    const nextAngle = currentAngle + turn;
    knife.vx = Math.cos(nextAngle) * PLAYER_KNIFE_SPEED;
    knife.vy = Math.sin(nextAngle) * PLAYER_KNIFE_SPEED;
  }

  function normalizeAngle(angle) {
    return window.YOKOSHOOT_MATH.normalizeAngle(angle);
  }

  function getEnemyGameplay(type) {
    return CONFIG.enemies[type];
  }

  function getEnemyFirstShotTimer(gameplay) {
    if (gameplay.firstShotMinSeconds === undefined) return 999;
    return randomBetween(gameplay.firstShotMinSeconds, gameplay.firstShotMaxSeconds);
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function updateStageTwoEnemyMovement(enemy, dt) {
    if (enemy.type === "cleaningRobot") {
      enemy.y += enemy.zigzagDirection * getEnemyGameplay(enemy.type).zigzagSpeed * dt;
      if (enemy.y <= STAGE_TWO_GROUND_MIN_Y || enemy.y >= STAGE_TWO_GROUND_MAX_Y) {
        enemy.y = clamp(enemy.y, STAGE_TWO_GROUND_MIN_Y, STAGE_TWO_GROUND_MAX_Y);
        enemy.zigzagDirection *= -1;
      }
      return;
    }
    if (enemy.type === "disciplineRobot") {
      enemy.motionTime += dt;
      const gameplay = getEnemyGameplay(enemy.type);
      const jumpProgress = (enemy.motionTime % gameplay.jumpSeconds) / gameplay.jumpSeconds;
      enemy.y = enemy.groundY - Math.sin(jumpProgress * Math.PI) * gameplay.jumpHeight;
    }
  }

  function updateEnemyBullets(dt) {
    for (const ball of state.enemyBullets) {
      ball.vy += (ball.gravity || 0) * dt;
      ball.spin = (ball.spin || 0) + dt * 9;
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
          damageEnemy(enemy, 1);
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
      if (state.boss && distance(state.boss, hurtPoint) < state.boss.r + PLAYER_HURT_RADIUS) {
        damagePlayer();
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
        state.score += CONFIG.score.enemyDefeat;
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
    if (state.stage === 2) {
      damageStageTwoBoss();
      return;
    }
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
      if (state.stage === 2 && hasStageTwoReinforcementPresence()) {
        state.boss = null;
        state.waitingForMidBossReinforcementsClear = true;
        state.message = "援軍掃討";
        return;
      }
      setPhase("wave2");
      return;
    }
    playVoiceLine("うわーっ", "bright");
    startBossDefeatedDialogue();
  }

  function damageStageTwoBoss() {
    if (!state.boss) return;
    if (state.phase === "midBoss" && state.boss.hp <= state.boss.maxHp / 2) {
      triggerStageTwoMidBossReinforcements();
    }
    if (state.boss.hp <= 0) defeatBoss();
  }

  function triggerStageTwoMidBossReinforcements() {
    if (!state.boss || state.boss.reinforcementsCalled) return;
    state.boss.reinforcementsCalled = true;
    state.boss.fireTimer = CONFIG.bosses.ritsuko.reinforcementPauseSeconds;
    state.message = "律子 援軍招集";
    spawnReinforcementEnemy("yankeeEnforcer", HEIGHT * 0.84);
    scheduleReinforcementEnemy("glassesEnforcer", HEIGHT * 0.72, STAGE_TWO_REINFORCEMENT_CHASE_DELAY_SECONDS);
  }

  function stageTwoBossShoot(boss, dt) {
    boss.fireTimer -= dt;
    boss.moveTimer += dt;
    boss.y = clampBossY(BOSS_CENTER_Y + Math.sin(boss.moveTimer * 1.7) * BOSS_MOVE_AMPLITUDE);
    if (boss.rank === 2) {
      const powered = boss.hp <= CONFIG.bosses.ritsuko.poweredHp;
      if (powered && !boss.changed) state.message = "律子 強化";
      boss.changed = powered;
      if (boss.fireTimer > 0) return;
      boss.fireTimer = boss.changed
        ? CONFIG.bosses.ritsuko.poweredShotIntervalSeconds
        : CONFIG.bosses.ritsuko.normalShotIntervalSeconds;
      playShotSound("schoolTool");
      for (const [index, offset] of [-0.2, 0, 0.2].entries()) {
        pushAimedBullet(
          boss,
          CONFIG.bosses.ritsuko.bulletSpeed + index * CONFIG.bosses.ritsuko.bulletSpeedStep,
          offset,
          ["pencil", "compass", "ruler"][index]
        );
      }
      return;
    }
    updateSayoAttack(boss, dt);
  }

  function damageEnemy(enemy, amount) {
    enemy.hp = (enemy.hp || 1) - amount;
    burst(enemy.x, enemy.y, "#f8d84a");
    if (enemy.hp > 0) return;
    enemy.dead = true;
    state.score += CONFIG.score.enemyDefeat;
  }

  function updateSayoAttack(boss, dt) {
    boss.changed = boss.hp <= STAGE_TWO_PLAN.bossPhaseTarget;
    if (!boss.changed) {
      if (boss.fireTimer > 0) return;
      boss.fireTimer = CONFIG.bosses.sayo.shockwaveIntervalSeconds;
      executeBulletPattern(boss, "sayoShockwave");
      return;
    }
    boss.dashTimer -= dt;
    if (boss.dashState === "forward") {
      boss.x -= CONFIG.bosses.sayo.dashForwardSpeed * dt;
      boss.invincible = true;
      if (boss.x <= WIDTH * 0.54) {
        boss.dashState = "return";
        boss.invincible = false;
      }
      return;
    }
    if (boss.dashState === "return") {
      boss.x += CONFIG.bosses.sayo.dashReturnSpeed * dt;
      if (boss.x >= WIDTH - 130) {
        boss.x = WIDTH - 130;
        boss.dashState = "idle";
        boss.dashTimer = CONFIG.bosses.sayo.dashIntervalSeconds;
      }
      return;
    }
    if (boss.dashTimer <= 0) {
      playShotSound("swordWave");
      boss.dashState = "forward";
      boss.invincible = true;
    }
  }

  function pushAimedBullet(source, speed, angleOffset, kind, radius = 8) {
    const angle = Math.atan2(state.player.y - source.y, state.player.x - source.x) + angleOffset;
    state.enemyBullets.push({
      x: source.x - 22,
      y: source.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      kind,
      spin: 0,
      r: radius,
    });
  }

  function executeBulletPattern(source, patternName) {
    const pattern = bulletPatterns && bulletPatterns[patternName];
    if (!pattern) throw new Error(`Unknown bullet pattern: ${patternName}`);
    if (pattern.sound) playShotSound(pattern.sound);
    for (const action of pattern.actions) {
      if (action.fire === "aimed") {
        pushPatternAimedBullet(source, action, 0);
      } else if (action.fire === "aimedSpread") {
        for (const angleOffset of action.angleOffsets) {
          pushPatternAimedBullet(source, action, angleOffset);
        }
      } else if (action.fire === "radial") {
        for (let index = 0; index < action.count; index += 1) {
          const angle = (Math.PI * 2 * index) / action.count;
          pushPatternBullet(source, action, angle);
        }
      }
      if (action.retreat) source.vx = action.retreat.speed;
      if (action.finish) Object.assign(source, action.finish);
    }
  }

  function pushPatternAimedBullet(source, action, angleOffset) {
    const angle = Math.atan2(state.player.y - source.y, state.player.x - source.x) + angleOffset;
    pushPatternBullet(source, action, angle);
  }

  function pushPatternBullet(source, action, angle) {
    state.enemyBullets.push({
      x: source.x + (action.originX || 0),
      y: source.y + (action.originY || 0),
      vx: Math.cos(angle) * action.speed,
      vy: Math.sin(angle) * action.speed,
      kind: action.kind,
      spin: 0,
      r: action.radius || 8,
    });
  }

  function stageTwoEnemyShoot(enemy) {
    if (enemy.type === "barrageRobot") {
      if (enemy.usedSpecial) return;
      executeBulletPattern(enemy, "barrageRobotExit");
      return;
    }
    if (enemy.type !== "disciplineRobot") return;
    playShotSound("shinaiThrow");
    state.enemyBullets.push({
      x: enemy.x - 18,
      y: enemy.y - 8,
      vx: -getEnemyGameplay(enemy.type).shinaiSpeedX,
      vy: -getEnemyGameplay(enemy.type).shinaiSpeedY,
      gravity: getEnemyGameplay(enemy.type).shinaiGravity,
      spin: 0,
      kind: "shinai",
      r: 10,
    });
  }

  function getEnemySpawnSpeed(type) {
    if (type === "cleaningRobot") return 0;
    const gameplay = getEnemyGameplay(type);
    return -randomBetween(gameplay.moveSpeedMin, gameplay.moveSpeedMax);
  }

  function advanceToNextStage() {
    state.stage += 1;
    state.mode = "playing";
    state.player.invincible = 1.5;
    state.player.chargeTime = 0;
    state.player.dashCooldown = 0;
    state.player.dashState = "none";
    state.player.trail = [];
    setPhase("wave1");
    state.message = `${state.stage}面 開始`;
  }

  function startLifeRecovery(nextPhase) {
    const recovery = Math.min(CONFIG.player.bossDefeatLifeRecovery, PLAYER_MAX_LIFE - state.player.life);
    if (recovery <= 0) {
      finishPostBossTransition(nextPhase);
      return;
    }
    state.mode = "lifeRecover";
    state.message = "LIFE RECOVER";
    state.lifeRecovery = {
      nextPhase,
      remaining: recovery,
      timer: 0.24,
    };
  }

  function updateLifeRecovery(dt) {
    if (!state.lifeRecovery) return;
    state.lifeRecovery.timer -= dt;
    if (state.lifeRecovery.timer > 0) return;
    if (state.lifeRecovery.remaining > 0) {
      state.player.life += 1;
      state.player.lifeReveal = {
        index: state.player.life - 1,
        remaining: LIFE_WIPE_SECONDS,
      };
      state.lifeRecovery.remaining -= 1;
      state.lifeRecovery.timer = LIFE_RECOVERY_STEP_SECONDS;
      playLifeRecoverySound();
      return;
    }
    finishPostBossTransition(state.lifeRecovery.nextPhase);
  }

  function finishPostBossTransition(nextPhase) {
    state.lifeRecovery = null;
    if (nextPhase === "nextStage") {
      advanceToNextStage();
      return;
    }
    state.mode = "clear";
    state.message = "GAME CLEAR";
  }

  function updateLifeIndicatorAnimations(dt) {
    for (const key of ["lifeWipe", "lifeReveal"]) {
      if (!state.player[key]) continue;
      state.player[key].remaining -= dt;
      if (state.player[key].remaining <= 0) state.player[key] = null;
    }
  }

  function damagePlayer() {
    const hitX = state.player.x;
    const hitY = state.player.y;
    playVoiceLine("くぅっ", "cool");
    state.player.life -= 1;
    state.player.lifeWipe = {
      index: state.player.life,
      remaining: LIFE_WIPE_SECONDS,
    };
    state.player.invincible = CONFIG.player.hitInvincibleSeconds;
    state.player.flinchTime = PLAYER_FLINCH_SECONDS;
    state.player.x = clamp(state.player.x - PLAYER_KNOCKBACK_DISTANCE, 34, WIDTH * 0.48);
    burst(hitX, hitY, "#ff5278", 18);
    if (state.player.life <= 0) {
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
    if (state.stage === 2) {
      drawStageTwoBackground();
      return;
    }
    if (drawStageOneBackground()) return;
    drawFallbackBackground();
  }

  function drawStageTwoBackground() {
    if (!stageTwoBackground.complete || stageTwoBackground.naturalWidth === 0) {
      drawStageTwoFallbackBackground();
      return;
    }
    const sourceHeight = stageTwoBackground.naturalHeight;
    const sourceWidth = Math.min(stageTwoBackground.naturalWidth, sourceHeight * (WIDTH / HEIGHT));
    const stop = getStageTwoProgress();
    for (const layer of BACKGROUND_PARALLAX_LAYERS) {
      drawStageTwoBackgroundLayer(sourceWidth, stop, layer);
    }
  }

  function drawStageTwoBackgroundLayer(sourceWidth, stop, layer) {
    const sourceHeight = stageTwoBackground.naturalHeight;
    const sourceTop = Math.round(sourceHeight * layer.top);
    const sourceBottom = Math.round(sourceHeight * layer.bottom);
    const sourceLayerHeight = Math.max(1, sourceBottom - sourceTop);
    const destTop = Math.round(HEIGHT * layer.top);
    const destBottom = Math.round(HEIGHT * layer.bottom);
    const destLayerHeight = Math.max(1, destBottom - destTop);
    const sourceX = getStageTwoBackgroundSourceX(sourceWidth, stop, layer.strength);
    ctx.drawImage(
      stageTwoBackground,
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

  function getStageTwoBackgroundSourceX(sourceWidth, stop, parallaxStrength) {
    const maxSourceX = Math.max(0, stageTwoBackground.naturalWidth - sourceWidth);
    const parallaxStop = clamp(stop + (stop - 0.5) * parallaxStrength, 0, 1);
    return Math.round(maxSourceX * parallaxStop);
  }

  function drawStageTwoFallbackBackground() {
    const stop = getStageTwoProgress();
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, lerpColor([245, 132, 88], [20, 24, 54], stop));
    gradient.addColorStop(1, lerpColor([92, 83, 120], [8, 12, 28], stop));
    ctx.fillStyle = gradient;
    pixelRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 236, 156, 0.58)";
    for (let x = -80 - stop * 160; x < WIDTH; x += 210) {
      pixelRect(x, 86, 74, 22);
      pixelRect(x + 24, 126, 92, 16);
    }

    ctx.fillStyle = "#51354b";
    pixelRect(0, 86, WIDTH, 190);
    const slide = -stop * 260;
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 176 + slide) % (WIDTH + 220)) - 110;
      const tidy = stop > i / 8;
      ctx.fillStyle = tidy ? "#6b5262" : "#5b3146";
      pixelRect(x, 116, 132, 104);
      ctx.fillStyle = "#1b2034";
      pixelRect(x + 10, 130, 112, 76);
      ctx.fillStyle = tidy ? "#c7d2e6" : "#f0d266";
      for (let j = 0; j < (tidy ? 2 : 5); j += 1) pixelRect(x + 22 + j * 18, 188 - j * 9, 28, 6);
    }

    ctx.fillStyle = "#2a2435";
    pixelRect(0, 276, WIDTH, HEIGHT - 276);
    ctx.fillStyle = "#7b5364";
    for (let x = -120 - stop * 420; x < WIDTH + 120; x += 120) {
      pixelRect(x, 276, 42, 190);
      pixelRect(x + 28, 276, 8, 190);
    }
    ctx.fillStyle = "#3a3145";
    pixelRect(0, 402, WIDTH, 138);
    ctx.fillStyle = "#57485a";
    for (let x = -80; x < WIDTH; x += 88) pixelRect(x + stop * 40, 438, 62, 12);

    if (stop > 0.82) {
      ctx.fillStyle = "#2a1620";
      pixelRect(WIDTH - 350, 250, 300, 290);
      ctx.fillStyle = "#b62236";
      pixelRect(WIDTH - 286, 364, 170, 176);
      ctx.fillStyle = "#f5d38c";
      pixelRect(WIDTH - 332, 250, 264, 18);
      for (let y = 312; y < 500; y += 38) pixelRect(WIDTH - 332, y, 264, 8);
    }
  }

  function getStageTwoProgress() {
    if (state.phase === "wave1") return clamp(state.phaseTime / STAGE_TWO_PLAN.wave1, 0, 1) * 0.34;
    if (state.phase === "midBossDialogue" || state.phase === "midBoss") return 0.38;
    if (state.phase === "wave2") return 0.48 + clamp(state.phaseTime / STAGE_TWO_PLAN.wave2, 0, 1) * 0.34;
    if (state.phase === "bossDialogue" || state.phase === "boss" || state.phase === "bossDefeatedDialogue") return 1;
    return 0;
  }

  function lerpColor(a, b, t) {
    return `rgb(${a.map((value, index) => Math.round(lerp(value, b[index], t))).join(",")})`;
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
    return window.YOKOSHOOT_MATH.lerp(a, b, t);
  }

  function easeInOut(t) {
    return window.YOKOSHOOT_MATH.easeInOut(t);
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
    const stageName = state.stage === 2 ? "2面 学校の廊下" : `${state.stage}面 テニスコート`;
    ctx.fillText(stageName, 18, 30);
    drawLifeIndicator(250, 9);
    ctx.fillText(`SCORE ${state.score}`, 500, 30);
    if (!touchControlsEnabled) {
      ctx.font = "700 14px sans-serif";
      ctx.fillText("移動: 矢印/WASD  小刀: Z  溜め突進: Space長押し", 18, HEIGHT - 18);
    }
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

  function drawLifeIndicator(x, y) {
    ctx.fillStyle = "#f5f7ff";
    ctx.font = "800 15px sans-serif";
    ctx.fillText("LIFE", x, y + 21);
    for (let index = 0; index < PLAYER_MAX_LIFE; index += 1) {
      const iconX = x + 48 + index * 38;
      drawScarfLifeIcon(iconX, y + 2, "slot");
      if (index < state.player.life) {
        const reveal = state.player.lifeReveal && state.player.lifeReveal.index === index
          ? 1 - state.player.lifeReveal.remaining / LIFE_WIPE_SECONDS
          : 1;
        drawClippedScarfLifeIcon(iconX, y + 2, reveal);
      } else if (state.player.lifeWipe && state.player.lifeWipe.index === index) {
        drawClippedScarfLifeIcon(iconX, y + 2, state.player.lifeWipe.remaining / LIFE_WIPE_SECONDS);
      }
    }
  }

  function drawClippedScarfLifeIcon(x, y, visibleRatio) {
    const width = 30;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width * clamp(visibleRatio, 0, 1), 32);
    ctx.clip();
    drawScarfLifeIcon(x, y, "active");
    ctx.restore();
  }

  function drawScarfLifeIcon(x, y, style) {
    if (lifeScarfIcon.complete && lifeScarfIcon.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = style === "active" ? 1 : 0.16;
      ctx.drawImage(lifeScarfIcon, x + 5, y, 20, 30);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = style === "active" ? "#ff5278" : "rgba(255,255,255,0.14)";
    pixelRect(3, 3, 18, 7);
    pixelRect(17, 7, 9, 7);
    pixelRect(18, 12, 7, 17);
    pixelRect(9, 10, 8, 14);
    ctx.fillStyle = style === "active" ? "#f8d84a" : "rgba(255,255,255,0.08)";
    pixelRect(17, 7, 5, 5);
    ctx.restore();
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

    const spriteState = getPlayerSpriteState(dashActive);
    const frame = getPlayerSpriteFrame(spriteState);
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
    const baseState = getPlayerMovementSpriteState(dashActive);
    if (state.player.throwTime > 0 && (baseState === "forward" || baseState === "idle")) return "throw";
    return baseState;
  }

  function getPlayerMovementSpriteState(dashActive) {
    if (state.player.moveX > 0) return "forward";
    if (state.player.moveX < 0) return "backward";
    if (state.player.moveY !== 0) return "forward";
    if (dashActive) return "dash";
    if (isBackgroundScrolling()) return "scrollWalk";
    return "idle";
  }

  function isBackgroundScrolling() {
    return state.foregroundScrolling;
  }

  function updateForegroundScrollState() {
    const position = getForegroundScrollPosition();
    state.foregroundScrolling =
      state.foregroundScrollPosition !== null && Math.abs(position - state.foregroundScrollPosition) > 0.0001;
    state.foregroundScrollPosition = position;
  }

  function getForegroundScrollPosition() {
    if (state.stage === 2) {
      const stop = getStageTwoProgress();
      if (!stageTwoBackground.complete || stageTwoBackground.naturalWidth === 0) return stop;
      const sourceHeight = stageTwoBackground.naturalHeight;
      const sourceWidth = Math.min(stageTwoBackground.naturalWidth, sourceHeight * (WIDTH / HEIGHT));
      const foregroundStrength = BACKGROUND_PARALLAX_LAYERS[BACKGROUND_PARALLAX_LAYERS.length - 1].strength;
      return getStageTwoBackgroundSourceX(sourceWidth, stop, foregroundStrength);
    }
    const stop = getStageOneBackgroundStop();
    if (!stageOneBackground.complete || stageOneBackground.naturalWidth === 0) return stop;
    const sourceHeight = stageOneBackground.naturalHeight;
    const sourceWidth = Math.min(stageOneBackground.naturalWidth, sourceHeight * (WIDTH / HEIGHT));
    const maxSourceX = Math.max(0, stageOneBackground.naturalWidth - sourceWidth);
    const foregroundStrength = BACKGROUND_PARALLAX_LAYERS[BACKGROUND_PARALLAX_LAYERS.length - 1].strength;
    const parallaxStop = clamp(stop + (stop - 0.5) * foregroundStrength, 0, 1);
    return maxSourceX * parallaxStop;
  }

  function getPlayerSpriteFrame(spriteState) {
    if (spriteState !== "throw") return Math.floor(state.elapsed * 8) % PLAYER_SPRITE_COLUMNS;
    const elapsed = PLAYER_THROW_SECONDS - state.player.throwTime;
    return clamp(Math.floor(elapsed / (PLAYER_THROW_SECONDS / 2)), 0, 1);
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
      ctx.save();
      ctx.translate(knife.x, knife.y);
      ctx.rotate(Math.atan2(knife.vy, knife.vx));
      ctx.fillStyle = "#eef5ff";
      pixelRect(-8, -3, 22, 6);
      ctx.fillStyle = "#a9c5df";
      pixelRect(10, -1, 6, 2);
      ctx.fillStyle = "#343847";
      pixelRect(-14, -2, 8, 4);
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      if (drawStageTwoEnemy(enemy)) {
        ctx.restore();
        continue;
      }
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

  function drawStageTwoEnemy(enemy) {
    if (state.stage !== 2) return false;
    applyStageTwoReinforcementFacing(enemy);
    if (drawStageTwoReinforcementSprite(enemy)) return true;
    if (drawStageTwoEnemySprite(enemy)) return true;
    if (enemy.type === "cleaningRobot") {
      const spin = enemy.chargeState === "windup" && Math.floor(state.elapsed * 24) % 2;
      ctx.fillStyle = "#cad5e6";
      pixelRect(-22, -18, 44, 28);
      ctx.fillStyle = "#5e6a80";
      pixelRect(-16, -28, 32, 12);
      ctx.fillStyle = "#1c2234";
      pixelRect(-20, 10, 14, 14);
      pixelRect(6, 10, 14, 14);
      ctx.fillStyle = spin ? "#7ee8ff" : "#f8d84a";
      pixelRect(-15, 15, 10, 4);
      pixelRect(7, 15, 10, 4);
      ctx.fillStyle = "#d9e5ff";
      pixelRect(-54, -4, 36, 7);
      ctx.fillStyle = "#b9a26f";
      pixelRect(-62, -11, 10, 22);
    } else if (enemy.type === "barrageRobot") {
      ctx.fillStyle = "#d9e5ff";
      pixelRect(-22, -20, 44, 40);
      ctx.fillStyle = "#5e6a80";
      pixelRect(-16, -28, 32, 10);
      ctx.fillStyle = "#ff5278";
      pixelRect(-9, -12, 18, 8);
      ctx.fillStyle = "#f8d84a";
      for (const [x, y] of [[-28, -5], [22, -5], [-5, -26], [-5, 20]]) pixelRect(x, y, 10, 10);
      ctx.fillStyle = "#1c2234";
      pixelRect(-18, 20, 12, 10);
      pixelRect(6, 20, 12, 10);
    } else if (enemy.type === "disciplineRobot") {
      ctx.fillStyle = "#dfe5f2";
      pixelRect(-20, -24, 40, 42);
      ctx.fillStyle = "#36405a";
      pixelRect(-16, -31, 32, 10);
      ctx.fillStyle = "#ff5278";
      pixelRect(-10, -15, 20, 6);
      ctx.fillStyle = "#b59258";
      pixelRect(-34, 8, 58, 6);
      ctx.fillStyle = "#1c2234";
      pixelRect(-16, 18, 10, 12);
      pixelRect(6, 18, 10, 12);
    } else {
      ctx.fillStyle = enemy.type === "glassesEnforcer" ? "#c9d8f4" : "#e4a8c1";
      pixelRect(-16, -42, 32, 28);
      pixelRect(-24, -14, 48, 54);
      ctx.fillStyle = "#24263a";
      pixelRect(-16, 40, 12, 18);
      pixelRect(4, 40, 12, 18);
      if (enemy.type === "glassesEnforcer") pixelRect(-14, -29, 28, 5);
    }
    return true;
  }

  function applyStageTwoReinforcementFacing(enemy) {
    if (enemy.wave === "midBossReinforcement" && enemy.vx > 0) ctx.scale(-1, 1);
  }

  function drawStageTwoReinforcementSprite(enemy) {
    const config = STAGE_TWO_REINFORCEMENT_SPRITE_CONFIG[enemy.type];
    if (config && enemy.type === "glassesEnforcer" && drawStageTwoGlassesEnforcerRunSprite(config)) {
      return true;
    }
    if (
      !config ||
      !stageTwoReinforcementSprite.complete ||
      stageTwoReinforcementSprite.naturalWidth === 0
    ) {
      return false;
    }

    const frame = Math.floor(state.elapsed * 10) % STAGE_TWO_REINFORCEMENT_SPRITE_COLUMNS;
    const sourceWidth = stageTwoReinforcementSprite.naturalWidth / STAGE_TWO_REINFORCEMENT_SPRITE_COLUMNS;
    const sourceHeight = stageTwoReinforcementSprite.naturalHeight / STAGE_TWO_REINFORCEMENT_SPRITE_ROWS;
    ctx.drawImage(
      stageTwoReinforcementSprite,
      frame * sourceWidth + ENEMY_SPRITE_SOURCE_INSET,
      config.row * sourceHeight + ENEMY_SPRITE_SOURCE_INSET,
      sourceWidth - ENEMY_SPRITE_SOURCE_INSET * 2,
      sourceHeight - ENEMY_SPRITE_SOURCE_INSET * 2,
      -config.width * 0.5,
      -config.height * 0.62 + config.offsetY,
      config.width,
      config.height
    );
    return true;
  }

  function drawStageTwoGlassesEnforcerRunSprite(config) {
    if (
      !stageTwoGlassesEnforcerRun6Sprite.complete ||
      stageTwoGlassesEnforcerRun6Sprite.naturalWidth === 0
    ) {
      return false;
    }

    const frame = Math.floor(state.elapsed * STAGE_TWO_GLASSES_RUN_SPRITE_FPS) % STAGE_TWO_GLASSES_RUN_SPRITE_COLUMNS;
    const sourceWidth = stageTwoGlassesEnforcerRun6Sprite.naturalWidth / STAGE_TWO_GLASSES_RUN_SPRITE_COLUMNS;
    const sourceHeight = stageTwoGlassesEnforcerRun6Sprite.naturalHeight;
    ctx.drawImage(
      stageTwoGlassesEnforcerRun6Sprite,
      frame * sourceWidth + ENEMY_SPRITE_SOURCE_INSET,
      ENEMY_SPRITE_SOURCE_INSET,
      sourceWidth - ENEMY_SPRITE_SOURCE_INSET * 2,
      sourceHeight - ENEMY_SPRITE_SOURCE_INSET * 2,
      -config.width * 0.5,
      -config.height * 0.62 + config.offsetY,
      config.width,
      config.height
    );
    return true;
  }

  function drawStageTwoEnemySprite(enemy) {
    const config = STAGE_TWO_ENEMY_SPRITE_CONFIG[enemy.type];
    if (!config || !stageTwoEnemySprite.complete || stageTwoEnemySprite.naturalWidth === 0) return false;

    const frame = Math.floor(state.elapsed * 8) % ENEMY_SPRITE_COLUMNS;
    const sourceWidth = stageTwoEnemySprite.naturalWidth / ENEMY_SPRITE_COLUMNS;
    const sourceHeight = stageTwoEnemySprite.naturalHeight / STAGE_TWO_ENEMY_SPRITE_ROWS;
    ctx.drawImage(
      stageTwoEnemySprite,
      frame * sourceWidth + ENEMY_SPRITE_SOURCE_INSET,
      config.row * sourceHeight + ENEMY_SPRITE_SOURCE_INSET,
      sourceWidth - ENEMY_SPRITE_SOURCE_INSET * 2,
      sourceHeight - ENEMY_SPRITE_SOURCE_INSET * 2,
      -config.width * 0.5,
      -config.height * 0.62 + config.offsetY,
      config.width,
      config.height
    );
    return true;
  }

  function drawStageOneEnemySprite(enemy) {
    if (state.stage === 2) return false;
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
    if (drawStageTwoBoss(boss)) {
      ctx.restore();
      return;
    }
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

  function drawStageTwoBoss(boss) {
    if (state.stage !== 2) return false;
    if (boss.rank === 2) {
      if (drawRitsukoBossSprite(boss)) return true;
    } else {
      if (drawSayoBossSprite(boss)) return true;
      ctx.fillStyle = "#eef3ff";
      pixelRect(-22, -50, 44, 36);
      pixelRect(-30, -14, 60, 72);
      ctx.fillStyle = "#1c2234";
      pixelRect(-26, -58, 52, 18);
      ctx.fillStyle = "#c8d7ef";
      pixelRect(-62, 4, 94, 8);
      pixelRect(-68, 0, 10, 16);
      if (boss.changed) {
        ctx.fillStyle = "#ff5278";
        pixelRect(-34, 16, 68, 10);
      }
    }
    ctx.fillStyle = "#1c2234";
    pixelRect(-22, 58, 14, 20);
    pixelRect(8, 58, 14, 20);
    return true;
  }

  function drawSayoBossSprite(boss) {
    if (!sayoBossSprite.complete || sayoBossSprite.naturalWidth === 0) return false;

    const frame = Math.floor(state.elapsed * 7) % BOSS_SPRITE_COLUMNS;
    const row = boss.changed ? 1 : 0;
    const sourceWidth = sayoBossSprite.naturalWidth / BOSS_SPRITE_COLUMNS;
    const sourceHeight = sayoBossSprite.naturalHeight / BOSS_SPRITE_ROWS;
    ctx.drawImage(
      sayoBossSprite,
      frame * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      -BOSS_SPRITE_DRAW_SIZE * 0.5,
      -BOSS_SPRITE_DRAW_SIZE * 0.56,
      BOSS_SPRITE_DRAW_SIZE,
      BOSS_SPRITE_DRAW_SIZE
    );
    return true;
  }

  function drawRitsukoBossSprite(boss) {
    if (!ritsukoBossSprite.complete || ritsukoBossSprite.naturalWidth === 0) return false;

    const frame = Math.floor(state.elapsed * 7) % BOSS_SPRITE_COLUMNS;
    const row = boss.changed ? 1 : 0;
    const sourceWidth = ritsukoBossSprite.naturalWidth / BOSS_SPRITE_COLUMNS;
    const sourceHeight = ritsukoBossSprite.naturalHeight / BOSS_SPRITE_ROWS;
    ctx.drawImage(
      ritsukoBossSprite,
      frame * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      -RITSUKO_BOSS_SPRITE_DRAW_WIDTH * 0.5,
      -BOSS_SPRITE_DRAW_SIZE * 0.56,
      RITSUKO_BOSS_SPRITE_DRAW_WIDTH,
      BOSS_SPRITE_DRAW_SIZE
    );
    return true;
  }

  function drawTsubameBossSprite(boss) {
    if (state.stage !== 1) return false;
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
      if (drawStageTwoBullet(ball)) continue;
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

  function drawStageTwoBullet(ball) {
    if (state.stage !== 2) return false;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    if (ball.kind === "speechBubble") {
      drawSpeechBubbleBullet(ball);
      ctx.restore();
      return true;
    }
    ctx.rotate(ball.spin || 0);
    if (ball.kind === "shinai") {
      ctx.fillStyle = "#b59258";
      pixelRect(-22, -3, 44, 6);
      ctx.fillStyle = "#eef3ff";
      pixelRect(-28, -5, 8, 10);
    } else if (ball.kind === "shockwave") {
      ctx.fillStyle = "#7ee8ff";
      pixelRect(-20, -4, 40, 8);
      ctx.fillStyle = "#eef3ff";
      pixelRect(-14, -7, 28, 3);
    } else if (ball.kind === "robotBullet") {
      ctx.fillStyle = "#ff5278";
      pixelRect(-6, -6, 12, 12);
      ctx.fillStyle = "#f8d84a";
      pixelRect(-3, -3, 6, 6);
    } else if (ball.kind === "reinforcementBurst") {
      ctx.fillStyle = "#8f6cff";
      pixelRect(-7, -7, 14, 14);
      ctx.fillStyle = "#f8d84a";
      pixelRect(-3, -3, 6, 6);
    } else if (ball.kind === "compass") {
      ctx.fillStyle = "#d9e5ff";
      pixelRect(-3, -14, 6, 28);
      pixelRect(-10, 8, 20, 4);
    } else if (ball.kind === "ruler") {
      ctx.fillStyle = "#f8d84a";
      pixelRect(-14, -10, 28, 20);
      ctx.fillStyle = "#1c2234";
      pixelRect(-8, -4, 16, 8);
    } else {
      ctx.fillStyle = "#f0d266";
      pixelRect(-18, -3, 36, 6);
      ctx.fillStyle = "#ff5278";
      pixelRect(12, -3, 6, 6);
    }
    ctx.restore();
    return true;
  }

  function drawSpeechBubbleBullet(ball) {
    ctx.fillStyle = "#f8f6ef";
    ctx.strokeStyle = "#24263a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const points = [
      [-33, -6], [-28, -15], [-17, -13], [-9, -18],
      [0, -14], [10, -18], [18, -12], [31, -14],
      [28, -4], [35, 3], [26, 10], [29, 18],
      [15, 15], [7, 20], [-3, 15], [-14, 18],
      [-20, 12], [-33, 14], [-28, 4],
    ];
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d82432";
    ctx.strokeStyle = "#fff6e8";
    ctx.lineWidth = 2;
    ctx.font = "900 16px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.rotate(-0.13);
    ctx.strokeText("待ちなさい！", 0, 1);
    ctx.fillText("待ちなさい！", 0, 1);
    ctx.rotate(0.13);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
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
      ctx.fillText(state.mode === "clear" ? "ゲームクリア" : "ゲームオーバー", WIDTH / 2, HEIGHT / 2 - 12);
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
    return window.YOKOSHOOT_MATH.distance(a, b);
  }

  function clamp(value, min, max) {
    return window.YOKOSHOOT_MATH.clamp(value, min, max);
  }

  function getMovementInput() {
    let x = touchInput.moveX;
    let y = touchInput.moveY;
    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) x -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) x += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) y -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) y += 1;
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  function isChargePressed() {
    return state.keys.has("Space") || touchInput.attackPointerId !== null;
  }

  function syncAttackButtonState() {
    if (!attackButton) return;
    const progress = clamp(state.player.chargeTime / CHARGE_SECONDS, 0, 1);
    attackButton.style.setProperty("--charge-progress", `${progress * 100}%`);
    attackButton.classList.toggle("charging", isChargePressed());
    attackButton.classList.toggle("ready", progress >= 1 && state.player.dashCooldown <= 0);
  }

  function updateMovePad(event) {
    const bounds = movePad.getBoundingClientRect();
    const maxDistance = bounds.width * 0.32;
    let x = event.clientX - (bounds.left + bounds.width / 2);
    let y = event.clientY - (bounds.top + bounds.height / 2);
    const distanceFromCenter = Math.hypot(x, y);
    if (distanceFromCenter > maxDistance) {
      x = (x / distanceFromCenter) * maxDistance;
      y = (y / distanceFromCenter) * maxDistance;
    }
    touchInput.moveX = x / maxDistance;
    touchInput.moveY = y / maxDistance;
    moveThumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  function resetMovePad() {
    touchInput.movePointerId = null;
    touchInput.moveX = 0;
    touchInput.moveY = 0;
    if (moveThumb) moveThumb.style.transform = "translate(-50%, -50%)";
  }

  function resetTouchInput() {
    resetMovePad();
    touchInput.attackPointerId = null;
    state.player.wasCharging = false;
    state.player.chargeTime = 0;
    state.player.chargeReadySoundPlayed = false;
    syncAttackButtonState();
  }

  function setupTouchControls() {
    if (!touchControlsEnabled || !mobileControls || !movePad || !moveThumb || !attackButton) return;

    movePad.addEventListener("pointerdown", (event) => {
      if (touchInput.movePointerId !== null) return;
      event.preventDefault();
      touchInput.movePointerId = event.pointerId;
      movePad.setPointerCapture(event.pointerId);
      updateMovePad(event);
    });
    movePad.addEventListener("pointermove", (event) => {
      if (event.pointerId !== touchInput.movePointerId) return;
      event.preventDefault();
      updateMovePad(event);
    });
    for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
      movePad.addEventListener(eventName, (event) => {
        if (event.pointerId !== touchInput.movePointerId) return;
        resetMovePad();
      });
    }

    attackButton.addEventListener("pointerdown", (event) => {
      if (touchInput.attackPointerId !== null) return;
      event.preventDefault();
      touchInput.attackPointerId = event.pointerId;
      state.player.wasCharging = true;
      attackButton.setPointerCapture(event.pointerId);
      syncAttackButtonState();
    });
    attackButton.addEventListener("pointerup", (event) => {
      if (event.pointerId !== touchInput.attackPointerId) return;
      event.preventDefault();
      touchInput.attackPointerId = null;
      releaseCharge();
    });
    for (const eventName of ["pointercancel", "lostpointercapture"]) {
      attackButton.addEventListener(eventName, (event) => {
        if (event.pointerId !== touchInput.attackPointerId) return;
        touchInput.attackPointerId = null;
        state.player.wasCharging = false;
        state.player.chargeTime = 0;
        state.player.chargeReadySoundPlayed = false;
        syncAttackButtonState();
      });
    }
  }

  function setupMobileSafariZoomGuard() {
    if (!touchControlsEnabled) return;
    let multiTouchGestureActive = false;
    const preventSingleTouchDefault = (event) => {
      if (gameScreen.hidden || !gameScreen.contains(event.target)) return;
      if (event.touches && event.touches.length > 1) {
        multiTouchGestureActive = true;
        return;
      }
      if (multiTouchGestureActive) {
        if (!event.touches || event.touches.length === 0) multiTouchGestureActive = false;
        return;
      }
      event.preventDefault();
    };
    for (const eventName of ["touchstart", "touchmove", "touchend"]) {
      gameScreen.addEventListener(eventName, preventSingleTouchDefault, { passive: false });
    }
  }

  function tryEnterMobileFullscreen() {
    if (!touchControlsEnabled || !document.documentElement.requestFullscreen) return;
    document.documentElement.requestFullscreen()
      .then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      })
      .catch(() => {});
  }

  function returnToTitle() {
    state.mode = "title";
    gameScreen.hidden = true;
    titleScreen.hidden = false;
    resetTouchInput();
  }

  function resetAllInput() {
    state.keys.clear();
    resetTouchInput();
  }

  function handleOrientationChange() {
    if (touchControlsEnabled) resetAllInput();
  }

  /* DEV_DEBUG_ONLY_START */
  async function setupLocalDebugStart() {
    if (!debugStartPanel || !debugStageSelect || !debugPhaseSelect || !debugStartButton) return;
    const response = await fetch("local-debug-config.json", { cache: "no-store" }).catch(() => null);
    if (!response || !response.ok) return;
    const config = await response.json().catch(() => null);
    if (!config || config.enabled !== true) return;
    debugStartPanel.hidden = false;
    debugStartButton.addEventListener("click", () => {
      startGame({
        stage: debugStageSelect.value,
        phase: debugPhaseSelect.value,
      });
    });
  }

  setupLocalDebugStart();
  /* DEV_DEBUG_ONLY_END */

  setupTouchControls();
  setupMobileSafariZoomGuard();
  startButton.addEventListener("click", () => {
    tryEnterMobileFullscreen();
    startGame();
  });
  dialogueNext.addEventListener("click", advanceDialogue);
  dialogueBox.addEventListener("pointerdown", (event) => {
    if (!touchControlsEnabled || state.mode !== "dialogue") return;
    event.preventDefault();
    advanceDialogue();
  });
  gameScreen.addEventListener("pointerdown", (event) => {
    if (!touchControlsEnabled || (state.mode !== "clear" && state.mode !== "gameOver")) return;
    if (event.target !== canvas && event.target !== gameScreen) return;
    returnToTitle();
  });
  window.addEventListener("blur", resetAllInput);
  portraitOrientation.addEventListener("change", handleOrientationChange);

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    if ((state.mode === "clear" || state.mode === "gameOver") && event.code === "Enter") {
      returnToTitle();
      return;
    }
    state.keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.code);
    if (event.code === "Space") releaseCharge();
  });
})();
