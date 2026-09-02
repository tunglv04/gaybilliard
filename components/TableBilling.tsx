"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, Square, DollarSign, Plus, Edit2, Check, X, 
  Receipt, Clock, RefreshCw, Filter, Sparkles, AlertCircle, Trash2, Printer
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/audio";

export interface BilliardTable {
  id: string;
  name: string;
  category: "Pool" | "Bida Phăng" | "Bida 3 Băng (3C)" | "Bàn VIP";
  pricePerHour: number; // in VND
  status: "idle" | "running" | "paused";
  startTime: number | null; // Timestamp when started
  accumulatedSeconds: number; // Elapsed time before pause
  currentSessionStart: number | null; // Last start time when unpaused
  notes?: string;
}

export interface Invoice {
  tableName: string;
  category: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationSeconds: number;
  pricePerHour: number;
  rawCost: number;
  discountPercent: number;
  finalCost: number;
}

const INITIAL_TABLES: BilliardTable[] = [
  { id: "tbl-1", name: "Bàn 01", category: "Pool", pricePerHour: 50000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
  { id: "tbl-2", name: "Bàn 02", category: "Pool", pricePerHour: 50000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
  { id: "tbl-3", name: "Bàn 03", category: "Bida Phăng", pricePerHour: 60000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
  { id: "tbl-4", name: "Bàn 04 VIP", category: "Bàn VIP", pricePerHour: 90000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
  { id: "tbl-5", name: "Bàn 05", category: "Bida 3 Băng (3C)", pricePerHour: 80000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
  { id: "tbl-6", name: "Bàn 06 VIP Pro", category: "Bàn VIP", pricePerHour: 120000, status: "idle", startTime: null, accumulatedSeconds: 0, currentSessionStart: null },
];

export default function TableBilling() {
  const [tables, setTables] = useState<BilliardTable[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("billiard_timer_tables");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved tables", e);
        }
      }
    }
    return INITIAL_TABLES;
  });

  const [now, setNow] = useState<number>(Date.now());
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Edit / Add Table State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCategory, setNewTableCategory] = useState<BilliardTable["category"]>("Pool");
  const [newTablePrice, setNewTablePrice] = useState<number>(50000);

  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<number>(50000);

  // Save tables to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("billiard_timer_tables", JSON.stringify(tables));
    }
  }, [tables]);

  // Global ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate total active elapsed seconds for a table
  const getElapsedSeconds = (table: BilliardTable): number => {
    let total = table.accumulatedSeconds;
    if (table.status === "running" && table.currentSessionStart) {
      total += Math.floor((now - table.currentSessionStart) / 1000);
    }
    return Math.max(0, total);
  };

  // Helper to calculate cost in VND
  const getCalculatedCost = (table: BilliardTable): number => {
    const seconds = getElapsedSeconds(table);
    const hours = seconds / 3600;
    return Math.round(hours * table.pricePerHour);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format currency VND
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Actions
  const handleStart = (tableId: string) => {
    soundManager.playClick();
    const timestamp = Date.now();
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: "running",
            startTime: t.startTime || timestamp,
            currentSessionStart: timestamp,
          };
        }
        return t;
      })
    );
  };

  const handlePause = (tableId: string) => {
    soundManager.playClick();
    const timestamp = Date.now();
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId && t.status === "running" && t.currentSessionStart) {
          const addedSecs = Math.floor((timestamp - t.currentSessionStart) / 1000);
          return {
            ...t,
            status: "paused",
            accumulatedSeconds: t.accumulatedSeconds + addedSecs,
            currentSessionStart: null,
          };
        }
        return t;
      })
    );
  };

  const handleCheckoutModal = (table: BilliardTable) => {
    soundManager.playFinishChime();
    const totalSecs = getElapsedSeconds(table);
    const rawCost = Math.round((totalSecs / 3600) * table.pricePerHour);

    const startTimeFormatted = table.startTime
      ? new Date(table.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "--:--";
    const endTimeFormatted = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setActiveInvoice({
      tableName: table.name,
      category: table.category,
      startTimeFormatted,
      endTimeFormatted,
      durationSeconds: totalSecs,
      pricePerHour: table.pricePerHour,
      rawCost,
      discountPercent: 0,
      finalCost: rawCost,
    });
    setDiscountPercent(0);

    // Fire Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const confirmCheckout = (tableName: string) => {
    soundManager.playClick();
    setTables((prev) =>
      prev.map((t) => {
        if (t.name === tableName) {
          return {
            ...t,
            status: "idle",
            startTime: null,
            accumulatedSeconds: 0,
            currentSessionStart: null,
          };
        }
        return t;
      })
    );
    setActiveInvoice(null);
  };

  const handleResetTable = (tableId: string) => {
    soundManager.playClick();
    if (confirm("Bạn có chắc chắn muốn làm mới giờ của bàn này về 00:00:00?")) {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id === tableId) {
            return {
              ...t,
              status: "idle",
              startTime: null,
              accumulatedSeconds: 0,
              currentSessionStart: null,
            };
          }
          return t;
        })
      );
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    if (!newTableName.trim()) return;

    const newTbl: BilliardTable = {
      id: `tbl-${Date.now()}`,
      name: newTableName.trim(),
      category: newTableCategory,
      pricePerHour: newTablePrice,
      status: "idle",
      startTime: null,
      accumulatedSeconds: 0,
      currentSessionStart: null,
    };

    setTables((prev) => [...prev, newTbl]);
    setNewTableName("");
    setIsAddModalOpen(false);
  };

  const handleDeleteTable = (tableId: string) => {
    soundManager.playClick();
    if (confirm("Xóa bàn này khỏi danh sách?")) {
      setTables((prev) => prev.filter((t) => t.id !== tableId));
    }
  };

  const saveEditPrice = (tableId: string) => {
    soundManager.playClick();
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, pricePerHour: editPriceInput } : t))
    );
    setEditingTableId(null);
  };

  // Filtered Tables
  const filteredTables = tables.filter((t) => {
    if (filterCategory !== "All" && t.category !== filterCategory) return false;
    if (filterStatus === "active" && t.status === "idle") return false;
    if (filterStatus === "idle" && t.status !== "idle") return false;
    return true;
  });

  // Calculate global summary stats
  const activeTablesCount = tables.filter((t) => t.status === "running").length;
  const pausedTablesCount = tables.filter((t) => t.status === "paused").length;
  const totalRevenueRunning = tables.reduce((acc, t) => acc + getCalculatedCost(t), 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Bàn Đang Chơi</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{activeTablesCount} <span className="text-sm font-normal text-zinc-400">/ {tables.length}</span></h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Play size={24} className="fill-emerald-400" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tạm Dừng</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{pausedTablesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Pause size={24} />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tạm Tính Giờ Chơi</p>
            <h3 className="text-2xl font-black text-cyan-400 mt-1">{formatVND(totalRevenueRunning)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Thêm Bàn Mới</p>
            <button
              onClick={() => {
                soundManager.playClick();
                setIsAddModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <Plus size={18} strokeWidth={3} /> Tạo Bàn
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-300">Lọc theo loại:</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {["All", "Pool", "Bida Phăng", "Bida 3 Băng (3C)", "Bàn VIP"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundManager.playClick();
                  setFilterCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === cat
                    ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {cat === "All" ? "Tất Cả Loại" : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-300">Trạng thái:</span>
          <div className="flex gap-1.5">
            {[
              { label: "Tất cả", val: "All" },
              { label: "Đang chơi", val: "active" },
              { label: "Bàn trống", val: "idle" },
            ].map((st) => (
              <button
                key={st.val}
                onClick={() => {
                  soundManager.playClick();
                  setFilterStatus(st.val);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === st.val
                    ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => {
          const elapsedSecs = getElapsedSeconds(table);
          const currentCost = getCalculatedCost(table);

          const isRunning = table.status === "running";
          const isPaused = table.status === "paused";

          return (
            <div
              key={table.id}
              className={`relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between overflow-hidden ${
                isRunning
                  ? "bg-gradient-to-b from-zinc-900 via-zinc-900 to-emerald-950/40 border-emerald-500/50 shadow-2xl shadow-emerald-950/50 ring-1 ring-emerald-500/30"
                  : isPaused
                  ? "bg-gradient-to-b from-zinc-900 via-zinc-900 to-amber-950/40 border-amber-500/50 shadow-xl shadow-amber-950/40"
                  : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 shadow-lg"
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                        table.category === "Bàn VIP"
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {table.category}
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tight">{table.name}</h3>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        isRunning
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                          : isPaused
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRunning ? "bg-emerald-400" : isPaused ? "bg-amber-400" : "bg-zinc-500"
                        }`}
                      />
                      {isRunning ? "Đang Chơi" : isPaused ? "Tạm Dừng" : "Bàn Trống"}
                    </span>

                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Xóa bàn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Price per Hour Row */}
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 bg-zinc-950/40 px-3 py-2 rounded-xl border border-zinc-800/50">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={14} className="text-zinc-500" /> Giá phòng:
                  </span>
                  {editingTableId === table.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="5000"
                        value={editPriceInput}
                        onChange={(e) => setEditPriceInput(Number(e.target.value))}
                        className="w-24 bg-zinc-800 text-white px-2 py-1 rounded text-xs font-bold outline-none border border-emerald-500"
                      />
                      <button
                        onClick={() => saveEditPrice(table.id)}
                        className="p-1 bg-emerald-500 text-zinc-950 rounded hover:bg-emerald-400"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => {
                        setEditingTableId(table.id);
                        setEditPriceInput(table.pricePerHour);
                      }}
                      className="font-bold text-zinc-200 hover:text-emerald-400 cursor-pointer flex items-center gap-1 group"
                      title="Bấm để đổi giá theo giờ"
                    >
                      {formatVND(table.pricePerHour)}/giờ
                      <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                    </span>
                  )}
                </div>
              </div>

              {/* Main Timer & Cost Display */}
              <div className="my-6 text-center py-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 shadow-inner">
                <div className="font-mono text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                  {formatTime(elapsedSecs)}
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-400 tracking-wide">
                  {formatVND(currentCost)}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {!isRunning ? (
                    <button
                      onClick={() => handleStart(table.id)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Play size={18} className="fill-zinc-950" /> {isPaused ? "Tiếp Tục" : "Bắt Đầu"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePause(table.id)}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      <Pause size={18} className="fill-zinc-950" /> Tạm Dừng
                    </button>
                  )}

                  <button
                    onClick={() => handleCheckoutModal(table)}
                    disabled={elapsedSecs === 0}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-zinc-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                  >
                    <Receipt size={18} /> Tính Tiền
                  </button>
                </div>

                {/* Secondary Reset Button */}
                {elapsedSecs > 0 && (
                  <button
                    onClick={() => handleResetTable(table.id)}
                    className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-red-400 py-1 transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} /> Làm mới thời gian bàn này
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice / Checkout Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                <Receipt size={32} />
              </div>
              <h2 className="text-2xl font-black text-white">HÓA ĐƠN TÍNH TIỀN</h2>
              <p className="text-sm font-semibold text-emerald-400">{activeInvoice.tableName} ({activeInvoice.category})</p>
            </div>

            {/* Invoice Details */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Giờ vào:</span>
                <span className="text-white font-bold">{activeInvoice.startTimeFormatted}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Giờ ra:</span>
                <span className="text-white font-bold">{activeInvoice.endTimeFormatted}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tổng thời gian:</span>
                <span className="text-cyan-400 font-bold">{formatTime(activeInvoice.durationSeconds)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Đơn giá theo giờ:</span>
                <span className="text-white font-bold">{formatVND(activeInvoice.pricePerHour)}/h</span>
              </div>

              <hr className="border-zinc-800 my-2" />

              <div className="flex justify-between text-zinc-300">
                <span>Tạm tính:</span>
                <span className="font-bold">{formatVND(activeInvoice.rawCost)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between text-zinc-400 pt-1">
                <span>Giảm giá (%):</span>
                <div className="flex items-center gap-1">
                  {[0, 10, 20, 50].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiscountPercent(d)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                        discountPercent === d
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-zinc-800 my-2" />

              {/* Final Amount */}
              <div className="flex justify-between items-center text-lg pt-1">
                <span className="font-sans font-black text-white">TỔNG THANH TOÁN:</span>
                <span className="font-mono text-2xl font-black text-emerald-400">
                  {formatVND(Math.round(activeInvoice.rawCost * (1 - discountPercent / 100)))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                <Printer size={18} /> In Biên Nhận
              </button>

              <button
                onClick={() => confirmCheckout(activeInvoice.tableName)}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Check size={20} strokeWidth={3} /> Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAddTable}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Plus size={20} className="text-emerald-400" /> Tạo Bàn Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Tên Bàn</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bàn 07 VIP"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Loại Bàn</label>
                <select
                  value={newTableCategory}
                  onChange={(e) => setNewTableCategory(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm font-semibold"
                >
                  <option value="Pool">Pool (Bida Lỗ)</option>
                  <option value="Bida Phăng">Bida Phăng (Carom)</option>
                  <option value="Bida 3 Băng (3C)">Bida 3 Băng (3C)</option>
                  <option value="Bàn VIP">Bàn VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Giá Theo Giờ (VND)</label>
                <input
                  type="number"
                  step="5000"
                  required
                  value={newTablePrice}
                  onChange={(e) => setNewTablePrice(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
              >
                Tạo Bàn
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
