// Player.js - Player state management
import { Effects } from './Effects.js';

export class Player {
  constructor(faction = 'orthodox', classId = null, classDef = null) {
    this.faction = faction;
    this.classId = classId;       // 'sword' | 'talisman' | 'poison'
    this.classDef = classDef;     // full class definition
    this.maxHp = classDef ? classDef.hp : (faction === 'orthodox' ? 75 : 70);
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
    this.realm = '炼气期';       // 炼气期 → 筑基期 → 金丹期 → 元婴期
    this.realmIndex = 0;         // 0, 1, 2, 3
    this.currentFloor = 0;
    this.isBossFight = false;

    // Class passive tracking
    this._firstSwordPlayedThisTurn = false;  // sword class passive

    // Phase 4: relic tracking
    this._swordCardsPlayed = 0;
    this._nextSwordDiscount = 0;
    this._bloodDamageTaken = 0;
    this._damagedThisTurn = false;
    this._deathSaveUsed = false;
  }

  // Relic helpers
  hasRelic(id) {
    return this.relics.some(r => r.id === id);
  }

  addRelic(relic) {
    if (!this.hasRelic(relic.id)) {
      this.relics.push(relic);
      // On-acquire effects
      if (relic.effect && relic.effect.type === 'onAcquire') {
        const a = relic.effect.apply;
        if (a.maxHp) { this.maxHp += a.maxHp; this.hp += a.maxHp; }
      }
    }
  }

  removeRandomRelic() {
    if (this.relics.length === 0) return null;
    const idx = Math.floor(Math.random() * this.relics.length);
    return this.relics.splice(idx, 1)[0];
  }

  getRelicsByEffect(type) {
    return this.relics.filter(r => r.effect && r.effect.type === type);
  }

  // Called at start of each battle
  onBattleStart() {
    this.block = 0;
    this.firstTurn = true;
    this.turnCount = 0;
    this._swordCardsPlayed = 0;
    this._nextSwordDiscount = 0;
    this._damagedThisTurn = false;
    this._deathSaveUsed = false;
    this._firstSwordPlayedThisTurn = false;
    this.effects.clearAll();

    // Relic: battle start effects
    for (const r of this.getRelicsByEffect('battleStart')) {
      const a = r.effect.apply;
      if (a.strength) this.effects.apply('strength', a.strength);
      if (a.block) this.addBlock(a.block);
      if (a.heal) this.heal(a.heal);
      if (a.energy) this.energy += a.energy;
    }
  }

  // Called by BattleScene after enemies are created to apply battleStartPoison
  onBattleStartEnemies(enemies) {
    // Class passive: poison cultivator - all enemies +1 poison
    if (this.classId === 'poison') {
      enemies.forEach(e => { if (e.isAlive()) e.effects.apply('poison', 1); });
    }
    for (const r of this.getRelicsByEffect('battleStartPoison')) {
      const poison = r.effect.apply.poison || 0;
      enemies.forEach(e => { if (e.isAlive()) e.effects.apply('poison', poison); });
    }
  }

  startTurn() {
    // Retain shield if player has the relic or effect
    if (!this.hasRelic('retain_shield') && !this.effects.has('retainBlock')) {
      this.block = 0;
    }
    this.energy = this.maxEnergy;
    this.turnCount++;
    this._firstSwordPlayedThisTurn = false;

    // Class passive: talisman cultivator - +1 energy per turn
    if (this.classId === 'talisman') {
      this.energy += 1;
    }

    // 金刚体: if damaged last turn, +2 strength
    if (this._damagedThisTurn && this.hasRelic('vajra_body')) {
      this.effects.apply('strength', 2);
    }
    this._damagedThisTurn = false;

    // Relic: turn start effects
    let extraDraw = 0;
    for (const r of this.getRelicsByEffect('turnStart')) {
      const a = r.effect.apply;
      if (a.energy) this.energy += a.energy;
      if (a.draw) extraDraw += a.draw;
      if (a.block) this.addBlock(a.block);
    }

    // Conditional turn-start relics
    for (const r of this.getRelicsByEffect('turnStartConditional')) {
      const cond = r.effect.condition;
      let applies = false;
      if (cond === 'everyNTurns' && this.turnCount % r.effect.n === 0) applies = true;
      if (cond === 'notFirstTurn' && this.turnCount > 1) applies = true;
      if (applies) {
        const a = r.effect.apply;
        if (a.energy) this.energy += a.energy;
        if (a.draw) extraDraw += a.draw;
        if (a.block) this.addBlock(a.block);
      }
    }

    const dot = this.effects.processTurnStart();
    if (dot > 0) this.takeDamage(dot);
    const wasFirst = this.firstTurn;
    this.firstTurn = false;
    return { dotDamage: dot, firstTurn: wasFirst, extraDraw };
  }

