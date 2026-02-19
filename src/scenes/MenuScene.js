// MenuScene.js - Main menu + faction selection
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a12');

    // Title
    this.add.text(w / 2, 100, '🗡️ 修仙塔 · Wombat Spire', {
      fontSize: '42px',
      color: '#e8d5a3',
      fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 160, '通天灵塔，道魔之争', {
      fontSize: '20px',
      color: '#888',
      fontFamily: 'serif',
    }).setOrigin(0.5);

    // Faction selection
    this.add.text(w / 2, 260, '选择你的道路', {
      fontSize: '24px',
      color: '#ccc',
      fontFamily: 'serif',
    }).setOrigin(0.5);

    // Orthodox button
    const orthodox = this.add.text(w / 2 - 150, 340, '☯ 修炼正道', {
      fontSize: '26px',
      color: '#66ccff',
      fontFamily: 'serif',
      backgroundColor: '#1a1a30',
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 - 150, 400, '初始 +5 HP\n正道卡牌 -1 灵气', {
      fontSize: '14px',
      color: '#88aacc',
      fontFamily: 'serif',
      align: 'center',
    }).setOrigin(0.5);

    // Demonic button
    const demonic = this.add.text(w / 2 + 150, 340, '👹 堕入魔道', {
      fontSize: '26px',
      color: '#ff6666',
      fontFamily: 'serif',
      backgroundColor: '#301a1a',
      padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 + 150, 400, '首回合卡牌 +1 伤害\n魔道卡牌 -1 灵气', {
      fontSize: '14px',
      color: '#cc8888',
      fontFamily: 'serif',
      align: 'center',
    }).setOrigin(0.5);

    // Hover effects
    [orthodox, demonic].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.1));
      btn.on('pointerout', () => btn.setScale(1));
    });

    orthodox.on('pointerdown', () => this.startGame('orthodox'));
    demonic.on('pointerdown', () => this.startGame('demonic'));
  }

  startGame(faction) {
    this.scene.start('BattleScene', { faction });
  }
}
