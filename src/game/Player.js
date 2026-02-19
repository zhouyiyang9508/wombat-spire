// Player.js - Player state management
import { Effects } from './Effects.js';

export class Player {
  constructor(faction = 'orthodox') {
    this.faction = faction;
    this.maxHp = faction === 'orthodox' ? 75 : 70;
    this.hp = this.maxHp;
    this.block = 0;
    this.energy = 3;
    this.maxEnergy = 3;
    this.effects = new Effects();
    this.firstTurn = true;
    this.turnCount = 0;

    // Phase 2 additions
    this.gold = 50;
    this.relics = [];
    this.realm = '炼气期';       // 炼气期 → 筑基期 → 金丹期
    this.realmIndex = 0;         // 0, 1, 2
    this.currentFloor = 0;
    this.isBossFight = false;
  }

  // Relic helpers
  hasRelic(id) {
    return this.relics.some(r => r.id === id);
  }

  addRelic(relic) {
    if (!this.hasRelic(relic.id)) {
      this.relics.push(relic);
    }
  }

  getRelicsByEffect(type) {
    return this.relics.filter(r => r.effect && r.effect.type === type);
  }

  // Called at start of each battle
  onBattleStart() {
    this.block = 0;
    this.firstTurn = true;
    this.turnCount = 0;
    this.effects.clearAll();

    // Relic: battle start effects
    for (const r of this.getRelicsByEffect('battleStart')) {
      const a = r.effect.apply;
      if (a.strength) this.effects.apply('strength', a.strength);
      if (a.block) this.addBlock(a.block);
      if (a.heal) this.heal(a.heal);
    }
  }

  startTurn() {
    this.block = 0;
    this.energy = this.maxEnergy;
    this.turnCount++;

    // Relic: turn start effects
    let extraDraw = 0;
    for (const r of this.getRelicsByEffect('turnStart')) {
      const a = r.effect.apply;
      if (a.energy) this.energy += a.energy;
      if (a.draw) extraDraw += a.draw;
    }

    const dot = this.effects.processTurnStart();
    if (dot > 0) this.takeDamage(dot);
    const wasFirst = this.firstTurn;
    this.firstTurn = false;
    return { dotDamage: dot, firstTurn: wasFirst, extraDraw };
  }

  // Check if status immunity is active (金钟罩)
  hasStatusImmunity() {
    if (this.hasRelic('golden_bell_shield') && this.turnCount <= 3) return true;
    return false;
  }

  takeDamage(amount) {
    if (this.effects.has('vulnerable')) {
      amount = Math.floor(amount * 1.5);
    }
    const blocked = Math.min(this.block, amount);
    this.block -= blocked;
    const hpLoss = amount - blocked;
    this.hp = Math.max(0, this.hp - hpLoss);
    return { blocked, hpLoss };
  }

  takeDirectDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addBlock(amount) {
    this.block += amount;
  }

  spendEnergy(cost) {
    if (this.energy < cost) return false;
    this.energy -= cost;
    return true;
  }

  isAlive() {
    return this.hp > 0;
  }

  getCardCostModifier(card) {
    if (this.faction === 'orthodox' && card.tags.includes('orthodox')) return -1;
    if (this.faction === 'demonic' && card.tags.includes('demonic')) return -1;
    return 0;
  }

  getEffectiveCost(card) {
    return Math.max(0, card.cost + this.getCardCostModifier(card));
  }

  getExtraDamage(card) {
    let extra = this.effects.get('strength');
    if (this.faction === 'demonic' && this.firstTurn) extra += 1;
    if (this.effects.has('weak')) extra -= Math.floor((card.effect.damage || 0) * 0.25);
    return extra;
  }

  // Realm breakthrough
  breakthrough() {
    if (this.realmIndex === 0) {
      this.realm = '筑基期';
      this.realmIndex = 1;
      this.maxHp += 10;
      this.hp = Math.min(this.hp + 10, this.maxHp);
    } else if (this.realmIndex === 1) {
      this.realm = '金丹期';
      this.realmIndex = 2;
      this.maxEnergy += 1;
    }
  }

  // Shop discount from relics
  getShopDiscount() {
    let discount = 0;
    for (const r of this.getRelicsByEffect('shopDiscount')) {
      discount += r.effect.value;
    }
    return discount;
  }

  // Boss damage bonus from relics
  getBossDamageBonus() {
    let bonus = 0;
    for (const r of this.getRelicsByEffect('bossDamage')) {
      bonus += r.effect.value;
    }
    return bonus;
  }
}
