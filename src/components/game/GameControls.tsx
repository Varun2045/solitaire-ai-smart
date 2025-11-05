import { Button } from '@/components/ui/button';
import { Lightbulb, Bot, RotateCcw, Sparkles } from 'lucide-react';

interface GameControlsProps {
  onHint: () => void;
  onAutoPlay: () => void;
  onRestart: () => void;
  onNewGame: () => void;
  isAutoPlaying: boolean;
}

export function GameControls({
  onHint,
  onAutoPlay,
  onRestart,
  onNewGame,
  isAutoPlaying,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Button
        onClick={onHint}
        className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-glow-gold transition-all"
        disabled={isAutoPlaying}
      >
        <Lightbulb className="mr-2 h-4 w-4" />
        Hint
      </Button>

      <Button
        onClick={onAutoPlay}
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-glow-gold transition-all"
        variant={isAutoPlaying ? 'destructive' : 'default'}
      >
        <Bot className="mr-2 h-4 w-4" />
        {isAutoPlaying ? 'Stop AI' : 'AI Auto Play'}
      </Button>

      <Button
        onClick={onRestart}
        variant="secondary"
        className="shadow-md hover:shadow-lg transition-all"
        disabled={isAutoPlaying}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Restart
      </Button>

      <Button
        onClick={onNewGame}
        variant="outline"
        className="border-accent text-accent-foreground hover:bg-accent/20 shadow-md hover:shadow-lg transition-all"
        disabled={isAutoPlaying}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        New Game
      </Button>
    </div>
  );
}
