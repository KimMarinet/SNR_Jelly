export type PaginationInput = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  windowSize: number;
};

export type PaginationState = PaginationInput & {
  totalPages: number;
  windowStart: number;
  windowEnd: number;
  pageNumbers: number[];
  canGoPrev: boolean;
  canGoNext: boolean;
  canGoPrevWindow: boolean;
  canGoNextWindow: boolean;
  previousPage: number;
  nextPage: number;
  previousWindowPage: number;
  nextWindowPage: number;
};

function toPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : fallback;
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function buildPaginationState({
  currentPage,
  totalItems,
  itemsPerPage,
  windowSize,
}: PaginationInput): PaginationState {
  const safeItemsPerPage = toPositiveInteger(itemsPerPage, 1);
  const safeWindowSize = toPositiveInteger(windowSize, 1);
  const safeTotalItems = toNonNegativeInteger(totalItems);
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safeItemsPerPage));
  const safeCurrentPage = Math.min(
    Math.max(toPositiveInteger(currentPage, 1), 1),
    totalPages,
  );

  const windowStart = Math.floor((safeCurrentPage - 1) / safeWindowSize) * safeWindowSize + 1;
  const windowEnd = Math.min(windowStart + safeWindowSize - 1, totalPages);
  const pageNumbers = Array.from(
    { length: Math.max(0, windowEnd - windowStart + 1) },
    (_, index) => windowStart + index,
  );

  return {
    currentPage: safeCurrentPage,
    totalItems: safeTotalItems,
    itemsPerPage: safeItemsPerPage,
    windowSize: safeWindowSize,
    totalPages,
    windowStart,
    windowEnd,
    pageNumbers,
    canGoPrev: safeCurrentPage > 1,
    canGoNext: safeCurrentPage < totalPages,
    canGoPrevWindow: windowStart > 1,
    canGoNextWindow: windowEnd < totalPages,
    previousPage: Math.max(1, safeCurrentPage - 1),
    nextPage: Math.min(totalPages, safeCurrentPage + 1),
    previousWindowPage: Math.max(1, safeCurrentPage - safeWindowSize),
    nextWindowPage: Math.min(totalPages, safeCurrentPage + safeWindowSize),
  };
}
