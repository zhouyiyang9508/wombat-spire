// MapScene.js - Map navigation between floors
import { MapGenerator } from '../game/MapGenerator.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data) {
    this.player = data.player;
    this.deck = data.deck || [];
    this.gameMap = data.gameMap || null;
    this.currentFloor = data.currentFloor ?? -1; // -1 = haven't entered yet
    this.visitedNodes = data.visitedNodes || new Set();
    this.lastNodeId = data.lastNodeId || null;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a16');

    if (!this.gameMap) {
      this.gameMap = MapGenerator.generate(15);
    }

    // Header
    this.add.text(w / 2, 20, `修仙塔 · ${this.player.realm}`, {
      fontSize: '22px', color: '#e8d5a3', fontFamily: 'serif',
    }).setOrigin(0.5);

    // Player info
    this.add.text(20, 15, `❤️${this.player.hp}/${this.player.maxHp}  💰${this.player.gold}`, {
      fontSize: '16px', color: '#ccc', fontFamily: 'serif',
    });

    // Relic display
    if (this.player.relics.length > 0) {
      const relicStr = this.player.relics.map(r => r.icon).join(' ');
      this.add.text(w - 20, 15, relicStr, {
        fontSize: '16px', fontFamily: 'serif',
      }).setOrigin(1, 0);
    }

    // Draw map - scroll container
    const mapTop = 50;
    const mapBottom = h - 20;
    const mapH = mapBottom - mapTop;
    const floorCount = this.gameMap.length;
    const floorSpacing = Math.min(40, (mapH - 40) / floorCount);
    const startY = mapBottom - 30;

    // Node positions
    this.nodePositions = {};
    this.nodeObjects = {};

    // Draw from bottom (floor 0) to top (floor 14)
    for (let f = 0; f < floorCount; f++) {
      const nodes = this.gameMap[f];
      const y = startY - f * floorSpacing;
      const totalWidth = (nodes.length - 1) * 120;
      const startX = (w - totalWidth) / 2;

      nodes.forEach((node, i) => {
        const x = nodes.length === 1 ? w / 2 : startX + i * 120;
        this.nodePositions[node.id] = { x, y };
      });
    }

    // Draw connections first (lines)
    const g = this.add.graphics();
    for (let f = 0; f < floorCount; f++) {
      this.gameMap[f].forEach(node => {
        const from = this.nodePositions[node.id];
        node.connections.forEach(targetId => {
          const to = this.nodePositions[targetId];
          if (from && to) {
            g.lineStyle(1, 0x334455, 0.5);
            g.lineBetween(from.x, from.y, to.x, to.y);
          }
        });
      });
    }

    // Determine clickable nodes
    const nextFloor = this.currentFloor + 1;
    let clickableIds = new Set();

    if (this.currentFloor === -1) {
      // First move: can click any floor 0 node
      this.gameMap[0].forEach(n => clickableIds.add(n.id));
    } else if (this.lastNodeId && nextFloor < floorCount) {
      // Find last node and its connections
      for (const nodes of this.gameMap) {
        const found = nodes.find(n => n.id === this.lastNodeId);
        if (found) {
          found.connections.forEach(id => clickableIds.add(id));
          break;
        }
      }
    }

    // Draw nodes
    const icons = {
      battle: { icon: '⚔️', color: 0x993333 },
      elite: { icon: '💀', color: 0x996600 },
      event: { icon: '❓', color: 0x336699 },
      rest: { icon: '🔥', color: 0x339933 },
      shop: { icon: '💰', color: 0x999933 },
      boss: { icon: '👹', color: 0x990066 },
    };

    for (let f = 0; f < floorCount; f++) {
      this.gameMap[f].forEach(node => {
        const pos = this.nodePositions[node.id];
        const info = icons[node.type] || icons.battle;
        const visited = this.visitedNodes.has(node.id);
        const clickable = clickableIds.has(node.id);
        const isCurrent = node.id === this.lastNodeId;

        // Node circle
        const circle = this.add.graphics();
        if (isCurrent) {
          circle.lineStyle(3, 0xffcc44, 1);
          circle.strokeCircle(pos.x, pos.y, 18);
        }
        if (clickable) {
          circle.lineStyle(2, 0x66ff66, 0.8);
          circle.strokeCircle(pos.x, pos.y, 20);
        }
        circle.fillStyle(visited ? 0x222222 : info.color, visited ? 0.5 : 0.8);
        circle.fillCircle(pos.x, pos.y, 15);

        // Icon
        const icon = this.add.text(pos.x, pos.y, info.icon, {
          fontSize: '16px',
        }).setOrigin(0.5).setAlpha(visited ? 0.4 : 1);

        // Make clickable
        if (clickable && !visited) {
          const hitArea = this.add.circle(pos.x, pos.y, 20, 0x000000, 0.01)
            .setInteractive({ useHandCursor: true });

          hitArea.on('pointerdown', () => this._enterNode(node));
          hitArea.on('pointerover', () => {
            circle.clear();
            circle.lineStyle(3, 0xffff00, 1);
            circle.strokeCircle(pos.x, pos.y, 22);
            circle.fillStyle(info.color, 1);
            circle.fillCircle(pos.x, pos.y, 15);
          });
          hitArea.on('pointerout', () => {
            circle.clear();
            circle.lineStyle(2, 0x66ff66, 0.8);
            circle.strokeCircle(pos.x, pos.y, 20);
            circle.fillStyle(info.color, 0.8);
            circle.fillCircle(pos.x, pos.y, 15);
          });
        }
      });
    }

    // Floor labels on right side
    for (let f = 0; f < floorCount; f++) {
      const y = startY - f * floorSpacing;
      this.add.text(w - 40, y, `${f + 1}`, {
        fontSize: '11px', color: '#555', fontFamily: 'serif',
      }).setOrigin(0.5);
    }
  }

  _enterNode(node) {
    this.visitedNodes.add(node.id);
    const mapData = {
      player: this.player,
      deck: this.deck,
      gameMap: this.gameMap,
      currentFloor: node.floor,
      visitedNodes: this.visitedNodes,
      lastNodeId: node.id,
    };

    this.player.currentFloor = node.floor;

    switch (node.type) {
      case 'battle':
        this.player.isBossFight = false;
        this.scene.start('BattleScene', { ...mapData, encounterType: 'normal' });
        break;
      case 'elite':
        this.player.isBossFight = false;
        this.scene.start('BattleScene', { ...mapData, encounterType: 'elite' });
        break;
      case 'boss':
        this.player.isBossFight = true;
        this.scene.start('BattleScene', { ...mapData, encounterType: 'boss' });
        break;
      case 'event':
        this.scene.start('EventScene', mapData);
        break;
      case 'rest':
        this.scene.start('RestScene', mapData);
        break;
      case 'shop':
        this.scene.start('ShopScene', mapData);
        break;
    }
  }
}
