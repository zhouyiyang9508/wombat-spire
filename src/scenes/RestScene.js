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

    // Pagination setup
    const cardsPerPage = 8;
    const cols = 4;
    const cardW = 200;
    const cardH = 120;
    const gapX = 16;
    const gapY = 16;
    const startY = 90;
    let page = 0;
    const totalPages = Math.ceil(upgradeable.length / cardsPerPage);

    const cardContainer = this.add.container(0, 0);

    const renderPage = () => {
      cardContainer.removeAll(true);
      const start = page * cardsPerPage;
      const pageCards = upgradeable.slice(start, start + cardsPerPage);
      const totalW = Math.min(pageCards.length, cols) * (cardW + gapX) - gapX;
      const baseX = (w - totalW) / 2;

      pageCards.forEach((card, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = baseX + col * (cardW + gapX);
        const cy = startY + row * (cardH + gapY);
        const upg = card.upgraded;

        const bg = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x1a1a2e)
          .setStrokeStyle(1, 0x444466);

        const nameText = this.add.text(cx + 8, cy + 6, card.name, {
          fontSize: '14px', color: '#ffcc44', fontFamily: 'serif', fontStyle: 'bold',
        });

        const descText = this.add.text(cx + 8, cy + 26, card.desc, {
          fontSize: '11px', color: '#aaa', fontFamily: 'serif',
          wordWrap: { width: cardW - 16 },
        });

        const arrowText = this.add.text(cx + 8, cy + 50, `→ ${upg.desc}`, {
          fontSize: '12px', color: '#66ff66', fontFamily: 'serif',
          wordWrap: { width: cardW - 16 },
        });

        const costText = this.add.text(cx + cardW - 8, cy + 6, `${card.cost}💎`, {
          fontSize: '12px', color: '#88aaff', fontFamily: 'serif',
        }).setOrigin(1, 0);

        const hitArea = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => bg.setFillStyle(0x2a2a4e));
        hitArea.on('pointerout', () => bg.setFillStyle(0x1a1a2e));
        hitArea.on('pointerdown', () => {
          card.desc = upg.desc;
          card.effect = { ...upg.effect };
          card.isUpgraded = true;
          card.name = card.name + '+';
          this._showResult(`${card.name} 升级成功！\n${card.desc}`);
        });

        cardContainer.add([bg, nameText, descText, arrowText, costText, hitArea]);
      });

      // Page indicator
      if (totalPages > 1) {
        const pageText = this.add.text(w / 2, startY + 2 * (cardH + gapY) + 20,
          `第 ${page + 1}/${totalPages} 页  (← →翻页)`, {
          fontSize: '14px', color: '#888', fontFamily: 'serif',
        }).setOrigin(0.5);
        cardContainer.add(pageText);
      }
    };

    renderPage();

    // Keyboard pagination
    if (totalPages > 1) {
      this.input.keyboard.on('keydown-LEFT', () => {
        if (page > 0) { page--; renderPage(); }
      });
      this.input.keyboard.on('keydown-RIGHT', () => {
        if (page < totalPages - 1) { page++; renderPage(); }
      });
    }

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
