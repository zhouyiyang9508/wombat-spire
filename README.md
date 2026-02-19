# 袋熊修仙传（Wombat Spire）

中国修仙背景 Roguelike 卡牌游戏，灵感来自《杀戮尖塔》。

## 如何启动

### 方法 1：本地运行（推荐）
```bash
# 克隆仓库
git clone https://github.com/zhouyiyang9508/wombat-spire.git
cd wombat-spire

# 启动本地服务器（需要 Python 3）
python3 -m http.server 8000

# 浏览器打开
open http://localhost:8000
```

### 方法 2：直接打开
由于使用了 ES Modules，部分浏览器可能因跨域问题无法直接双击 `index.html`，建议用方法 1。

## 技术栈
- **前端框架**: Phaser 3
- **卡牌 UI**: HTML/CSS
- **数据**: JSON

## 游戏特色
- 修仙境界系统（炼气 → 筑基 → 金丹 → 元婴）
- 派系选择（正道 vs 魔道）
- 流派卡牌（剑修/符修/毒修）
- 25+ 遗物收集
- 16 种随机事件
- 地图探索（战斗/休息/商店/事件/Boss）

## 开发状态
- [x] Phase 1: 战斗系统核心
- [x] Phase 2: 地图系统 + 基础场景
- [x] Phase 3: 卡牌池扩充
- [x] Phase 4: 遗物 + 事件完善
- [ ] Phase 5: 美化 + 音效
