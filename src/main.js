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

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 650,
  parent: 'game-container',
  backgroundColor: '#0a0a12',
  scene: [BootScene, MenuScene, MapScene, BattleScene, RewardScene, EventScene, ShopScene, RestScene, BreakthroughScene, VictoryScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
