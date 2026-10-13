import { resolveFileDisplayName } from "@/utils/fileAttachments";

/** @typedef {'image' | 'pdf' | 'other'} FilePreviewKind */

/**
 * @param {{ url?: string, name?: string }} file
 * @returns {FilePreviewKind}
 */
export function getFilePreviewKind(file) {
  const hint = `${file?.name || ""} ${file?.url || ""}`
    .toLowerCase()
    .split("?")[0];
  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|$)/i.test(hint)) return "image";
  if (/\.pdf(\?|$)/i.test(hint)) return "pdf";
  return "other";
}

export function getFileDisplayName(file, index = 0) {
  const name = resolveFileDisplayName(file);
  return name || `File ${index + 1}`;
}

function triggerBlobDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
}

async function fetchFileBlob(file) {
  const url = file?.url;
  if (!url) throw new Error("File URL is missing.");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not download file.");
  return response.blob();
}

export async function downloadFileDirect(file, index = 0) {
  const displayName = getFileDisplayName(file, index);
  const blob = await fetchFileBlob(file);
  triggerBlobDownload(blob, displayName);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(parts, value) {
  parts.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(parts, value) {
  parts.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function uniqueFileName(name, usedNames) {
  const cleanName = name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "file";
  if (!usedNames.has(cleanName)) {
    usedNames.add(cleanName);
    return cleanName;
  }

  const dotIndex = cleanName.lastIndexOf(".");
  const base = dotIndex > 0 ? cleanName.slice(0, dotIndex) : cleanName;
  const ext = dotIndex > 0 ? cleanName.slice(dotIndex) : "";
  let suffix = 2;
  let nextName = `${base} (${suffix})${ext}`;
  while (usedNames.has(nextName)) {
    suffix += 1;
    nextName = `${base} (${suffix})${ext}`;
  }
  usedNames.add(nextName);
  return nextName;
}

function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, date } = getDosDateTime();

  entries.forEach(({ name, bytes }) => {
    const nameBytes = encoder.encode(name);
    const checksum = crc32(bytes);
    const localHeader = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0x0800);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, time);
    writeUint16(localHeader, date);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, bytes.length);
    writeUint32(localHeader, bytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);

    localParts.push(new Uint8Array(localHeader), nameBytes, bytes);

    const centralHeader = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0x0800);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, time);
    writeUint16(centralHeader, date);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, bytes.length);
    writeUint32(centralHeader, bytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);

    centralParts.push(new Uint8Array(centralHeader), nameBytes);
    offset += localHeader.length + nameBytes.length + bytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = [];
  writeUint32(endHeader, 0x06054b50);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, entries.length);
  writeUint16(endHeader, entries.length);
  writeUint32(endHeader, centralSize);
  writeUint32(endHeader, offset);
  writeUint16(endHeader, 0);

  return new Blob([...localParts, ...centralParts, new Uint8Array(endHeader)], {
    type: "application/zip",
  });
}

export async function downloadFilesZip(files, filename = "documents.zip") {
  const usedNames = new Set();
  const entries = await Promise.all(
    files.map(async (file, index) => {
      const blob = await fetchFileBlob(file);
      return {
        name: uniqueFileName(getFileDisplayName(file, index), usedNames),
        bytes: new Uint8Array(await blob.arrayBuffer()),
      };
    }),
  );

  triggerBlobDownload(createZipBlob(entries), filename);
}
