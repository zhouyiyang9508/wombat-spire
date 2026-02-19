// VictoryScene.js - Final victory screen
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.player = data.player;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a12');

    // Celebratory flash
    const flash = this.add.graphics();
    flash.fillStyle(0xffdd44, 0.6);
    flash.fillRect(0, 0, w, h);
    this.tweens.add({ targets: flash, alpha: 0, duration: 2000 });

    this.add.text(w / 2, h / 2 - 100, '🏆 通关！', {
      fontSize: '48px', color: '#ffdd44', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2 - 30, '你成功登顶修仙塔！', {
      fontSize: '24px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    const stats = [
      `境界: ${this.player.realm}`,
      `❤️ HP: ${this.player.hp}/${this.player.maxHp}`,
      `💰 灵石: ${this.player.gold}`,
      `🏺 法宝: ${this.player.relics.map(r => r.icon + r.name).join(', ') || '无'}`,
    ].join('\n');

    this.add.text(w / 2, h / 2 + 50, stats, {
      fontSize: '16px', color: '#aaa', fontFamily: 'serif',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    const restart = this.add.text(w / 2, h / 2 + 170, '重新开始', {
      fontSize: '22px', color: '#66ccff', fontFamily: 'serif',
      backgroundColor: '#1a1a30', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
