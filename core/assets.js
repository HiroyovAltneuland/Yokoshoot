(function () {
  "use strict";

  const IMAGE_SOURCES = {
    playerSprite: "assets/rin-sprite-sheet.png",
    tsubameBossSprite: "assets/tsubame-boss-sprite-sheet.png",
    ritsukoBossSprite: "assets/ritsuko-boss-sprite-sheet.png",
    sayoBossSprite: "assets/sayo-boss-sprite-sheet.png",
    stageOneEnemySprite: "assets/stage1-enemy-sprite-sheet.png",
    stageTwoEnemySprite: "assets/stage2-enemy-sprite-sheet.png",
    stageOneBackground: "assets/stage1-background-concept.png",
    stageTwoBackground: "assets/stage2-background-concept.png",
    lifeScarfIcon: "assets/hud-life-scarf.png",
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
