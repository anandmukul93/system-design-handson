// Small helpers: text <-> bytes, and base64url (the URL-safe base64 used by JWTs and OAuth).
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const toBytes = (text) => encoder.encode(text);
export const toText = (bytes) => decoder.decode(bytes);

export function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function fromBase64url(text) {
  return Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}
