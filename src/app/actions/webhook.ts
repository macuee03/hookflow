"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateEndpointSecret } from "@/lib/signer";
import { dispatchWebhook } from "@/lib/dispatcher";

// 1. Action: Mendaftarkan Endpoint Tujuan Baru
export async function createEndpoint(data: {
  name: string;
  url: string;
  events?: string;
}) {
  try {
    if (!data.url || !data.url.startsWith("http")) {
      return {
        success: false,
        error: "URL harus diawali dengan http:// atau https://",
      };
    }

    const secretKey = generateEndpointSecret();
    const events =
      data.events && data.events.trim() !== ""
        ? data.events
        : "order.paid,invoice.created";

    const endpoint = await prisma.endpoint.create({
      data: {
        name: data.name || "Default Endpoint",
        url: data.url.trim(),
        secretKey,
        events,
        isActive: true,
      },
    });

    revalidatePath("/");
    return { success: true, data: endpoint };
  } catch (error) {
    console.error("Gagal membuat endpoint:", error);
    return { success: false, error: "Gagal menyimpan endpoint ke basis data." };
  }
}

// 2. Action: Mengambil Daftar Semua Endpoint
export async function getEndpoints() {
  try {
    const endpoints = await prisma.endpoint.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });
    return { success: true, data: endpoints };
  } catch (error) {
    console.error("Gagal mengambil endpoint:", error);
    return { success: false, data: [] };
  }
}

// 3. Action: Hapus Endpoint
export async function deleteEndpoint(id: string) {
  try {
    await prisma.endpoint.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus endpoint:", error);
    return { success: false, error: "Gagal menghapus endpoint" };
  }
}

// 4. Action: Simulator Memicu Event & Mengirimkan Webhook Nyata
export async function triggerWebhookEvent(
  eventType: string,
  customPayload?: string,
  targetEndpointId?: string,
) {
  try {
    // Buat payload simulasi default jika tidak disediakan
    const payload =
      customPayload && customPayload.trim() !== ""
        ? customPayload
        : JSON.stringify(
            {
              event: eventType,
              id: `evt_${Date.now()}`,
              timestamp: new Date().toISOString(),
              data: {
                orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                customer: {
                  name: "Budi Santoso",
                  email: "budi.santoso@example.com",
                },
                amount: 350000,
                currency: "IDR",
                status: eventType === "payment.failed" ? "FAILED" : "PAID",
              },
            },
            null,
            2,
          );

    // 1. Simpan WebhookEvent ke database
    const event = await prisma.webhookEvent.create({
      data: {
        eventType,
        payload,
      },
    });

    // 2. Cari endpoint aktif yang berlangganan event ini
    const endpoints = await prisma.endpoint.findMany({
      where: {
        isActive: true,
        ...(targetEndpointId ? { id: targetEndpointId } : {}),
      },
    });

    if (endpoints.length === 0) {
      return {
        success: false,
        error:
          "Tidak ada endpoint aktif yang terdaftar untuk menerima event ini.",
      };
    }

    // 3. Tembakkan webhook ke semua endpoint terkait secara paralel
    const deliveryPromises = endpoints.map((ep) =>
      dispatchWebhook(ep.id, event.id, 1),
    );
    const results = await Promise.all(deliveryPromises);

    revalidatePath("/");
    return {
      success: true,
      eventId: event.id,
      totalDispatched: results.length,
      results,
    };
  } catch (error) {
    console.error("Gagal memicu webhook:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memicu event webhook.",
    };
  }
}

// 5. Action: Mengambil Live Delivery Logs untuk Dashboard Inspector
export async function getDeliveryLogs(limit = 20) {
  try {
    const logs = await prisma.deliveryAttempt.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        endpoint: {
          select: { id: true, name: true, url: true },
        },
        event: {
          select: { id: true, eventType: true },
        },
      },
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Gagal mengambil log pengiriman:", error);
    return { success: false, data: [] };
  }
}

// 6. Action: Manual Replay / Retry Pengiriman
export async function retryDelivery(attemptId: string) {
  try {
    const prevAttempt = await prisma.deliveryAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!prevAttempt) {
      return { success: false, error: "Log pengiriman tidak ditemukan" };
    }

    // Eksekusi ulang pengiriman dengan nomor percobaan berikutnya
    const result = await dispatchWebhook(
      prevAttempt.endpointId,
      prevAttempt.eventId,
      prevAttempt.attemptNumber + 1,
    );

    revalidatePath("/");
    return { success: true, result };
  } catch (error) {
    console.error("Gagal mencoba ulang pengiriman:", error);
    return { success: false, error: "Gagal mencoba ulang pengiriman webhook." };
  }
}
