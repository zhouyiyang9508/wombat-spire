// BattleScene.js - Core battle scene
import { Player } from '../game/Player.js';
import { Enemy } from '../game/Enemy.js';
import { CardSystem } from '../game/CardSystem.js';
import { CardUI } from '../ui/CardUI.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.faction = data.faction || 'orthodox';
    this.battleIndex = data.battleIndex || 0;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // Load data
    const allCards = this.cache.json.get('cards');
    const allEnemies = this.cache.json.get('enemies');

    // Create player
    this.player = new Player(this.faction);

    // Build initial deck: 4 faction + 4 neutral + 2 opposite
    const factionTag = this.faction === 'orthodox' ? 'orthodox' : 'demonic';
    const oppositeTag = this.faction === 'orthodox' ? 'demonic' : 'orthodox';
    const factionCards = allCards.filter(c => c.tags.includes(factionTag));
    const neutralCards = allCards.filter(c => c.tags.includes('neutral'));
    const oppositeCards = allCards.filter(c => c.tags.includes(oppositeTag));

    const deck = [
      ...this._pick(factionCards, 4),
      ...this._pick(neutralCards, 4),
      ...this._pick(oppositeCards, 2),
    ];

    this.cardSystem = new CardSystem(deck);

    // Pick enemy based on battleIndex
    const enemyPool = allEnemies.filter(e => e.type === 'normal');
    const bossPool = allEnemies.filter(e => e.type === 'boss');
    let enemyData;
    if (this.battleIndex >= 3) {
      enemyData = bossPool[0];
    } else {
      enemyData = enemyPool[this.battleIndex % enemyPool.length];
    }

    // Create enemies
    this.enemies = [];
    const count = enemyData.count || 1;
    for (let i = 0; i < count; i++) {
      this.enemies.push(new Enemy(enemyData, i));
    }

    // Card UI
    this.cardUI = new CardUI((index) => this.playCard(index));

    // Draw background elements (water ink style)
    this._drawBackground(w, h);

    // Enemy display
    this.enemyDisplays = [];
    this._renderEnemies(w, h);

    // Player display
    this._renderPlayerUI(w, h);

    // Draw pile / Discard buttons
    this._renderPileButtons(w, h);

    // End turn button
    this.endTurnBtn = this.add.text(w - 100, h - 220, '结束回合', {
      fontSize: '18px',
      color: '#fff',
      backgroundColor: '#993333',
      padding: { x: 16, y: 8 },
      fontFamily: 'serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    this.endTurnBtn.on('pointerdown', () => this.endPlayerTurn());
    this.endTurnBtn.on('pointerover', () => this.endTurnBtn.setScale(1.1));
    this.endTurnBtn.on('pointerout', () => this.endTurnBtn.setScale(1));

    // Battle log
    this.logTexts = [];

    // Start battle
    this.isPlayerTurn = true;
    this.startPlayerTurn();
  }

  _pick(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  _drawBackground(w, h) {
    // Simple atmospheric rectangles
    const g = this.add.graphics();
    g.fillStyle(0x111122, 0.3);
    g.fillRect(0, 0, w, h);
    // Mountain silhouette
    g.fillStyle(0x0a0a18, 0.6);
    g.fillTriangle(0, h * 0.5, w * 0.3, h * 0.15, w * 0.5, h * 0.5);
    g.fillTriangle(w * 0.4, h * 0.5, w * 0.7, h * 0.1, w, h * 0.5);
    // Ground
    g.fillStyle(0x0d0d1a, 1);
    g.fillRect(0, h * 0.5, w, h * 0.5);
    // Fog line
    g.fillStyle(0x222244, 0.3);
    g.fillRect(0, h * 0.48, w, 20);
  }

  _renderEnemies(w, h) {
    this.enemyDisplays.forEach(d => { d.container && d.container.destroy(); });
    this.enemyDisplays = [];
    const count = this.enemies.length;
    this.enemies.forEach((enemy, i) => {
      const x = w / 2 + (i - (count - 1) / 2) * 200;
      const y = h * 0.28;
      const container = this.add.container(x, y).setDepth(5);

      // Enemy body (circle)
      const body = this.add.graphics();
      const color = enemy.id === 'demon_elder' ? 0x880044 : 0x334455;
      body.fillStyle(color, 0.9);
      body.fillCircle(0, 0, 45);
      body.lineStyle(2, 0x667788);
      body.strokeCircle(0, 0, 45);
      container.add(body);

      // Name
      const name = this.add.text(0, -70, enemy.name, {
        fontSize: '16px', color: '#ddd', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(name);

      // HP bar bg
      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x333333, 1);
      hpBg.fillRect(-40, 55, 80, 10);
      container.add(hpBg);

      // HP bar fill
      const hpBar = this.add.graphics();
      container.add(hpBar);

      // HP text
      const hpText = this.add.text(0, 72, '', {
        fontSize: '13px', color: '#ccc', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(hpText);

      // Block text
      const blockText = this.add.text(50, 0, '', {
        fontSize: '14px', color: '#4488ff', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(blockText);

      // Intent display
      const intentText = this.add.text(0, -95, '', {
        fontSize: '18px', color: '#fff', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(intentText);

      // Effects text
      const effectsText = this.add.text(0, 90, '', {
        fontSize: '12px', color: '#aaa', fontFamily: 'serif',
      }).setOrigin(0.5);
      container.add(effectsText);

      this.enemyDisplays.push({ container, hpBar, hpText, blockText, intentText, effectsText, name, hpBg, body });
    });
    this._updateEnemyDisplay();
  }

  _updateEnemyDisplay() {
    this.enemies.forEach((enemy, i) => {
      if (i >= this.enemyDisplays.length) return;
      const d = this.enemyDisplays[i];
      if (!enemy.isAlive()) {
        d.container.setAlpha(0.3);
        return;
      }
      // HP bar
      d.hpBar.clear();
      const ratio = enemy.hp / enemy.maxHp;
      const color = ratio > 0.5 ? 0x44aa44 : ratio > 0.25 ? 0xaaaa44 : 0xaa4444;
      d.hpBar.fillStyle(color, 1);
      d.hpBar.fillRect(-40, 55, 80 * ratio, 10);

      d.hpText.setText(`${enemy.hp}/${enemy.maxHp}`);
      d.blockText.setText(enemy.block > 0 ? `🛡️${enemy.block}` : '');

      // Intent
      const intent = enemy.getIntentDisplay();
      d.intentText.setText(`${intent.icon} ${intent.text}`);
      d.intentText.setColor(intent.color);

      // Effects
      const eff = enemy.effects.getDisplayList();
      d.effectsText.setText(eff.map(e => `${e.icon}${e.stacks}`).join(' '));
    });
  }

  _renderPlayerUI(w, h) {
    const y = h - 220;

    // Player info container (left side)
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

    this._updatePlayerUI();
  }

  _updatePlayerUI() {
    const p = this.player;
    this.playerHpText.setText(`❤️ ${p.hp}/${p.maxHp}`);
    this.playerBlockText.setText(p.block > 0 ? `🛡️ 护盾: ${p.block}` : '');
    this.playerEnergyText.setText(`💎 灵气: ${p.energy}/${p.maxEnergy}`);
    this.factionText.setText(p.faction === 'orthodox' ? '☯ 正道' : '👹 魔道');

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
    if (turnInfo.dotDamage > 0) {
      this.addLog(`你受到 ${turnInfo.dotDamage} 点持续伤害`);
    }
    if (!this.player.isAlive()) {
      this.gameOver(false);
      return;
    }
    this.cardSystem.drawCards(5);
    this.refreshUI();
  }

  endPlayerTurn() {
    if (!this.isPlayerTurn) return;
    this.isPlayerTurn = false;
    this.cardSystem.discardHand();
    this.cardUI.clear();
    this._updatePileDisplay();

    // Enemy turns
    this.time.delayedCall(400, () => this.executeEnemyTurns());
  }

  executeEnemyTurns() {
    let delay = 0;
    this.enemies.forEach((enemy, i) => {
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
            this.addLog(`${enemy.name} 攻击造成 ${r.hpLoss} 伤害${r.blocked > 0 ? `（${r.blocked} 被护盾抵挡）` : ''}`);
          } else if (r.type === 'defend') {
            this.addLog(`${enemy.name} 获得 ${r.value} 护盾`);
          } else if (r.type === 'buff' || r.type === 'debuff') {
            this.addLog(`${enemy.name}: ${r.desc}`);
          }
        });
        this.refreshUI();
        if (!this.player.isAlive()) {
          this.gameOver(false);
        }
      });
      delay += 600;
    });

    this.time.delayedCall(delay + 200, () => {
      if (this.player.isAlive() && !this.checkBattleEnd()) {
        this.startPlayerTurn();
      }
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

    // Find first alive enemy as target
    const target = this.enemies.find(e => e.isAlive());
    if (!target && card.type === 'attack') {
      this.player.energy += cost; // Refund
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

    // Damage
    if (eff.damage) {
      const hits = eff.hits || 1;
      let extraDmg = p.effects.get('strength');
      if (p.faction === 'demonic' && p.firstTurn) extraDmg += 1;
      if (p.effects.has('weak')) {
        // Weak: reduce damage by 25%
        for (let i = 0; i < hits; i++) {
          const baseDmg = Math.max(0, Math.floor((eff.damage + extraDmg) * 0.75));
          const r = target.takeDamage(baseDmg);
          this.addLog(`${card.name}: ${baseDmg} 伤害${r.blocked > 0 ? `（${r.blocked} 格挡）` : ''}`);
        }
      } else {
        for (let i = 0; i < hits; i++) {
          const dmg = eff.damage + extraDmg;
          const r = target.takeDamage(dmg);
          this.addLog(`${card.name}: ${dmg} 伤害${r.blocked > 0 ? `（${r.blocked} 格挡）` : ''}`);
          // Kill burst (尸爆术)
          if (r.killed && eff.killBurst) {
            this.enemies.forEach(e => {
              if (e.isAlive()) e.takeDamage(eff.killBurst);
            });
            this.addLog(`尸爆！对所有敌人造成 ${eff.killBurst} 伤害`);
          }
        }
      }
    }

    // Poison burst (吞噬天地)
    if (eff.poisonBurst && target) {
      const stacks = target.effects.get('poison');
      const dmg = stacks * eff.poisonBurst;
      if (dmg > 0) {
        target.takeDamage(dmg);
        this.addLog(`${card.name}: ${dmg} 毒爆伤害（${stacks}层 x${eff.poisonBurst}）`);
      }
    }

    // Block
    if (eff.block) {
      p.addBlock(eff.block);
      this.addLog(`${card.name}: +${eff.block} 护盾`);
    }

    // Heal
    if (eff.heal) {
      p.heal(eff.heal);
      this.addLog(`${card.name}: 回复 ${eff.heal} HP`);
    }

    // Draw
    if (eff.draw) {
      this.cardSystem.drawCards(eff.draw);
    }

    // Energy
    if (eff.energy) {
      p.energy += eff.energy;
    }

    // Debuffs on enemy
    if (eff.weak && target) target.effects.apply('weak', eff.weak);
    if (eff.vulnerable && target) target.effects.apply('vulnerable', eff.vulnerable);
    if (eff.poison && target) target.effects.apply('poison', eff.poison);
    if (eff.burn && target) target.effects.apply('burn', eff.burn);

    // Self damage
    if (eff.selfDamage) p.takeDirectDamage(eff.selfDamage);
    if (eff.selfBurn) p.effects.apply('burn', eff.selfBurn);
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

    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, w, h);

    if (won) {
      this.add.text(w / 2, h / 2 - 40, '✨ 战斗胜利！', {
        fontSize: '36px', color: '#ffdd44', fontFamily: 'serif',
      }).setOrigin(0.5).setDepth(51);

      // Next battle button
      if (this.battleIndex < 3) {
        const next = this.add.text(w / 2, h / 2 + 40, '继续前进 →', {
          fontSize: '22px', color: '#66ff66', fontFamily: 'serif',
          backgroundColor: '#1a331a', padding: { x: 16, y: 8 },
        }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
        next.on('pointerdown', () => {
          this.scene.restart({ faction: this.faction, battleIndex: this.battleIndex + 1 });
        });
      } else {
        this.add.text(w / 2, h / 2 + 40, '🏆 通关！你战胜了魔宗长老！', {
          fontSize: '22px', color: '#ffdd44', fontFamily: 'serif',
        }).setOrigin(0.5).setDepth(51);
      }
    } else {
      this.add.text(w / 2, h / 2 - 40, '💀 道陨...', {
        fontSize: '36px', color: '#ff4444', fontFamily: 'serif',
      }).setOrigin(0.5).setDepth(51);
    }

    // Restart button
    const restart = this.add.text(w / 2, h / 2 + (won && this.battleIndex < 3 ? 90 : 40), '重新开始', {
      fontSize: '20px', color: '#aaa', fontFamily: 'serif',
      backgroundColor: '#222', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  addLog(text) {
    // Use the battle log display area
    const w = this.cameras.main.width;
    const log = this.add.text(w / 2, 20 + this.logTexts.length * 18, text, {
      fontSize: '13px', color: '#aaa', fontFamily: 'serif',
    }).setOrigin(0.5).setDepth(20).setAlpha(1);

    this.logTexts.push(log);

    // Fade out and limit
    this.tweens.add({
      targets: log,
      alpha: 0,
      y: log.y - 10,
      delay: 2000,
      duration: 1000,
      onComplete: () => log.destroy(),
    });

    // Keep only recent logs
    if (this.logTexts.length > 8) {
      const old = this.logTexts.shift();
      if (old && old.active) old.destroy();
    }
  }
}
