import { headers } from "next/headers";

const REQUEST_ID_HEADER = "x-bridge-perf-request-id";
const REQUEST_START_HEADER = "x-bridge-perf-start-epoch-ms";
const REQUEST_PATH_HEADER = "x-bridge-perf-path";

export interface PerformanceContext {
  requestId: string;
  path: string;
  startedAt: number;
  requestStartedAt: number | null;
}

export function startTimer(): number {
  return performance.now();
}

export function elapsedSince(startedAt: number): number {
  return performance.now() - startedAt;
}

export async function startPerformanceContext(
  path?: string
): Promise<PerformanceContext> {
  const startedAt = startTimer();
  const requestHeaders = await headers();
  const requestStartValue = requestHeaders.get(REQUEST_START_HEADER);
  const requestStart = requestStartValue ? Number(requestStartValue) : NaN;

  return {
    requestId: requestHeaders.get(REQUEST_ID_HEADER) ?? "untracked",
    path: path ?? requestHeaders.get(REQUEST_PATH_HEADER) ?? "unknown",
    startedAt,
    requestStartedAt: Number.isFinite(requestStart) ? requestStart : null,
  };
}

export function logPerformance(
  context: PerformanceContext,
  measurements: Array<[string, number | null]>
) {
  const pageDuration = elapsedSince(context.startedAt);
  const measurementsText = measurements
    .map(([label, duration]) =>
      duration === null ? `${label}: skipped` : `${label}: ${duration.toFixed(1)}ms`
    )
    .join(" | ");
  const proxyToPageDuration = context.requestStartedAt === null
    ? null
    : performance.timeOrigin + startTimer() - context.requestStartedAt;
  const totalText = proxyToPageDuration === null
    ? "Proxy-to-page-return: unavailable"
    : `Proxy-to-page-return (approx): ${proxyToPageDuration.toFixed(1)}ms`;

  console.info(
    `[PERF] request=${context.requestId} path=${context.path} ${measurementsText} | Page total: ${pageDuration.toFixed(1)}ms | ${totalText}`
  );
}

export const performanceRequestHeaders = {
  requestId: REQUEST_ID_HEADER,
  requestStart: REQUEST_START_HEADER,
  path: REQUEST_PATH_HEADER,
};
