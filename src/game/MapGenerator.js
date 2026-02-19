// MapGenerator.js - Generate random layered map
export class MapGenerator {
  // nodeTypes: battle, elite, event, rest, shop, boss
  static generate(floors = 15) {
    const map = [];

    for (let floor = 0; floor < floors; floor++) {
      const nodes = [];
      let nodeCount;

      // Boss floors: single boss node
      if (floor === 4 || floor === 9 || floor === 14) {
        nodes.push({ id: `${floor}-0`, floor, index: 0, type: 'boss', connections: [] });
        map.push(nodes);
        continue;
      }

      // Determine node count (2-4)
      nodeCount = 2 + Math.floor(Math.random() * 3); // 2-4

      for (let i = 0; i < nodeCount; i++) {
        const type = this._randomNodeType(floor);
        nodes.push({ id: `${floor}-${i}`, floor, index: i, type, connections: [] });
      }
      map.push(nodes);
    }

    // Generate connections: each node connects to 1-2 nodes in the next floor
    for (let floor = 0; floor < floors - 1; floor++) {
      const current = map[floor];
      const next = map[floor + 1];

      // Ensure every node in current has at least 1 connection forward
      current.forEach(node => {
        const connCount = 1 + Math.floor(Math.random() * Math.min(2, next.length));
        const indices = this._pickRandom(next.length, connCount);
        node.connections = indices.map(i => next[i].id);
      });

      // Ensure every node in next is reachable from at least one node in current
      next.forEach((nextNode, ni) => {
        const reachable = current.some(cn => cn.connections.includes(nextNode.id));
        if (!reachable) {
          const randomParent = current[Math.floor(Math.random() * current.length)];
          randomParent.connections.push(nextNode.id);
        }
      });
    }

    return map;
  }

  static _randomNodeType(floor) {
    // First floor: always battle
    if (floor === 0) return 'battle';
    // Floor before boss: mix of rest/shop
    if (floor === 3 || floor === 8 || floor === 13) {
      const r = Math.random();
      return r < 0.4 ? 'rest' : r < 0.7 ? 'shop' : 'battle';
    }
    // Normal floors
    const r = Math.random();
    if (r < 0.40) return 'battle';
    if (r < 0.55) return 'elite';
    if (r < 0.72) return 'event';
    if (r < 0.84) return 'rest';
    return 'shop';
  }

  static _pickRandom(max, count) {
    const indices = [];
    const available = Array.from({ length: max }, (_, i) => i);
    for (let i = 0; i < Math.min(count, max); i++) {
      const pick = Math.floor(Math.random() * available.length);
      indices.push(available.splice(pick, 1)[0]);
    }
    return indices.sort((a, b) => a - b);
  }
}
