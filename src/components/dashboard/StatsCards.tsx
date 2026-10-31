import { Globe, Send, CheckCircle2, Zap } from "lucide-react";
import { DeliveryLogItem } from "@/types/webhook";

interface StatsProps {
  totalEndpoints: number;
  logs: DeliveryLogItem[];
}

export default function StatsCards({ totalEndpoints, logs }: StatsProps) {
  const totalDeliveries = logs.length;
  const successDeliveries = logs.filter((l) => l.status === "SUCCESS").length;
  const successRate =
    totalDeliveries > 0
      ? Math.round((successDeliveries / totalDeliveries) * 100)
      : 100;

  // Hitung rata-rata latensi
  const avgLatency =
    totalDeliveries > 0
      ? Math.round(
          logs.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalDeliveries,
        )
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      <div className="bg-[#0d151c]/90 border border-slate-800 p-3 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="truncate">Endpoint aktif</span>
          <Globe className="w-4 h-4 text-cyan-300" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {totalEndpoints}
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Tujuan pengiriman terdaftar
        </div>
      </div>

      <div className="bg-[#0d151c]/90 border border-slate-800 p-3 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="truncate">Total terkirim</span>
          <Send className="w-4 h-4 text-sky-300" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {totalDeliveries}
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Pengiriman yang tercatat
        </div>
      </div>

      <div className="bg-[#0d151c]/90 border border-slate-800 p-3 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="truncate">Tingkat keberhasilan</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-400 font-mono">
          {successRate}%
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Respons HTTP 2xx
        </div>
      </div>

      <div className="bg-[#0d151c]/90 border border-slate-800 p-3 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="truncate">Latensi rata-rata</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {avgLatency} ms
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          Waktu respons endpoint
        </div>
      </div>
    </div>
  );
}
