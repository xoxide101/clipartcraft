/* Craft crypto (window.CraftCrypto): PBKDF2-HMAC-SHA256 and AES-256-GCM in plain JavaScript, for pages where the browser
   has no crypto.subtle (plain http on a network address). The same results as the browser's own (tested against it), so
   keys locked on an http page open on an https page and back.
     pbkdf2(passwordBytes, salt, rounds) → Uint8Array(32)
     seal(key32, iv12, plain) → Uint8Array (ciphertext + 16-byte tag, as crypto.subtle gives)
     open(key32, iv12, sealed) → Uint8Array, or throws when the key is wrong or the data was changed */
(function (root) {
  'use strict';
  // ------------------------------------------------------------------ SHA-256
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const IV0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Uint32Array(64);
  function compress(H, w16) {   // H: Uint32Array(8) changed in place; w16: 16 words
    for (let i = 0; i < 16; i++) W[i] = w16[i];
    for (let i = 16; i < 64; i++) { const a = W[i - 15], b = W[i - 2]; W[i] = (W[i - 16] + ((a >>> 7 | a << 25) ^ (a >>> 18 | a << 14) ^ (a >>> 3)) + W[i - 7] + ((b >>> 17 | b << 15) ^ (b >>> 19 | b << 13) ^ (b >>> 10))) | 0; }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const t2 = (((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const words = (u8, off = 0) => { const w = new Uint32Array(16); for (let i = 0; i < 16; i++) { const j = off + i * 4; w[i] = (u8[j] << 24) | (u8[j + 1] << 16) | (u8[j + 2] << 8) | u8[j + 3]; } return w; };
  function sha256(msg, H0 = IV0, already = 0) {   // already: bytes hashed into H0 before (for HMAC's ipad/opad states)
    const H = Uint32Array.from(H0), n = msg.length, total = already + n, padLen = ((n + 9 + 63) >> 6) << 6, p = new Uint8Array(padLen);
    p.set(msg); p[n] = 0x80; const bits = total * 8; p[padLen - 4] = bits >>> 24; p[padLen - 3] = bits >>> 16; p[padLen - 2] = bits >>> 8; p[padLen - 1] = bits; p[padLen - 5] = Math.floor(bits / 2 ** 32);
    for (let o = 0; o < padLen; o += 64) compress(H, words(p, o));
    return H;
  }
  const bytes = (H) => { const o = new Uint8Array(32); for (let i = 0; i < 8; i++) { o[i * 4] = H[i] >>> 24; o[i * 4 + 1] = H[i] >>> 16; o[i * 4 + 2] = H[i] >>> 8; o[i * 4 + 3] = H[i]; } return o; };

  function pbkdf2(pw, salt, rounds) {
    let key = pw; if (key.length > 64) key = bytes(sha256(key));
    const pad = (x) => { const b = new Uint8Array(64); b.set(key); for (let i = 0; i < 64; i++) b[i] ^= x; return b; };
    const inner = Uint32Array.from(IV0), outer = Uint32Array.from(IV0); compress(inner, words(pad(0x36))); compress(outer, words(pad(0x5c)));
    // a 32-byte message after the 64-byte pad: one block, its padding fixed (length 96 bytes = 768 bits)
    const blk = new Uint32Array(16); blk[8] = 0x80000000; blk[15] = 768;
    const hmac32 = (u) => { const a = Uint32Array.from(inner); blk.set(u, 0); compress(a, blk); const b = Uint32Array.from(outer); blk.set(a, 0); compress(b, blk); return b; };
    const first = new Uint8Array(salt.length + 4); first.set(salt); first[salt.length + 3] = 1;
    let u = sha256(bytes(sha256(first, inner, 64)), outer, 64); const t = Uint32Array.from(u);
    for (let i = 1; i < rounds; i++) { u = hmac32(u); for (let j = 0; j < 8; j++) t[j] ^= u[j]; }
    return bytes(t);
  }

  // ------------------------------------------------------------------ AES-256 (encryption only: GCM needs no more)
  const SB = new Uint8Array(256), MUL2 = (x) => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;
  (function () { let p = 1, q = 1; do { p = p ^ MUL2(p); q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09; const x = q ^ ((q << 1 | q >> 7) & 0xff) ^ ((q << 2 | q >> 6) & 0xff) ^ ((q << 3 | q >> 5) & 0xff) ^ ((q << 4 | q >> 4) & 0xff); SB[p] = (x ^ 0x63) & 0xff; } while (p !== 1); SB[0] = 0x63; })();
  function expand(key) {   // 32-byte key → 240 bytes of round keys
    const w = new Uint8Array(240); w.set(key); let rcon = 1;
    for (let i = 32; i < 240; i += 4) {
      let a = w[i - 4], b = w[i - 3], c = w[i - 2], d = w[i - 1];
      if (i % 32 === 0) { const t = a; a = SB[b] ^ rcon; b = SB[c]; c = SB[d]; d = SB[t]; rcon = MUL2(rcon); }
      else if (i % 32 === 16) { a = SB[a]; b = SB[b]; c = SB[c]; d = SB[d]; }
      w[i] = w[i - 32] ^ a; w[i + 1] = w[i - 31] ^ b; w[i + 2] = w[i - 30] ^ c; w[i + 3] = w[i - 29] ^ d;
    }
    return w;
  }
  function encBlock(rk, inp) {
    const s = new Uint8Array(16); for (let i = 0; i < 16; i++) s[i] = inp[i] ^ rk[i];
    const t = new Uint8Array(16);
    for (let r = 1; r <= 14; r++) {
      for (let i = 0; i < 16; i++) t[i] = SB[s[(i + 4 * (i % 4)) % 16]];   // SubBytes + ShiftRows (column-major)
      if (r < 14) for (let c = 0; c < 4; c++) { const a0 = t[c * 4], a1 = t[c * 4 + 1], a2 = t[c * 4 + 2], a3 = t[c * 4 + 3], x = a0 ^ a1 ^ a2 ^ a3; s[c * 4] = a0 ^ x ^ MUL2(a0 ^ a1); s[c * 4 + 1] = a1 ^ x ^ MUL2(a1 ^ a2); s[c * 4 + 2] = a2 ^ x ^ MUL2(a2 ^ a3); s[c * 4 + 3] = a3 ^ x ^ MUL2(a3 ^ a0); }
      else s.set(t);
      for (let i = 0; i < 16; i++) s[i] ^= rk[r * 16 + i];
    }
    return s;
  }

  // ------------------------------------------------------------------ GCM
  function gmul(X, Y) {   // GF(2^128), bit order as in the GCM paper; 16-byte arrays
    const Z = new Uint8Array(16), V = Uint8Array.from(Y);
    for (let i = 0; i < 128; i++) {
      if (X[i >> 3] & (0x80 >> (i & 7))) for (let j = 0; j < 16; j++) Z[j] ^= V[j];
      const lsb = V[15] & 1; for (let j = 15; j > 0; j--) V[j] = (V[j] >>> 1) | ((V[j - 1] & 1) << 7); V[0] >>>= 1; if (lsb) V[0] ^= 0xe1;
    }
    return Z;
  }
  function ghash(H, data) {
    let Y = new Uint8Array(16); const n = data.length, len = new Uint8Array(16), bits = n * 8;
    for (let o = 0; o < n; o += 16) { for (let j = 0; j < 16 && o + j < n; j++) Y[j] ^= data[o + j]; Y = gmul(Y, H); }
    len[11] = Math.floor(bits / 2 ** 32); len[12] = bits >>> 24; len[13] = bits >>> 16; len[14] = bits >>> 8; len[15] = bits;   // (no extra data: its length is 0)
    for (let j = 0; j < 16; j++) Y[j] ^= len[j]; return gmul(Y, H);
  }
  function ctr(rk, iv, data) {
    const out = new Uint8Array(data.length), cb = new Uint8Array(16); cb.set(iv); let n = 1;
    for (let o = 0; o < data.length; o += 16) { n++; cb[12] = n >>> 24; cb[13] = n >>> 16; cb[14] = n >>> 8; cb[15] = n; const ks = encBlock(rk, cb); for (let j = 0; j < 16 && o + j < data.length; j++) out[o + j] = data[o + j] ^ ks[j]; }
    return out;
  }
  function tagOf(rk, iv, ct) { const H = encBlock(rk, new Uint8Array(16)), j0 = new Uint8Array(16); j0.set(iv); j0[15] = 1; const S = ghash(H, ct), E = encBlock(rk, j0); for (let j = 0; j < 16; j++) S[j] ^= E[j]; return S; }
  function seal(key, iv, plain) { const rk = expand(key), ct = ctr(rk, iv, plain), out = new Uint8Array(ct.length + 16); out.set(ct); out.set(tagOf(rk, iv, ct), ct.length); return out; }
  function open(key, iv, sealed) {
    if (sealed.length < 16) throw new Error('The operation failed for an operation-specific reason');
    const rk = expand(key), ct = sealed.subarray(0, sealed.length - 16), tag = sealed.subarray(sealed.length - 16), want = tagOf(rk, iv, ct);
    let d = 0; for (let j = 0; j < 16; j++) d |= tag[j] ^ want[j]; if (d) throw new Error('The operation failed for an operation-specific reason');
    return ctr(rk, iv, ct);
  }
  root.CraftCrypto = { pbkdf2, seal, open, sha256: (m) => bytes(sha256(m)) };
})(typeof window !== 'undefined' ? window : globalThis);
