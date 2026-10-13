export const storage = {
  get(key) {
    if (typeof window === "undefined") return null;
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};
