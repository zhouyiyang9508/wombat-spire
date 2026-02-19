// Enemy.js - Enemy class with intent system
import { Effects } from './Effects.js';

export class Enemy {
  constructor(data, index = 0) {
    this.id = data.id;
    this.name = data.count > 1 ? `${data.name} ${index === 0 ? '兄' : '弟'}` : data.name;
    this.maxHp = data.hp;
    this.hp = data.hp;
    this.block = 0;
    this.effects = new Effects();
    this.intents = data.intents;
    this.pattern = data.pattern || 'sequential';
    this.special = data.special || null;
    this.intentIndex = 0;
    this.currentIntent = null;
    this.phaseTwo = false;
    this.enraged = false;
    this.chooseNextIntent();
  }

  chooseNextIntent() {
    if (this.pattern === 'random') {
      this.currentIntent = this.intents[Math.floor(Math.random() * this.intents.length)];
    } else {
      this.currentIntent = this.intents[this.intentIndex % this.intents.length];
      this.intentIndex++;
    }
  }

  startTurn() {
    this.block = 0;
    const dot = this.effects.processTurnStart();
    if (dot > 0) this.hp = Math.max(0, this.hp - dot);

    // Boss phase mechanics
    if (this.special) {
      if (this.special.phaseShift && !this.phaseTwo && this.hp / this.maxHp <= this.special.phaseShift.threshold) {
        this.phaseTwo = true;
      }
      if (this.special.enrage && !this.enraged && this.hp / this.maxHp <= this.special.enrage.threshold) {
        this.enraged = true;
        this.effects.apply('strength', this.special.enrage.strength);
      }
      if (this.phaseTwo) {
        this.block += 5;
      }
    }
    return dot;
  }

  executeIntent(player) {
    const intent = this.currentIntent;
    const results = [];

    // Frozen: skip turn
    if (this.effects.has('frozen')) {
      this.effects.decrement('frozen');
      results.push({ type: 'debuff', desc: '冰冻中，跳过行动' });
      this.chooseNextIntent();
      return results;
    }

    // Weak: reduce attack damage by 25%
    const weakMult = this.effects.has('weak') ? 0.75 : 1;
    const str = this.effects.get('strength');

    if (intent.type === 'attack') {
      const hits = intent.hits || 1;
      for (let i = 0; i < hits; i++) {
        const dmg = Math.max(0, Math.floor((intent.value + str) * weakMult));
        const r = player.takeDamage(dmg);
        results.push({ type: 'damage', value: dmg, ...r });
      }
    }
    if (intent.type === 'defend') {
      this.block += intent.value;
      results.push({ type: 'defend', value: intent.value });
    }
    if (intent.type === 'buff' && intent.effect) {
      for (const [k, v] of Object.entries(intent.effect)) {
        this.effects.apply(k, v);
      }
      results.push({ type: 'buff', desc: intent.desc });
    }
    if (intent.type === 'debuff' && intent.effect) {
      for (const [k, v] of Object.entries(intent.effect)) {
        player.effects.apply(k, v);
      }
      results.push({ type: 'debuff', desc: intent.desc });
    }

    this.chooseNextIntent();
    return results;
  }

  takeDamage(amount) {
    if (this.effects.has('vulnerable')) {
      amount = Math.floor(amount * 1.5);
    }
    const blocked = Math.min(this.block, amount);
    this.block -= blocked;
    const hpLoss = amount - blocked;
    this.hp = Math.max(0, this.hp - hpLoss);
    return { blocked, hpLoss, killed: this.hp <= 0 };
  }

  isAlive() {
    return this.hp > 0;
  }

  getIntentDisplay() {
    const i = this.currentIntent;
    const str = this.effects.get('strength');
    if (i.type === 'attack') {
      const dmg = Math.max(0, i.value + str);
      return { icon: '⚔️', text: i.hits > 1 ? `${dmg}x${i.hits}` : `${dmg}`, color: '#ff4444' };
    }
    if (i.type === 'defend') return { icon: '🛡️', text: `${i.value}`, color: '#4488ff' };
    if (i.type === 'buff') return { icon: '⬆️', text: i.desc || '增益', color: '#ffcc00' };
    if (i.type === 'debuff') return { icon: '⬇️', text: i.desc || '减益', color: '#aa44ff' };
    return { icon: '❓', text: '???', color: '#888' };
  }
}
