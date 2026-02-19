// RewardScene.js - Post-battle rewards (gold, card, relic)
export class RewardScene extends Phaser.Scene {
  constructor() {
    super('RewardScene');
  }

  init(data) {
    this.mapData = data;
    this.player = data.player;
    this.deck = data.deck;
    this.encounterType = data.encounterType || 'normal';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    const allCards = this.cache.json.get('cards');
    const allRelics = this.cache.json.get('relics');

    this.add.text(w / 2, 50, '✨ 战斗胜利！', {
      fontSize: '32px', color: '#ffdd44', fontFamily: 'serif',
    }).setOrigin(0.5);

    let yOff = 120;

    // Gold reward
    const goldReward = this.encounterType === 'elite' ? 40 + Math.floor(Math.random() * 30)
      : this.encounterType === 'boss' ? 80 + Math.floor(Math.random() * 40)
      : 15 + Math.floor(Math.random() * 20);
    this.player.gold += goldReward;

    this.add.text(w / 2, yOff, `💰 获得 ${goldReward} 灵石`, {
      fontSize: '20px', color: '#ffcc44', fontFamily: 'serif',
    }).setOrigin(0.5);
    yOff += 50;

    // Card reward: pick 3 cards to choose from
    this.add.text(w / 2, yOff, '选择一张卡牌加入卡组（或跳过）', {
      fontSize: '16px', color: '#aaa', fontFamily: 'serif',
    }).setOrigin(0.5);
    yOff += 40;

    const cardChoices = this._pickCards(allCards, 3);
    let cx = w / 2 - 200;
    cardChoices.forEach(card => {
      const box = this.add.text(cx, yOff, `${card.name}\n费用:${card.cost} ${card.type === 'attack' ? '攻击' : card.type === 'skill' ? '技能' : '能力'}\n${card.desc}`, {
        fontSize: '13px', color: '#88ccff', fontFamily: 'serif',
        backgroundColor: '#1a1a2e', padding: { x: 12, y: 10 },
        wordWrap: { width: 160 },
      }).setInteractive({ useHandCursor: true });

      box.on('pointerover', () => box.setColor('#ffcc44'));
      box.on('pointerout', () => box.setColor('#88ccff'));
      box.on('pointerdown', () => {
        this.deck.push({ ...card });
        this._proceed();
      });
      cx += 200;
    });
    yOff += 120;

    // Relic reward for elite/boss
    if (this.encounterType === 'elite' || this.encounterType === 'boss') {
      const available = allRelics.filter(r => !this.player.hasRelic(r.id));
      if (available.length > 0) {
        const relic = available[Math.floor(Math.random() * available.length)];
        this.player.addRelic(relic);
        this.add.text(w / 2, yOff, `🏺 获得法宝: ${relic.icon} ${relic.name}\n${relic.desc}`, {
          fontSize: '18px', color: '#ffcc88', fontFamily: 'serif',
          align: 'center',
        }).setOrigin(0.5);
        yOff += 60;
      }
    }

    // Skip / Continue
    const skip = this.add.text(w / 2, h - 50, '跳过 / 继续 →', {
      fontSize: '20px', color: '#66ff66', fontFamily: 'serif',
      backgroundColor: '#1a331a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', () => this._proceed());
  }

  _proceed() {
    // Check for realm breakthrough (after boss on floor 4, 9)
    const floor = this.player.currentFloor;
    if ((floor === 4 && this.player.realmIndex === 0) || (floor === 9 && this.player.realmIndex === 1)) {
      this.scene.start('BreakthroughScene', this.mapData);
    } else if (floor === 14) {
      // Final boss defeated - victory!
      this.scene.start('VictoryScene', this.mapData);
    } else {
      this.scene.start('MapScene', this.mapData);
    }
  }

  _pickCards(allCards, n) {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }
}
