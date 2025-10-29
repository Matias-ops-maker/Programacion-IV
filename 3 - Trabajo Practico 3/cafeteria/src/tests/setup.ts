/// &lt;reference types="vitest" />
/// &lt;reference types="@testing-library/jest-dom" />

import { expect } from "vitest";
import matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

declare module "vitest" {
  interface Assertion<T> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string): T;
  }
}
