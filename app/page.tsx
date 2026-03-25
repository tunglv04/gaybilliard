"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
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

  const handlePanEnd = (
    team: "left" | "right",
    info: PanInfo,
    type: "main" | "sub"
  ) => {
    const isSwipeUp = info.offset.y < -SWIPE_THRESHOLD;
    const isSwipeDown = info.offset.y > SWIPE_THRESHOLD;

    if (isSwipeUp) {
      if (team === "left") {
        type === "main" ? setLeftMainScore(s => s + 1) : setLeftSubScore(s => s + 1);
      } else {
        type === "main" ? setRightMainScore(s => s + 1) : setRightSubScore(s => s + 1);
      }
    } else if (isSwipeDown) {
      if (team === "left") {
        type === "main" ? setLeftMainScore(s => Math.max(0, s - 1)) : setLeftSubScore(s => Math.max(0, s - 1));
      } else {
        type === "main" ? setRightMainScore(s => Math.max(0, s - 1)) : setRightSubScore(s => Math.max(0, s - 1));
      }
    }
  };

  const handleTap = (team: "left" | "right", type: "main" | "sub") => {
    if (team === "left") {
      type === "main" ? setLeftMainScore(s => s + 1) : setLeftSubScore(s => s + 1);
    } else {
      type === "main" ? setRightMainScore(s => s + 1) : setRightSubScore(s => s + 1);
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
          onPanEnd={(_, info) => handlePanEnd("left", info, "main")}
          onTap={() => handleTap("left", "main")}
        >
          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg">
            {leftMainScore}
          </span>
        </motion.div>

        {/* Sub Score Area */}
        <motion.div
          className="w-full h-[25%] flex items-center justify-center cursor-pointer bg-blue-700/30"
          onPanEnd={(_, info) => handlePanEnd("left", info, "sub")}
          onTap={() => handleTap("left", "sub")}
        >
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-blue-100 drop-shadow-md pb-4">
            {leftSubScore}
          </span>
        </motion.div>
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
          onPanEnd={(_, info) => handlePanEnd("right", info, "main")}
          onTap={() => handleTap("right", "main")}
        >
          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg">
            {rightMainScore}
          </span>
        </motion.div>

        {/* Sub Score Area */}
        <motion.div
          className="w-full h-[25%] flex items-center justify-center cursor-pointer bg-red-700/30"
          onPanEnd={(_, info) => handlePanEnd("right", info, "sub")}
          onTap={() => handleTap("right", "sub")}
        >
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-red-100 drop-shadow-md pb-4">
            {rightSubScore}
          </span>
        </motion.div>
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

      {/* Reset Button (Bottom Center) */}
      <button
        onClick={() => setShowResetConfirm(true)}
        className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 hover:bg-black/80 p-3 md:p-4 text-white pointer-events-auto transition-all backdrop-blur-md shadow-xl border border-white/10 z-20"
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
