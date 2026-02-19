// MenuScene.js - Main menu + faction selection
import { Player } from '../game/Player.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a12');

    // Clear card hand
    const cardHand = document.getElementById('card-hand');
    if (cardHand) cardHand.innerHTML = '';

    this.add.text(w / 2, 100, '🗡️ 修仙塔 · Wombat Spire', {
      fontSize: '42px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 160, '通天灵塔，道魔之争', {
      fontSize: '20px', color: '#888', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 220, 'Phase 2: 地图 · 遗物 · 商店 · 事件', {
      fontSize: '16px', color: '#666', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 280, '选择你的道路', {
      fontSize: '24px', color: '#ccc', fontFamily: 'serif',
    }).setOrigin(0.5);

    const orthodox = this.add.text(w / 2 - 150, 360, '☯ 修炼正道', {
      fontSize: '26px', color: '#66ccff', fontFamily: 'serif',
      backgroundColor: '#1a1a30', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 - 150, 420, '初始 +5 HP\n正道卡牌 -1 灵气', {
      fontSize: '14px', color: '#88aacc', fontFamily: 'serif', align: 'center',
    }).setOrigin(0.5);

    const demonic = this.add.text(w / 2 + 150, 360, '👹 堕入魔道', {
      fontSize: '26px', color: '#ff6666', fontFamily: 'serif',
      backgroundColor: '#301a1a', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 + 150, 420, '首回合卡牌 +1 伤害\n魔道卡牌 -1 灵气', {
      fontSize: '14px', color: '#cc8888', fontFamily: 'serif', align: 'center',
    }).setOrigin(0.5);

    [orthodox, demonic].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.1));
      btn.on('pointerout', () => btn.setScale(1));
    });

    orthodox.on('pointerdown', () => this.startGame('orthodox'));
    demonic.on('pointerdown', () => this.startGame('demonic'));
  }

  startGame(faction) {
    const allCards = this.cache.json.get('cards');
    const player = new Player(faction);

    // Build initial deck
    const factionTag = faction;
    const oppositeTag = faction === 'orthodox' ? 'demonic' : 'orthodox';
    const factionCards = allCards.filter(c => c.tags.includes(factionTag));
    const neutralCards = allCards.filter(c => c.tags.includes('neutral'));
    const oppositeCards = allCards.filter(c => c.tags.includes(oppositeTag));

    const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
    const deck = [
      ...pick(factionCards, 4),
      ...pick(neutralCards, 4),
      ...pick(oppositeCards, 2),
    ].map(c => ({ ...c })); // deep copy

    this.scene.start('MapScene', {
      player,
      deck,
      gameMap: null,
      currentFloor: -1,
      visitedNodes: new Set(),
      lastNodeId: null,
    });
  }
}
