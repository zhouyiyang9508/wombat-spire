// Effects.js - Status effect system
export class Effects {
  constructor() {
    this.effects = {};
  }

  apply(name, stacks) {
    if (!this.effects[name]) this.effects[name] = 0;
    this.effects[name] += stacks;
  }

  get(name) {
    return this.effects[name] || 0;
  }

  has(name) {
    return this.get(name) > 0;
  }

  decrement(name, amount = 1) {
    if (this.effects[name]) {
      this.effects[name] = Math.max(0, this.effects[name] - amount);
      if (this.effects[name] === 0) delete this.effects[name];
    }
  }

  clear(name) {
    delete this.effects[name];
  }

  clearAll() {
    this.effects = {};
  }

  // Process turn-start effects, returns total damage taken
  processTurnStart() {
    let damage = 0;
    // Poison: deal damage equal to stacks, then reduce by 1
    if (this.has('poison')) {
      damage += this.get('poison');
      this.decrement('poison');
    }
    // Burn: deal damage equal to stacks, then reduce by 1
    if (this.has('burn')) {
      damage += this.get('burn');
      this.decrement('burn');
    }
    // Decrement duration-based effects
    if (this.has('weak')) this.decrement('weak');
    if (this.has('vulnerable')) this.decrement('vulnerable');
    return damage;
  }

  getAll() {
    return { ...this.effects };
  }

  getDisplayList() {
    const icons = {
      weak: { icon: '😵', name: '虚弱', color: '#a0a0ff' },
      vulnerable: { icon: '💥', name: '易伤', color: '#ff6060' },
      poison: { icon: '☠️', name: '中毒', color: '#40ff40' },
      burn: { icon: '🔥', name: '点燃', color: '#ff8020' },
      strength: { icon: '💪', name: '力量', color: '#ffcc00' },
      frozen: { icon: '🧊', name: '冰冻', color: '#88ccff' },
      retainBlock: { icon: '🔒', name: '护盾保留', color: '#4488ff' },
    };
    return Object.entries(this.effects)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        key: k,
        stacks: v,
        ...(icons[k] || { icon: '❓', name: k, color: '#ccc' }),
      }));
  }
}
