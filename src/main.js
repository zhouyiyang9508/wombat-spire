// main.js - Game entry point
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { MapScene } from './scenes/MapScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { RewardScene } from './scenes/RewardScene.js';
import { EventScene } from './scenes/EventScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { RestScene } from './scenes/RestScene.js';
import { BreakthroughScene } from './scenes/BreakthroughScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';

// 📱 Responsive canvas size based on screen orientation
const isMobile = window.innerWidth < 768;
const isPortrait = window.innerHeight > window.innerWidth;

// Mobile portrait: reduce canvas height to fit cards in viewport
// Canvas 600×700 + card hand 140px = 840px total (fits most phones)
const config = {
  type: Phaser.AUTO,
  width: isMobile && isPortrait ? 600 : 900,
  height: isMobile && isPortrait ? 700 : 650,
  parent: 'game-container',
  backgroundColor: '#0a0a12',
  scene: [BootScene, MenuScene, MapScene, BattleScene, RewardScene, EventScene, ShopScene, RestScene, BreakthroughScene, VictoryScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
