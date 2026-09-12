import { ref, computed } from "vue";

export type NetworkStatus =
  | "ONLINE"
  | "OFFLINE"
  | "SERVER_ERROR"
  | "SLOW_NETWORK";

export interface NetworkState {
  status: NetworkStatus;
  isOnline: boolean;
  isBackendReachable: boolean;
  isUsingCachedData: boolean;
  lastSuccessfulSyncAt: number | null;
  showRecoveredToast: boolean;
}

export const networkStatus = ref<NetworkStatus>("ONLINE");
export const isUsingCachedData = ref(false);
export const lastSuccessfulSyncAt = ref<number | null>(null);
export const showRecoveredToast = ref(false);

export type NetworkStateOverride =
  | "ONLINE"
  | "OFFLINE"
  | "SERVER_ERROR"
  | "SLOW_NETWORK"
  | "RECOVERED";

declare global {
  interface Window {
    __setNetworkState?: (state: NetworkStateOverride) => void;
  }
}

function resetNetworkState(): void {
  networkStatus.value = "ONLINE";
  isUsingCachedData.value = false;
  lastSuccessfulSyncAt.value = Date.now();
  showRecoveredToast.value = false;
}

function applyNetworkStateOverride(state: NetworkStateOverride): void {
  switch (state) {
    case "OFFLINE":
      networkStatus.value = "OFFLINE";
      isUsingCachedData.value = true;
      showRecoveredToast.value = false;
      break;
    case "SERVER_ERROR":
      networkStatus.value = "SERVER_ERROR";
      isUsingCachedData.value = true;
      showRecoveredToast.value = false;
      break;
    case "SLOW_NETWORK":
      networkStatus.value = "SLOW_NETWORK";
      isUsingCachedData.value = true;
      showRecoveredToast.value = false;
      break;
    case "RECOVERED":
      showRecoveredToast.value = true;
      setTimeout(() => {
        showRecoveredToast.value = false;
      }, 3000);
      break;
    case "ONLINE":
      resetNetworkState();
      break;
    default:
      break;
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__setNetworkState = (state: NetworkStateOverride) => {
    applyNetworkStateOverride(state);
  };
}

export const networkState = computed<NetworkState>(() => {
  return {
    status: networkStatus.value,
    isOnline: navigator.onLine,
    isBackendReachable: networkStatus.value === "ONLINE",
    isUsingCachedData: isUsingCachedData.value,
    lastSuccessfulSyncAt: lastSuccessfulSyncAt.value,
    showRecoveredToast: showRecoveredToast.value,
  };
});

export function setOnline(): void {
  const wasOffline = ["OFFLINE", "SERVER_ERROR", "SLOW_NETWORK"].includes(
    networkStatus.value,
  );
  networkStatus.value = "ONLINE";
  isUsingCachedData.value = false;
  lastSuccessfulSyncAt.value = Date.now();

  if (wasOffline) {
    triggerRecoveredToast();
  }
}

export function setOffline(): void {
  networkStatus.value = "OFFLINE";
  isUsingCachedData.value = true;
}

export function setServerError(): void {
  networkStatus.value = "SERVER_ERROR";
  isUsingCachedData.value = true;
}

export function setSlowNetwork(): void {
  networkStatus.value = "SLOW_NETWORK";
  isUsingCachedData.value = true;
}

export function setUsingCachedData(value: boolean): void {
  isUsingCachedData.value = value;
}

export function triggerRecoveredToast(): void {
  showRecoveredToast.value = true;
  setTimeout(() => {
    showRecoveredToast.value = false;
  }, 3000);
}

export function setupNetworkListeners(): void {
  window.addEventListener("online", () => {
    if (navigator.onLine) {
      setOnline();
    }
  });

  window.addEventListener("offline", () => {
    setOffline();
  });

  // TAMBAHAN: Deteksi otomatis kualitas jaringan browser
  const conn = (
    navigator as unknown as {
      connection?: { effectiveType?: string; addEventListener?: Function };
    }
  ).connection;
  if (conn) {
    const updateConnectionStatus = () => {
      if (
        conn.effectiveType === "slow-2g" ||
        conn.effectiveType === "2g" ||
        conn.effectiveType === "3g"
      ) {
        setSlowNetwork();
      }
    };

    // Cek status saat pertama kali load
    updateConnectionStatus();

    // Dengarkan perubahan jaringan secara real-time
    conn.addEventListener?.("change", updateConnectionStatus);
  }
}

export function handleApiError(error: unknown): void {
  if (!navigator.onLine) {
    setOffline();
    return;
  }

  const errorWithResponse = error as {
    response?: unknown;
    status?: unknown;
    name?: unknown;
    message?: unknown;
  } | null;

  const responseStatus =
    error instanceof Response
      ? error.status
      : typeof errorWithResponse === "object" && errorWithResponse !== null
        ? typeof errorWithResponse.status === "number"
          ? errorWithResponse.status
          : typeof errorWithResponse.response === "object" &&
              errorWithResponse.response !== null &&
              "status" in errorWithResponse.response &&
              typeof errorWithResponse.response.status === "number"
            ? errorWithResponse.response.status
            : undefined
        : undefined;

  // 1. Jika dapat response HTTP status 5xx dari backend -> Server Error
  if ([500, 502, 503, 504].includes(responseStatus ?? 0)) {
    setServerError();
    return;
  }

  const errorName =
    typeof errorWithResponse?.name === "string" ? errorWithResponse.name : "";
  const errorMessage =
    typeof errorWithResponse?.message === "string"
      ? errorWithResponse.message
      : "";

  // 2. Jika Timeout, Abort, atau "Failed to fetch" karena jaringan lambat -> Slow Network
  if (
    errorName === "TimeoutError" ||
    errorName === "AbortError" ||
    /failed to fetch/i.test(errorMessage)
  ) {
    setSlowNetwork();
    return;
  }

  // 3. Jika backend lokal mati total (Connection Refused) -> Server Error
  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/i.test(errorMessage)) {
    setServerError();
    return;
  }

  setServerError();
}
