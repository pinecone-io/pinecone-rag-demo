import { urls } from "../urls";

describe("sidebar urls seed data", () => {
  it("is a non-empty list", () => {
    expect(urls.length).toBeGreaterThan(0);
  });

  it("gives every entry a title and a valid http(s) url", () => {
    for (const entry of urls) {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(() => new URL(entry.url)).not.toThrow();
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it("starts every entry unseeded and not loading", () => {
    for (const entry of urls) {
      expect(entry.seeded).toBe(false);
      expect(entry.loading).toBe(false);
    }
  });

  it("has no duplicate urls", () => {
    const seen = urls.map((u) => u.url);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
