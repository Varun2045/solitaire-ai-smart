import { Card, Suit, Rank } from '@/types/card';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const RANK_VALUES: Record<Rank, number> = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13,
};

// Create a new shuffled deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    const color = suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
        color,
      });
    }
  }
  
  return shuffleDeck(deck);
}

// Fisher-Yates shuffle algorithm
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if a card can be placed on a tableau pile
export function canPlaceOnTableau(card: Card, targetCard: Card | null): boolean {
  if (!targetCard) {
    // Only Kings can be placed on empty tableau piles
    return card.rank === 'K';
  }
  
  // Must be opposite color and one rank lower
  const isOppositeColor = card.color !== targetCard.color;
  const isOneLower = RANK_VALUES[card.rank] === RANK_VALUES[targetCard.rank] - 1;
  
  return isOppositeColor && isOneLower;
}

// Check if a card can be placed on a foundation pile
export function canPlaceOnFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    // Only Aces can start a foundation pile
    return card.rank === 'A';
  }
  
  const topCard = foundationPile[foundationPile.length - 1];
  
  // Must be same suit and one rank higher
  const isSameSuit = card.suit === topCard.suit;
  const isOneHigher = RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1;
  
  return isSameSuit && isOneHigher;
}

// Get cards that can be moved from a tableau pile (all face-up cards from clicked card to bottom)
export function getMovableCards(pile: Card[], clickedIndex: number): Card[] {
  if (clickedIndex < 0 || clickedIndex >= pile.length) return [];
  
  const movableCards = pile.slice(clickedIndex);
  
  // Check if all cards are face up and form a valid sequence
  if (!movableCards.every(card => card.faceUp)) return [];
  
  for (let i = 1; i < movableCards.length; i++) {
    if (!canPlaceOnTableau(movableCards[i], movableCards[i - 1])) {
      return [];
    }
  }
  
  return movableCards;
}
