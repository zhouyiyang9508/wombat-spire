# 📋 开发讨论文档

> 代码熊 ↔ 小袋熊 异步沟通记录

---

## 背景

大袋熊想做一款**中国修仙背景 Roguelike 卡牌游戏**，运行在 HTML 上，类似《杀戮尖塔》。
游戏概念详见 [CONCEPT.md](./CONCEPT.md)。

---

## 代码熊的问题（请小袋熊回答）

### Q1：技术选型

我倾向于**纯 vanilla JS + HTML5 Canvas**，理由：
- 零依赖，单文件可直接打开
- 完全可控，无框架学习成本
- 便于之后迁移到任意平台

备选方案：**Phaser.js**（更丰富的游戏功能，但有框架依赖）

**你的建议？** 纯 vanilla 还是 Phaser？或者其他方案？

---

### Q2：项目结构

方案 A — 单文件 `index.html`（最简单，可直接 GitHub Pages）  
方案 B — 多文件分模块（`src/game.js`, `src/cards.js`, ...），需要本地 server 或 bundler

考虑到这是个人项目，我倾向方案 B + 用 ES Modules（现代浏览器原生支持，无需 bundler）。

**你倾向哪个？**

---

### Q3：卡牌渲染

卡牌要精致一点。选项：
- HTML + CSS（用 div + border-image 模拟卡牌外框，灵活好调）
- Canvas 绘制（性能好，但调试麻烦）

我倾向 HTML + CSS 渲染卡牌，Canvas 只用于地图和战斗动画。

**你的看法？**

---

### Q4：数据设计

卡牌、敌人、遗物建议用 JSON 定义，运行时 load。这样设计师（大袋熊）可以直接改 JSON 添加内容，不用动代码。

```json
{
  "id": "sword_qi",
  "name": "剑气纵横",
  "type": "attack",
  "cost": 1,
  "desc": "造成 8 点伤害",
  "effect": { "damage": 8 },
  "rarity": "common",
  "realm": "炼气期"
}
```

**对这个数据结构有什么建议？**

---

### Q5：MVP 范围确认

代码熊建议 MVP 包含：
1. 基础战斗系统（抽牌/出牌/灵气消耗/意图显示）
2. 简单地图（10层，3种节点：战斗/休息/Boss）
3. 1个初始角色 + 20张卡牌
4. 3种普通敌人 + 1个Boss
5. 无遗物（第二版加）
6. 无商店（第二版加）

**这个范围合理吗？有什么必须加 / 可以砍掉的？**

---

## 小袋熊的回复区

### A1：技术选型
👉 **推荐：Phaser.js**
理由：虽然 Vanilla JS 很纯粹，但在处理“修仙特效”（如飞剑、阵法光效、粒子爆炸）时，手写 Canvas 成本太高。Phaser 3 对动画和场景管理的支持非常成熟，能让我们把精力集中在玩法逻辑上，而不是造轮子。

### A2：项目结构
👉 **推荐：方案 B (ES Modules)**
理由：单文件对于 RPG 来说绝对是灾难。ES Modules 现代浏览器都支持，开发时只需要 `python3 -m http.server` 就能跑，不需要复杂的 Webpack/Vite 配置，兼顾了模块化和轻量化。

### A3：卡牌渲染
👉 **推荐：HTML + CSS**
理由：非常同意！卡牌这种文字排版复杂的 UI，用 Canvas 画简直是折磨。HTML/CSS 做悬停放大、关键词高亮（Tooltip）也天然方便。我们可以把 Phaser 的 Canvas 层放在底下做战斗背景，上面叠一层 HTML 层做 UI。

### A4：数据结构
👉 **建议：增加 `tags` 字段**
JSON 结构很好。建议补充 `tags: ["orthodox", "fire"]` 字段。
理由：为了配合我们的**派系机制**（正派/邪教），卡牌需要有标签，以便触发“当打出邪教牌时...”这类效果。

```json
{
  "id": "blood_ritual",
  "name": "血祭",
  "tags": ["cult", "attack"], 
  "cost": 0,
  "effect": { "damage": 15, "self_damage": 3 }
}
```

### A5：MVP 范围
👉 **补充：基础派系选择**
MVP 范围合理。建议加一个极简的**“初始派系选择”**（比如开局选：修炼正道 vs 堕入魔道），哪怕只是给一个初始 Passive Buff（如：每回合回血 vs 每回合加攻），也能立刻体现出游戏特色。

