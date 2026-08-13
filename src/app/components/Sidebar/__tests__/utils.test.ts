import { clearIndex, crawlDocument } from "../utils";
import type { IUrlEntry } from "../UrlButton";

const entry = (url: string): IUrlEntry =>
  ({ url, title: url, seeded: false, loading: false }) as IUrlEntry;

const applyUpdater = <T>(updater: unknown, prev: T): T =>
  typeof updater === "function" ? (updater as (p: T) => T)(prev) : (updater as T);

const realFetch = global.fetch;
afterEach(() => {
  global.fetch = realFetch;
});

describe("crawlDocument", () => {
  it("posts the url and splitting options to /api/crawl", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await crawlDocument("https://x.test/", jest.fn(), jest.fn(), "recursive", 300, 20);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/crawl",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      url: "https://x.test/",
      options: { splittingMethod: "recursive", chunkSize: 300, overlap: 20 },
    });
  });

  it("marks the crawled entry loading, then seeded and done", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [{ id: 1 }] }),
    }) as unknown as typeof fetch;

    const setEntries = jest.fn();
    const setCards = jest.fn();
    const seed = [entry("https://x.test/"), entry("https://other.test/")];

    await crawlDocument("https://x.test/", setEntries, setCards, "recursive", 1, 1);

    const afterStart = applyUpdater(setEntries.mock.calls[0][0], seed);
    expect(afterStart[0].loading).toBe(true);
    expect(afterStart[1].loading).toBe(false);

    expect(setCards).toHaveBeenCalledWith([{ id: 1 }]);

    const afterFinish = applyUpdater(setEntries.mock.calls[1][0], seed);
    expect(afterFinish[0]).toMatchObject({ seeded: true, loading: false });
    expect(afterFinish[1].seeded).toBe(false);
  });
});

describe("clearIndex", () => {
  it("resets entries and cards and returns true on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
    const setEntries = jest.fn();
    const setCards = jest.fn();

    const result = await clearIndex(setEntries, setCards);

    expect(result).toBe(true);
    expect(setCards).toHaveBeenCalledWith([]);

    const reset = applyUpdater(setEntries.mock.calls[0][0], [
      { ...entry("https://x.test/"), seeded: true, loading: true },
    ]);
    expect(reset[0]).toMatchObject({ seeded: false, loading: false });
  });

  it("returns undefined and does not reset when the request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const setEntries = jest.fn();
    const setCards = jest.fn();

    const result = await clearIndex(setEntries, setCards);

    expect(result).toBeUndefined();
    expect(setEntries).not.toHaveBeenCalled();
    expect(setCards).not.toHaveBeenCalled();
  });
});
