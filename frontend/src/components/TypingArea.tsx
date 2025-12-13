import { useState, useEffect, useRef, useCallback } from 'react';

interface TypingAreaProps {
  text: string;
  disabled: boolean;
  onProgress: (progress: number, wpm: number, accuracy: number) => void;
  onFinish: (wpm: number, accuracy: number) => void;
}

export default function TypingArea({
  text,
  disabled,
  onProgress,
  onFinish,
}: TypingAreaProps) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [errors, setErrors] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProgressRef = useRef({ progress: 0, wpm: 0, accuracy: 100 });

  // Focus input when race starts
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Reset when text changes
  useEffect(() => {
    setInput('');
    setStartTime(null);
    setFinished(false);
    setErrors(0);
    setTotalTyped(0);
    lastProgressRef.current = { progress: 0, wpm: 0, accuracy: 100 };
  }, [text]);

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    if (timeElapsed < 0.01) return 0;
    const wordsTyped = input.length / 5; // Standard: 5 characters = 1 word
    return Math.round(wordsTyped / timeElapsed);
  }, [startTime, input]);

  const calculateAccuracy = useCallback(() => {
    if (totalTyped === 0) return 100;
    return Math.round(((totalTyped - errors) / totalTyped) * 100);
  }, [totalTyped, errors]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || finished) return;

    const newInput = e.target.value;

    // Start timer on first input
    if (!startTime && newInput.length > 0) {
      setStartTime(Date.now());
    }

    // Check for errors
    const prevLength = input.length;
    const newLength = newInput.length;

    if (newLength > prevLength) {
      // Character added
      setTotalTyped((t) => t + 1);
      const expectedChar = text[prevLength];
      const typedChar = newInput[newLength - 1];
      if (typedChar !== expectedChar) {
        setErrors((e) => e + 1);
      }
    }

    // Only allow correct characters (no backspace allowed for incorrect chars)
    let validInput = '';
    for (let i = 0; i < newInput.length && i < text.length; i++) {
      if (newInput[i] === text[i]) {
        validInput += newInput[i];
      } else {
        break;
      }
    }

    setInput(validInput);

    // Calculate stats
    const progress = (validInput.length / text.length) * 100;
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();

    // Send progress update (throttled to significant changes)
    if (
      Math.abs(progress - lastProgressRef.current.progress) >= 1 ||
      Math.abs(wpm - lastProgressRef.current.wpm) >= 5 ||
      Math.abs(accuracy - lastProgressRef.current.accuracy) >= 1
    ) {
      lastProgressRef.current = { progress, wpm, accuracy };
      onProgress(progress, wpm, accuracy);
    }

    // Check if finished
    if (validInput === text) {
      setFinished(true);
      const finalWpm = calculateWPM();
      const finalAccuracy = calculateAccuracy();
      onFinish(finalWpm, finalAccuracy);
    }
  };

  // Render text with highlighting
  const renderText = () => {
    const chars = text.split('');
    return chars.map((char, index) => {
      let className = 'typing-pending';
      if (index < input.length) {
        className = 'typing-correct';
      } else if (index === input.length) {
        className = 'typing-current';
      }
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();
  const progress = (input.length / text.length) * 100;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Stats bar */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-gray-400 text-sm">WPM: </span>
            <span className="font-bold text-lg text-green-400">{wpm}</span>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Accuracy: </span>
            <span className="font-bold text-lg text-blue-400">{accuracy}%</span>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Progress: </span>
            <span className="font-bold text-lg text-purple-400">{progress.toFixed(0)}%</span>
          </div>
        </div>
        {finished && (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
            Finished!
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Text display */}
      <div className="p-6">
        <div className="text-lg leading-relaxed font-mono bg-gray-900/50 p-4 rounded-lg mb-4 max-h-[200px] overflow-y-auto">
          {renderText()}
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInput}
          disabled={disabled || finished}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={disabled ? 'Waiting for race to start...' : 'Start typing...'}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
