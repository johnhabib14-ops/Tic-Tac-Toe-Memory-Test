/** In-app debug log for session b9aa2a when ingest file is unavailable. */
const MAX = 30;
const entries: Array<{ t: number; loc: string; msg: string; data?: unknown }> = [];
let listener: (() => void) | null = null;

export function pushDebugLog(payload: {
  location?: string;
  message?: string;
  data?: unknown;
  timestamp?: number;
}) {
  entries.push({
    t: payload.timestamp ?? Date.now(),
    loc: payload.location ?? '',
    msg: payload.message ?? '',
    data: payload.data,
  });
  if (entries.length > MAX) entries.shift();
  listener?.();
}

export function getDebugLogs() {
  return [...entries];
}

export function subscribeDebugLog(fn: () => void) {
  listener = fn;
  return () => {
    listener = null;
  };
}
