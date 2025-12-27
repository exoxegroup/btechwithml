import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        if (onComplete) onComplete();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) {
    return null; // Timer completed
  }

  return (
    <div className="flex flex-col items-center">
      <Clock size={32} className="text-orange-500 mb-2" />
      <div className="text-sm text-slate-500 mb-1">Available in</div>
      <div className="flex gap-3 text-center">
        {timeLeft.days > 0 && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800">{timeLeft.days}</span>
            <span className="text-xs text-slate-500">days</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-800">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs text-slate-500">hrs</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-800">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-slate-500">min</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-slate-800">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-slate-500">sec</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">
        {targetDate.toLocaleString()}
      </div>
    </div>
  );
};

export default CountdownTimer;
