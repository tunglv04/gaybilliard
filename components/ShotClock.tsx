"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, PlusCircle, Settings, Users, 
  Volume2, VolumeX, Maximize2, Minimize2, ArrowRightLeft, ShieldAlert
} from "lucide-react";
import { soundManager } from "@/lib/audio";

export default function ShotClock() {
  const [player1Name, setPlayer1Name] = useState("Cơ thủ A");
  const [player2Name, setPlayer2Name] = useState("Cơ thủ B");
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);

  const [defaultShotTime, setDefaultShotTime] = useState<number>(40);
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [extensionsLeft, setExtensionsLeft] = useState<{ p1: number; p2: number }>({ p1: 2, p2: 2 });

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempDefaultTime, setTempDefaultTime] = useState<number>(40);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "Enter") {
        e.preventDefault();
        switchTurn();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        addExtension();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetCurrentClock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, activePlayer, defaultShotTime, extensionsLeft]);

  // Main countdown timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 5 && next > 0) {
            soundManager.playWarning();
          } else if (next === 0) {
            soundManager.playBuzzer();
            setIsRunning(false);
          } else {
            soundManager.playTick();
          }
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const togglePlayPause = () => {
    soundManager.playClick();
    setIsRunning((prev) => !prev);
  };

  const switchTurn = () => {
    soundManager.playClick();
    setActivePlayer((prev) => (prev === 1 ? 2 : 1));
    setTimeLeft(defaultShotTime);
    setIsRunning(true);
  };

  const resetCurrentClock = () => {
    soundManager.playClick();
    setTimeLeft(defaultShotTime);
    setIsRunning(false);
  };

  const addExtension = (seconds: number = 15) => {
    soundManager.playClick();
    const currentExt = activePlayer === 1 ? extensionsLeft.p1 : extensionsLeft.p2;
    if (currentExt <= 0) {
      alert("Đã hết quyền gia hạn lượt cơ cho cơ thủ này!");
      return;
    }

    setExtensionsLeft((prev) => ({
      ...prev,
      [activePlayer === 1 ? "p1" : "p2"]: currentExt - 1,
    }));

    setTimeLeft((prev) => prev + seconds);
  };

  // Dynamic status color
  const getTimerColorClass = () => {
    if (timeLeft <= 5) return "text-red-500 animate-pulse drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]";
    if (timeLeft <= 10) return "text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]";
    return "text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]";
  };

  const progressPercent = Math.min(100, Math.max(0, (timeLeft / defaultShotTime) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Players Header */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div
          onClick={() => {
            if (activePlayer !== 1) switchTurn();
          }}
          className={`cursor-pointer rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl relative overflow-hidden ${
            activePlayer === 1
              ? "bg-gradient-to-br from-cyan-950/80 to-zinc-900 border-cyan-500/60 shadow-2xl shadow-cyan-950/50 ring-2 ring-cyan-500/40"
              : "bg-zinc-900/60 border-zinc-800 opacity-60 hover:opacity-90"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Cơ Thủ 1
            </span>
            <span className="text-xs font-bold text-zinc-400">Gia hạn còn: {extensionsLeft.p1}</span>
          </div>

          <input
            type="text"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            className="w-full bg-transparent text-2xl md:text-3xl font-black text-white outline-none mt-3"
            placeholder="Tên Cơ Thủ 1"
          />

          {activePlayer === 1 && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Đang Đến Lượt Cơ
            </div>
          )}
        </div>

        {/* Player 2 Card */}
        <div
          onClick={() => {
            if (activePlayer !== 2) switchTurn();
          }}
          className={`cursor-pointer rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl relative overflow-hidden ${
            activePlayer === 2
              ? "bg-gradient-to-br from-amber-950/80 to-zinc-900 border-amber-500/60 shadow-2xl shadow-amber-950/50 ring-2 ring-amber-500/40"
              : "bg-zinc-900/60 border-zinc-800 opacity-60 hover:opacity-90"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Cơ Thủ 2
            </span>
            <span className="text-xs font-bold text-zinc-400">Gia hạn còn: {extensionsLeft.p2}</span>
          </div>

          <input
            type="text"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
            className="w-full bg-transparent text-2xl md:text-3xl font-black text-white outline-none mt-3"
            placeholder="Tên Cơ Thủ 2"
          />

          {activePlayer === 2 && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Đang Đến Lượt Cơ
            </div>
          )}
        </div>
      </div>

      {/* Main Shot Clock Central Display */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 md:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Top Preset Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[30, 40, 45, 60].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                soundManager.playClick();
                setDefaultShotTime(preset);
                setTimeLeft(preset);
                setIsRunning(false);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                defaultShotTime === preset
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {preset} Giây
            </button>
          ))}

          <button
            onClick={() => {
              soundManager.playClick();
              setTempDefaultTime(defaultShotTime);
              setShowSettingsModal(true);
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
            title="Cài đặt thời gian khác"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Circular Progress & Huge Digital Display */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-zinc-800/80"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-300 ${
                timeLeft <= 5 ? "stroke-red-500" : timeLeft <= 10 ? "stroke-amber-400" : "stroke-emerald-400"
              }`}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`font-mono text-7xl md:text-9xl font-black tracking-tighter transition-all ${getTimerColorClass()}`}>
              {timeLeft}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Giây</span>
          </div>
        </div>

        {/* Big Switch Turn CTA Button */}
        <button
          onClick={switchTurn}
          className="mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:from-emerald-300 hover:to-blue-400 text-zinc-950 font-black text-2xl md:text-3xl px-10 py-5 rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-95 transition-all w-full max-w-md border border-cyan-300/40"
        >
          <ArrowRightLeft size={32} strokeWidth={3} /> CHUYỂN LƯỢT (Enter)
        </button>

        {/* Controls Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={togglePlayPause}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold transition-all shadow-md active:scale-95 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            }`}
          >
            {isRunning ? <Pause size={20} className="fill-zinc-950" /> : <Play size={20} className="fill-zinc-950" />}
            {isRunning ? "Tạm Dừng (Space)" : "Chạy Tiếp (Space)"}
          </button>

          <button
            onClick={() => addExtension(15)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <PlusCircle size={20} /> Gia Hạn +15s (E)
          </button>

          <button
            onClick={resetCurrentClock}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <RotateCcw size={18} /> Đặt Lại (R)
          </button>
        </div>

        {/* Shortcut Guide Footer */}
        <div className="mt-8 text-xs font-semibold text-zinc-500 flex flex-wrap justify-center gap-4">
          <span>Phím tắt: <kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">Space</kbd> Tạm dừng</span>
          <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">Enter</kbd> Chuyển lượt</span>
          <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">E</kbd> Gia hạn +15s</span>
          <span><kbd className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">R</kbd> Reset</span>
        </div>
      </div>

      {/* Custom Time Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-6">
            <h3 className="text-xl font-extrabold text-white">Cài Đặt Shot Clock</h3>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setTempDefaultTime((t) => Math.max(10, t - 5))}
                className="w-12 h-12 rounded-xl bg-zinc-800 text-white font-black text-2xl hover:bg-zinc-700"
              >
                -
              </button>
              <div className="font-mono text-5xl font-black text-emerald-400 w-28">{tempDefaultTime}s</div>
              <button
                onClick={() => setTempDefaultTime((t) => Math.min(180, t + 5))}
                className="w-12 h-12 rounded-xl bg-zinc-800 text-white font-black text-2xl hover:bg-zinc-700"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setDefaultShotTime(tempDefaultTime);
                  setTimeLeft(tempDefaultTime);
                  setIsRunning(false);
                  setShowSettingsModal(false);
                }}
                className="flex-1 bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl hover:bg-emerald-400"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
