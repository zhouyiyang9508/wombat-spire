// CardUI.js - HTML card rendering on top of Phaser canvas
export class CardUI {
  constructor(onPlayCard) {
    this.onPlayCard = onPlayCard;
    this.container = document.getElementById('card-hand');
    this.selectedIndex = -1;
  }

  render(hand, player) {
    this.container.innerHTML = '';
    hand.forEach((card, i) => {
      const cost = player.getEffectiveCost(card);
      const canPlay = player.energy >= cost;
      const el = document.createElement('div');
      el.className = `card ${card.tags[0] || 'neutral'} ${canPlay ? '' : 'disabled'} ${card.exhaust ? 'exhaust-card' : ''}`;
      el.innerHTML = `
        <div class="card-cost">${cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-type">${this._typeLabel(card.type)}</div>
        <div class="card-desc">${card.desc}</div>
        <div class="card-tags">${card.tags.map(t => this._tagLabel(t)).join(' ')}</div>
        ${card.exhaust ? '<div class="card-exhaust-label">消耗</div>' : ''}
      `;
      el.addEventListener('click', () => {
        if (canPlay) this.onPlayCard(i);
      });
      el.addEventListener('mouseenter', () => el.classList.add('hover'));
      el.addEventListener('mouseleave', () => el.classList.remove('hover'));
      this.container.appendChild(el);
    });
  }

  clear() {
    this.container.innerHTML = '';
  }

  _typeLabel(type) {
    return { attack: '攻击', skill: '技能', power: '能力' }[type] || type;
  }

  _tagLabel(tag) {
    const labels = {
      orthodox: '正道',
      demonic: '魔道',
      neutral: '通用',
      sword: '剑',
      body: '身法',
      seal: '符',
      soul: '魂',
      fire: '火',
      pill: '丹',
    };
    return labels[tag] || tag;
  }

  showMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'battle-message';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1500);
  }
}
