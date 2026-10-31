"use client";

import { useState, useTransition } from "react";
import { Play, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { triggerWebhookEvent } from "@/app/actions/webhook";

interface SimulatorProps {
  onEventSent: () => void;
}

export default function EventSimulator({ onEventSent }: SimulatorProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    success: boolean;
    msg: string;
  } | null>(null);

  const handleTrigger = (eventType: string) => {
    setFeedback(null);

    startTransition(async () => {
      const res = await triggerWebhookEvent(eventType);
      if (res.success) {
        setFeedback({
          success: true,
          msg: `Event "${eventType}" berhasil dikirimkan ke ${res.totalDispatched} endpoint aktif!`,
        });
        onEventSent();
      } else {
        setFeedback({
          success: false,
          msg: res.error || "Gagal mengirimkan event webhook.",
        });
      }
    });
  };

  return (
    <div className="bg-[#0d151c]/95 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">
          Kirim event uji
        </h2>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Kirim event contoh untuk memeriksa respons endpoint dan validasi tanda tangan HMAC.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
        <button
          onClick={() => handleTrigger("order.paid")}
          disabled={isPending}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#111d25] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> order.paid (200 OK Demo)
        </button>

        <button
          onClick={() => handleTrigger("invoice.created")}
          disabled={isPending}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#111d25] border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> invoice.created
        </button>

        <button
          onClick={() => handleTrigger("payment.failed")}
          disabled={isPending}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#111d25] border border-rose-500/30 text-rose-300 hover:bg-rose-950/60 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> payment.failed
        </button>
      </div>

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
            feedback.success
              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}
