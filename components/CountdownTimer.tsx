"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, Sparkles, Bell } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/audio";

export default function CountdownTimer() {
  const [initialSeconds, setInitialSeconds] = useState<number>(300); // Default 5 mins
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Custom Input State
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(5);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 5 && next > 0) {
            soundManager.playWarning();
          } else if (next === 0) {
            soundManager.playFinishChime();
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
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

  const toggleStartPause = () => {
    soundManager.playClick();
    if (timeLeft === 0) {
      setTimeLeft(initialSeconds);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    soundManager.playClick();
    setIsRunning(false);
    setTimeLeft(initialSeconds);
  };

  const selectPreset = (seconds: number) => {
    soundManager.playClick();
    setInitialSeconds(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
  };

  const applyCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const total = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (total <= 0) return;

    setInitialSeconds(total);
    setTimeLeft(total);
    setIsRunning(false);
  };

  // Format time to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const progressPercent = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 backdrop-blur-xl">
        {[
          { label: "1 Phút", secs: 60 },
          { label: "5 Phút", secs: 300 },
          { label: "10 Phút", secs: 600 },
          { label: "15 Phút", secs: 900 },
          { label: "25m Pomodoro", secs: 1500 },
          { label: "30 Phút", secs: 1800 },
          { label: "60 Phút", secs: 3600 },
        ].map((p) => (
          <button
            key={p.secs}
            onClick={() => selectPreset(p.secs)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              initialSeconds === p.secs
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Countdown Visual Panel */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 md:p-12 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* SVG Circular Progress Bar */}
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
                timeLeft <= 5 ? "stroke-red-500" : timeLeft <= 10 ? "stroke-amber-400" : "stroke-purple-500"
              }`}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span
              className={`font-mono text-6xl md:text-7xl font-black tracking-tight ${
                timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-white"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
              {timeLeft === 0 ? "HẾT GIỜ!" : "Đang đếm ngược"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={toggleStartPause}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                : "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20"
            }`}
          >
            {isRunning ? <Pause size={24} className="fill-zinc-950" /> : <Play size={24} className="fill-white" />}
            {isRunning ? "Tạm Dừng" : "Bắt Đầu"}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-6 py-4 rounded-2xl transition-colors"
          >
            <RotateCcw size={20} /> Đặt Lại
          </button>
        </div>
      </div>

      {/* Custom Time Form */}
      <form
        onSubmit={applyCustomTimer}
        className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4"
      >
        <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-purple-400" /> Tùy Chỉnh Thời Gian Đếm Ngược
        </h4>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1">Giờ</label>
            <input
              type="number"
              min="0"
              max="23"
              value={customHours}
              onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono text-center font-bold outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1">Phút</label>
            <input
              type="number"
              min="0"
              max="59"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono text-center font-bold outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1">Giây</label>
            <input
              type="number"
              min="0"
              max="59"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono text-center font-bold outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          Áp Dụng Thời Gian Này
        </button>
      </form>
    </div>
  );
}