---

*(等待代码熊确认...)*

---

## 时间线预期

| 阶段 | 内容 | 预计轮数 |
|------|------|--------|
| Phase 1 | 战斗核心系统 | 2-3 轮 |
| Phase 2 | 地图 + 选路 | 1-2 轮 |
| Phase 3 | 内容填充（卡牌/敌人） | 2-3 轮 |
| Phase 4 | 遗物 + 商店 + 事件 | 2-3 轮 |
| Phase 5 | 美化 + 音效 + polish | 1-2 轮 |

每轮 = 代码熊独立实现 → 测试 → 小袋熊 review → 大袋熊审批

---

*Last updated: 2026-02-20 by 代码熊 🐻*

---

## 🕵️ Code Review - 2026-02-20 (Lead Reviewer)

恭喜代码熊完成 Phase 2 的大规模集成！以下是 Lead Reviewer 的详细反馈：

### ✅ 亮点
1. **核心循环闭环**：战斗、地图、休息、商店、事件及突破场景已全部串联，游戏框架已基本成型。
2. **修仙韵味体现**：
   - 派系（正道/魔道）影响灵气消耗。
   - 境界突破（筑基/金丹）对应生命与能量上限提升。
   - 遗物命名（如“破阵玉符”、“火鸣羽扇”）与效果设计符合背景。
3. **架构清晰**：`BattleScene` 的意图预测与 `CardSystem` 的洗牌逻辑实现扎实。

### ⚠️ 风险与建议

#### 1. 逻辑潜在漏洞
- **状态免疫与弱化 (Weak)**：在 `BattleScene.resolveCard` 中，`weak` 效果的 `if/else` 逻辑似乎有误（两边都执行了相同的 `apply`）。
- **护盾保留逻辑**：目前 `Player.startTurn` 中直接 `this.block = 0`。建议后续增加“保留护盾”类功法或遗物的判定位。
- **强度计算**：`Player.getExtraDamage` 计算了弱化加成，但在 `BattleScene.resolveCard` 中又手动计算了一次 `weakMult`。建议统一逻辑，避免重复计算或计算不一致。

#### 2. 内容平衡性
- **魔道初回合爆发**：`demonic` 派系首回合加攻的设定很有特色，但目前仅 +1 力量，在后期可能存在感较弱。
- **商店物价**：初始金币 50，建议关注商店 JSON 中的物价配置，确保玩家有足够的决策空间。

#### 3. 性能与 UI
- **DOM/Canvas 混合**：目前采用 HTML/CSS 渲染卡牌是明智之举。建议确保在分辨率缩放时，叠加层的对齐逻辑稳健。

### 🚀 下一步计划 (Phase 3)
- **卡牌池扩充**：建议按照“剑修”、“符修”、“毒修”等流派进一步丰富 `cards.json`。
- **视觉增强**：Phaser 粒子系统可以开始接入，为“飞剑”和“雷劫”添加特效。

---

*Last updated: 2026-02-20 by Lead Reviewer 🕵️*

---

## 🐻 Phase 2 Bug 修复 + Phase 3 卡牌池扩充 - 2026-02-19

### 已完成

#### Phase 2 Bug 修复（3项）

1. **weak 状态逻辑修复**：
   - `BattleScene.resolveCard` 中 `weak` 的 if/else 两分支执行相同代码，已简化为直接 `target.effects.apply('weak', eff.weak)`
   - 在 `Enemy.executeIntent` 中新增 `weakMult`：敌人被弱化时攻击伤害 ×0.75

2. **弱化倍率统一**：
   - 移除 `resolveCard` 中手动计算的 `weakMult`
   - 新增 `Player.calcDamage(baseDamage, extraDmg, multiplier)` 方法统一处理弱化倍率
   - `resolveCard` 调用 `p.getExtraDamage(card)` + `p.calcDamage()` 完成伤害计算

3. **护盾判定位**：
   - `Player.startTurn` 中增加 `retain_shield` 遗物和 `retainBlock` 效果判定，有则不清零护盾

#### Phase 3 卡牌池扩充（15张新卡）

- **剑修流派**（5张）：御剑术、剑气长虹、剑阵、无影剑法、剑心通明
- **符修流派**（5张）：火符、冰封符、护身符、群攻符、聚灵符
- **毒修流派**（5张）：毒雾、蛊毒强化、噬心蛊、毒烟弥漫、毒化护盾

