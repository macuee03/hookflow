import crypto from "crypto";

/**
 * 1. Menghasilkan Kunci Rahasia Endpoint Unik (whsec_...)
 */
export function generateEndpointSecret(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `whsec_${randomBytes}`;
}

/**
 * 2. Menandatangani Payload Webhook menggunakan HMAC-SHA256
 * Format standar industri (seperti Stripe):
 * Header: X-Hook-Signature: t=17198293,v1=a3b9f...
 */
export function signWebhookPayload(payload: string, secretKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payload}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signaturePayload)
    .digest("hex");

  return {
    timestamp,
    headerValue: `t=${timestamp},v1=${signature}`,
  };
}
