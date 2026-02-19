// BattleScene.js - Core battle scene (Phase 2: integrated with map)
import { Enemy } from '../game/Enemy.js';
import { CardSystem } from '../game/CardSystem.js';
import { CardUI } from '../ui/CardUI.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.player = data.player;
    this.deck = data.deck;
    this.mapData = data;
    this.encounterType = data.encounterType || 'normal';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // Load data
    const allEnemies = this.cache.json.get('enemies');

    // Card system from current deck
    this.cardSystem = new CardSystem([...this.deck]);

    // Pick enemy
    const enemyData = this._pickEnemy(allEnemies);

    // Create enemies
    this.enemies = [];
    const count = enemyData.count || 1;
    for (let i = 0; i < count; i++) {
      this.enemies.push(new Enemy(enemyData, i));
    }

    // Apply player battle start effects (relics etc)
    this.player.onBattleStart();

    // Card UI
    this.cardUI = new CardUI((index) => this.playCard(index));

    // Draw background
    this._drawBackground(w, h);
    this.enemyDisplays = [];
    this._renderEnemies(w, h);
    this._renderPlayerUI(w, h);
    this._renderPileButtons(w, h);

    // End turn button
    this.endTurnBtn = this.add.text(w - 100, h - 220, '结束回合', {
      fontSize: '18px', color: '#fff', backgroundColor: '#993333',
      padding: { x: 16, y: 8 }, fontFamily: 'serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    this.endTurnBtn.on('pointerdown', () => this.endPlayerTurn());
    this.endTurnBtn.on('pointerover', () => this.endTurnBtn.setScale(1.1));
    this.endTurnBtn.on('pointerout', () => this.endTurnBtn.setScale(1));

    this.logTexts = [];
    this.isPlayerTurn = true;
    this.startPlayerTurn();
  }

  _pickEnemy(allEnemies) {
    if (this.encounterType === 'boss') {
      const floor = this.player.currentFloor;
      const bosses = allEnemies.filter(e => e.type === 'boss');
      // Different boss per tier
      if (floor <= 4) return bosses.find(b => b.id === 'demon_elder') || bosses[0];
      if (floor <= 9) return bosses.find(b => b.id === 'ice_queen') || bosses[bosses.length % 1] || bosses[0];
      return bosses[bosses.length - 1] || bosses[0];
    }
    if (this.encounterType === 'elite') {
      const elites = allEnemies.filter(e => e.type === 'elite');
      if (elites.length > 0) return elites[Math.floor(Math.random() * elites.length)];
    }
    const normals = allEnemies.filter(e => e.type === 'normal');
    return normals[Math.floor(Math.random() * normals.length)];
  }

  _drawBackground(w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x111122, 0.3);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x0a0a18, 0.6);
    g.fillTriangle(0, h * 0.5, w * 0.3, h * 0.15, w * 0.5, h * 0.5);
    g.fillTriangle(w * 0.4, h * 0.5, w * 0.7, h * 0.1, w, h * 0.5);
    g.fillStyle(0x0d0d1a, 1);
    g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle(0x222244, 0.3);
    g.fillRect(0, h * 0.48, w, 20);
  }

  _renderEnemies(w, h) {
    this.enemyDisplays.forEach(d => d.container?.destroy());
    this.enemyDisplays = [];
    const count = this.enemies.length;
    this.enemies.forEach((enemy, i) => {
      const x = w / 2 + (i - (count - 1) / 2) * 200;
      const y = h * 0.28;
      const container = this.add.container(x, y).setDepth(5);

      const body = this.add.graphics();
      const color = enemy.id === 'demon_elder' ? 0x880044 : 0x334455;
      body.fillStyle(color, 0.9);
      body.fillCircle(0, 0, 45);
      body.lineStyle(2, 0x667788);
      body.strokeCircle(0, 0, 45);
      container.add(body);

      const name = this.add.text(0, -70, enemy.name, {
        fontSize: '16px', color: '#ddd', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(name);

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x333333, 1);
      hpBg.fillRect(-40, 55, 80, 10);
      container.add(hpBg);

      const hpBar = this.add.graphics();
      container.add(hpBar);

      const hpText = this.add.text(0, 72, '', {
        fontSize: '13px', color: '#ccc', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(hpText);

      const blockText = this.add.text(50, 0, '', {
        fontSize: '14px', color: '#4488ff', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(blockText);

      const intentText = this.add.text(0, -95, '', {
        fontSize: '18px', color: '#fff', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(intentText);

      const effectsText = this.add.text(0, 90, '', {
        fontSize: '12px', color: '#aaa', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(effectsText);

      this.enemyDisplays.push({ container, hpBar, hpText, blockText, intentText, effectsText });
    });
    this._updateEnemyDisplay();
  }

  _updateEnemyDisplay() {
    this.enemies.forEach((enemy, i) => {
      if (i >= this.enemyDisplays.length) return;
      const d = this.enemyDisplays[i];
      if (!enemy.isAlive()) { d.container.setAlpha(0.3); return; }
      d.hpBar.clear();
      const ratio = enemy.hp / enemy.maxHp;
      const color = ratio > 0.5 ? 0x44aa44 : ratio > 0.25 ? 0xaaaa44 : 0xaa4444;
      d.hpBar.fillStyle(color, 1);
      d.hpBar.fillRect(-40, 55, 80 * ratio, 10);
      d.hpText.setText(`${enemy.hp}/${enemy.maxHp}`);
      d.blockText.setText(enemy.block > 0 ? `🛡️${enemy.block}` : '');
      const intent = enemy.getIntentDisplay();
      d.intentText.setText(`${intent.icon} ${intent.text}`);
      d.intentText.setColor(intent.color);
      const eff = enemy.effects.getDisplayList();
      d.effectsText.setText(eff.map(e => `${e.icon}${e.stacks}`).join(' '));
    });
  }

  _renderPlayerUI(w, h) {
    const y = h - 220;
    this.playerHpText = this.add.text(20, y, '', {
      fontSize: '18px', color: '#ff8888', fontFamily: 'serif',
    }).setDepth(10);
    this.playerBlockText = this.add.text(20, y + 28, '', {
      fontSize: '16px', color: '#4488ff', fontFamily: 'serif',
    }).setDepth(10);
    this.playerEnergyText = this.add.text(20, y + 54, '', {
      fontSize: '18px', color: '#ffcc44', fontFamily: 'serif',
    }).setDepth(10);
    this.playerEffectsText = this.add.text(20, y + 80, '', {
      fontSize: '14px', color: '#aaa', fontFamily: 'serif',
    }).setDepth(10);
    this.factionText = this.add.text(20, y - 28, '', {
      fontSize: '14px', color: '#888', fontFamily: 'serif',
    }).setDepth(10);
    // Gold + Realm display
    this.goldRealmText = this.add.text(20, y - 50, '', {
      fontSize: '13px', color: '#aa8', fontFamily: 'serif',
    }).setDepth(10);
    this._updatePlayerUI();
  }

  _updatePlayerUI() {
    const p = this.player;
    this.playerHpText.setText(`❤️ ${p.hp}/${p.maxHp}`);
    this.playerBlockText.setText(p.block > 0 ? `🛡️ 护盾: ${p.block}` : '');
    this.playerEnergyText.setText(`💎 灵气: ${p.energy}/${p.maxEnergy}`);
    this.factionText.setText(p.faction === 'orthodox' ? '☯ 正道' : '👹 魔道');
    this.goldRealmText.setText(`${p.realm} · 💰${p.gold}`);
    const eff = p.effects.getDisplayList();
    this.playerEffectsText.setText(eff.map(e => `${e.icon}${e.stacks}`).join(' '));
  }

  _renderPileButtons(w, h) {
    const y = h - 220;
    this.drawPileText = this.add.text(w - 200, y, '', {
      fontSize: '14px', color: '#88aa88', fontFamily: 'serif',
    }).setDepth(10);
    this.discardPileText = this.add.text(w - 200, y + 24, '', {
      fontSize: '14px', color: '#aa8888', fontFamily: 'serif',
    }).setDepth(10);
    this.exhaustPileText = this.add.text(w - 200, y + 48, '', {
      fontSize: '14px', color: '#888888', fontFamily: 'serif',
    }).setDepth(10);
    this._updatePileDisplay();
  }

  _updatePileDisplay() {
    const s = this.cardSystem.getStatus();
    this.drawPileText.setText(`📚 抽牌堆: ${s.draw}`);
    this.discardPileText.setText(`♻️ 弃牌堆: ${s.discard}`);
    this.exhaustPileText.setText(`🚫 消耗堆: ${s.exhaust}`);
  }

  // === TURN FLOW ===

  startPlayerTurn() {
    this.isPlayerTurn = true;
    const turnInfo = this.player.startTurn();
    if (turnInfo.dotDamage > 0) this.addLog(`你受到 ${turnInfo.dotDamage} 点持续伤害`);
    if (!this.player.isAlive()) { this.gameOver(false); return; }
    const drawCount = 5 + (turnInfo.extraDraw || 0);
    this.cardSystem.drawCards(drawCount);
    this.refreshUI();
  }

  endPlayerTurn() {
    if (!this.isPlayerTurn) return;
    this.isPlayerTurn = false;
    this.cardSystem.discardHand();
    this.cardUI.clear();
    this._updatePileDisplay();
    this.time.delayedCall(400, () => this.executeEnemyTurns());
  }

  executeEnemyTurns() {
    let delay = 0;
    this.enemies.forEach((enemy) => {
      if (!enemy.isAlive()) return;
      this.time.delayedCall(delay, () => {
        const dot = enemy.startTurn();
        if (dot > 0) this.addLog(`${enemy.name} 受到 ${dot} 点持续伤害`);
        if (!enemy.isAlive()) {
          this.addLog(`${enemy.name} 被持续伤害击败！`);
          this._updateEnemyDisplay();
          this.checkBattleEnd();
          return;
        }
        const results = enemy.executeIntent(this.player);
        results.forEach(r => {
          if (r.type === 'damage') {
            this.addLog(`${enemy.name} 攻击造成 ${r.hpLoss} 伤害${r.blocked > 0 ? `（${r.blocked} 格挡）` : ''}`);
          } else if (r.type === 'defend') {
            this.addLog(`${enemy.name} 获得 ${r.value} 护盾`);
          } else if (r.type === 'buff' || r.type === 'debuff') {
            this.addLog(`${enemy.name}: ${r.desc}`);
          }
        });
        this.refreshUI();
        if (!this.player.isAlive()) this.gameOver(false);
      });
      delay += 600;
    });

    this.time.delayedCall(delay + 200, () => {
      if (this.player.isAlive() && !this.checkBattleEnd()) this.startPlayerTurn();
    });
  }

  playCard(index) {
    if (!this.isPlayerTurn) return;
    const card = this.cardSystem.hand[index];
    if (!card) return;

    const cost = this.player.getEffectiveCost(card);
    if (!this.player.spendEnergy(cost)) {
      this.cardUI.showMessage('灵气不足！');
      return;
    }

    const target = this.enemies.find(e => e.isAlive());
    if (!target && card.type === 'attack') {
      this.player.energy += cost;
      return;
    }

    this.cardSystem.playCard(index);
    this.resolveCard(card, target);
    this.refreshUI();
    this.checkBattleEnd();
  }

  resolveCard(card, target) {
    const eff = card.effect;
    const p = this.player;

    if (eff.damage) {
      const hits = eff.hits || 1;
      let extraDmg = p.getExtraDamage(card);

      // Boss damage bonus (破阵玉符)
      let bossMultiplier = 1;
      if (p.isBossFight) bossMultiplier += p.getBossDamageBonus();

      // Fire fan relic (火鸣羽扇)
      let fireBonus = 0;
      if (card.tags.includes('fire')) {
        for (const r of p.getRelicsByEffect('onFireCard')) {
          fireBonus += r.effect.apply.damage;
        }
      }

      for (let i = 0; i < hits; i++) {
        const baseDmg = p.calcDamage(eff.damage + fireBonus, extraDmg, bossMultiplier);
        const r = target.takeDamage(baseDmg);
        this.addLog(`${card.name}: ${baseDmg} 伤害${r.blocked > 0 ? `（${r.blocked} 格挡）` : ''}`);
        if (r.killed && eff.killBurst) {
          this.enemies.forEach(e => {
            if (e.isAlive()) e.takeDamage(eff.killBurst);
          });
          this.addLog(`尸爆！对所有敌人造成 ${eff.killBurst} 伤害`);
        }
      }

      // Relic: 毒龙模 (poison on attack)
      if (target && target.isAlive()) {
        for (const r of p.getRelicsByEffect('onAttack')) {
          if (r.effect.apply.poison) target.effects.apply('poison', r.effect.apply.poison);
        }
      }
    }

    if (eff.poisonBurst && target) {
      const stacks = target.effects.get('poison');
      const dmg = stacks * eff.poisonBurst;
      if (dmg > 0) {
        target.takeDamage(dmg);
        this.addLog(`${card.name}: ${dmg} 毒爆伤害（${stacks}层 x${eff.poisonBurst}）`);
      }
    }

    if (eff.block) { p.addBlock(eff.block); this.addLog(`${card.name}: +${eff.block} 护盾`); }
    if (eff.heal) { p.heal(eff.heal); this.addLog(`${card.name}: 回复 ${eff.heal} HP`); }
    if (eff.draw) this.cardSystem.drawCards(eff.draw);
    if (eff.energy) p.energy += eff.energy;
    if (eff.weak && target) {
      target.effects.apply('weak', eff.weak);
    }
    if (eff.vulnerable && target) target.effects.apply('vulnerable', eff.vulnerable);
    if (eff.poison && target) target.effects.apply('poison', eff.poison);
    if (eff.burn && target) target.effects.apply('burn', eff.burn);
    if (eff.selfDamage) p.takeDirectDamage(eff.selfDamage);
    if (eff.selfBurn) p.effects.apply('burn', eff.selfBurn);
    if (eff.frozen && target) { target.effects.apply('frozen', eff.frozen); this.addLog(`${card.name}: 施加 ${eff.frozen} 层冰冻`); }
    if (eff.strength) { p.effects.apply('strength', eff.strength); this.addLog(`${card.name}: +${eff.strength} 力量`); }
    if (eff.allDamage) {
      const extraDmg = p.getExtraDamage(card);
      this.enemies.forEach(e => {
        if (e.isAlive()) {
          const dmg = p.calcDamage(eff.allDamage, extraDmg);
          e.takeDamage(dmg);
          this.addLog(`${card.name}: 对 ${e.name} 造成 ${dmg} 伤害`);
        }
      });
    }
    if (eff.allPoison) {
      this.enemies.forEach(e => {
        if (e.isAlive()) e.effects.apply('poison', eff.allPoison);
      });
      this.addLog(`${card.name}: 全体敌人 +${eff.allPoison} 毒`);
    }
    if (eff.boostPoison) {
      this.enemies.forEach(e => {
        if (e.isAlive() && e.effects.has('poison')) {
          e.effects.apply('poison', eff.boostPoison);
        }
      });
      this.addLog(`${card.name}: 所有中毒敌人毒层 +${eff.boostPoison}`);
    }
    if (eff.poisonShield && target) {
      const stacks = target.effects.get('poison');
      if (stacks > 0) { p.addBlock(stacks); this.addLog(`${card.name}: +${stacks} 护盾（来自毒层）`); }
    }
    if (eff.swordDiscount) {
      p._nextSwordDiscount = (p._nextSwordDiscount || 0) + eff.swordDiscount;
    }
  }

  refreshUI() {
    this.cardUI.render(this.cardSystem.hand, this.player);
    this._updatePlayerUI();
    this._updateEnemyDisplay();
    this._updatePileDisplay();
  }

  checkBattleEnd() {
    if (this.enemies.every(e => !e.isAlive())) {
      this.time.delayedCall(500, () => this.gameOver(true));
      return true;
    }
    return false;
  }

  gameOver(won) {
    this.isPlayerTurn = false;
    this.cardUI.clear();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    if (won) {
      // Go to reward scene
      this.scene.start('RewardScene', {
        ...this.mapData,
        encounterType: this.encounterType,
      });
    } else {
      // Death
      const overlay = this.add.graphics().setDepth(50);
      overlay.fillStyle(0x000000, 0.7);
      overlay.fillRect(0, 0, w, h);

      this.add.text(w / 2, h / 2 - 40, '💀 道陨...', {
        fontSize: '36px', color: '#ff4444', fontFamily: 'serif',
      }).setOrigin(0.5).setDepth(51);

      this.add.text(w / 2, h / 2 + 20, `到达第 ${this.player.currentFloor + 1} 层`, {
        fontSize: '18px', color: '#aaa', fontFamily: 'serif',
      }).setOrigin(0.5).setDepth(51);

      const restart = this.add.text(w / 2, h / 2 + 70, '重新开始', {
        fontSize: '20px', color: '#aaa', fontFamily: 'serif',
        backgroundColor: '#222', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
      restart.on('pointerdown', () => this.scene.start('MenuScene'));
    }
  }

  addLog(text) {
    const w = this.cameras.main.width;
    const log = this.add.text(w / 2, 20 + this.logTexts.length * 18, text, {
      fontSize: '13px', color: '#aaa', fontFamily: 'serif',
    }).setOrigin(0.5).setDepth(20).setAlpha(1);
    this.logTexts.push(log);
    this.tweens.add({
      targets: log, alpha: 0, y: log.y - 10,
      delay: 2000, duration: 1000,
      onComplete: () => log.destroy(),
    });
    if (this.logTexts.length > 8) {
      const old = this.logTexts.shift();
      if (old?.active) old.destroy();
    }
  }
}
