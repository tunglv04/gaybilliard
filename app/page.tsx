"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, RotateCcw, Volume2, VolumeX, Sun, Maximize, Minimize, Zap 
} from "lucide-react";
import { soundManager } from "@/lib/audio";

export default function Home() {
  const DEFAULT_TIME = 30;
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_TIME);
  const [totalMaxTime, setTotalMaxTime] = useState<number>(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasUsedExtension, setHasUsedExtension] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const wakeLockRef = useRef<any>(null);

  // Pre-warm SpeechSynthesis & AudioContext on mount / first gesture
  useEffect(() => {
    soundManager.initCtx();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const unlockAudio = () => {
      soundManager.initCtx();
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
  }, []);

  // Sync Native Fullscreen State
  useEffect(() => {
    const handleFSChange = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      if (isFs) setIsFullscreen(true);
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    document.addEventListener("webkitfullscreenchange", handleFSChange);
    document.addEventListener("mozfullscreenchange", handleFSChange);
    document.addEventListener("MSFullscreenChange", handleFSChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      document.removeEventListener("webkitfullscreenchange", handleFSChange);
      document.removeEventListener("mozfullscreenchange", handleFSChange);
      document.removeEventListener("MSFullscreenChange", handleFSChange);
    };
  }, []);

  // Keyboard shortcut listener (Space / Enter -> Start 30s, E / + -> Extension, R -> Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleStart();
      } else if (e.key === "e" || e.key === "E" || e.key === "+") {
        e.preventDefault();
        addExtension30s();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasUsedExtension]);

  // Main countdown ticker
  // Beep sound from 10s down to 6s + Voice reading from 5s down to 1s + Finish chime at 0s
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        soundManager.initCtx();

        setTimeLeft((prev) => {
          const next = prev - 1;

          if (next <= 10 && next >= 6) {
            // Beep audio tick for 10, 9, 8, 7, 6 seconds
            soundManager.play10to6Beep();
          } else if (next <= 5 && next > 0) {
            // Speak "five", "four", "three", "two", "one" for 5, 4, 3, 2, 1 seconds
            soundManager.speakCountdownNumber(next);
          } else if (next === 0) {
            // Loud finish chime + "Time's Up" voice at 0s!
            soundManager.playClearFinishSound();
            setIsRunning(false);
          }

          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Start button action: speaks "Start", resets to 30s, resets extension usage, starts countdown!
  const handleStart = () => {
    soundManager.playStartSpeech();
    setTimeLeft(DEFAULT_TIME);
    setTotalMaxTime(DEFAULT_TIME);
    setIsRunning(true);
    setHasUsedExtension(false); // Reset extension for the new turn!
  };

  // Extension button action: allowed ONLY ONCE per Start cycle!
  const addExtension30s = () => {
    if (hasUsedExtension) return; // Single extension limit

    soundManager.playExtensionSpeech();
    setHasUsedExtension(true);
    setTimeLeft((prev) => {
      const updated = prev + 30;
      setTotalMaxTime((currentMax) => Math.max(currentMax, updated));
      return updated;
    });
  };

  // Reset button action: resets timer to 30s, stops running, enables Extension button
  const handleReset = () => {
    soundManager.initCtx();
    setTimeLeft(DEFAULT_TIME);
    setTotalMaxTime(DEFAULT_TIME);
    setIsRunning(false);
    setHasUsedExtension(false);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
    if (!nextMute) soundManager.initCtx();
  };

  const toggleWakeLock = async () => {
    soundManager.initCtx();
    try {
      if (!isWakeLockActive) {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          setIsWakeLockActive(true);
        } else {
          alert("Browser does not support screen wake lock.");
        }
      } else {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setIsWakeLockActive(false);
      }
    } catch (err) {
      console.warn("Wake lock error:", err);
    }
  };

  // Robust Cross-Device Fullscreen (Supports iPhone iOS Safari + Android + Desktop)
  const toggleFullscreen = () => {
    soundManager.initCtx();
    
    const isIOS =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    if (isIOS) {
      setIsFullscreen((prev) => !prev);
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      return;
    }

    const doc = document as any;
    const docElm = document.documentElement as any;
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      isFullscreen
    );

    if (!isFs) {
      const requestFS =
        docElm.requestFullscreen ||
        docElm.webkitRequestFullscreen ||
        docElm.mozRequestFullScreen ||
        docElm.msRequestFullscreen;

      if (requestFS) {
        requestFS.call(docElm).catch(() => {
          setIsFullscreen(true);
        });
      }
      setIsFullscreen(true);
    } else {
      const exitFS =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

      if (exitFS) {
        try {
          doc.exitFullscreen ? doc.exitFullscreen().catch(() => {}) : exitFS.call(doc);
        } catch (e) {}
      }
      setIsFullscreen(false);
    }
  };

  // Dynamic progress & colors
  const progressPercent = totalMaxTime > 0 ? Math.min(100, Math.max(0, (timeLeft / totalMaxTime) * 100)) : 0;

  const getTimerColor = () => {
    if (timeLeft <= 5) return "text-red-500 animate-pulse drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]";
    if (timeLeft <= 10) return "text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]";
    return "text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]";
  };

  return (
    <main
      className={`w-full bg-[#090d16] text-zinc-100 font-sans flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden touch-manipulation transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-[99999] h-[100dvh] w-screen bg-[#090d16]"
          : "h-[100dvh]"
      }`}
    >
      {/* Header Utilities */}
      <header className="flex items-center justify-between max-w-xl mx-auto w-full pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <Zap size={18} className="fill-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              SHOT CLOCK <span className="text-emerald-400">30S</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Billiard Match Timer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Keep Awake Toggle */}
          <button
            onClick={toggleWakeLock}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isWakeLockActive
                ? "bg-amber-500/10 text-amber-400 border-amber-500/40"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={isWakeLockActive ? "Screen Awake Active" : "Keep Screen Awake"}
          >
            <Sun size={16} className={isWakeLockActive ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">{isWakeLockActive ? "Awake: ON" : "Awake"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2.5 border rounded-xl transition-colors ${
              isFullscreen
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      {/* Main Central Section: Portrait Optimized */}
      <div className="flex-1 max-w-xl mx-auto w-full flex flex-col items-center justify-center my-2">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 backdrop-blur-2xl shadow-2xl w-full flex flex-col items-center justify-center text-center relative overflow-hidden">
          
          {/* Circular Progress & Giant Number Counter */}
          <div className="relative w-[65vw] max-w-[280px] sm:max-w-[330px] aspect-square flex items-center justify-center my-2 sm:my-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-zinc-800/80"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-300 ${
                  timeLeft <= 5 ? "stroke-red-500" : timeLeft <= 10 ? "stroke-amber-400" : "stroke-emerald-400"
                }`}
                strokeWidth="5"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Huge Number */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`font-mono text-7xl sm:text-8xl md:text-[9rem] font-black leading-none tracking-tighter transition-all ${getTimerColor()}`}>
                {timeLeft}
              </span>
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-zinc-500 mt-2">
                {timeLeft === 0 ? "TIME'S UP!" : "SEC"}
              </span>
            </div>
          </div>

          {/* Action Buttons: START, EXTENSION & RESET */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-2.5 w-full">
            {/* Start Button */}
            <button
              onClick={handleStart}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:from-emerald-300 hover:to-blue-400 text-zinc-950 font-black text-2xl sm:text-3xl py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all w-full border border-cyan-300/40"
            >
              <Play size={26} className="fill-zinc-950 w-6 h-6 sm:w-7 sm:h-7" />
              <span>Start</span>
            </button>

            {/* Row of Extension & Reset */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {/* Extension Button */}
              <button
                onClick={addExtension30s}
                disabled={hasUsedExtension}
                className={`flex items-center justify-center font-black text-lg sm:text-xl py-3.5 sm:py-4 rounded-2xl shadow-xl transition-all border ${
                  hasUsedExtension
                    ? "bg-zinc-800/60 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-40 shadow-none"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20 border-purple-400/30 active:scale-95"
                }`}
              >
                <span>{hasUsedExtension ? "Extension (Used)" : "Extension"}</span>
              </button>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-lg sm:text-xl py-3.5 sm:py-4 rounded-2xl transition-all active:scale-95 border border-zinc-700/60"
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Shortcut Keys Guide */}
          <div className="mt-5 text-[10px] sm:text-xs font-semibold text-zinc-500 flex flex-wrap justify-center gap-3 sm:gap-4">
            <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">Enter</kbd> Start</span>
            <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">E / +</kbd> Extension</span>
            <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">R</kbd> Reset</span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] sm:text-xs text-zinc-600 pb-1">
        © 2026 30s Billiard Shot Clock
      </footer>
    </main>
  );
}
