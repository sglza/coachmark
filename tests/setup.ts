import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

class ResizeObserverMock implements ResizeObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback) =>
    window.setTimeout(() => callback(performance.now()), 0);
  globalThis.cancelAnimationFrame = (id) => window.clearTimeout(id);
}
