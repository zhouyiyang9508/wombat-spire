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
  }

  startTurn() {
    this.block = 0;
    this.energy = this.maxEnergy;
    const dot = this.effects.processTurnStart();
    if (dot > 0) this.takeDamage(dot);
    const wasFirst = this.firstTurn;
    this.firstTurn = false;
    return { dotDamage: dot, firstTurn: wasFirst };
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
}
