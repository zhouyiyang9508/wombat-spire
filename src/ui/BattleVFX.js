// BattleVFX.js - Battle visual effects (Phase 5)
export class BattleVFX {
  constructor(scene) {
    this.scene = scene;
  }

  // Sword slash effect - flying sword trajectory
  swordSlash(fromX, fromY, toX, toY) {
    const scene = this.scene;
    // Create sword line
    const sword = scene.add.text(fromX, fromY, '⚔️', { fontSize: '24px' }).setDepth(100);
    scene.tweens.add({
      targets: sword,
      x: toX, y: toY,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this._impactFlash(toX, toY, 0xffffff, 0.6);
        sword.destroy();
      }
    });
    // Trail particles
    this._trailParticles(fromX, fromY, toX, toY, 0x88ccff, 8);
  }

  // Fire explosion effect
  fireExplosion(x, y) {
    const scene = this.scene;
    const colors = [0xff4400, 0xff8800, 0xffcc00];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 30 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = scene.add.circle(x, y, 4 + Math.random() * 3, color, 0.9).setDepth(100);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2, scaleY: 0.2,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
    this._impactFlash(x, y, 0xff6600, 0.8);
  }

  // Ice freeze effect
  iceFreeze(x, y) {
    const scene = this.scene;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 25 + Math.random() * 15;
      const p = scene.add.circle(x, y, 3 + Math.random() * 2, 0x88ddff, 0.8).setDepth(100);
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
    // Ice crystal text
    const ice = scene.add.text(x, y - 20, '❄️', { fontSize: '28px' }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({
      targets: ice, alpha: 0, y: y - 50, scaleX: 1.5, scaleY: 1.5,
      duration: 600, onComplete: () => ice.destroy()
    });
  }

  // Poison cloud effect
  poisonCloud(x, y) {
    const scene = this.scene;
    for (let i = 0; i < 10; i++) {
      const ox = (Math.random() - 0.5) * 60;
      const oy = (Math.random() - 0.5) * 40;
      const size = 6 + Math.random() * 8;
      const p = scene.add.circle(x + ox, y + oy, size, 0x44cc44, 0.15 + Math.random() * 0.2).setDepth(100);
      scene.tweens.add({
        targets: p,
        y: p.y - 20 - Math.random() * 20,
        alpha: 0,
        scaleX: 1.5, scaleY: 1.5,
        duration: 800 + Math.random() * 400,
        ease: 'Sine.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  // Shield gain effect
  shieldGain(x, y) {
    const scene = this.scene;
    const shield = scene.add.circle(x, y, 30, 0x4488ff, 0.4).setDepth(99);
    scene.tweens.add({
      targets: shield,
      scaleX: 1.6, scaleY: 1.6, alpha: 0,
      duration: 500, ease: 'Cubic.easeOut',
      onComplete: () => shield.destroy()
    });
  }

  // Generic damage hit
  damageHit(x, y) {
    this._impactFlash(x, y, 0xff4444, 0.7);
    // Shake
    this.scene.cameras.main.shake(80, 0.005);
  }

  // Heal effect
  healEffect(x, y) {
    const scene = this.scene;
    const txt = scene.add.text(x, y, '✨', { fontSize: '24px' }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({
      targets: txt, y: y - 40, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 600, onComplete: () => txt.destroy()
    });
  }

  // Damage number floating up
  damageNumber(x, y, amount, color = '#ff4444') {
    const txt = this.scene.add.text(x, y, `-${amount}`, {
      fontSize: '22px', color, fontFamily: 'serif', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101);
    this.scene.tweens.add({
      targets: txt, y: y - 40, alpha: 0,
      duration: 800, ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  // Internal helpers
  _impactFlash(x, y, color, alpha) {
    const flash = this.scene.add.circle(x, y, 20, color, alpha).setDepth(100);
    this.scene.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 300, onComplete: () => flash.destroy()
    });
  }

  _trailParticles(fromX, fromY, toX, toY, color, count) {
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const x = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 10;
      const y = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 10;
      const p = this.scene.add.circle(x, y, 2, color, 0.6).setDepth(99);
      this.scene.tweens.add({
        targets: p, alpha: 0, scaleX: 0.3, scaleY: 0.3,
        delay: t * 200,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }
  }
}
