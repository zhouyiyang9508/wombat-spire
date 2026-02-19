// EventScene.js - Random event encounters
export class EventScene extends Phaser.Scene {
  constructor() {
    super('EventScene');
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

    const allEvents = this.cache.json.get('events');
    const allCards = this.cache.json.get('cards');
    const allRelics = this.cache.json.get('relics');

    // Pick random event
    const event = allEvents[Math.floor(Math.random() * allEvents.length)];

    // Title
    this.add.text(w / 2, 60, `${event.icon} ${event.name}`, {
      fontSize: '32px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Description
    this.add.text(w / 2, 120, event.desc, {
      fontSize: '18px', color: '#bbb', fontFamily: 'serif',
      wordWrap: { width: 600 },
      align: 'center',
    }).setOrigin(0.5);

    // Options
    let yOff = 200;
    event.options.forEach((opt, i) => {
      // Check requirements
      if (opt.requires) {
        if (opt.requires.gold && this.player.gold < opt.requires.gold) return;
      }

      // Check if option needs a relic but player has none
      const needsRelic = opt.outcomes && opt.outcomes.some(o => o.effect && o.effect.removeRelic);
      const hasNoRelics = this.player.relics.length === 0;

      const disabled = needsRelic && hasNoRelics;
      const displayText = disabled ? `${i + 1}. ${opt.text}（你没有法宝可以交易）` : `${i + 1}. ${opt.text}`;
      const btn = this.add.text(w / 2, yOff, displayText, {
        fontSize: '20px', color: disabled ? '#666' : '#66ccff', fontFamily: 'serif',
        backgroundColor: '#1a1a30', padding: { x: 24, y: 10 },
      }).setOrigin(0.5);

      if (!disabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor('#ffcc44'));
        btn.on('pointerout', () => btn.setColor('#66ccff'));
        btn.on('pointerdown', () => this._resolveOption(opt, allCards, allRelics, w, h));
      }

      yOff += 60;
    });

    // Player info
    this.add.text(20, h - 40, `❤️${this.player.hp}/${this.player.maxHp}  💰${this.player.gold}`, {
      fontSize: '14px', color: '#888', fontFamily: 'serif',
    });
  }

  _resolveOption(opt, allCards, allRelics, w, h) {
    // Weight-based outcome
    const outcomes = opt.outcomes;
    const totalWeight = outcomes.reduce((s, o) => s + o.weight, 0);
    let roll = Math.random() * totalWeight;
    let outcome = outcomes[0];
    for (const o of outcomes) {
      roll -= o.weight;
      if (roll <= 0) { outcome = o; break; }
    }

    // Apply effects
    const eff = outcome.effect;
    let resultText = outcome.desc;

    if (eff.hp) {
      if (eff.hp > 0) this.player.heal(eff.hp);
      else this.player.takeDirectDamage(-eff.hp);
    }
    if (eff.maxHp) {
      this.player.maxHp += eff.maxHp;
      this.player.hp += eff.maxHp;
    }
    if (eff.gold) {
      this.player.gold = Math.max(0, this.player.gold + eff.gold);
    }
    if (eff.strength) {
      this.player.effects.apply('strength', eff.strength);
    }
    if (eff.card) {
      const available = allCards.filter(c => !this.deck.some(d => d.id === c.id));
      if (available.length > 0) {
        const card = available[Math.floor(Math.random() * available.length)];
        this.deck.push({ ...card });
        resultText += `\n获得卡牌：${card.name}`;
      }
    }
    if (eff.relic) {
      const available = allRelics.filter(r => !this.player.hasRelic(r.id));
      if (available.length > 0) {
        const relic = available[Math.floor(Math.random() * available.length)];
        this.player.addRelic(relic);
        resultText += `\n获得法宝：${relic.icon} ${relic.name}`;
      }
    }
    if (eff.rareRelic) {
      const available = allRelics.filter(r => r.rarity === 'rare' && !this.player.hasRelic(r.id));
      if (available.length > 0) {
        const relic = available[Math.floor(Math.random() * available.length)];
        this.player.addRelic(relic);
        resultText += `\n获得稀有法宝：${relic.icon} ${relic.name}`;
      }
    }
    if (eff.rareCard) {
      const available = allCards.filter(c => c.rarity === 'rare' && !this.deck.some(d => d.id === c.id));
      if (available.length > 0) {
        const card = available[Math.floor(Math.random() * available.length)];
        this.deck.push({ ...card });
        resultText += `\n获得稀有卡牌：${card.name}`;
      }
    }
    if (eff.removeCard) {
      if (this.deck.length > 5) {
        const idx = Math.floor(Math.random() * this.deck.length);
        const removed = this.deck.splice(idx, 1)[0];
        resultText += `\n失去卡牌：${removed.name}`;
      }
    }
    if (eff.removeRelic) {
      const removed = this.player.removeRandomRelic();
      if (removed) resultText += `\n失去法宝：${removed.icon} ${removed.name}`;
    }
    if (eff.maxEnergy) {
      this.player.maxEnergy += eff.maxEnergy;
    }
    if (eff.discountShop) {
      // Transition to shop with temporary discount
      this.scene.start('ShopScene', { ...this.mapData, tempDiscount: 0.2 });
      return;
    }
    if (eff.eliteBattle) {
      this.scene.start('BattleScene', { ...this.mapData, encounterType: 'elite' });
      return;
    }

    // Faction bonus
    if (opt.factionBonus && opt.factionBonus.faction === this.player.faction) {
      const extra = opt.factionBonus.extra;
      if (extra.gold) this.player.gold += extra.gold;
      resultText += '\n（派系加成！）';
    }

    // Clear scene and show result
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(w / 2, h / 2 - 60, resultText, {
      fontSize: '20px', color: '#e8d5a3', fontFamily: 'serif',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5);

    // Continue button
    const cont = this.add.text(w / 2, h / 2 + 60, '继续 →', {
      fontSize: '22px', color: '#66ff66', fontFamily: 'serif',
      backgroundColor: '#1a331a', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    cont.on('pointerdown', () => {
      if (!this.player.isAlive()) {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('MapScene', this.mapData);
      }
    });
  }
}
