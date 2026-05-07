export const INACTIVITY_TIMEOUT_STORAGE_KEY = "password-vault-timeout-minutes";
export const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 15;
export const INACTIVITY_TIMEOUT_OPTIONS = [5, 10, 15];

export function getStoredInactivityTimeout() {
  // Reads the saved timeout from this browser.
  const storedValue = localStorage.getItem(INACTIVITY_TIMEOUT_STORAGE_KEY);
  const timeout = Number(storedValue);

  // Falls back to the default if storage is empty or has an unexpected value.
  if (INACTIVITY_TIMEOUT_OPTIONS.includes(timeout)) {
    return timeout;
  }

  return DEFAULT_INACTIVITY_TIMEOUT_MINUTES;
}

export function saveInactivityTimeout(timeout: number) {
  // Saves the selected timeout for future protected-page visits.
  localStorage.setItem(INACTIVITY_TIMEOUT_STORAGE_KEY, String(timeout));
}
