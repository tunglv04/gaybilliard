"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag, Copy, Check, Trash2, Award } from "lucide-react";
import { soundManager } from "@/lib/audio";

export interface Lap {
  id: number;
  lapTime: number; // in milliseconds
  overallTime: number; // in milliseconds
}

export default function Stopwatch() {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastLapTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime;

      const updateTimer = () => {
        setElapsedTime(Date.now() - startTimeRef.current);
        requestRef.current = requestAnimationFrame(updateTimer);
      };

      requestRef.current = requestAnimationFrame(updateTimer);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning]);

  const handleStartPause = () => {
    soundManager.playClick();
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    soundManager.playClick();
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    lastLapTimeRef.current = 0;
  };

  const handleLap = () => {
    soundManager.playClick();
    if (!isRunning) return;

    const currentTotal = elapsedTime;
    const lapTime = currentTotal - lastLapTimeRef.current;
    lastLapTimeRef.current = currentTotal;

    const newLap: Lap = {
      id: laps.length + 1,
      lapTime,
      overallTime: currentTotal,
    };

    setLaps((prev) => [newLap, ...prev]);
  };

  const formatMs = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => n.toString().padStart(2, "0");
    return {
      main: `${pad(minutes)}:${pad(seconds)}`,
      sub: `.${pad(milliseconds)}`,
    };
  };

  // Find min/max laps
  let fastestLapId: number | null = null;
  let slowestLapId: number | null = null;

  if (laps.length > 1) {
    let minTime = Infinity;
    let maxTime = -1;

    laps.forEach((l) => {
      if (l.lapTime < minTime) {
        minTime = l.lapTime;
        fastestLapId = l.id;
      }
      if (l.lapTime > maxTime) {
        maxTime = l.lapTime;
        slowestLapId = l.id;
      }
    });
  }

  const copyLapsToClipboard = () => {
    soundManager.playClick();
    if (laps.length === 0) return;

    const text = laps
      .map((l) => {
        const lapFmt = formatMs(l.lapTime);
        const overallFmt = formatMs(l.overallTime);
        return `Vòng ${l.id}: ${lapFmt.main}${lapFmt.sub} (Tổng: ${overallFmt.main}${overallFmt.sub})`;
      })
      .join("\n");

    navigator.clipboard.writeText(`--- KẾT QUẢ BẤM GIỜ ---\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatted = formatMs(elapsedTime);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Main Stopwatch Timer Display */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 md:p-12 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Large Time Display */}
        <div className="font-mono flex items-baseline justify-center text-zinc-100 my-6 tracking-tight">
          <span className="text-6xl md:text-8xl lg:text-9xl font-black drop-shadow-lg">
            {formatted.main}
          </span>
          <span className="text-3xl md:text-5xl font-extrabold text-cyan-400">
            {formatted.sub}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handleStartPause}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
            }`}
          >
            {isRunning ? <Pause size={24} className="fill-zinc-950" /> : <Play size={24} className="fill-zinc-950" />}
            {isRunning ? "Tạm Dừng" : "Bắt Đầu"}
          </button>

          <button
            onClick={handleLap}
            disabled={!isRunning}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-zinc-950 font-black px-6 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
          >
            <Flag size={20} /> Vòng Giờ (Lap)
          </button>

          <button
            onClick={handleReset}
            disabled={elapsedTime === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 font-bold px-5 py-4 rounded-2xl transition-colors"
            title="Xóa thời gian"
          >
            <RotateCcw size={20} /> Đặt Lại
          </button>
        </div>
      </div>

      {/* Laps List */}
      {laps.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Award size={20} className="text-cyan-400" /> Danh Sách Vòng Giờ ({laps.length})
            </h3>
            <button
              onClick={copyLapsToClipboard}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 px-3 py-2 rounded-xl transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Đã Sao Chép!" : "Sao Chép Vòng"}
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {laps.map((lap) => {
              const isFastest = lap.id === fastestLapId;
              const isSlowest = lap.id === slowestLapId;

              const lapFmt = formatMs(lap.lapTime);
              const totalFmt = formatMs(lap.overallTime);

              return (
                <div
                  key={lap.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm font-mono transition-all ${
                    isFastest
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : isSlowest
                      ? "bg-red-950/40 border-red-500/50 text-red-300"
                      : "bg-zinc-950/40 border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3 font-sans">
                    <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                      #{lap.id}
                    </span>
                    {isFastest && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                        Nhanh Nhất
                      </span>
                    )}
                    {isSlowest && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">
                        Chậm Nhất
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-sans">Thời gian vòng</div>
                      <div className="font-bold">
                        {lapFmt.main}<span className="text-xs text-zinc-400">{lapFmt.sub}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-sans">Tổng tích lũy</div>
                      <div className="font-bold text-zinc-400">
                        {totalFmt.main}<span className="text-xs text-zinc-500">{totalFmt.sub}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
