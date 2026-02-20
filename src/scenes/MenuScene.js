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

    // 📱 Responsive font sizes (minimum scale 0.7 for readability)
    const scale = Math.max(0.7, Math.min(w / 900, 1));
    const titleSize = Math.floor(42 * scale);
    const subtitleSize = Math.floor(20 * scale);
    const phaseSize = Math.floor(16 * scale);
    const headingSize = Math.floor(24 * scale);

    this.add.text(w / 2, 100, '🗡️ 修仙塔 · Wombat Spire', {
      fontSize: `${titleSize}px`, color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 160, '通天灵塔，道魔之争', {
      fontSize: `${subtitleSize}px`, color: '#888', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 220, 'Phase 2: 地图 · 遗物 · 商店 · 事件', {
      fontSize: `${phaseSize}px`, color: '#666', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 280, '选择你的道路', {
      fontSize: `${headingSize}px`, color: '#ccc', fontFamily: 'serif',
    }).setOrigin(0.5);

    const btnSize = Math.floor(26 * scale);
    const descSize = Math.floor(14 * scale);
    const spacing = Math.floor(150 * scale);

    const orthodox = this.add.text(w / 2 - spacing, 360, '☯ 修炼正道', {
      fontSize: `${btnSize}px`, color: '#66ccff', fontFamily: 'serif',
      backgroundColor: '#1a1a30', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 - spacing, 420, '初始 +5 HP\n正道卡牌 -1 灵气', {
      fontSize: `${descSize}px`, color: '#88aacc', fontFamily: 'serif', align: 'center',
    }).setOrigin(0.5);

    const demonic = this.add.text(w / 2 + spacing, 360, '👹 堕入魔道', {
      fontSize: `${btnSize}px`, color: '#ff6666', fontFamily: 'serif',
      backgroundColor: '#301a1a', padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.add.text(w / 2 + spacing, 420, '首回合卡牌 +1 伤害\n魔道卡牌 -1 灵气', {
      fontSize: `${descSize}px`, color: '#cc8888', fontFamily: 'serif', align: 'center',
    }).setOrigin(0.5);

    [orthodox, demonic].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.1));
      btn.on('pointerout', () => btn.setScale(1));
    });

    orthodox.on('pointerdown', () => this._showClassSelection('orthodox'));
    demonic.on('pointerdown', () => this._showClassSelection('demonic'));
  }

  _showClassSelection(faction) {
    this.children.removeAll();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a12');

    const classes = this.cache.json.get('classes');

    // 📱 Responsive sizing (minimum scale 0.7 for readability)
    const scale = Math.max(0.7, Math.min(w / 900, 1));
    const headingSize = Math.floor(28 * scale);
    const labelSize = Math.floor(16 * scale);

    this.add.text(w / 2, 50, '选择你的修炼之道', {
      fontSize: `${headingSize}px`, color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, 90, `已选派系：${faction === 'orthodox' ? '☯ 正道' : '👹 魔道'}`, {
      fontSize: `${labelSize}px`, color: '#888', fontFamily: 'serif',
    }).setOrigin(0.5);

    // 📱 Mobile: vertical layout; Desktop: horizontal layout
    const isMobile = w <= 600;
    const isPortrait = h > w;
    const useVertical = isMobile || isPortrait;

    // Card dimensions adapted to layout
    let cardW, cardH, gap;
    if (useVertical) {
      cardW = Math.min(400, w - 40);
      // Distribute available height: top 100px for header, bottom 50px for back btn
      const availH = h - 150;
      gap = 20;
      cardH = Math.min(230, Math.floor((availH - (classes.length - 1) * gap) / classes.length));
    } else {
      cardW = Math.floor(220 * scale);
      gap = Math.floor(30 * scale);
      cardH = Math.floor(320 * scale);
    }

    const totalW = classes.length * cardW + (classes.length - 1) * gap;
    const totalH = classes.length * cardH + (classes.length - 1) * gap;
    const baseX = useVertical ? (w - cardW) / 2 : (w - totalW) / 2;
    // Center cards vertically in available space for portrait
    const baseY = useVertical ? Math.floor(110 + ((h - 150) - totalH) / 2) : 140;

    classes.forEach((cls, i) => {
      const cx = useVertical ? baseX : (baseX + i * (cardW + gap));
      const cy = useVertical ? (baseY + i * (cardH + gap)) : baseY;

      const bg = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x1a1a2e)
        .setStrokeStyle(2, 0x444466);

      // 📱 Portrait cards are wider → use larger, more readable fonts
      const iconSize = useVertical ? 40 : Math.floor(40 * scale);
      const nameSize = useVertical ? 22 : Math.floor(22 * scale);
      const subSize = useVertical ? 13 : Math.floor(12 * scale);
      const statSize = useVertical ? 17 : Math.floor(16 * scale);
      const passiveSize = useVertical ? 16 : Math.floor(15 * scale);

      // Vertical positions within each card
      const yIcon = cy + 22;
      const yName = useVertical ? cy + 58 : cy + 65;
      const yNameEn = useVertical ? cy + 82 : cy + 90;
      const yHP = useVertical ? cy + 108 : cy + 120;
      const yPassiveName = useVertical ? cy + 138 : cy + 155;
      const yPassiveDesc = useVertical ? cy + 165 : cy + 180;

      this.add.text(cx + cardW / 2, yIcon, cls.icon, {
        fontSize: `${iconSize}px`,
      }).setOrigin(0.5);

      this.add.text(cx + cardW / 2, yName, cls.name, {
        fontSize: `${nameSize}px`, color: '#e8d5a3', fontFamily: 'serif', fontStyle: 'bold',
      }).setOrigin(0.5);

      // Show English name (fits in portrait cards too)
      this.add.text(cx + cardW / 2, yNameEn, cls.nameEn, {
        fontSize: `${subSize}px`, color: '#666', fontFamily: 'serif',
      }).setOrigin(0.5);

      this.add.text(cx + cardW / 2, yHP, `❤️ ${cls.hp} HP`, {
        fontSize: `${statSize}px`, color: '#ff8888', fontFamily: 'serif',
      }).setOrigin(0.5);

      // Passive
      this.add.text(cx + cardW / 2, yPassiveName, `被动：${cls.passive.name}`, {
        fontSize: `${passiveSize}px`, color: '#ffcc44', fontFamily: 'serif', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(cx + cardW / 2, yPassiveDesc, cls.passive.desc, {
        fontSize: `${subSize}px`, color: '#aaa', fontFamily: 'serif',
        wordWrap: { width: cardW - 24 }, align: 'center',
      }).setOrigin(0.5);

      // Start deck summary – show on desktop and portrait (cards are tall enough)
      if (cardH >= 210) {
        // Get card names from cards.json
        const allCards = this.cache.json.get('cards');
        const cardMap = {};
        allCards.forEach(c => { cardMap[c.id] = c.name; });
        
        // Deck display with Chinese names, use '、' separator
        const deckList = [
          ...cls.startDeck.tagged.map(d => `${cardMap[d.id] || d.id}×${d.count}`),
          ...cls.startDeck.common.map(d => `${cardMap[d.id] || d.id}×${d.count}`),
        ];
        const deckNames = deckList.join('、');
        
        const deckLabelY = useVertical ? cy + 190 : cy + 230;
        const deckTextY = useVertical ? cy + 210 : cy + 260;
        const deckSize = useVertical ? 11 : Math.floor(10 * scale);
        this.add.text(cx + cardW / 2, deckLabelY, '起始卡组:', {
          fontSize: `${subSize}px`, color: '#88aacc', fontFamily: 'serif',
        }).setOrigin(0.5);
        this.add.text(cx + cardW / 2, deckTextY, deckNames, {
          fontSize: `${deckSize}px`, color: '#777', fontFamily: 'serif',
          wordWrap: { width: cardW - 16 }, align: 'center', lineSpacing: 2,
        }).setOrigin(0.5);
      }

      // Click area
      const hitArea = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => bg.setStrokeStyle(2, 0xffcc44));
      hitArea.on('pointerout', () => bg.setStrokeStyle(2, 0x444466));
      hitArea.on('pointerdown', () => this.startGame(faction, cls.id));
    });

    // Back button
    const backBtnSize = Math.floor(16 * scale);
    const backBtn = this.add.text(w / 2, h - 40, '← 返回选择派系', {
      fontSize: `${backBtnSize}px`, color: '#aaa', fontFamily: 'serif',
      backgroundColor: '#222', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.restart());
  }

  startGame(faction, classId) {
    const allCards = this.cache.json.get('cards');
    const classes = this.cache.json.get('classes');
    const classDef = classes.find(c => c.id === classId);

    const player = new Player(faction, classId, classDef);

    // Build initial deck from class definition
    const cardMap = {};
    allCards.forEach(c => { cardMap[c.id] = c; });

    const deck = [];
    const addCards = (list) => {
      list.forEach(entry => {
        const template = cardMap[entry.id];
        if (template) {
          for (let i = 0; i < entry.count; i++) {
            deck.push({ ...template });
          }
        }
      });
    };
    addCards(classDef.startDeck.tagged);
    addCards(classDef.startDeck.common);

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
