"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw, Maximize, Minimize, ChevronUp, ChevronDown, Play, Pause, Settings, ArrowRightLeft, Timer, TimerOff } from "lucide-react";

export default function Home() {
  const [leftName, setLeftName] = useState("Đội 1");
  const [rightName, setRightName] = useState("Đội 2");

  const [leftMainScore, setLeftMainScore] = useState(0);
  const [rightMainScore, setRightMainScore] = useState(0);

  const [leftSubScore, setLeftSubScore] = useState(0);
  const [rightSubScore, setRightSubScore] = useState(0);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shot clock state
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [defaultShotClock, setDefaultShotClock] = useState(40);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [tempShotClock, setTempShotClock] = useState(40);
  const [shotClock, setShotClock] = useState(40);
  const [isClockRunning, setIsClockRunning] = useState(false);

  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const onFullscreenChange = async () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
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
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    const preventTouchScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });
    
    // Completely disable touchstart defaults except for buttons and inputs
    const preventTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('button') && !target.closest('input')) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchstart", preventTouchStart, { passive: false });

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("touchmove", preventTouchScroll);
      document.removeEventListener("touchstart", preventTouchStart);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isClockRunning && shotClock > 0) {
      interval = setInterval(() => {
        setShotClock(prev => prev - 1);
      }, 1000);
    } else if (shotClock === 0) {
      setIsClockRunning(false);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, shotClock]);

  const resetShotClock = () => {
    setIsClockRunning(true);
    setShotClock(defaultShotClock);
  };

  const toggleFullscreen = () => {
    const docElm = document.documentElement as any;
    const requestFS = docElm.requestFullscreen || docElm.webkitRequestFullscreen;
    const doc = document as any;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (requestFS) {
        requestFS.call(docElm).catch((err: any) => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        alert("Trình duyệt Safari trên iPhone không hỗ trợ nút Phóng To tĩnh.\\n\\nĐỂ CHƠI TOÀN MÀN HÌNH:\\nHãy ấn biểu tượng [Chia sẻ] ở dưới cùng Safari và chọn [Thêm vào màn hình chính] (Add to Home Screen). Sau đó mở app từ màn hình chính!");
      }
    } else {
      const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (exitFS) exitFS.call(doc);
    }
  };

  const resetAll = () => {
    setLeftMainScore(0);
    setRightMainScore(0);
    setLeftSubScore(0);
    setRightSubScore(0);
    setShowResetConfirm(false);
    resetShotClock();
  };

  return (
    <main className="flex w-full h-[100dvh] bg-black overflow-hidden font-sans">
      {/* Left Team (Blue) */}
      <div className="flex-1 bg-blue-600 flex flex-col items-center relative select-none touch-none">
        
        {/* Name Input */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 w-2/3 md:w-1/2">
          <input
            type="text"
            value={leftName}
            onChange={(e) => setLeftName(e.target.value)}
            className="bg-transparent text-white text-2xl md:text-3xl lg:text-4xl font-bold text-left w-full outline-none placeholder:text-blue-300 drop-shadow-md"
            placeholder="Tên đội 1"
          />
        </div>

        {/* Main Score Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative -translate-x-6 md:-translate-x-16 lg:-translate-x-24">
          {/* Up Arrow */}
          <button 
            onClick={() => setLeftMainScore(s => s + 1)}
            className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white pointer-events-auto mb-[-2vh] z-10 transition-colors active:scale-95"
            title="Tăng điểm"
          >
            <ChevronUp size={64} strokeWidth={3} />
          </button>

          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg pointer-events-none">
            {leftMainScore}
          </span>

          {/* Down Arrow */}
          <button 
            onClick={() => setLeftMainScore(s => Math.max(0, s - 1))}
            className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white pointer-events-auto mt-[-2vh] z-10 transition-colors active:scale-95"
            title="Giảm điểm"
          >
            <ChevronDown size={64} strokeWidth={3} />
          </button>
        </div>

        {/* Sub Score Area */}
        <div className="w-full h-[25%] flex items-center justify-center gap-8 md:gap-14 bg-blue-700/30">
          <button 
            onClick={() => setLeftSubScore(s => Math.max(0, s - 1))}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-blue-100/40 hover:text-blue-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
            title="Giảm điểm phụ"
          >
            −
          </button>
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-blue-100 drop-shadow-md min-w-[2ch] text-center">
            {leftSubScore}
          </span>
          <button 
            onClick={() => setLeftSubScore(s => s + 1)}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-blue-100/40 hover:text-blue-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
            title="Tăng điểm phụ"
          >
            +
          </button>
        </div>
      </div>

      {/* Right Team (Red) */}
      <div className="flex-1 bg-red-600 flex flex-col items-center relative select-none touch-none">
        
        {/* Name Input */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-2/3 md:w-1/2">
          <input
            type="text"
            value={rightName}
            onChange={(e) => setRightName(e.target.value)}
            className="bg-transparent text-white text-2xl md:text-3xl lg:text-4xl font-bold text-right w-full outline-none placeholder:text-red-300 drop-shadow-md"
            placeholder="Tên đội 2"
          />
        </div>

        {/* Main Score Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative translate-x-6 md:translate-x-16 lg:translate-x-24">
          {/* Up Arrow */}
          <button 
            onClick={() => setRightMainScore(s => s + 1)}
            className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white pointer-events-auto mb-[-2vh] z-10 transition-colors active:scale-95"
            title="Tăng điểm"
          >
            <ChevronUp size={64} strokeWidth={3} />
          </button>

          <span className="text-[35vh] md:text-[45vh] leading-none font-bold text-white tracking-tighter drop-shadow-lg pointer-events-none">
            {rightMainScore}
          </span>

          {/* Down Arrow */}
          <button 
            onClick={() => setRightMainScore(s => Math.max(0, s - 1))}
            className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white pointer-events-auto mt-[-2vh] z-10 transition-colors active:scale-95"
            title="Giảm điểm"
          >
            <ChevronDown size={64} strokeWidth={3} />
          </button>
        </div>

        {/* Sub Score Area */}
        <div className="w-full h-[25%] flex items-center justify-center gap-8 md:gap-14 bg-red-700/30">
          <button 
            onClick={() => setRightSubScore(s => Math.max(0, s - 1))}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-red-100/40 hover:text-red-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
            title="Giảm điểm phụ"
          >
            −
          </button>
          <span className="text-[12vh] md:text-[18vh] leading-none font-bold text-red-100 drop-shadow-md min-w-[2ch] text-center">
            {rightSubScore}
          </span>
          <button 
            onClick={() => setRightSubScore(s => s + 1)}
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-full hover:bg-white/10 text-red-100/40 hover:text-red-100 text-4xl md:text-5xl font-bold transition-colors active:scale-95 pointer-events-auto"
            title="Tăng điểm phụ"
          >
            +
          </button>
        </div>
      </div>

      {/* Center Divider */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] bg-black/20 pointer-events-none z-0" />

      {/* Top Center Controls (Fullscreen & Timer Toggle) */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-full p-1 border border-white/10 backdrop-blur-md shadow-xl z-20 pointer-events-auto">
        <button
          onClick={() => setIsTimerEnabled(!isTimerEnabled)}
          className={`p-2 md:p-3 rounded-full transition-all flex items-center justify-center ${isTimerEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
          title={isTimerEnabled ? "Tắt đếm giờ" : "Bật đếm giờ"}
        >
          {isTimerEnabled ? <Timer size={24} strokeWidth={2.5} /> : <TimerOff size={24} strokeWidth={2.5} />}
        </button>

        <div className="w-[1px] h-6 bg-white/20 mx-1" />

        <button
          onClick={toggleFullscreen}
          className="p-2 md:p-3 rounded-full text-white hover:bg-white/10 transition-all flex items-center justify-center"
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize size={24} strokeWidth={2.5} /> : <Maximize size={24} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Center Overlay Controls */}
      {isTimerEnabled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 md:gap-10 z-20 pointer-events-none w-full max-w-2xl">
        
        {/* Shot Clock */}
        <div className="flex items-center bg-black/80 rounded-[3rem] md:rounded-[4rem] p-4 md:p-6 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 pointer-events-auto gap-4 md:gap-8 mx-auto">
          <button 
            onClick={() => {
              setTempShotClock(defaultShotClock);
              setShowTimerSettings(true);
              setIsClockRunning(false);
            }}
            className="p-5 md:p-6 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
            title="Cài đặt thời gian"
          >
            <Settings size={32} strokeWidth={2.5} />
          </button>

          <div 
            className="w-36 md:w-56 text-center text-white font-mono text-7xl md:text-[8rem] leading-none font-bold cursor-pointer select-none"
            onClick={() => setIsClockRunning(!isClockRunning)}
            title="Chạm để Dừng/Chạy"
          >
            {shotClock}
          </div>

          <button 
            onClick={() => setIsClockRunning(!isClockRunning)}
            className={`p-5 md:p-6 rounded-full text-white transition-colors ${isClockRunning ? 'bg-amber-600/80 hover:bg-amber-500' : 'bg-green-600/80 hover:bg-green-500'}`}
            title={isClockRunning ? "Tạm dừng" : "Bắt đầu"}
          >
            {isClockRunning ? <Pause size={32} fill="currentColor" strokeWidth={2.5} /> : <Play size={32} fill="currentColor" strokeWidth={2.5} />}
          </button>
        </div>

        {/* Switch Turn Button */}
        <button 
          onClick={resetShotClock}
          className="flex items-center justify-center gap-3 md:gap-4 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 px-8 py-5 md:px-16 md:py-8 rounded-full text-black font-extrabold text-2xl md:text-4xl shadow-[0_0_50px_rgba(245,158,11,0.5)] border-2 border-amber-200 pointer-events-auto transition-all active:scale-95"
          title="Đổi lượt / Bắt đầu lại thời gian"
        >
          <ArrowRightLeft size={36} className="w-8 h-8 md:w-12 md:h-12" strokeWidth={3} />
          <span className="tracking-wide">CHUYỂN LƯỢT</span>
        </button>

      </div>
      )}

      {/* Global Reset Button (Bottom Center) */}
      <button
        onClick={() => setShowResetConfirm(true)}
        className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 hover:bg-black/80 p-3 md:p-4 text-white pointer-events-auto transition-all backdrop-blur-md shadow-xl border border-white/10 z-20"
        title="Làm mới tỉ số"
      >
        <RotateCcw size={24} strokeWidth={2.5} />
      </button>

      {/* Reset Confirmation Overlay */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm pointer-events-auto">
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

      {/* Timer Settings Overlay */}
      {showTimerSettings && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm pointer-events-auto">
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-800 pointer-events-auto">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-6">Cài đặt thời gian</h2>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={() => setTempShotClock(s => Math.max(5, s - 5))}
                className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white text-3xl font-bold hover:bg-zinc-700 active:scale-95 transition-all"
              >
                −
              </button>
              <div className="text-5xl font-mono font-bold text-white w-24 text-center">
                {tempShotClock}
              </div>
              <button 
                onClick={() => setTempShotClock(s => Math.min(300, s + 5))}
                className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-white text-3xl font-bold hover:bg-zinc-700 active:scale-95 transition-all"
              >
                +
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowTimerSettings(false)}
                className="flex-1 py-3 md:py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors text-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setDefaultShotClock(tempShotClock);
                  setShotClock(tempShotClock);
                  setShowTimerSettings(false);
                }}
                className="flex-1 py-3 md:py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors text-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
