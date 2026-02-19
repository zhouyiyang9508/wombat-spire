// ShopScene.js - Buy cards, relics, remove cards
export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
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

    const allCards = this.cache.json.get('cards');
    const allRelics = this.cache.json.get('relics');
    const discount = this.player.getShopDiscount() + (this.mapData.tempDiscount || 0);

    this.add.text(w / 2, 30, '💰 灵石商铺', {
      fontSize: '28px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.goldText = this.add.text(w / 2, 65, `灵石: ${this.player.gold}`, {
      fontSize: '18px', color: '#ffcc44', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Generate shop items: 4 cards + 2 relics
    const shopCards = this._pickRandom(allCards, 4);
    const availableRelics = allRelics.filter(r => !this.player.hasRelic(r.id));
    const shopRelics = this._pickRandom(availableRelics, Math.min(2, availableRelics.length));

    // Cards section
    this.add.text(50, 100, '📜 卡牌', {
      fontSize: '20px', color: '#ccc', fontFamily: 'serif',
    });

    let x = 80, y = 140;
    shopCards.forEach(card => {
      let price = this._cardPrice(card);
      price = Math.floor(price * (1 - discount));
      this._renderShopCard(card, price, x, y);
      x += 200;
    });

    // Relics section
    this.add.text(50, 310, '🏺 法宝', {
      fontSize: '20px', color: '#ccc', fontFamily: 'serif',
    });

    x = 80; y = 350;
    shopRelics.forEach(relic => {
      let price = Math.floor(relic.price * (1 - discount));
      this._renderShopRelic(relic, price, x, y);
      x += 280;
    });

    // Remove card option
    const removePrice = Math.floor(75 * (1 - discount));
    this.add.text(50, 470, '🗑️ 移除卡牌', {
      fontSize: '20px', color: '#ccc', fontFamily: 'serif',
    });

    const removeBtn = this.add.text(250, 470, `花费 ${removePrice} 灵石移除一张牌`, {
      fontSize: '16px', color: '#ff8888', fontFamily: 'serif',
      backgroundColor: '#331a1a', padding: { x: 12, y: 6 },
    }).setInteractive({ useHandCursor: true });

    removeBtn.on('pointerdown', () => {
      if (this.player.gold >= removePrice && this.deck.length > 5) {
        this._showCardRemoval(removePrice);
      }
    });

    // Leave button
    const leave = this.add.text(w / 2, h - 40, '离开商铺 →', {
      fontSize: '20px', color: '#66ff66', fontFamily: 'serif',
      backgroundColor: '#1a331a', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leave.on('pointerdown', () => {
      this.scene.start('MapScene', this.mapData);
    });
  }

  _cardPrice(card) {
    const prices = { common: 50, uncommon: 75, rare: 125 };
    return prices[card.rarity] || 60;
  }

  _renderShopCard(card, price, x, y) {
    const canBuy = this.player.gold >= price;
    const color = canBuy ? '#88ccff' : '#555';

    const box = this.add.text(x, y, `${card.name}\n${card.desc}\n💰${price}`, {
      fontSize: '13px', color, fontFamily: 'serif',
      backgroundColor: '#1a1a2e', padding: { x: 10, y: 8 },
      wordWrap: { width: 170 },
    }).setInteractive({ useHandCursor: canBuy });

    if (canBuy) {
      box.on('pointerover', () => box.setColor('#ffcc44'));
      box.on('pointerout', () => box.setColor('#88ccff'));
      box.on('pointerdown', () => {
        this.player.gold -= price;
        this.deck.push({ ...card });
        box.setText(`${card.name}\n✅ 已购买`);
        box.disableInteractive();
        box.setColor('#666');
        this.goldText.setText(`灵石: ${this.player.gold}`);
      });
    }
  }

  _renderShopRelic(relic, price, x, y) {
    const canBuy = this.player.gold >= price;
    const color = canBuy ? '#ffcc88' : '#555';

    const box = this.add.text(x, y, `${relic.icon} ${relic.name}\n${relic.desc}\n💰${price}`, {
      fontSize: '14px', color, fontFamily: 'serif',
      backgroundColor: '#1a2a1a', padding: { x: 10, y: 8 },
      wordWrap: { width: 240 },
    }).setInteractive({ useHandCursor: canBuy });

    if (canBuy) {
      box.on('pointerover', () => box.setColor('#ffff44'));
      box.on('pointerout', () => box.setColor('#ffcc88'));
      box.on('pointerdown', () => {
        this.player.gold -= price;
        this.player.addRelic(relic);
        box.setText(`${relic.icon} ${relic.name}\n✅ 已购买`);
        box.disableInteractive();
        box.setColor('#666');
        this.goldText.setText(`灵石: ${this.player.gold}`);
      });
    }
  }

  _showCardRemoval(price) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, w, h);

    this.add.text(w / 2, 40, '选择要移除的卡牌', {
      fontSize: '22px', color: '#ff8888', fontFamily: 'serif',
    }).setOrigin(0.5).setDepth(51);

    let x = 50, y = 80;
    this.deck.forEach((card, i) => {
      const btn = this.add.text(x, y, `${card.name}`, {
        fontSize: '14px', color: '#ccc', fontFamily: 'serif',
        backgroundColor: '#2a1a1a', padding: { x: 8, y: 4 },
      }).setDepth(51).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#ff4444'));
      btn.on('pointerout', () => btn.setColor('#ccc'));
      btn.on('pointerdown', () => {
        this.deck.splice(i, 1);
        this.player.gold -= price;
        this.scene.restart(this.mapData);
      });

      x += 140;
      if (x > w - 100) { x = 50; y += 40; }
    });

    const cancel = this.add.text(w / 2, h - 50, '取消', {
      fontSize: '18px', color: '#aaa', fontFamily: 'serif',
      backgroundColor: '#222', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => this.scene.restart(this.mapData));
  }

  _pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }
}
