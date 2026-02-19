// BootScene.js - Load assets and data
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.add.text(w / 2, h / 2, '载入中...', {
      fontSize: '28px', color: '#cccccc', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.load.json('cards', 'src/data/cards.json');
    this.load.json('enemies', 'src/data/enemies.json');
    this.load.json('relics', 'src/data/relics.json');
    this.load.json('events', 'src/data/events.json');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