  // Track sword cards for 剑匣 relic
  onCardPlayed(card) {
    // Class passive: track first sword card played this turn
    if (this.classId === 'sword' && !this._firstSwordPlayedThisTurn
        && card.tags && card.tags.includes('sword')) {
      this._firstSwordPlayedThisTurn = true;
    }
    if (card.tags && card.tags.includes('sword') && this.hasRelic('sword_case')) {
      this._swordCardsPlayed++;
      if (this._swordCardsPlayed >= 3) {
        this._nextSwordDiscount = (this._nextSwordDiscount || 0) + 1;
        this._swordCardsPlayed = 0;
      }
    }
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

    if (hpLoss > 0) {
      this._damagedThisTurn = true;
      // 血祭魔典: track cumulative damage
      if (this.hasRelic('blood_tome')) {
        this._bloodDamageTaken += hpLoss;
        const threshold = 5;
        while (this._bloodDamageTaken >= threshold) {
          this._bloodDamageTaken -= threshold;
          this.effects.apply('strength', 1);
        }
      }
    }

    // 轮回镜: death save
    if (this.hp <= 0 && !this._deathSaveUsed && this.hasRelic('reincarnation_mirror')) {
      this._deathSaveUsed = true;
      this.hp = Math.floor(this.maxHp * 0.5);
      // Remove the relic (consumable)
      this.relics = this.relics.filter(r => r.id !== 'reincarnation_mirror');
    }

    return { blocked, hpLoss };
  }

  takeDirectDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (amount > 0) this._damagedThisTurn = true;

    // Blood tome tracking for direct damage too
    if (amount > 0 && this.hasRelic('blood_tome')) {
      this._bloodDamageTaken += amount;
      while (this._bloodDamageTaken >= 5) {
        this._bloodDamageTaken -= 5;
        this.effects.apply('strength', 1);
      }
    }

    // Death save for direct damage
    if (this.hp <= 0 && !this._deathSaveUsed && this.hasRelic('reincarnation_mirror')) {
      this._deathSaveUsed = true;
      this.hp = Math.floor(this.maxHp * 0.5);
      this.relics = this.relics.filter(r => r.id !== 'reincarnation_mirror');
    }
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
    // 双修法宝: both faction discounts apply
    if (this.hasRelic('dual_cultivation')) {
      if (card.tags && (card.tags.includes('orthodox') || card.tags.includes('demonic'))) return -1;
    }
    if (this.faction === 'orthodox' && card.tags.includes('orthodox')) return -1;
    if (this.faction === 'demonic' && card.tags.includes('demonic')) return -1;
    return 0;
  }

  getEffectiveCost(card) {
    let mod = this.getCardCostModifier(card);
    // Class passive: sword cultivator - first sword card each turn costs -1
    if (this.classId === 'sword' && !this._firstSwordPlayedThisTurn
        && card.tags && card.tags.includes('sword')) {
      mod -= 1;
    }
    // Sword discount from 无影剑法 or 剑匣
    if (this._nextSwordDiscount && card.tags && card.tags.includes('sword')) {
      mod -= this._nextSwordDiscount;
      this._nextSwordDiscount = 0;
    }
    return Math.max(0, card.cost + mod);
  }

  getExtraDamage(card) {
    let extra = this.effects.get('strength');
    if (this.faction === 'demonic' && this.firstTurn) extra += 1;

    // 仙剑胚胎: sword cards +3 damage
    if (card.tags && card.tags.includes('sword') && this.hasRelic('immortal_sword_embryo')) {
      extra += 3;
    }

    // 符笔: talisman cards +2 damage
    if (card.tags && card.tags.includes('talisman') && this.hasRelic('talisman_pen')) {
      extra += 2;
    }

    return extra;
  }

  // Calculate final damage for a card hit, including weak multiplier
  calcDamage(baseDamage, extraDmg = 0, multiplier = 1) {
    const weakMult = this.effects.has('weak') ? 0.75 : 1;
    return Math.max(0, Math.floor((baseDamage + extraDmg) * weakMult * multiplier));
  }

  // Realm breakthrough
  breakthrough(allRelics) {
    if (this.realmIndex === 0) {
      this.realm = '筑基期';
      this.realmIndex = 1;
      this.maxHp += 10;
      this.hp = Math.min(this.hp + 10, this.maxHp);
      this.maxEnergy += 1;
      return { bonusText: '+10 最大HP, +1 灵气上限' };
    } else if (this.realmIndex === 1) {
      this.realm = '金丹期';
      this.realmIndex = 2;
      this.maxHp += 15;
      this.hp = Math.min(this.hp + 15, this.maxHp);
      this.maxEnergy += 1;
      // Grant random uncommon relic
      let relicGrant = null;
      if (allRelics) {
        const available = allRelics.filter(r => r.rarity === 'uncommon' && !this.hasRelic(r.id));
        if (available.length > 0) {
          relicGrant = available[Math.floor(Math.random() * available.length)];
          this.addRelic(relicGrant);
        }
      }
      return { bonusText: `+15 最大HP, +1 灵气上限${relicGrant ? `, 获得法宝: ${relicGrant.icon} ${relicGrant.name}` : ''}` };
    } else if (this.realmIndex === 2) {
      this.realm = '元婴期';
      this.realmIndex = 3;
      this.maxHp += 20;
      this.hp = Math.min(this.hp + 20, this.maxHp);
      this.maxEnergy += 1;
      // Grant random rare relic
      let relicGrant = null;
      if (allRelics) {
        const available = allRelics.filter(r => r.rarity === 'rare' && !this.hasRelic(r.id));
        if (available.length > 0) {
          relicGrant = available[Math.floor(Math.random() * available.length)];
          this.addRelic(relicGrant);
        }
      }
      return { bonusText: `+20 最大HP, +1 灵气上限${relicGrant ? `, 获得法宝: ${relicGrant.icon} ${relicGrant.name}` : ''}` };
    }
    return { bonusText: '已达最高境界' };
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
