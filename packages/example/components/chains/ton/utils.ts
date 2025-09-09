import crypto from 'crypto';
import { Address, beginCell, Cell } from '@ton/core';
import crc32 from 'crc-32';
import { toASCII } from 'punycode';
import nacl from 'tweetnacl';

type SignDataPayloadText = {
    type: "text";
    text: string;
};

type SignDataPayloadBinary = {
    type: "binary";
    bytes: string; // base64 (not url safe) encoded bytes array
};

type SignDataPayloadCell = {
    type: "cell";
    schema: string; // TL-B scheme of the cell payload
    cell: string; // base64 (not url safe) encoded cell
}

type SignDataPayload = SignDataPayloadText | SignDataPayloadBinary | SignDataPayloadCell;

/**
 * Creates hash for text or binary payload.
 * Message format:
 * message = 0xffff || "ton-connect/sign-data/" || workchain || address_hash || domain_len || domain || timestamp || payload
 */
export function createTextBinaryHash(
    payload: SignDataPayloadText | SignDataPayloadBinary,
    parsedAddr: Address,
    domain: string,
    timestamp: number
): Buffer {
    // Create workchain buffer
    const wcBuffer = Buffer.alloc(4);
    wcBuffer.writeInt32BE(parsedAddr.workChain);

    // Create domain buffer
    const domainBuffer = Buffer.from(domain, 'utf8');
    const domainLenBuffer = Buffer.alloc(4);
    domainLenBuffer.writeUInt32BE(domainBuffer.length);

    // Create timestamp buffer
    const tsBuffer = Buffer.alloc(8);
    tsBuffer.writeBigUInt64BE(BigInt(timestamp));

    // Create payload buffer
    const typePrefix = payload.type === 'text' ? 'txt' : 'bin';
    const content = payload.type === 'text' ? payload.text : payload.bytes;
    const encoding = payload.type === 'text' ? 'utf8' : 'base64';

    const payloadPrefix = Buffer.from(typePrefix);
    const payloadBuffer = Buffer.from(content, encoding);
    const payloadLenBuffer = Buffer.alloc(4);
    payloadLenBuffer.writeUInt32BE(payloadBuffer.length);

    // Build message
    const message = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from('ton-connect/sign-data/'),
        wcBuffer,
        parsedAddr.hash,
        domainLenBuffer,
        domainBuffer,
        tsBuffer,
        payloadPrefix,
        payloadLenBuffer,
        payloadBuffer,
    ]);

    // Hash message with sha256
    return crypto.createHash('sha256').update(message).digest();
}

/**
 * Creates hash for Cell payload according to TON Connect specification.
 */
export function createCellHash(
    payload: SignDataPayload & { type: 'cell' },
    parsedAddr: Address,
    domain: string,
    timestamp: number
): Buffer {
    const cell = Cell.fromBase64(payload.cell);
    const schemaHash = crc32.buf(Buffer.from(payload.schema, 'utf8')) >>> 0; // unsigned crc32 hash
    const encodedDomain = encodeDnsName(domain).toString('utf8');

    const message = beginCell()
        .storeUint(0x75569022, 32) // prefix
        .storeUint(schemaHash, 32) // schema hash
        .storeUint(timestamp, 64) // timestamp
        .storeAddress(parsedAddr) // user wallet address
        .storeStringRefTail(encodedDomain) // app domain
        .storeRef(cell) // payload cell
        .endCell();

    return Buffer.from(message.hash());
}

/**
 * Convert a human-readable domain (e.g. "ton-connect.github.io")
 * into the TON DNS internal byte representation defined in TEP-81.
 *
 * Rules (TEP-81 §“Domain names” → §“Domain internal representation”):
 *   • UTF-8 string ≤ 126 bytes; bytes 0x00–0x20 are forbidden. :contentReference[oaicite:0]{index=0}
 *   • Split by ".", reverse the order, append 0x00 after every label
 *     (“google.com” ⇒ “com\0google\0”). :contentReference[oaicite:1]{index=1}
 *   • Resulting byte array must fit into a Cell (n ≤ 127). :contentReference[oaicite:2]{index=2}
 *
 * The helper returns both:
 *   • `Buffer` — raw bytes, convenient for hashing/debugging
 *   • `Cell`   — ready for `dnsresolve` calls via @ton/core
 */

export function encodeDnsName(domain: string): Buffer {
    if (!domain) {
        throw new Error('Domain must be non-empty');
    }

    // Normalise (lower-case, strip trailing dot) – recommended for interop
    let norm = domain.toLowerCase();
    if (norm.endsWith('.')) norm = norm.slice(0, -1);

    // Special case: single dot (“.”) ⇒ self-reference ⇒ single 0x00
    if (norm === '') {
        return Buffer.from([0]);
    }

    // Split & validate labels
    const labelsAscii = norm.split('.').map((lbl) => {
        if (lbl.length === 0) {
            throw new Error('Empty label ("..") not allowed');
        }
        // IDN: convert Unicode → punycode ASCII (xn--…)
        const ascii = toASCII(lbl);
        // Disallow bytes 0x00–0x20 and label > 63 chars (classic DNS rule)
        // eslint-disable-next-line no-control-regex
        if (ascii.length > 63 || /[\x00-\x20]/.test(ascii)) {
            throw new Error(`Invalid label "${lbl}"`);
        }
        return ascii;
    });

    // Build byte array: reverse order + 0x00 after each label
    const byteChunks: number[] = [];
    for (const label of labelsAscii.reverse()) {
        const labelBuffer = Buffer.from(label, 'utf8');
        for (let i = 0; i < labelBuffer.length; i++) {
            byteChunks.push(labelBuffer[i]);
        }
        byteChunks.push(0);
    }
    const bytes = Buffer.from(byteChunks);

    if (bytes.length > 126) {
        throw new Error(
            `Encoded name is ${bytes.length} bytes; TEP-81 allows at most 126`
        );
    }

    return bytes;
}

export function verifySignData(signature: string, publicKey: string, address: string, timestamp: number, domain: string, payload: SignDataPayload) {
    const parsedAddr = Address.parse(address);
    const message = payload.type === 'cell' ? createCellHash(payload, parsedAddr, domain, timestamp) : createTextBinaryHash(payload, parsedAddr, domain, timestamp);
    return nacl.sign.detached.verify(new Uint8Array(message), Buffer.from(signature, 'base64'), new Uint8Array(Buffer.from(publicKey, 'hex')));
}