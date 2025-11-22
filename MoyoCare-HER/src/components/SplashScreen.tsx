import { useEffect } from 'react';
import { Heart } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center">
      <Heart 
        className="w-24 h-24 text-white animate-pulse" 
        strokeWidth={1.5}
      />
      <h1 className="text-4xl font-bold text-white mt-6 mb-2">
        MoyoCare-Her
      </h1>
      <p className="text-white/90 text-lg">
        Your Wellness Companion
      </p>
    </div>
  );
}
