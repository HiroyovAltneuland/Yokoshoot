// Gameplay tuning lives here. Keep rendering-only values in game.js.
window.YOKOSHOOT_CONFIG = {
  dialogue: {
    autoSeconds: 2.4,
    midBossExtraSeconds: 1,
  },

  player: {
    life: 5,
    maxLife: 5,
    bossDefeatLifeRecovery: 2,
    lifeWipeSeconds: 0.42,
    lifeRecoveryStepSeconds: 0.62,
    moveSpeed: 285,
    knockbackDistance: 44,
    hitInvincibleSeconds: 1.4,
    fireRatePerSecond: 6,
    knifeSpeed: 640,
    aimAngleDegrees: 25.714,
    upAimChainSeconds: 0.3,
    upAimAcquireAngleDegrees: 50,
    upAimHomingSeconds: 0.45,
    upAimTurnDegreesPerSecond: 140,
    upAimMaxTargetDistance: 560,
    flinchSeconds: 0.5,
    dash: {
      chargeSeconds: 1,
      speedMultiplier: 3,
      damage: 9,
      cooldownSeconds: 4,
    },
  },

  score: {
    enemyDefeat: 100,
  },

  stages: {
    1: {
      wave1Seconds: 15,
      wave2Seconds: 7,
      wave1SpawnInterval: 1.35,
      wave2SpawnInterval: 1.05,
      midBossHp: 20,
      midBossRetreatDamage: 10,
      bossPhaseChangeHp: 15,
      bossHp: 25,
    },
    2: {
      wave1Seconds: 23,
      wave2Seconds: 12,
      wave1SpawnInterval: 1.6,
      wave2SpawnInterval: 1.25,
      midBossHp: 24,
      bossPhaseChangeHp: 18,
      bossHp: 32,
    },
  },

  enemies: {
    twintail: {
      hp: 3,
      moveSpeed: 265,
    },
    visorGlasses: {
      hp: 3,
      moveSpeed: 265,
    },
    droneA: {
      hp: 1,
      moveSpeedMin: 115,
      moveSpeedMax: 170,
      firstShotMinSeconds: 0.45,
      firstShotMaxSeconds: 1.25,
      shotIntervalMinSeconds: 1.55,
      shotIntervalMaxSeconds: 2.45,
      bulletSpeed: 230,
    },
    droneB: {
      hp: 1,
      moveSpeedMin: 115,
      moveSpeedMax: 170,
      firstShotMinSeconds: 0.45,
      firstShotMaxSeconds: 1.25,
      shotIntervalMinSeconds: 1.55,
      shotIntervalMaxSeconds: 2.45,
      bulletSpeed: 230,
      radialBulletSpeed: 175,
    },
    cleaningRobot: {
      hp: 1,
      chargeSpeed: 335,
      windupSeconds: 0.72,
      zigzagSpeed: 112,
    },
    barrageRobot: {
      hp: 1,
      moveSpeedMin: 120,
      moveSpeedMax: 145,
      firstShotMinSeconds: 0.55,
      firstShotMaxSeconds: 0.55,
    },
    disciplineRobot: {
      hp: 1,
      moveSpeedMin: 135,
      moveSpeedMax: 175,
      firstShotMinSeconds: 0.45,
      firstShotMaxSeconds: 1.25,
      shotIntervalMinSeconds: 1.55,
      shotIntervalMaxSeconds: 2.45,
      jumpSeconds: 1.1,
      jumpHeight: 82,
      shinaiSpeedX: 230,
      shinaiSpeedY: 235,
      shinaiGravity: 430,
    },
    glassesEnforcer: {
      hp: 3,
      moveSpeed: 265,
      speechBubbleIntervalSeconds: 1.05,
      speechBubbleSpeed: 345,
      soloShotIntervalSeconds: 0.8,
      soloBulletSpeed: 185,
    },
    yankeeEnforcer: {
      hp: 3,
      moveSpeed: 265,
      soloShotIntervalSeconds: 0.8,
      soloBulletSpeed: 185,
    },
  },

  bosses: {
    stage1MidBoss: {
      shotIntervalSeconds: 0.62,
      bulletSpeed: 245,
    },
    stage1Boss: {
      normalShotIntervalSeconds: 0.52,
      poweredShotIntervalSeconds: 0.32,
      normalBulletSpeed: 240,
      poweredBulletSpeed: 275,
    },
    ritsuko: {
      poweredHp: 9,
      normalShotIntervalSeconds: 0.72,
      poweredShotIntervalSeconds: 0.52,
      bulletSpeed: 245,
      bulletSpeedStep: 12,
      reinforcementPauseSeconds: 1.2,
    },
    sayo: {
      shockwaveIntervalSeconds: 0.72,
      dashIntervalSeconds: 4,
      dashForwardSpeed: 540,
      dashReturnSpeed: 250,
    },
  },

  dialogues: {
    midBoss: [
      { speaker: "朝比奈 つばめ", line: "ここから先はテニス部のコートよ。無断で通すわけないでしょ。" },
    ],
    boss: [
      { speaker: "朝比奈 つばめ", line: "まだ立ってるなんてね。次は本気のスマッシュで沈める。" },
      { speaker: "黒羽 凛", line: "御門院へ続く道を、あなたで止めるつもりはない。" },
    ],
    bossDefeated: [
      { speaker: "朝比奈 つばめ", line: "参ったわ。先へ行きなさい。" },
      { speaker: "黒羽 凛", line: "じゃあ、通らせてもらう。" },
    ],
    stage2MidBoss: [
      { speaker: "鬼塚 律子", line: "刃物は校則違反！真琴様のところへは行かせない" },
    ],
    stage2Boss: [
      { speaker: "一文字 小夜", line: "あの女のところは、私との決着つけてから行け！" },
      { speaker: "黒羽 凛", line: "5回は着いてるとおもうけど、決着" },
      { speaker: "一文字 小夜", line: "もう1回くらい着けてけ！" },
    ],
    stage2BossDefeated: [
      { speaker: "一文字 小夜", line: "くそっ、今度こそ決着ついたと思うなよ！" },
      { speaker: "黒羽 凛", line: "それ、前も聞いた。" },
    ],
    finalBossDefeated: [
      { speaker: "黒羽 凛", line: "これで終わり。" },
    ],
  },
};
