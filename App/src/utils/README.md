# MLS Utilities (`mlsUtils.ts`)

This directory contains utility functions for converting data between **raw binary bytes** (`Uint8Array`) and **Base64 strings**.

---

## 1. Core Concepts for Beginners

### What is a Byte?
* At the lowest hardware level, computers store all information as bits (`0` or `1`).
* **1 Byte = 8 bits**.
* A single byte can represent any integer value from **`0` to `255`** ($2^8 = 256$ possible values).
* In JavaScript/TypeScript, a sequence of bytes is represented by a **`Uint8Array`** (Unsigned 8-bit Integer Array).
* Cryptographic libraries (such as OpenMLS / Rust WASM) produce and consume raw bytes for cryptographic keys, ciphertexts, and certificates because encryption operates directly on raw mathematical byte values.

### Why Can't We Just Send Bytes as Normal Text?
* Normal text protocols (like JSON, WebSockets text frames, HTTP headers, URLs) expect printable characters (ASCII / UTF-8 text).
* Encrypted cryptographic data contains arbitrary, non-printable, and control bytes (like null bytes `0x00`, line feeds, escape characters).
* If you try to directly convert raw random cryptographic bytes into standard strings, characters get corrupted or truncated.

### What is Base64?
* **Base64** is a binary-to-text encoding scheme.
* It takes arbitrary binary bytes and translates them into a safe set of **64 printable ASCII characters**:
  - `A`–`Z` (26 characters)
  - `a`–`z` (26 characters)
  - `0`–`9` (10 characters)
  - `+` and `/` (2 characters)
  - `=` (used for padding)
* **Rule of Thumb:**
  - **OpenMLS (Rust WASM engine):** Works with raw binary **`Uint8Array`** bytes.
  - **Socket.io / HTTP API / JSON payloads:** Transmit safe text **Base64 strings**.

---

## 2. File Overview (`mlsUtils.ts`)

```typescript
export function bytesToBase64(bytes: Uint8Array): string;
export function base64ToBytes(b64: string): Uint8Array;
```

---

## 3. Detailed Line-by-Line Breakdown

### Function 1: `bytesToBase64`

Converts a `Uint8Array` (binary bytes) into a safe Base64 `string`.

```typescript
1: export function bytesToBase64(bytes: Uint8Array): string {
2:   let binary = '';
3:   const len = bytes.byteLength;
4:   for (let i = 0; i < len; i++) {
5:     binary += String.fromCharCode(bytes[i]);
6:   }
7:   return btoa(binary);
8: }
```

* **Line 1:** Declares and exports the function `bytesToBase64`, taking a `bytes: Uint8Array` parameter and returning a `string`.
* **Line 2:** Initializes an empty binary string accumulator `binary = ''`.
* **Line 3:** Gets the total count of bytes in the array via `bytes.byteLength` and stores it in `len` to avoid looking up the property on every iteration.
* **Line 4:** A standard `for` loop that iterates through each byte from index `0` to `len - 1`.
* **Line 5:** `String.fromCharCode(bytes[i])` takes the numerical value of the byte (0–255) and turns it into a 1-byte character code, appending it to the `binary` string.
* **Line 7:** Calls the built-in browser function `btoa(...)` (*Binary to ASCII*). `btoa` encodes the 8-bit binary string into standard Base64 representation and returns it.

---

### Function 2: `base64ToBytes`

Converts a Base64 `string` back into a `Uint8Array` (binary bytes).

```typescript
1: export function base64ToBytes(b64: string): Uint8Array {
2:   const binaryString = atob(b64);
3:   const len = binaryString.length;
4:   const bytes = new Uint8Array(len);
5:   for (let i = 0; i < len; i++) {
6:     bytes[i] = binaryString.charCodeAt(i);
7:   }
8:   return bytes;
9: }
```

* **Line 1:** Declares and exports `base64ToBytes`, taking a Base64 string `b64: string` and returning a `Uint8Array`.
* **Line 2:** Calls the built-in browser function `atob(...)` (*ASCII to Binary*). `atob` decodes the Base64 string back into a raw 8-bit binary character string.
* **Line 3:** Gets the length of the decoded binary string `len = binaryString.length`.
* **Line 4:** Allocates a new fixed-length typed array `Uint8Array` of size `len` in memory to hold the output bytes.
* **Line 5:** Iterates through each character in `binaryString`.
* **Line 6:** `binaryString.charCodeAt(i)` extracts the numerical character code (the original 0–255 byte value) and assigns it directly to position `bytes[i]`.
* **Line 8:** Returns the completed `Uint8Array` ready to be passed into OpenMLS WASM functions.

---

## 4. Usage Flow Summary

```text
[OpenMLS WASM] ── (Uint8Array) ──> bytesToBase64() ──> (Base64 String) ──> [Socket.IO / Server]
                                                                                   │
                                                                                   ▼
[OpenMLS WASM] <── (Uint8Array) <── base64ToBytes() <── (Base64 String) <── [Socket.IO / Client]
```
