import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingToolProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export default function BreathingTool({ isOpen, onClose }: BreathingToolProps) {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const phaseTimings = {
      inhale: 4000,
      hold: 2000,
      exhale: 4000,
    };

    const interval = setInterval(() => {
      setPhase((current) => {
        if (current === 'inhale') return 'hold';
        if (current === 'hold') return 'exhale';
        setCycle((c) => c + 1);
        return 'inhale';
      });
    }, phase === 'hold' ? phaseTimings.hold : phaseTimings.inhale);

    return () => clearInterval(interval);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const phaseText = {
    inhale: 'Breathe In (Simi...)',
    hold: 'Hold',
    exhale: 'Breathe Out (Fẹ...)',
  };

  const circleScale = {
    inhale: 'scale-150',
    hold: 'scale-150',
    exhale: 'scale-100',
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-foreground"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Breathing Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div
            className={`absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary transition-transform duration-[4000ms] ease-in-out ${circleScale[phase]}`}
          />
        </div>

        {/* Instruction Text */}
        <div className="text-center space-y-2">
          <p className="text-3xl font-bold text-foreground">
            {phaseText[phase]}
          </p>
          <p className="text-muted-foreground">
            Cycle {cycle + 1}
          </p>
        </div>

        {/* Tips */}
        <div className="max-w-md text-center space-y-2 px-4">
          <p className="text-sm text-muted-foreground">
            Focus on your breath. Let go of any tension. You're safe here.
          </p>
          <p className="text-xs text-muted-foreground">
            Continue for 3-5 cycles for best results
          </p>
        </div>
      </div>
    </div>
  );
}
