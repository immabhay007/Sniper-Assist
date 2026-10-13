/** File uploads use hardcoded Azure containers on the server:
 *  - accountants-fund-deposit
 *  - accountants-expense-ledger
 */

/** Blob paths inside the logo container (see VITE_AZURE_STORAGE_CONTAINER). */
export const AZURE_LOGO_ASSETS = {
  logo: "sniper_logo_transparent.png",
  favicon: "fav_icon_sniper.png",
};

const trimSlash = (s) => s.replace(/\/+$/, "");

export function getAzureStorageBaseUrl() {
  return trimSlash(
    import.meta.env.VITE_AZURE_STORAGE_BASE_URL
      || "https://sniperpublicstorage.blob.core.windows.net",
  );
}

export function getAzureStorageContainer() {
  return import.meta.env.VITE_AZURE_STORAGE_CONTAINER || "sniperlogo";
}

/** Build a public blob URL: {base}/{container}/{path} */
export function getAzureBlobUrl(blobPath) {
  const path = String(blobPath || "").replace(/^\/+/, "");
  return `${getAzureStorageBaseUrl()}/${getAzureStorageContainer()}/${path}`;
}

export function getSniperLogoUrl() {
  return getAzureBlobUrl(AZURE_LOGO_ASSETS.logo);
}

export function getSniperFaviconUrl() {
  return getAzureBlobUrl(AZURE_LOGO_ASSETS.favicon);
}
