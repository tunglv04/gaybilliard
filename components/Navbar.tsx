"use client";

import React, { useState, useEffect } from "react";
import { 
  Dices, Clock, Timer, Hourglass, Maximize, Minimize, 
  Volume2, VolumeX, Shield, Sun, Moon, Zap, Sparkles 
} from "lucide-react";
import { soundManager } from "@/lib/audio";

export type TabType = "billing" | "shotclock" | "stopwatch" | "countdown";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wakeLockRef = React.useRef<any>(null);

  // Fullscreen state sync
  useEffect(() => {
    const handleFSChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    document.addEventListener("webkitfullscreenchange", handleFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      document.removeEventListener("webkitfullscreenchange", handleFSChange);
    };
  }, []);

  const toggleFullscreen = () => {
    soundManager.playClick();
    const docElm = document.documentElement as any;
    const doc = document as any;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      const requestFS = docElm.requestFullscreen || docElm.webkitRequestFullscreen;
      if (requestFS) requestFS.call(docElm);
    } else {
      const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (exitFS) exitFS.call(doc);
    }
  };

  const toggleWakeLock = async () => {
    soundManager.playClick();
    try {
      if (!isWakeLockActive) {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          setIsWakeLockActive(true);
        } else {
          alert("Trình duyệt không hỗ trợ Screen Wake Lock.");
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

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
    if (!nextMute) soundManager.playClick();
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "billing", label: "Tính Giờ Bàn Bida", icon: <Dices size={18} /> },
    { id: "shotclock", label: "Shot Clock Thi Đấu", icon: <Timer size={18} /> },
    { id: "stopwatch", label: "Bấm Giờ Stopwatch", icon: <Clock size={18} /> },
    { id: "countdown", label: "Đếm Ngược", icon: <Hourglass size={18} /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Zap size={22} className="fill-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              BILLIARD <span className="text-emerald-400">TIMER PRO</span>
            </h1>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
              Hệ Thống Tính Giờ & Bấm Giờ Bida
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1.5 backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* Wake Lock Toggle */}
          <button
            onClick={toggleWakeLock}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isWakeLockActive
                ? "bg-amber-500/10 text-amber-400 border-amber-500/40"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={isWakeLockActive ? "Màn hình được giữ sáng liên tục" : "Bật giữ sáng màn hình (Screen Wake Lock)"}
          >
            <Sun size={18} className={isWakeLockActive ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">{isWakeLockActive ? "Giữ Sáng: BẬT" : "Giữ Sáng"}</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden border-t border-zinc-800/80 bg-zinc-950 px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                isActive ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400"
              }`}
            >
              {tab.icon}
              <span>{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
