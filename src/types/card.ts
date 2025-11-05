export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  color: 'red' | 'black';
}

export interface GameState {
  tableau: Card[][];
  foundation: Card[][];
  stock: Card[];
  waste: Card[];
  score: number;
  moves: number;
  startTime: number;
}

export interface Move {
  from: {
    pile: 'tableau' | 'foundation' | 'stock' | 'waste';
    index: number;
    cardIndex?: number;
  };
  to: {
    pile: 'tableau' | 'foundation' | 'stock' | 'waste';
    index: number;
  };
  cards: Card[];
}
