"use client";

import { useState } from "react";
import {
  ListFilter,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { DeliveryLogItem } from "@/types/webhook";
import { retryDelivery } from "@/app/actions/webhook";

interface DeliveryLogsProps {
  logs: DeliveryLogItem[];
  loading: boolean;
  onRefresh: () => void;
}

export default function DeliveryLogs({
  logs,
  loading,
  onRefresh,
}: DeliveryLogsProps) {
  const [selectedLog, setSelectedLog] = useState<DeliveryLogItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleManualRetry = async (attemptId: string) => {
    setRetryingId(attemptId);
    const res = await retryDelivery(attemptId);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.error);
    }
    setRetryingId(null);
  };

  return (
    <>
      <div className="bg-[#0d151c]/95 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl">
        <div className="flex items-start gap-4 justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListFilter className="w-5 h-5 shrink-0 text-cyan-300" /> Riwayat pengiriman
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau status, latensi, percobaan ulang, dan detail keamanan setiap pengiriman.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="shrink-0 p-2 rounded-xl bg-[#111d25] border border-cyan-500/30 text-cyan-300 hover:text-white transition-all cursor-pointer"
            title="Muat ulang riwayat"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-300" />
            <span>Memuat riwayat pengiriman...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
            Belum ada pengiriman. Gunakan event uji di atas untuk membuat aktivitas pertama.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isSuccess = log.status === "SUCCESS";
              return (
                <div
                  key={log.id}
                  className="bg-[#080b12] border border-slate-800/90 hover:border-cyan-500/40 p-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    {/* Status Badge */}
                    <div
                      className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                        isSuccess
                          ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-400"
                          : "bg-rose-950/70 border border-rose-500/40 text-rose-400"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{log.statusCode || "ERR"}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white">
                          {log.event.eventType}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-[#111d25] px-2 py-0.5 rounded">
                          Percobaan #{log.attemptNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1 break-all sm:truncate sm:max-w-sm">
                        {log.endpoint.name} ({log.endpoint.url})
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-300" />
                          {new Date(log.createdAt).toLocaleTimeString("id-ID")}
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">
                          {log.latencyMs} ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    {/* Tombol Replay Jika Gagal */}
                    {!isSuccess && (
                      <button
                        onClick={() => handleManualRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Kirim ulang webhook ini"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${retryingId === log.id ? "animate-spin" : ""}`}
                        />
                        <span>Replay</span>
                      </button>
                    )}

                    {/* Tombol Inspeksi Rincian Payload */}
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1.5 rounded-xl bg-[#111d25] hover:bg-[#172731] border border-cyan-500/20 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Inspector Rincian Request & Response */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#0d151c] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-full relative shadow-[0_0_50px_rgba(34,211,238,0.12)] max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Detail pengiriman webhook
                </h3>
                <p className="pr-8 break-all text-xs text-slate-400 font-mono">
                  {selectedLog.endpoint.url}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Request Headers */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">
                  Header permintaan (HMAC-SHA256):
                </span>
                <pre className="p-3 rounded-xl bg-[#080b12] border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.requestHeaders
                    ? JSON.stringify(
                        JSON.parse(selectedLog.requestHeaders),
                        null,
                        2,
                      )
                    : "N/A"}
                </pre>
              </div>

              {/* Payload Body */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">
                  Payload permintaan (JSON):
                </span>
                <pre className="p-3 rounded-xl bg-[#080b12] border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.requestBody}
                </pre>
              </div>

              {/* Response Body */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">
                  Respons endpoint:
                </span>
                <pre className="p-3 rounded-xl bg-[#080b12] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.responseBody ||
                    selectedLog.errorMessage ||
                    "Tidak ada body respon"}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-all cursor-pointer mt-4 shrink-0"
            >
              Tutup detail
            </button>
          </div>
        </div>
      )}
    </>
  );
}
