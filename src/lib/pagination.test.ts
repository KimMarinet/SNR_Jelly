import assert from "node:assert/strict";
import { buildPaginationState } from "@/lib/pagination";

const zeroItems = buildPaginationState({
  currentPage: 1,
  totalItems: 0,
  itemsPerPage: 5,
  windowSize: 10,
});

assert.equal(zeroItems.totalPages, 1);
assert.deepEqual(zeroItems.pageNumbers, [1]);
assert.equal(zeroItems.canGoPrev, false);
assert.equal(zeroItems.canGoNext, false);
assert.equal(zeroItems.canGoPrevWindow, false);
assert.equal(zeroItems.canGoNextWindow, false);

const firstWindow = buildPaginationState({
  currentPage: 1,
  totalItems: 50,
  itemsPerPage: 5,
  windowSize: 10,
});

assert.equal(firstWindow.totalPages, 10);
assert.deepEqual(firstWindow.pageNumbers, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(firstWindow.canGoPrev, false);
assert.equal(firstWindow.canGoNext, true);
assert.equal(firstWindow.canGoPrevWindow, false);
assert.equal(firstWindow.canGoNextWindow, false);

const secondWindow = buildPaginationState({
  currentPage: 11,
  totalItems: 120,
  itemsPerPage: 5,
  windowSize: 10,
});

assert.equal(secondWindow.totalPages, 24);
assert.deepEqual(secondWindow.pageNumbers, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
assert.equal(secondWindow.canGoPrev, true);
assert.equal(secondWindow.canGoNext, true);
assert.equal(secondWindow.canGoPrevWindow, true);
assert.equal(secondWindow.canGoNextWindow, true);
assert.equal(secondWindow.previousWindowPage, 1);
assert.equal(secondWindow.nextWindowPage, 21);

const clampedPage = buildPaginationState({
  currentPage: 999,
  totalItems: 12,
  itemsPerPage: 5,
  windowSize: 10,
});

assert.equal(clampedPage.currentPage, 3);
assert.deepEqual(clampedPage.pageNumbers, [1, 2, 3]);
