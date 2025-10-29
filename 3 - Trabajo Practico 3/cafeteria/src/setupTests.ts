import "@testing-library/jest-dom/vitest";
import { server } from "./mocks/server";
import { expect, beforeAll, afterEach, afterAll } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
