// PKCE (proof key for code exchange): protects the OAuth authorization code when the client cannot keep a
// secret (mobile and single-page apps). The app proves it is the one that started the flow.
import { toBytes, base64url } from "./encoding.js";

// app side: a random secret, and its SHA-256 hash to send with the authorize request
export async function createVerifierAndChallenge() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  return { verifier, challenge: await challengeFor(verifier) };
}
export async function challengeFor(verifier) {
  return base64url(await crypto.subtle.digest("SHA-256", toBytes(verifier)));
}
// server side, at the token endpoint: does the verifier hash to the challenge stored with the code?
export async function verifierMatches(verifier, storedChallenge) {
  return (await challengeFor(verifier)) === storedChallenge;
}
