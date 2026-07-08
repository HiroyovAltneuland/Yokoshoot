(function () {
  "use strict";

  const IMAGE_SOURCES = {
    playerSprite: "assets/rin-sprite-sheet.png",
    tsubameBossSprite: "assets/tsubame-boss-sprite-sheet.png",
    ritsukoBossSprite: "assets/ritsuko-boss-sprite-sheet.png",
    sayoBossSprite: "assets/sayo-boss-sprite-sheet.png",
    masumiBossSprite: "assets/masumi-midboss-sprite-sheet.png",
    masumiBoundaryFragmentSprite: "assets/masumi-boundary-fragment-sprite-sheet.png",
    sakuyaBossSprite: "assets/sakuya-boss-sprite-sheet.png",
    stageOneEnemySprite: "assets/stage1-enemy-sprite-sheet.png",
    stageTwoEnemySprite: "assets/stage2-enemy-sprite-sheet.png",
    stageTwoReinforcementSprite: "assets/stage2-reinforcement-sprite-sheet.png",
    stageTwoGlassesEnforcerRun6Sprite: "assets/stage2-glasses-enforcer-run6-sprite-sheet.png",
    stageOneBackground: "assets/stage1-background-concept.png",
    stageTwoBackground: "assets/stage2-background-concept.png",
    stageThreeCorridorBackground: "assets/stage3-corridor-background.png",
    stageThreeDoorBackground: "assets/stage3-door-background.png",
    stageThreeHallBackground: "assets/stage3-hall-background.png",
    lifeScarfIcon: "assets/hud-life-scarf.png",
    wakizashiSprite: "assets/wakizashi-sprite.png",
    tachiSprite: "assets/tachi-sprite.png",
  };

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function createImages() {
    return Object.fromEntries(
      Object.entries(IMAGE_SOURCES).map(([name, src]) => [name, loadImage(src)])
    );
  }

  window.YOKOSHOOT_ASSETS = {
    createImages,
  };
})();
