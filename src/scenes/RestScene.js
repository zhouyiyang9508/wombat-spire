// RestScene.js - Rest node: heal or upgrade card
export class RestScene extends Phaser.Scene {
  constructor() {
    super('RestScene');
  }

  init(data) {
    this.mapData = data;
    this.player = data.player;
    this.deck = data.deck;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(w / 2, 80, '🔥 休息点', {
      fontSize: '32px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 130, '篝火温暖，你可以选择...', {
      fontSize: '18px', color: '#888', fontFamily: 'serif',
    }).setOrigin(0.5);

    // HP info
    this.add.text(w / 2, 170, `❤️ ${this.player.hp}/${this.player.maxHp}`, {
      fontSize: '20px', color: '#ff8888', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Option 1: Heal
    const healAmount = Math.floor(this.player.maxHp * 0.3);
    const healBtn = this.add.text(w / 2, 250, `😴 休息 - 恢复 ${healAmount} HP`, {
      fontSize: '22px', color: '#66ff66', fontFamily: 'serif',
      backgroundColor: '#1a331a', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    healBtn.on('pointerover', () => healBtn.setScale(1.05));
    healBtn.on('pointerout', () => healBtn.setScale(1));
    healBtn.on('pointerdown', () => {
      this.player.heal(healAmount);
      this._showResult(`恢复了 ${healAmount} HP\n❤️ ${this.player.hp}/${this.player.maxHp}`);
    });

    // Option 2: Upgrade card
    const upgradeBtn = this.add.text(w / 2, 340, '⬆️ 升级一张卡牌', {
      fontSize: '22px', color: '#ffcc44', fontFamily: 'serif',
      backgroundColor: '#332a1a', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    upgradeBtn.on('pointerover', () => upgradeBtn.setScale(1.05));
    upgradeBtn.on('pointerout', () => upgradeBtn.setScale(1));
    upgradeBtn.on('pointerdown', () => this._showUpgradeSelection());
  }

  _showUpgradeSelection() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(w / 2, 40, '选择要升级的卡牌', {
      fontSize: '22px', color: '#ffcc44', fontFamily: 'serif',
    }).setOrigin(0.5);

    const upgradeable = this.deck.filter(c => c.upgraded && !c.isUpgraded);
    if (upgradeable.length === 0) {
      this.add.text(w / 2, h / 2, '没有可升级的卡牌', {
        fontSize: '18px', color: '#888', fontFamily: 'serif',
      }).setOrigin(0.5);
      this.time.delayedCall(1500, () => this.scene.start('MapScene', this.mapData));
      return;
    }

    let x = 60, y = 90;
    upgradeable.forEach(card => {
      const upg = card.upgraded;
      const btn = this.add.text(x, y, `${card.name}\n${card.desc}\n→ ${upg.desc}`, {
        fontSize: '13px', color: '#ccc', fontFamily: 'serif',
        backgroundColor: '#1a1a2e', padding: { x: 10, y: 8 },
        wordWrap: { width: 170 },
      }).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#ffcc44'));
      btn.on('pointerout', () => btn.setColor('#ccc'));
      btn.on('pointerdown', () => {
        // Apply upgrade
        card.desc = upg.desc;
        card.effect = { ...upg.effect };
        card.isUpgraded = true;
        card.name = card.name + '+';
        this._showResult(`${card.name} 升级成功！\n${card.desc}`);
      });

      x += 190;
      if (x > w - 100) { x = 60; y += 100; }
    });

    const cancel = this.add.text(w / 2, h - 50, '返回', {
      fontSize: '18px', color: '#aaa', fontFamily: 'serif',
      backgroundColor: '#222', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => this.scene.restart(this.mapData));
  }

  _showResult(text) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(w / 2, h / 2 - 40, text, {
      fontSize: '22px', color: '#e8d5a3', fontFamily: 'serif',
      align: 'center',
    }).setOrigin(0.5);

    const cont = this.add.text(w / 2, h / 2 + 60, '继续 →', {
      fontSize: '20px', color: '#66ff66', fontFamily: 'serif',
      backgroundColor: '#1a331a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    cont.on('pointerdown', () => this.scene.start('MapScene', this.mapData));
  }
}
