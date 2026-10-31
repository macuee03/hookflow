"use client";

import { useState, useTransition } from "react";
import { Plus, Globe, Key, Trash2, Copy, Check } from "lucide-react";
import { EndpointItem } from "@/types/webhook";
import { createEndpoint, deleteEndpoint } from "@/app/actions/webhook";

interface EndpointManagerProps {
  endpoints: EndpointItem[];
  onRefresh: () => void;
}

export default function EndpointManager({ endpoints, onRefresh }: EndpointManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createEndpoint({ name, url });
      if (res.success) {
        setName("");
        setUrl("");
        setShowForm(false);
        onRefresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = (id: string, epName: string) => {
    if (confirm(`Hapus endpoint "${epName}"?`)) {
      startTransition(async () => {
        await deleteEndpoint(id);
        onRefresh();
      });
    }
  };

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0d151c]/95 border border-slate-800 rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-300" /> Endpoint terdaftar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola tujuan yang menerima event webhook dari aplikasi Anda.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto shrink-0 justify-center px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Tutup" : "Tambah endpoint"}
        </button>
      </div>

      {/* Form Tambah Endpoint */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#111d25] border border-slate-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nama layanan</label>
              <input
                type="text"
                placeholder="Contoh: API produksi atau CRM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#080b12] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">URL webhook tujuan</label>
              <input
                type="url"
                placeholder="https://api.example.com/webhooks"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#080b12] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-cyan-600 text-white font-semibold text-xs shadow-[0_0_15px_rgba(34,211,238,0.2)] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Menyimpan..." : "Simpan endpoint"}
            </button>
          </div>
        </form>
      )}

      {/* List Endpoint */}
      {endpoints.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
          Belum ada endpoint. Tambahkan tujuan pertama untuk mulai menerima event.
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="p-4 rounded-2xl bg-[#080b12] border border-slate-800/90 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{ep.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1 break-all">{ep.url}</div>

                {/* Secret Key Display */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="max-w-full truncate text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-[#111d25] px-2 py-0.5 rounded border border-slate-700">
                    <Key className="w-3 h-3 text-cyan-300" /> Kunci: {ep.secretKey.slice(0, 10)}...{ep.secretKey.slice(-4)}
                  </span>
                  <button
                    onClick={() => copySecret(ep.secretKey, ep.id)}
                    className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 cursor-pointer"
                    title="Salin kunci rahasia HMAC"
                  >
                    {copiedId === ep.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === ep.id ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => handleDelete(ep.id, ep.name)}
                  className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
                  title="Hapus Endpoint"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}