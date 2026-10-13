const UUID_BLOB_PREFIX = /^[a-f0-9]{32}_/i;

function basename(value) {
  const cleaned = String(value || "")
    .split(/[?#]/)[0]
    .replace(/\\/g, "/");
  return cleaned.split("/").filter(Boolean).pop() || "";
}

/** Original upload filename for UI/download — not the unique blob path. */
export function resolveFileDisplayName(file = {}) {
  for (const candidate of [
    file.name,
    file.file_name,
    file.blob_name,
    file.url,
    file.file_url,
  ]) {
    const plain = basename(String(candidate || "").trim());
    if (!plain) continue;
    if (UUID_BLOB_PREFIX.test(plain)) {
      const stripped = plain.replace(UUID_BLOB_PREFIX, "");
      if (stripped) return stripped;
      continue;
    }
    return plain;
  }
  return "";
}

function normalizeFile(file) {
  return {
    url: file.url || file.file_url,
    name: resolveFileDisplayName(file),
    blob_name: file.blob_name || "",
  };
}

/**
 * Parse file attachment arrays from API (files[]) or legacy file_url JSON / plain URL.
 */
export function parseStoredFiles(row) {
  if (!row) return [];

  if (Array.isArray(row.files) && row.files.length) {
    return row.files.map(normalizeFile).filter((f) => f.url);
  }

  const raw = row.file_url;
  if (!raw) return [];

  let parallelNames = [];
  if (row.file_name) {
    const fn = String(row.file_name).trim();
    if (fn.startsWith("[")) {
      try {
        const parsed = JSON.parse(fn);
        if (Array.isArray(parsed)) parallelNames = parsed.map(String);
      } catch {
        parallelNames = [];
      }
    } else if (fn) {
      parallelNames = [fn];
    }
  }

  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data
          .map((item, index) => {
            const fallbackName = parallelNames[index] || "";
            if (typeof item === "string") {
              return normalizeFile({ url: item, name: fallbackName, blob_name: "" });
            }
            return normalizeFile({
              url: item.url || item.file_url,
              name: item.name || item.file_name || fallbackName,
              blob_name: item.blob_name || "",
            });
          })
          .filter((f) => f.url);
      }
    } catch {
      /* fall through */
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    return [
      normalizeFile({
        url: raw.trim(),
        name: parallelNames[0] || row.file_name || "",
        blob_name: "",
      }),
    ];
  }

  return [];
}
