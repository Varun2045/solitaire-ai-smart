import { Card as CardType } from '@/types/card';
import { SUIT_SYMBOLS } from '@/utils/cardUtils';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  draggable?: boolean;
  className?: string;
}

export function Card({ card, onClick, draggable = false, className }: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const isRed = card.color === 'red';

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          'w-20 h-28 rounded-lg border-2 border-border',
          'bg-gradient-to-br from-blue-600 to-blue-800',
          'flex items-center justify-center cursor-pointer',
          'shadow-md hover:shadow-lg transition-all',
          'select-none',
          className
        )}
        onClick={onClick}
      >
        <div className="text-4xl opacity-30">🂠</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-20 h-28 rounded-lg border-2 border-gray-300',
        'bg-card shadow-md hover:shadow-xl transition-all',
        'flex flex-col items-center justify-between p-2',
        'select-none cursor-pointer',
        draggable && 'hover:scale-105 active:scale-95',
        className
      )}
      onClick={onClick}
      draggable={draggable}
    >
      {/* Top rank and suit */}
      <div className="flex flex-col items-center -mt-1">
        <span className={cn('text-xl font-bold leading-none', isRed ? 'text-card-red' : 'text-card-black')}>
          {card.rank}
        </span>
        <span className={cn('text-2xl leading-none', isRed ? 'text-card-red' : 'text-card-black')}>
          {suitSymbol}
        </span>
      </div>

      {/* Center suit symbol */}
      <div className={cn('text-4xl', isRed ? 'text-card-red' : 'text-card-black')}>
        {suitSymbol}
      </div>

      {/* Bottom rank and suit (rotated) */}
      <div className="flex flex-col items-center rotate-180 -mb-1">
        <span className={cn('text-xl font-bold leading-none', isRed ? 'text-card-red' : 'text-card-black')}>
          {card.rank}
        </span>
        <span className={cn('text-2xl leading-none', isRed ? 'text-card-red' : 'text-card-black')}>
          {suitSymbol}
        </span>
      </div>
    </div>
  );
}
