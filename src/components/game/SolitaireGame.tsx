import { useState, useEffect, useCallback } from 'react';
import { GameState, Move, Card as CardType } from '@/types/card';
import { initializeGame, findValidMoves, getBestMove, isGameWon } from '@/utils/gameLogic';
import { canPlaceOnTableau, canPlaceOnFoundation, getMovableCards } from '@/utils/cardUtils';
import { Card } from './Card';
import { GameControls } from './GameControls';
import { GameStats } from './GameStats';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SolitaireGame() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [selectedCards, setSelectedCards] = useState<{ pile: string; index: number; cardIndex: number } | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [highlightedMove, setHighlightedMove] = useState<Move | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      const bestMove = getBestMove(gameState);
      
      if (!bestMove) {
        setIsAutoPlaying(false);
        toast.info('No more valid moves available!');
        return;
      }

      executeMove(bestMove);
    }, 800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, gameState]);

  // Check for win condition
  useEffect(() => {
    if (isGameWon(gameState)) {
      setIsAutoPlaying(false);
      toast.success('🎉 Congratulations! You won!', {
        description: `Score: ${gameState.score} | Moves: ${gameState.moves}`,
      });
    }
  }, [gameState]);

  const executeMove = useCallback((move: Move) => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // Remove cards from source
      if (move.from.pile === 'waste') {
        newState.waste = newState.waste.slice(0, -1);
      } else if (move.from.pile === 'tableau' && move.from.cardIndex !== undefined) {
        newState.tableau[move.from.index] = [...newState.tableau[move.from.index].slice(0, move.from.cardIndex)];
        
        // Flip the new top card if it exists
        const pile = newState.tableau[move.from.index];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
          pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
        }
      }
      
      // Add cards to destination
      if (move.to.pile === 'foundation') {
        newState.foundation[move.to.index] = [...newState.foundation[move.to.index], ...move.cards];
      } else if (move.to.pile === 'tableau') {
        newState.tableau[move.to.index] = [...newState.tableau[move.to.index], ...move.cards];
      }
      
      newState.moves++;
      newState.score += move.to.pile === 'foundation' ? 10 : 5;
      
      return newState;
    });
    
    setSelectedCards(null);
  }, []);

  const handleHint = () => {
    const bestMove = getBestMove(gameState);
    
    if (!bestMove) {
      toast.info('No valid moves available. Try drawing from stock!');
      return;
    }

    setHighlightedMove(bestMove);
    toast.success('💡 Hint highlighted in gold!');

    setTimeout(() => setHighlightedMove(null), 3000);
  };

  const handleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) {
      toast.success('🤖 AI is now playing...');
    } else {
      toast.info('AI stopped');
    }
  };

  const handleRestart = () => {
    setGameState(initializeGame());
    setSelectedCards(null);
    setIsAutoPlaying(false);
    setHighlightedMove(null);
    toast.success('Game restarted!');
  };

  const handleNewGame = () => {
    handleRestart();
  };

  const handleStockClick = useCallback(() => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      if (newState.stock.length > 0) {
        const card = { ...newState.stock[newState.stock.length - 1], faceUp: true };
        newState.stock = newState.stock.slice(0, -1);
        newState.waste = [...newState.waste, card];
      } else if (newState.waste.length > 0) {
        // Reset stock from waste
        newState.stock = [...newState.waste].reverse().map(c => ({ ...c, faceUp: false }));
        newState.waste = [];
      }
      
      return newState;
    });
    setSelectedCards(null);
  }, []);

  const tryAutoMoveToFoundation = useCallback((card: CardType, fromPile: 'waste' | 'tableau', fromIndex: number, cardIndex?: number) => {
    // Try to auto-move to foundation
    for (let i = 0; i < gameState.foundation.length; i++) {
      if (canPlaceOnFoundation(card, gameState.foundation[i])) {
        executeMove({
          from: { pile: fromPile, index: fromIndex, cardIndex },
          to: { pile: 'foundation', index: i },
          cards: [card],
        });
        toast.success('Auto-moved to foundation!');
        return true;
      }
    }
    return false;
  }, [gameState.foundation, executeMove]);

  const handleTableauClick = useCallback((pileIndex: number, cardIndex: number) => {
    const pile = gameState.tableau[pileIndex];
    const card = pile[cardIndex];
    
    if (!card || !card.faceUp) return;

    // If clicking on empty space or same pile when selected, deselect
    if (selectedCards?.pile === 'tableau' && selectedCards.index === pileIndex) {
      setSelectedCards(null);
      return;
    }

    // If no cards selected, select this card and all below it
    if (!selectedCards) {
      const movableCards = getMovableCards(pile, cardIndex);
      if (movableCards.length > 0) {
        setSelectedCards({ pile: 'tableau', index: pileIndex, cardIndex });
      }
      return;
    }

    // Try to move selected cards here
    if (selectedCards.pile === 'tableau') {
      if (selectedCards.index === pileIndex) {
        setSelectedCards(null);
        return;
      }
      
      const sourcePile = gameState.tableau[selectedCards.index];
      const movableCards = getMovableCards(sourcePile, selectedCards.cardIndex);
      const targetCard = pile.length > 0 ? pile[pile.length - 1] : null;
      
      if (movableCards.length > 0 && canPlaceOnTableau(movableCards[0], targetCard)) {
        executeMove({
          from: { pile: 'tableau', index: selectedCards.index, cardIndex: selectedCards.cardIndex },
          to: { pile: 'tableau', index: pileIndex },
          cards: movableCards,
        });
      } else {
        setSelectedCards(null);
      }
    } else if (selectedCards.pile === 'waste') {
      const wasteCard = gameState.waste[gameState.waste.length - 1];
      const targetCard = pile.length > 0 ? pile[pile.length - 1] : null;
      
      if (canPlaceOnTableau(wasteCard, targetCard)) {
        executeMove({
          from: { pile: 'waste', index: 0 },
          to: { pile: 'tableau', index: pileIndex },
          cards: [wasteCard],
        });
      } else {
        setSelectedCards(null);
      }
    }
  }, [gameState.tableau, gameState.waste, selectedCards, executeMove]);

  const handleTableauDoubleClick = useCallback((pileIndex: number) => {
    const pile = gameState.tableau[pileIndex];
    if (pile.length === 0) return;
    
    const topCard = pile[pile.length - 1];
    if (topCard.faceUp) {
      tryAutoMoveToFoundation(topCard, 'tableau', pileIndex, pile.length - 1);
    }
  }, [gameState.tableau, tryAutoMoveToFoundation]);

  const handleEmptyTableauClick = useCallback((pileIndex: number) => {
    if (!selectedCards) return;

    if (selectedCards.pile === 'tableau') {
      const sourcePile = gameState.tableau[selectedCards.index];
      const movableCards = getMovableCards(sourcePile, selectedCards.cardIndex);
      
      // Only Kings can be placed on empty tableau piles
      if (movableCards.length > 0 && movableCards[0].rank === 'K') {
        executeMove({
          from: { pile: 'tableau', index: selectedCards.index, cardIndex: selectedCards.cardIndex },
          to: { pile: 'tableau', index: pileIndex },
          cards: movableCards,
        });
      } else {
        toast.error('Only Kings can be placed on empty tableau piles');
        setSelectedCards(null);
      }
    } else if (selectedCards.pile === 'waste') {
      const wasteCard = gameState.waste[gameState.waste.length - 1];
      
      if (wasteCard.rank === 'K') {
        executeMove({
          from: { pile: 'waste', index: 0 },
          to: { pile: 'tableau', index: pileIndex },
          cards: [wasteCard],
        });
      } else {
        toast.error('Only Kings can be placed on empty tableau piles');
        setSelectedCards(null);
      }
    }
  }, [gameState.tableau, gameState.waste, selectedCards, executeMove]);

  const handleFoundationClick = useCallback((foundationIndex: number) => {
    if (selectedCards?.pile === 'waste') {
      const wasteCard = gameState.waste[gameState.waste.length - 1];
      const foundationPile = gameState.foundation[foundationIndex];
      
      if (canPlaceOnFoundation(wasteCard, foundationPile)) {
        executeMove({
          from: { pile: 'waste', index: 0 },
          to: { pile: 'foundation', index: foundationIndex },
          cards: [wasteCard],
        });
      } else {
        setSelectedCards(null);
      }
    } else if (selectedCards?.pile === 'tableau') {
      const pile = gameState.tableau[selectedCards.index];
      const card = pile[pile.length - 1];
      const foundationPile = gameState.foundation[foundationIndex];
      
      if (canPlaceOnFoundation(card, foundationPile)) {
        executeMove({
          from: { pile: 'tableau', index: selectedCards.index, cardIndex: pile.length - 1 },
          to: { pile: 'foundation', index: foundationIndex },
          cards: [card],
        });
      } else {
        setSelectedCards(null);
      }
    }
  }, [gameState.waste, gameState.tableau, gameState.foundation, selectedCards, executeMove]);

  const handleWasteClick = useCallback(() => {
    if (gameState.waste.length === 0) return;
    
    if (selectedCards?.pile === 'waste') {
      setSelectedCards(null);
    } else {
      setSelectedCards({ pile: 'waste', index: 0, cardIndex: 0 });
    }
  }, [gameState.waste.length, selectedCards]);

  const handleWasteDoubleClick = useCallback(() => {
    if (gameState.waste.length === 0) return;
    
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    tryAutoMoveToFoundation(wasteCard, 'waste', 0);
  }, [gameState.waste, tryAutoMoveToFoundation]);

  const isHighlighted = (pile: string, index: number, cardIndex?: number): boolean => {
    if (!highlightedMove) return false;
    
    const matchesFrom =
      highlightedMove.from.pile === pile &&
      highlightedMove.from.index === index &&
      (cardIndex === undefined || highlightedMove.from.cardIndex === cardIndex);
    
    const matchesTo =
      highlightedMove.to.pile === pile &&
      highlightedMove.to.index === index;
    
    return matchesFrom || matchesTo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground drop-shadow-lg">
            Classic Solitaire
          </h1>
          <p className="text-xl text-muted-foreground">with AI Smart Assistant</p>
        </div>

        {/* Stats */}
        <GameStats score={gameState.score} moves={gameState.moves} startTime={gameState.startTime} />

        {/* Controls */}
        <GameControls
          onHint={handleHint}
          onAutoPlay={handleAutoPlay}
          onRestart={handleRestart}
          onNewGame={handleNewGame}
          isAutoPlaying={isAutoPlaying}
        />

        {/* Game Board */}
        <div className="space-y-8">
          {/* Top Row: Stock, Waste, and Foundations */}
          <div className="flex justify-between items-start">
            {/* Stock and Waste */}
            <div className="flex gap-4">
              {/* Stock Pile */}
              <div
                onClick={handleStockClick}
                className={cn(
                  'w-20 h-28 rounded-lg border-2 border-dashed border-muted',
                  'flex items-center justify-center cursor-pointer',
                  'hover:bg-muted/20 transition-all',
                  gameState.stock.length === 0 && gameState.waste.length > 0 && 'animate-pulse'
                )}
              >
                {gameState.stock.length > 0 ? (
                  <Card card={gameState.stock[gameState.stock.length - 1]} />
                ) : (
                  <div className="text-muted-foreground text-sm text-center">↻</div>
                )}
              </div>

              {/* Waste Pile */}
              <div onClick={handleWasteClick} onDoubleClick={handleWasteDoubleClick} className="relative">
                {gameState.waste.length > 0 ? (
                  <Card
                    card={gameState.waste[gameState.waste.length - 1]}
                    isSelected={selectedCards?.pile === 'waste'}
                    className={cn(
                      isHighlighted('waste', 0) && 'ring-4 ring-accent shadow-glow-gold'
                    )}
                  />
                ) : (
                  <div className="w-20 h-28 rounded-lg border-2 border-dashed border-muted" />
                )}
              </div>
            </div>

            {/* Foundation Piles */}
            <div className="flex gap-4">
              {gameState.foundation.map((pile, index) => (
                <div
                  key={index}
                  onClick={() => handleFoundationClick(index)}
                  className={cn(
                    'w-20 h-28 rounded-lg border-2 border-dashed border-muted',
                    'flex items-center justify-center cursor-pointer',
                    'hover:bg-success/20 transition-all',
                    isHighlighted('foundation', index) && 'ring-4 ring-accent shadow-glow-gold'
                  )}
                >
                  {pile.length > 0 ? (
                    <Card card={pile[pile.length - 1]} />
                  ) : (
                    <div className="text-muted-foreground text-2xl">A</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tableau */}
          <div className="flex gap-4 justify-center">
            {gameState.tableau.map((pile, pileIndex) => (
              <div key={pileIndex} className="relative min-h-[7rem]">
                {pile.length === 0 ? (
                  <div
                    onClick={() => handleEmptyTableauClick(pileIndex)}
                    className={cn(
                      "w-20 h-28 rounded-lg border-2 border-dashed border-muted",
                      "hover:bg-muted/20 transition-all cursor-pointer",
                      "flex items-center justify-center text-muted-foreground text-xs",
                      isHighlighted('tableau', pileIndex) && 'ring-4 ring-accent shadow-glow-gold'
                    )}
                  >
                    K
                  </div>
                ) : (
                  <div className="relative">
                    {pile.map((card, cardIndex) => {
                      const isSelected = selectedCards?.pile === 'tableau' &&
                        selectedCards.index === pileIndex &&
                        cardIndex >= selectedCards.cardIndex;
                      
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleTableauClick(pileIndex, cardIndex)}
                          onDoubleClick={() => handleTableauDoubleClick(pileIndex)}
                          className={cn(
                            'absolute transition-all duration-200',
                            isHighlighted('tableau', pileIndex, cardIndex) && 'z-10'
                          )}
                          style={{ top: `${cardIndex * 1.75}rem` }}
                        >
                          <Card
                            card={card}
                            isSelected={isSelected}
                            className={cn(
                              isHighlighted('tableau', pileIndex, cardIndex) && 'ring-4 ring-accent shadow-glow-gold'
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
