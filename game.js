(function () {
  "use strict";

  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const startButton = document.getElementById("start-button");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const dialogueBox = document.getElementById("dialogue-box");
  const speakerName = document.getElementById("speaker-name");
  const dialogueLine = document.getElementById("dialogue-line");
  const dialogueNext = document.getElementById("dialogue-next");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const PLAYER_FIRE_INTERVAL = 1 / 3;
  const PLAYER_RADIUS = 15;
  const DIALOGUE_AUTO_SECONDS = 2.4;
  const CHARGE_SECONDS = 1;
  const PLAYER_SPEED = 285;
  const DASH_SPEED = PLAYER_SPEED * 3;
  const DASH_DAMAGE = 9;
  const DASH_COOLDOWN_SECONDS = 4;

  const phasePlan = {
    wave1: 15,
    wave2: 7,
    midBossTarget: 20,
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
      chargeTime: 0,
      dashCooldown: 0,
      wasCharging: false,
      dashState: "none",
      dashOrigin: { x: 86, y: HEIGHT / 2 },
      dashHits: new Set(),
      trail: [],
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
    resetGame();
    titleScreen.hidden = true;
    gameScreen.hidden = false;
    dialogueBox.hidden = true;
    window.requestAnimationFrame(loop);
  }

  function startDialogue(kind, nextPhase) {
    state.mode = "dialogue";
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
    if (state.dialogueTimer >= DIALOGUE_AUTO_SECONDS) {
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
    };
  }

  function shootKnife() {
    state.knives.push({
      x: state.player.x + 22,
      y: state.player.y,
      vx: 640,
      r: 6,
    });
  }

  function spawnEnemy() {
    const y = 76 + Math.random() * (HEIGHT - 152);
    state.waveSpawnCounts[state.phase] += 1;
    state.enemies.push({
      id: state.nextEnemyId,
      x: WIDTH + 28,
      y,
      vx: -115 - Math.random() * 55,
      r: 18,
      fireTimer: 0.45 + Math.random() * 0.8,
      wave: state.phase,
      spawnIndex: state.waveSpawnCounts[state.phase],
      usedSpecial: false,
    });
    state.nextEnemyId += 1;
  }

  function enemyShoot(enemy, speed) {
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
    tennisBallAtAngle(enemy, speed, 30);
    tennisBallAtAngle(enemy, speed, 330);
  }

  function shootEightWay(enemy, speed) {
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
      enemy.vx = Math.abs(enemy.vx);
    } else {
      shootStraightTwoWay(enemy, 230);
      enemy.usedSpecial = true;
      enemy.vx = Math.abs(enemy.vx);
    }
  }

  function bossShoot(dt) {
    const boss = state.boss;
    boss.fireTimer -= dt;
    boss.moveTimer += dt;
    boss.y = HEIGHT / 2 + Math.sin(boss.moveTimer * 1.9) * 120;
    if (boss.fireTimer > 0) return;

    if (boss.rank === 0) {
      boss.fireTimer = 0.62;
      enemyShoot(boss, 245);
      return;
    }

    boss.changed = boss.hp <= phasePlan.bossPhaseTarget;
    boss.fireTimer = boss.changed ? 0.32 : 0.52;
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
      return;
    }
    if (state.mode !== "playing") return;
    state.elapsed += dt;
    state.phaseTime += dt;
    state.fireCooldown -= dt;
    state.player.invincible = Math.max(0, state.player.invincible - dt);
    state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt);

    updatePlayer(dt);
    updatePhase(dt);
    updateKnives(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateParticles(dt);
    checkCollisions();
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
    state.player.x = clamp(state.player.x + (dx / len) * speed * dt, 34, WIDTH * 0.48);
    state.player.y = clamp(state.player.y + (dy / len) * speed * dt, 34, HEIGHT - 34);

    updateCharge(dt);

    if (state.keys.has("KeyZ") && state.fireCooldown <= 0) {
      shootKnife();
      state.fireCooldown = PLAYER_FIRE_INTERVAL;
    }
  }

  function updateCharge(dt) {
    const charging = state.keys.has("Space");
    if (charging) {
      state.player.chargeTime += dt;
      state.player.wasCharging = true;
      return;
    }
    state.player.wasCharging = false;
    state.player.chargeTime = 0;
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
  }

  function startDash() {
    state.player.dashState = "dash";
    state.player.dashOrigin = { x: state.player.x, y: state.player.y };
    state.player.dashHits = new Set();
    state.player.trail = [];
    state.player.invincible = 999;
    state.player.dashCooldown = DASH_COOLDOWN_SECONDS;
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
    } else if (state.phase === "midBoss" || state.phase === "boss") {
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

  function updateKnives(dt) {
    for (const knife of state.knives) knife.x += knife.vx * dt;
    state.knives = state.knives.filter((knife) => knife.x < WIDTH + 32);
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      enemy.x += enemy.vx * dt;
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
        state.boss.hp -= 1;
        burst(knife.x, knife.y, "#ffffff", 5);
        if (state.boss.rank === 1 && state.boss.hp === phasePlan.bossPhaseTarget) {
          state.message = "つばめの攻撃が激しくなった！";
        }
        if (state.boss.hp <= 0) defeatBoss();
      }
    }

    state.knives = state.knives.filter((knife) => !knife.dead);
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);

    if (state.player.invincible <= 0) {
      for (const ball of state.enemyBullets) {
        if (distance(ball, state.player) < ball.r + PLAYER_RADIUS) {
          ball.dead = true;
          damagePlayer();
          break;
        }
      }
      for (const enemy of state.enemies) {
        if (distance(enemy, state.player) < enemy.r + PLAYER_RADIUS) {
          enemy.dead = true;
          damagePlayer();
          break;
        }
      }
    }
    state.enemyBullets = state.enemyBullets.filter((ball) => !ball.dead);
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
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
      state.boss.hp -= DASH_DAMAGE;
      burst(state.boss.x, state.boss.y, "#7ee8ff", 24);
      if (state.boss.rank === 1 && state.boss.hp <= phasePlan.bossPhaseTarget && !state.boss.changed) {
        state.message = "つばめの攻撃が激しくなった！";
      }
      if (state.boss.hp <= 0) defeatBoss();
    }
  }

  function defeatBoss() {
    burst(state.boss.x, state.boss.y, "#7ee8ff", 34);
    if (state.phase === "midBoss") {
      setPhase("wave2");
      return;
    }
    state.mode = "clear";
    state.message = "1面クリア";
  }

  function damagePlayer() {
    state.player.lives -= 1;
    state.player.invincible = 1.4;
    burst(state.player.x, state.player.y, "#ff5278", 18);
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
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, "#f09952");
    grad.addColorStop(0.42, "#27314d");
    grad.addColorStop(1, "#101522");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(32, 39, 58, 0.9)";
    ctx.fillRect(0, 92, WIDTH, 130);
    for (let x = 30; x < WIDTH; x += 84) {
      ctx.fillStyle = "rgba(255, 205, 120, 0.42)";
      ctx.fillRect(x, 112, 42, 58);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    for (let x = -20; x < WIDTH; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, HEIGHT - 108);
      ctx.lineTo(x + 70, HEIGHT);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(36, 103, 64, 0.78)";
    ctx.fillRect(0, HEIGHT - 116, WIDTH, 116);
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.strokeRect(120, HEIGHT - 96, WIDTH - 240, 70);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, HEIGHT - 96);
    ctx.lineTo(WIDTH / 2, HEIGHT - 26);
    ctx.stroke();
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
    const flicker = state.player.invincible > 0 && Math.floor(state.elapsed * flickerRate) % 2 === 0;
    if (flicker) return;
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    if (state.player.chargeTime >= CHARGE_SECONDS && !dashActive) {
      const pulse = 20 + Math.sin(state.elapsed * 12) * 5;
      ctx.strokeStyle = "rgba(126, 232, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 8, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(248, 216, 74, 0.78)";
      ctx.beginPath();
      ctx.arc(0, 8, pulse + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#090b12";
    ctx.beginPath();
    ctx.arc(0, -12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#11131f";
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(10, 30);
    ctx.lineTo(-12, 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(14, 8);
    ctx.stroke();
    ctx.fillStyle = "#ff5278";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(34, 8);
    ctx.lineTo(14, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawDashCooldownGauge();
  }

  function drawDashCooldownGauge() {
    if (state.player.dashCooldown <= 0 || state.player.dashState !== "none") return;
    const x = state.player.x - 22;
    const y = state.player.y - 56;
    const ratio = state.player.dashCooldown / DASH_COOLDOWN_SECONDS;
    ctx.fillStyle = "rgba(5, 7, 18, 0.72)";
    ctx.fillRect(x, y, 44, 6);
    ctx.fillStyle = "#7ee8ff";
    ctx.fillRect(x, y, 44 * ratio, 6);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 44, 6);
  }

  function drawKnives() {
    for (const knife of state.knives) {
      ctx.fillStyle = "#eef5ff";
      ctx.beginPath();
      ctx.moveTo(knife.x + 14, knife.y);
      ctx.lineTo(knife.x - 8, knife.y - 5);
      ctx.lineTo(knife.x - 4, knife.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#343847";
      ctx.fillRect(knife.x - 14, knife.y - 2, 8, 4);
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      ctx.fillStyle = "#f3f7ff";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6cd68a";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(enemy.x + 8, enemy.y - 2, 16, -0.9, 1.1);
      ctx.stroke();
      ctx.fillStyle = "#f8d84a";
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBoss() {
    const boss = state.boss;
    if (!boss) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.fillStyle = boss.rank ? "#ffffff" : "#f3f7ff";
    ctx.beginPath();
    ctx.arc(0, -20, boss.rank ? 22 : 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = boss.changed ? "#ff5278" : "#6cd68a";
    ctx.fillRect(-32, -2, 64, 58);
    ctx.strokeStyle = "#f8d84a";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(-2, 10, boss.rank ? 48 : 38, -0.7, 0.9);
    ctx.stroke();
    ctx.fillStyle = "#f8d84a";
    ctx.beginPath();
    ctx.arc(-20, -28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemyBullets() {
    for (const ball of state.enemyBullets) {
      ctx.fillStyle = "#d8fb4b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r - 2, -0.9, 0.9);
      ctx.stroke();
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
