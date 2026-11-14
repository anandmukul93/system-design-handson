// Envelope encryption: encrypt the data with a fresh data key (DEK), then encrypt ("wrap") the DEK with a
// key-encryption key (KEK) that never leaves the KMS. Store the wrapped DEK next to the ciphertext.
import { toBytes, toText } from "./encoding.js";

const AES = "AES-GCM";
const newIv = () => crypto.getRandomValues(new Uint8Array(12));

// stands in for a cloud KMS: it holds the KEK and only offers wrap and unwrap
export class Kms {
  async kek() {
    this.key ??= await crypto.subtle.generateKey({ name: AES, length: 256 }, false, ["wrapKey", "unwrapKey"]);
    return this.key;
  }
  async wrap(dataKey) {
    const iv = newIv();
    return { iv, wrapped: await crypto.subtle.wrapKey("raw", dataKey, await this.kek(), { name: AES, iv }) };
  }
  async unwrap({ iv, wrapped }) {
    return crypto.subtle.unwrapKey("raw", wrapped, await this.kek(), { name: AES, iv }, AES, false, [
      "decrypt",
    ]);
  }
}

// returns the envelope to store: { ciphertext, iv, wrappedKey }
export async function encrypt(kms, plaintext) {
  const dataKey = await crypto.subtle.generateKey({ name: AES, length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = newIv();
  const ciphertext = await crypto.subtle.encrypt({ name: AES, iv }, dataKey, toBytes(plaintext));
  return { ciphertext, iv, wrappedKey: await kms.wrap(dataKey) };
}

export async function decrypt(kms, envelope) {
  const dataKey = await kms.unwrap(envelope.wrappedKey);
  return toText(await crypto.subtle.decrypt({ name: AES, iv: envelope.iv }, dataKey, envelope.ciphertext));
}
