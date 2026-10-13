/** Active UI page sent to the API (?page= / X-Access-Page) for permission context. */
let accessPage = null;

export function setAccessPage(page) {
  accessPage = page ? String(page).trim().toLowerCase() : null;
}

export function getAccessPage() {
  return accessPage;
}

export function clearAccessPage() {
  accessPage = null;
}