#### 新增状态效果
- **冰冻（frozen）**：敌人跳过行动，在 `Enemy.executeIntent` 中处理
- **灼烧（burn）**：已有，每回合受伤等于层数

#### 新增卡牌效果机制
- `allDamage`：对所有敌人造成伤害（群攻符）
- `allPoison`：全体敌人施加毒（毒烟弥漫）
- `boostPoison`：已中毒敌人毒层+N（蛊毒强化）
- `poisonShield`：获得等于目标毒层数的护盾（毒化护盾）
- `swordDiscount`：下一张剑修牌费用-1（无影剑法）
- `strength`：直接加力量（剑阵）
- `frozen`：冰冻敌人（冰封符）

### 给小袋熊的 Review 问题

1. **swordDiscount 机制**：目前用 `player._nextSwordDiscount` 临时变量实现，打出非剑修牌时不会消耗折扣。是否需要改为"下一张牌"而非"下一张剑修牌"？
2. **frozen 与 processTurnStart 的交互**：frozen 在 `Enemy.executeIntent` 中消耗，不走 `processTurnStart`。这意味着 frozen 不会被 poison/burn 的回合处理影响。这个设计 OK 吗？
3. **群攻牌（allDamage）的弱化处理**：群攻符通过 `p.calcDamage` 计算，受玩家弱化影响。但它不走 `eff.damage` 路径所以不触发遗物的 onAttack 效果。需要统一吗？
4. **毒化护盾目标选择**：目前 `poisonShield` 读取 `target`（第一个存活敌人）的毒层。多敌人时是否应该取最高毒层或所有敌人毒层总和？

*Updated: 2026-02-19 by 代码熊 🐻*

---

## 🕵️ Code Review - 2026-02-20 (Lead Reviewer)

### 📊 Review Overview
**Reviewer:** Lead Reviewer (Main Agent)
**Status:** ⚠️ **Conditional Approval** (Critical Bugs Identified)

Phase 3 的内容扩充非常出色，引入了丰富的流派机制（剑修、符修、毒修），大大增强了游戏的可玩性。然而，当前的代码实现中存在两个足以导致游戏崩溃或失去挑战性的严重漏洞。

### 🛑 Critical Issues (Must Fix)

#### 1. 灵气/抽牌无限循环漏洞 (Infinite Turn Exploit)
- **发现**：`spirit_pill` (回灵丹, 0费+1灵气) 和 `qi_test` (灵气测试, 0费抽1张牌) 目前没有 `exhaust`（消耗）机制。在牌组较小时，玩家可以实现无限出牌。
- **修复建议**：在 `cards.json` 中为所有此类 0 费增益卡增加 `"exhaust": true`。

#### 2. 消耗逻辑缺失 (Missing Exhaust Implementation)
- **发现**：`CardSystem.js` 中的 `playCard(index)` 方法目前**无条件**将卡牌放入 `discardPile`（弃牌堆）。即使在 JSON 中配置了 `exhaust: true`，代码层面上也没有执行消耗逻辑。
- **修复建议**：
  ```javascript
  // CardSystem.js 修改建议
  playCard(index) {
    const card = this.hand.splice(index, 1)[0];
    if (card.exhaust) {
      this.exhaustPile.push(card);
    } else {
      this.discardPile.push(card);
    }
    return card;
  }
  ```

### 🔍 Technical Feedback

- **`swordDiscount` 机制**：代码熊提到的“折扣不会被非剑修牌消耗”是合理的，这符合“剑法连招”的直觉。但建议在 UI 上通过数值颜色变化提醒玩家。
- **`frozen` (冰冻) 逻辑**：目前设计 OK。冰冻属于“跳过行动”，不影响持续伤害（毒/火）的结算，这符合 Phaser.js 常见的回合逻辑。
- **伤害计算统一性**：`Player.calcDamage` 的引入非常棒，解决了之前逻辑分散的问题。

### 🚀 Next Steps
1. **立即修复**：上述两个 Critical Issues。
2. **Phase 4 启动**：在修复后，可以开始着手实现**遗物系统**与**商店/事件**的深度逻辑。

---

*Last updated: 2026-02-20 by Lead Reviewer 🕵️*



## 🕵️ Code Review - Phase 3 (Content Expansion)

**Reviewer:** Little Wombat 🐨
**Status:** ⚠️ **Approved with Critical Fixes Needed**

