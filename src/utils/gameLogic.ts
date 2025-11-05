import { GameState, Card, Move } from '@/types/card';
import { createDeck, canPlaceOnTableau, canPlaceOnFoundation } from './cardUtils';

// Initialize a new game state
export function initializeGame(): GameState {
  const deck = createDeck();
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  
  // Deal cards to tableau
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++];
      card.faceUp = row === col; // Only top card face up
      tableau[col].push(card);
    }
  }
  
  // Remaining cards go to stock
  const stock = deck.slice(deckIndex).map(card => ({ ...card, faceUp: false }));
  
  return {
    tableau,
    foundation: [[], [], [], []],
    stock,
    waste: [],
    score: 0,
    moves: 0,
    startTime: Date.now(),
  };
}

// Find all valid moves in the current game state
export function findValidMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  
  // Check waste to foundation
  if (state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];
    state.foundation.forEach((pile, index) => {
      if (canPlaceOnFoundation(wasteCard, pile)) {
        moves.push({
          from: { pile: 'waste', index: 0 },
          to: { pile: 'foundation', index },
          cards: [wasteCard],
        });
      }
    });
    
    // Check waste to tableau
    state.tableau.forEach((pile, index) => {
      const targetCard = pile.length > 0 ? pile[pile.length - 1] : null;
      if (canPlaceOnTableau(wasteCard, targetCard)) {
        moves.push({
          from: { pile: 'waste', index: 0 },
          to: { pile: 'tableau', index },
          cards: [wasteCard],
        });
      }
    });
  }
  
  // Check tableau to foundation
  state.tableau.forEach((pile, tableauIndex) => {
    if (pile.length > 0) {
      const topCard = pile[pile.length - 1];
      if (topCard.faceUp) {
        state.foundation.forEach((foundationPile, foundationIndex) => {
          if (canPlaceOnFoundation(topCard, foundationPile)) {
            moves.push({
              from: { pile: 'tableau', index: tableauIndex, cardIndex: pile.length - 1 },
              to: { pile: 'foundation', index: foundationIndex },
              cards: [topCard],
            });
          }
        });
      }
    }
  });
  
  // Check tableau to tableau
  state.tableau.forEach((fromPile, fromIndex) => {
    const faceUpCards = fromPile.filter(card => card.faceUp);
    if (faceUpCards.length === 0) return;
    
    faceUpCards.forEach((card, cardIndex) => {
      const actualIndex = fromPile.indexOf(card);
      const movableCards = fromPile.slice(actualIndex);
      
      state.tableau.forEach((toPile, toIndex) => {
        if (fromIndex === toIndex) return;
        
        const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
        if (canPlaceOnTableau(movableCards[0], targetCard)) {
          moves.push({
            from: { pile: 'tableau', index: fromIndex, cardIndex: actualIndex },
            to: { pile: 'tableau', index: toIndex },
            cards: movableCards,
          });
        }
      });
    });
  });
  
  return moves;
}

// Get the best move based on simple heuristics
export function getBestMove(state: GameState): Move | null {
  const validMoves = findValidMoves(state);
  
  if (validMoves.length === 0) return null;
  
  // Priority: Foundation moves > Reveal new cards > Other moves
  const foundationMoves = validMoves.filter(m => m.to.pile === 'foundation');
  if (foundationMoves.length > 0) return foundationMoves[0];
  
  // Moves that reveal hidden cards
  const revealingMoves = validMoves.filter(m => {
    if (m.from.pile === 'tableau' && m.from.cardIndex !== undefined) {
      const pile = state.tableau[m.from.index];
      const cardIndex = m.from.cardIndex;
      return cardIndex > 0 && !pile[cardIndex - 1].faceUp;
    }
    return false;
  });
  
  if (revealingMoves.length > 0) return revealingMoves[0];
  
  return validMoves[0];
}

// Check if the game is won
export function isGameWon(state: GameState): boolean {
  return state.foundation.every(pile => pile.length === 13);
}

// Calculate score based on moves and time
export function calculateScore(moves: number, timeSeconds: number): number {
  const baseScore = 1000;
  const movePenalty = moves * 5;
  const timePenalty = Math.floor(timeSeconds / 10);
  return Math.max(0, baseScore - movePenalty - timePenalty);
}
