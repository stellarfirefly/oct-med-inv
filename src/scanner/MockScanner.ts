import type { Scanner } from "./Scanner";

export class MockScanner implements Scanner {
  async scan() {
    return "012345678905";
  }
}
