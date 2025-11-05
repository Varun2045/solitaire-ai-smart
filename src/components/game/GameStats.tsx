import { useEffect, useState } from 'react';
import { Trophy, Move, Clock } from 'lucide-react';

interface GameStatsProps {
  score: number;
  moves: number;
  startTime: number;
}

export function GameStats({ score, moves, startTime }: GameStatsProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-wrap gap-6 justify-center text-foreground">
      <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg shadow-md">
        <Trophy className="h-5 w-5 text-accent" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg shadow-md">
        <Move className="h-5 w-5 text-accent" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Moves</span>
          <span className="text-lg font-bold">{moves}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg shadow-md">
        <Clock className="h-5 w-5 text-accent" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Time</span>
          <span className="text-lg font-bold">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
}
