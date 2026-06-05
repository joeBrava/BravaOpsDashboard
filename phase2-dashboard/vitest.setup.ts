// jsdom-project setup: registers @testing-library/jest-dom custom matchers
// (toBeInTheDocument, toHaveTextContent, etc.) on Vitest's expect and cleans up
// the rendered DOM between tests. Only loaded by the "jsdom" project.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
