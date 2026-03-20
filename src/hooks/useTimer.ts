import { useEffect, useRef, useCallback, useState } from 'react';

interface UseTimerOptions {
  duration: number;
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTimer(options: UseTimerOptions) {
  const { duration, onTick, onComplete, autoStart = false } = options;
  
  const timeRemainingRef = useRef(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isRunningRef.current = false;
  }, []);

  const tick = useCallback(() => {
    timeRemainingRef.current -= 1;
    
    if (onTick) {
      onTick(timeRemainingRef.current);
    }
    
    if (timeRemainingRef.current <= 0) {
      clearTimer();
      if (onComplete) {
        onComplete();
      }
    }
  }, [onTick, onComplete, clearTimer]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback((newDuration?: number) => {
    clearTimer();
    timeRemainingRef.current = newDuration ?? duration;
  }, [clearTimer, duration]);

  const restart = useCallback((newDuration?: number) => {
    reset(newDuration);
    start();
  }, [reset, start]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => {
      clearTimer();
    };
  }, [autoStart, start, clearTimer]);

  return {
    start,
    pause,
    reset,
    restart,
    isRunning: isRunningRef.current,
    timeRemaining: timeRemainingRef.current,
  };
}

// Countdown component hook
export function useCountdown(
  initialSeconds: number,
  onComplete: () => void
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, onComplete]);
  
  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);
  
  return { seconds, isRunning, start, pause, reset };
}