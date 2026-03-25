"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw, Maximize, Minimize } from "lucide-react";
import { PanInfo, motion } from "framer-motion";

export default function Home() {
  const [leftName, setLeftName] = useState("Đội 1");
  const [rightName, setRightName] = useState("Đội 2");

  const [leftMainScore, setLeftMainScore] = useState(0);
  const [rightMainScore, setRightMainScore] = useState(0);

  const [leftSubScore, setLeftSubScore] = useState(0);
  const [rightSubScore, setRightSubScore] = useState(0);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pointerInputs = useRef<{ [id: number]: { startY: number; startTime: number } }>({});
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const onFullscreenChange = async () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (isFs) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          }
        } catch (err) {
          console.error('Wake lock failed', err);
        }
      } else {
        if (wakeLockRef.current) {
          wakeLockRef.current.release().catch(() => {});
          wakeLockRef.current = null;
        }
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const preventTouchScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });
    
    const preventTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    };
    document.addEventListener("touchstart", preventTouchStart, { passive: false });

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("touchmove", preventTouchScroll);
      document.removeEventListener("touchstart", preventTouchStart);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const SWIPE_THRESHOLD = 30;

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerInputs.current[e.pointerId] = {
      startY: e.clientY,
      startTime: Date.now(),
    };
  };

  const handlePointerUp = (
    e: React.PointerEvent,
    team: "left" | "right"
  ) => {
    const input = pointerInputs.current[e.pointerId];
    if (!input) return;

    const deltaY = e.clientY - input.startY;
    delete pointerInputs.current[e.pointerId];

    const isSwipeUp = deltaY < -SWIPE_THRESHOLD;
    const isSwipeDown = deltaY > SWIPE_THRESHOLD;

    if (isSwipeUp) {
      if (team === "left") {
        setLeftMainScore(s => s + 1);
      } else {
        setRightMainScore(s => s + 1);
      }
    } else if (isSwipeDown) {
      if (team === "left") {
        setLeftMainScore(s => Math.max(0, s - 1));
      } else {
        setRightMainScore(s => Math.max(0, s - 1));
      }
    }
  };

  const resetAll = () => {
    setLeftMainScore(0);
    setRightMainScore(0);
    setLeftSubScore(0);
    setRightSubScore(0);
    setShowResetConfirm(false);
  };

  return (
    <main className="flex w-full h-full bg-black overflow-hidden font-sans fixed inset-0">
      {/* Left Team (Blue) */}
      <div className="flex-1 bg-blue-600 flex flex-col items-center relative select-none touch-none">
        
        {/* Name Input */}
        <div className="w-full pt-4 md:pt-6 pb-2 z-10 px-4">
          <input
            type="text"
            value={leftName}
            onChange={(e) => setLeftName(e.target.value)}
            className="bg-transparent text-white text-3xl md:text-5xl font-bold text-center w-full outline-none placeholder:text-blue-300 drop-shadow-md"
            placeholder="Tên đội 1"
          />
        </div>

        {/* Main Score Area */}
        <motion.div
          className="flex-1 w-full flex items-center justify-center cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerUp={(e) => handlePointerUp(e, "left")}
        >
          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg">
            {leftMainScore}
          </span>
        </motion.div>

        {/* Sub Score Area */}
        <div className="w-full h-[25%] flex items-center justify-center gap-8 md:gap-14 bg-blue-700/30">
          <button 
            onClick={() => setLeftSubScore(s => Math.max(0, s - 1))}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-blue-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
          >
            −
          </button>
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-blue-100 drop-shadow-md pb-4 min-w-[2ch] text-center">
            {leftSubScore}
          </span>
          <button 
            onClick={() => setLeftSubScore(s => s + 1)}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-blue-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
          >
            +
          </button>
        </div>
      </div>

      {/* Right Team (Red) */}
      <div className="flex-1 bg-red-600 flex flex-col items-center relative select-none touch-none">
        
        {/* Name Input */}
        <div className="w-full pt-4 md:pt-6 pb-2 z-10 px-4">
          <input
            type="text"
            value={rightName}
            onChange={(e) => setRightName(e.target.value)}
            className="bg-transparent text-white text-3xl md:text-5xl font-bold text-center w-full outline-none placeholder:text-red-300 drop-shadow-md"
            placeholder="Tên đội 2"
          />
        </div>

        {/* Main Score Area */}
        <motion.div
          className="flex-1 w-full flex items-center justify-center cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerUp={(e) => handlePointerUp(e, "right")}
        >
          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg">
            {rightMainScore}
          </span>
        </motion.div>

        {/* Sub Score Area */}
        <div className="w-full h-[25%] flex items-center justify-center gap-8 md:gap-14 bg-red-700/30">
          <button 
            onClick={() => setRightSubScore(s => Math.max(0, s - 1))}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-red-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
          >
            −
          </button>
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-red-100 drop-shadow-md pb-4 min-w-[2ch] text-center">
            {rightSubScore}
          </span>
          <button 
            onClick={() => setRightSubScore(s => s + 1)}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-red-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
          >
            +
          </button>
        </div>
      </div>

      {/* Center Divider */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] bg-black/20 pointer-events-none z-0" />

      {/* Fullscreen Button (Top Center) */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 hover:bg-black/80 p-3 md:p-4 text-white pointer-events-auto transition-all backdrop-blur-md shadow-xl border border-white/10 z-20"
        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
      >
        {isFullscreen ? <Minimize size={28} strokeWidth={2.5} /> : <Maximize size={28} strokeWidth={2.5} />}
      </button>

      {/* Reset Button (Absolute Center) */}
      <button
        onClick={() => setShowResetConfirm(true)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 p-3 md:p-4 text-white pointer-events-auto transition-all backdrop-blur-md shadow-xl border border-white/10 z-20"
        title="Làm mới"
      >
        <RotateCcw size={28} strokeWidth={2.5} />
      </button>

      {/* Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-800 pointer-events-auto">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-3 md:mb-4">Làm mới tỉ số?</h2>
            <p className="text-zinc-400 mb-6 md:mb-8 text-sm md:text-base">
              Tất cả điểm số sẽ được đưa về 0. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 md:py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors text-lg"
              >
                Hủy
              </button>
              <button
                onClick={resetAll}
                className="flex-1 py-3 md:py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors text-lg"
                autoFocus
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
