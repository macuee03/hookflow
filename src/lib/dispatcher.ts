import { prisma } from "./prisma";
import { signWebhookPayload } from "./signer";

interface DispatchResult {
  success: boolean;
  statusCode: number | null;
  latencyMs: number;
  attemptId: string;
}

export async function dispatchWebhook(
  endpointId: string,
  eventId: string,
  attemptNumber = 1,
): Promise<DispatchResult> {
  const endpoint = await prisma.endpoint.findUnique({
    where: { id: endpointId },
  });
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
  });

  if (!endpoint || !event || !endpoint.isActive) {
    throw new Error("Endpoint atau Event tidak valid / nonaktif");
  }

  // 1. Buat Tanda Tangan HMAC-SHA256
  const { headerValue, timestamp } = signWebhookPayload(
    event.payload,
    endpoint.secretKey,
  );

  const requestHeaders = {
    "Content-Type": "application/json",
    "User-Agent": "HookFlow-Webhook-Dispatcher/1.0",
    "X-Hook-Event": event.eventType,
    "X-Hook-Timestamp": timestamp.toString(),
    "X-Hook-Signature": headerValue,
  };

  const startTime = performance.now();
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;
  let isSuccess = false;

  // 2. Eksekusi HTTP POST dengan batas waktu (Timeout 6 detik)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: requestHeaders,
      body: event.payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    const text = await response.text();
    // Batasi response body maksimal 1000 karakter agar tidak membebani database
    responseBody = text.slice(0, 1000);

    // Dianggap sukses jika HTTP status code 2xx (200 - 299)
    isSuccess = response.ok;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      errorMessage =
        err.name === "AbortError" ? "Request Timeout (> 6000ms)" : err.message;
    } else {
      errorMessage = "Unknown Network Error";
    }
    isSuccess = false;
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  // 3. Logika Exponential Backoff Retry (Percobaan Maksimal 3x)
  let status = isSuccess ? "SUCCESS" : "FAILED";
  let nextRetryAt: Date | null = null;

  if (!isSuccess && attemptNumber < 3) {
    status = "PENDING_RETRY";
    // Formula Exponential Backoff: Percobaan 1: 15 detik, Percobaan 2: 60 detik
    const backoffSeconds = attemptNumber === 1 ? 15 : 60;
    nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
  }

  // 4. Catat Riwayat ke Tabel DeliveryAttempt
  const attempt = await prisma.deliveryAttempt.create({
    data: {
      endpointId: endpoint.id,
      eventId: event.id,
      status,
      statusCode,
      latencyMs,
      requestHeaders: JSON.stringify(requestHeaders),
      requestBody: event.payload,
      responseBody,
      errorMessage,
      attemptNumber,
      nextRetryAt,
    },
  });

  return {
    success: isSuccess,
    statusCode,
    latencyMs,
    attemptId: attempt.id,
  };
}
