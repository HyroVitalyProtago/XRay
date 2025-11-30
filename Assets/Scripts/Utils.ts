import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";

/**
 * only continue after conditionFunction returns true
 */
export function until(conditionFunction, retryEveryMs = 400) {
  const poll = resolve => {
    if(conditionFunction()) {
      resolve();
    } else {
      setTimeout(() => poll(resolve), retryEveryMs);
    }
  }
  return new Promise(poll);
}

export const textureUtil = {
    async toString(texture: Texture, { quality, encoding } = { quality: CompressionQuality.HighQuality, encoding: EncodingType.Jpg }) {
        return new Promise((resolve: (a: string) => void, reject) => {
            Base64.encodeTextureAsync(texture, resolve, reject, quality, encoding)
        })
    },
    async fromString(encodedString: string) {
        return new Promise(function (resolve: (a: Texture) => void, reject) {
            Base64.decodeTextureAsync(encodedString, resolve, reject)
        })
    }
}

export const vec3Util = {
    toObject(v: vec3) {
        return { x: v.x, y: v.y, z: v.z }
    },
    fromObject(obj) {
        return new vec3(
            Number(obj.x),
            Number(obj.y),
            Number(obj.z)
        )
    }
}

export const quatUtil = {
    toObject(q: quat) {
        return { x: q.x, y: q.y, z: q.z, w: q.w }
    },
    fromObject(obj) {
        return new quat(
            Number(obj.w),
            Number(obj.x),
            Number(obj.y),
            Number(obj.z)
        )
    }
}

// https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
// AES for performance around data: https://www.cbtnuggets.com/blog/technology/security/symmetric-encryption-vs-asymmetric-encryption
// WARNING: OLD LIBRARY NOT MAINTAINED ANYMORE !!!
// SHOULD SWITCH ASAP TO Snap crypto instead when available
// https://www.npmjs.com/package/aes-js
// infos: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-ctr
const aesjs = require('node_modules/aes-js/index')

/**
 * Example of usage:
 * 
 * const key = cryptoUtil.generateKey()
 * const counter = 5
 * 
 * const text = 'Text may be any length you wish, no padding is required.';
 * const bytes = cryptoUtil.stringToBytes(text)
 * const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)
 * 
 * // do something with encrypted data like sending it to database
 * // when you receive again encryptedBytes, you can decrypt it
 * 
 * const decryptedBytes = cryptoUtil.decrypt(encryptedBytes, key, counter)
 * const decryptedText = cryptoUtil.bytesToString(decryptedBytes)
 * 
 */
export const cryptoUtil = {
    /** use Base64 decoding */
    stringToBytes: Base64.decode,

    /** use Base64 encoding */
    bytesToString: Base64.encode,

    /**
     * 
     * @param encryptedBytes data to encrypt
     * @param key use a different key for each encryption (same for encoding/decoding)
     * @param counter use a random counter (same for encoding/decoding)
     * @returns the decrypted data using AES CTR algorithm
     */
    decrypt(encryptedBytes: Uint8Array, key : Uint8Array, counter) {
        const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
        return aesCtr.decrypt(encryptedBytes);
    },

    decryptTask(bytes: Uint8Array, key : Uint8Array, counter) : Uint8Array {
        const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
        return aesCtr.decryptTask(bytes);
    },

    /**
     * 
     * @param bytes data to decrypt
     * @param key use a different key for each encryption (same for encoding/decoding)
     * @param counter use a random counter (same for encoding/decoding)
     * @returns the encrypted data using AES CTR algorithm
     */
    encrypt(bytes: Uint8Array, key : Uint8Array, counter) : Uint8Array {
        const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
        return aesCtr.encrypt(bytes);
    },

    encryptTask(bytes: Uint8Array, key : Uint8Array, counter) : Uint8Array {
        const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
        return aesCtr.encryptTask(bytes);
    },

    /**
     * Create a 256 bits keys using crypto.getRandomValues
     * @returns 32 bytes key
     */
    generateKey(): Uint8Array {
        const codeVerifierArray = new Uint8Array(32); // Secure random array
        crypto.getRandomValues(codeVerifierArray);
        return codeVerifierArray
    },

    getRandomCounter() {
        const arr = new Uint8Array(1); // Secure random array
        crypto.getRandomValues(arr);
        return arr[0]
    }
}

// // https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
// // AES for performance around data: https://www.cbtnuggets.com/blog/technology/security/symmetric-encryption-vs-asymmetric-encryption
// // WARNING: OLD LIBRARY NOT MAINTAINED ANYMORE !!!
// // SHOULD SWITCH ASAP TO Snap crypto instead when available
// // https://www.npmjs.com/package/aes-js
// // infos: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-ctr
// const aesjs = require('node_modules/aes-js/index')


// const txt = 'Text may be any length'
// print(Utf8.decode(Utf8.encode(txt)))
// print(Base64.encode(Base64.decode(txt)))

// // An example 128-bit key (16 bytes * 8 bits/byte = 128 bits)
// const codeVerifierArray = new Uint8Array(32); // Secure random array
// crypto.getRandomValues(codeVerifierArray); // Use a different key for each encryption
// var key = codeVerifierArray//[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];

// // Convert text to bytes
// var text = 'Text may be any length you wish, no padding is required.';
// // const bytes = Base64.encode(text)
// var textBytes = cryptoUtil.stringToBytes(text)//aesjs.utils.utf8.toBytes(text);

// // The counter is optional, and if omitted will begin at 1
// var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
// var encryptedBytes = aesCtr.encrypt(textBytes);

// // To print or store the binary data, you may convert it to hex
// var encryptedHex = cryptoUtil.bytesToString(encryptedBytes)//aesjs.utils.hex.fromBytes(encryptedBytes);
// print(encryptedHex);
// // "a338eda3874ed884b6199150d36f49988c90f5c47fe7792b0cf8c7f77eeffd87
// //  ea145b73e82aefcf2076f881c88879e4e25b1d7b24ba2788"

// // When ready to decrypt the hex string, convert it back to bytes
// var encryptedBytes2 = cryptoUtil.stringToBytes(encryptedHex)//aesjs.utils.hex.toBytes(encryptedHex);

// // The counter mode of operation maintains internal state, so to
// // decrypt a new instance must be instantiated.
// var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
// var decryptedBytes = aesCtr.decrypt(encryptedBytes2);

// // Convert our bytes back into text
// var decryptedText = cryptoUtil.bytesToString(decryptedBytes)//aesjs.utils.utf8.fromBytes(decryptedBytes);
// print(decryptedText);
// // "Text may be any length you wish, no padding is required."