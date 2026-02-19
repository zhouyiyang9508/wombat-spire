// BreakthroughScene.js - Realm breakthrough animation
export class BreakthroughScene extends Phaser.Scene {
  constructor() {
    super('BreakthroughScene');
  }

  init(data) {
    this.mapData = data;
    this.player = data.player;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a12');

    const allRelics = this.cache.json.get('relics');
    const oldRealm = this.player.realm;
    const result = this.player.breakthrough(allRelics);
    const newRealm = this.player.realm;

    // Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0xffcc44, 0.8);
    flash.fillRect(0, 0, w, h);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
    });

    // Particles-like effect (circles expanding)
    for (let i = 0; i < 12; i++) {
      const circle = this.add.graphics();
      circle.fillStyle(0xffdd66, 0.6);
      circle.fillCircle(w / 2, h / 2, 5);
      this.tweens.add({
        targets: circle,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 300,
        alpha: 0,
        scaleX: 3,
        scaleY: 3,
        duration: 1500 + Math.random() * 1000,
        ease: 'Power2',
      });
    }

    // Text
    this.time.delayedCall(800, () => {
      this.add.text(w / 2, h / 2 - 80, '⚡ 境界突破 ⚡', {
        fontSize: '36px', color: '#ffdd44', fontFamily: 'serif',
      }).setOrigin(0.5);

      this.add.text(w / 2, h / 2 - 20, `${oldRealm} → ${newRealm}`, {
        fontSize: '28px', color: '#ffffff', fontFamily: 'serif',
      }).setOrigin(0.5);

      this.add.text(w / 2, h / 2 + 40, result.bonusText, {
        fontSize: '20px', color: '#88ff88', fontFamily: 'serif',
        wordWrap: { width: 500 }, align: 'center',
      }).setOrigin(0.5);

      const cont = this.add.text(w / 2, h / 2 + 120, '继续 →', {
        fontSize: '22px', color: '#66ff66', fontFamily: 'serif',
        backgroundColor: '#1a331a', padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      cont.on('pointerdown', () => {
        this.scene.start('MapScene', this.mapData);
      });
    });
  }
}