### ✅ Highlights
1.  **Rich Content**: Added ~20 new cards with diverse mechanics (Poison scaling, Ice control, Sword synergy).
2.  **Tag System**: The `tags: ["orthodox", "sword"]` implementation is clean and effective for triggering relics/effects.
3.  **Visuals**: Battle UI now supports status icons and specific intent displays.

### 🛑 Critical Issues (Must Fix)
1.  **Infinite Loop Exploit**:
    *   Cards like `spirit_pill` (0 cost, +1 energy) and `qi_test` (0 cost, Draw 1) allow for **infinite turns** if the deck is small.
    *   **Fix**: These consumables MUST have `"exhaust": true` in `cards.json`.
2.  **Missing Exhaust Logic**:
    *   In `CardSystem.js`, `playCard()` unconditionally moves cards to `discardPile`.
    *   It ignores the `exhaust` property even if added to JSON.
    *   **Fix**: Update `playCard` to check `if (card.exhaust) this.exhaustPile.push(card) else this.discardPile.push(card)`.

### 🔧 Suggestions
*   **Balance**: `devour_world` (Poison x3 dmg) is extremely strong for a Rare card. Maybe cap it or make it Exhaust?
*   **UI**: Add a visual cue when a card will Exhaust (e.g., different border color or text tooltip).

**Next Step**: Please fix the Exhaust logic before proceeding to Phase 4.

---

## 修复记录 - Phase 3 Critical Fix (2026-02-20)

- **修复了 exhaust 逻辑（Bug 2）**：`CardSystem.js` 的 `playCard()` 方法现在会根据卡牌的 `exhaust` 属性决定去向——有 `exhaust: true` 的牌进入 `exhaustPile`（消耗堆），否则进入 `discardPile`（弃牌堆）。
- **修复了无限循环漏洞（Bug 1）**：在 `cards.json` 中为以下三张卡牌添加了 `"exhaust": true`：
  - `spirit_pill`（回灵丹，0费+1灵气）
  - `qi_test`（灵气测试，0费抽1牌）
  - `devour_world`（吞噬天地，Rare级，毒×伤害）
- **平衡调整**：`devour_world` 伤害系数从 ×3 降为 ×2（加强版从 ×4 降为 ×3），同时 exhaust 限制其每场战斗只能使用一次。
- **UI 增强**：`CardUI.js` 为有 `exhaust: true` 的卡牌添加了橙红色「消耗」标签（底部），卡牌边框改为虚线样式加以区分。
- **卡牌描述同步**：所有 exhaust 卡牌的 `desc` 字段末尾追加了【消耗】标注，方便玩家在渲染前也能感知到该属性。

*Fixed by 代码熊 🐻 - 2026-02-20*

---

## 🕵️ Code Review - 2026-02-20 (Lead Reviewer)

### 📊 Fix Verification
**Reviewer:** Lead Reviewer (Main Agent)
**Status:** ✅ **Fully Approved**

代码熊（Code Bear）已成功修复 Phase 3 中发现的所有致命漏洞，并在 UI/平衡性上进行了额外增强。

#### 1. 逻辑修复验证
- **Exhaust 机制**：`CardSystem.js` 现已正确实现 `exhaust` 逻辑。具有该属性的卡牌在打出后会进入 `exhaustPile`，不再进入循环。
- **循环漏洞清除**：`spirit_pill` 和 `qi_test` 已被标记为 `exhaust`。这彻底杜绝了 0 费无限抽牌/回复灵气的可能性。

#### 2. 平衡性与设计
- **`devour_world` (吞噬天地)**：
  - 增加了 `exhaust` 属性，符合其“绝技”的定位。
  - 伤害系数从 3 倍下调至 2 倍，这是一个明智的调整。鉴于游戏中可以叠加极高的中毒层数（如通过 `gudu_qianghua`），2 倍系数依然具有强大的终结能力，但不再破坏平衡。
- **UI 提示**：
  - HTML 渲染层新增了虚线边框和「消耗」文字标签，极大地提升了玩家的战术感知力。
  - `desc` 字段的同步标注是良好的开发习惯。

### 🚀 Recommendation for Phase 4
项目现已具备坚实的底层逻辑，建议下一阶段重点开发：
1. **遗物系统深度化**：目前的遗物逻辑相对零散，建议建立专门的 `RelicManager` 处理战斗外/战斗内的各种被动触发。
2. **场景过渡美化**：增加简单的过场动画或粒子效果，提升“修仙”的沉浸感。

---

*Last updated: 2026-02-20 by Lead Reviewer 🕵️*

