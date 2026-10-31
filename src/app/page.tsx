"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import StatsCards from "@/components/dashboard/StatsCards";
import EndpointManager from "@/components/dashboard/EndpointManager";
import EventSimulator from "@/components/dashboard/EventSimulator";
import DeliveryLogs from "@/components/dashboard/DeliveryLogs";
import { getEndpoints, getDeliveryLogs } from "./actions/webhook";
import { EndpointItem, DeliveryLogItem } from "@/types/webhook";

export default function Home() {
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [logs, setLogs] = useState<DeliveryLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const [epRes, logsRes] = await Promise.all([
      getEndpoints(),
      getDeliveryLogs(25),
    ]);
    if (epRes.success && epRes.data) setEndpoints(epRes.data as EndpointItem[]);
    if (logsRes.success && logsRes.data)
      setLogs(logsRes.data as DeliveryLogItem[]);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([getEndpoints(), getDeliveryLogs(25)]).then(
      ([epRes, logsRes]) => {
        if (isMounted) {
          if (epRes.success && epRes.data)
            setEndpoints(epRes.data as EndpointItem[]);
          if (logsRes.success && logsRes.data)
            setLogs(logsRes.data as DeliveryLogItem[]);
          setLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans px-3 py-5 sm:p-6 md:p-10 relative overflow-x-hidden">
      <div className="fixed top-0 left-1/4 w-120 h-120 bg-cyan-600/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-120 h-120 bg-slate-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 md:space-y-8 relative z-10">
        <Header />
        <StatsCards totalEndpoints={endpoints.length} logs={logs} />
        <EndpointManager endpoints={endpoints} onRefresh={refreshData} />
        <EventSimulator onEventSent={refreshData} />
        <DeliveryLogs logs={logs} loading={loading} onRefresh={refreshData} />
      </div>
    </div>
  );
}
