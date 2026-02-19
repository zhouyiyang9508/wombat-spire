// CardSystem.js - Deck management: shuffle, draw, play, discard
export class CardSystem {
  constructor(deckCards) {
    this.drawPile = [...deckCards];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.maxHandSize = 10;
    this.shuffle(this.drawPile);
  }

  shuffle(pile) {
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pile[i], pile[j]] = [pile[j], pile[i]];
    }
  }

  drawCards(count = 5) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.hand.length >= this.maxHandSize) break;
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffle(this.drawPile);
      }
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  playCard(index) {
    if (index < 0 || index >= this.hand.length) return null;
    const card = this.hand.splice(index, 1)[0];
    // 打出卡牌后，根据 exhaust 属性决定去向
    if (card.exhaust) {
      this.exhaustPile.push(card);
    } else {
      this.discardPile.push(card);
    }
    return card;
  }

  discardHand() {
    this.discardPile.push(...this.hand);
    this.hand = [];
  }

  exhaustCard(index) {
    if (index < 0 || index >= this.hand.length) return null;
    const card = this.hand.splice(index, 1)[0];
    this.exhaustPile.push(card);
    return card;
  }

  getStatus() {
    return {
      draw: this.drawPile.length,
      hand: this.hand.length,
      discard: this.discardPile.length,
      exhaust: this.exhaustPile.length,
    };
  }
}
