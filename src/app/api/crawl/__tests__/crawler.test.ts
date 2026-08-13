import { Crawler } from "../crawler";

const html = (body: string) => `<!doctype html><html><body>${body}</body></html>`;

function mockFetchSequence(pages: Record<string, string>) {
  return jest.fn(async (url: string | URL) => {
    const key = url.toString();
    const body = pages[key];
    if (body === undefined) {
      throw new Error(`unexpected fetch: ${key}`);
    }
    return { text: async () => body } as Response;
  });
}

describe("Crawler", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("crawls the start page and converts its HTML to markdown", async () => {
    global.fetch = mockFetchSequence({
      "https://example.com/": html("<h1>Title</h1><p>Body text</p>"),
    }) as unknown as typeof fetch;

    const pages = await new Crawler(1, 1).crawl("https://example.com/");

    expect(pages).toHaveLength(1);
    expect(pages[0].url).toBe("https://example.com/");
    expect(pages[0].content).toContain("Title");
    expect(pages[0].content).toContain("Body text");
  });

  it("stops at maxPages even when more links are available", async () => {
    global.fetch = mockFetchSequence({
      "https://example.com/": html(
        '<a href="https://example.com/a">a</a><a href="https://example.com/b">b</a>'
      ),
      "https://example.com/a": html("<p>Page A</p>"),
      "https://example.com/b": html("<p>Page B</p>"),
    }) as unknown as typeof fetch;

    const pages = await new Crawler(2, 2).crawl("https://example.com/");

    expect(pages).toHaveLength(2);
  });

  it("does not follow links deeper than maxDepth", async () => {
    const fetchMock = mockFetchSequence({
      "https://example.com/": html('<a href="https://example.com/deep">deep</a>'),
      "https://example.com/deep": html("<p>too deep</p>"),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const pages = await new Crawler(0, 5).crawl("https://example.com/");

    expect(pages).toHaveLength(1);
    expect(pages[0].url).toBe("https://example.com/");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves relative links against the page URL", async () => {
    global.fetch = mockFetchSequence({
      "https://example.com/docs/": html('<a href="../other">other</a>'),
      "https://example.com/other": html("<p>Other</p>"),
    }) as unknown as typeof fetch;

    const pages = await new Crawler(1, 2).crawl("https://example.com/docs/");

    expect(pages.map((p) => p.url)).toEqual([
      "https://example.com/docs/",
      "https://example.com/other",
    ]);
  });

  it("does not visit the same URL twice", async () => {
    const fetchMock = mockFetchSequence({
      "https://example.com/": html(
        '<a href="https://example.com/a">a</a><a href="https://example.com/a">a again</a>'
      ),
      "https://example.com/a": html("<p>Page A</p>"),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const pages = await new Crawler(2, 10).crawl("https://example.com/");

    const urls = pages.map((p) => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("returns an empty page body when a fetch fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const pages = await new Crawler(1, 1).crawl("https://example.com/");

    expect(pages).toHaveLength(1);
    expect(pages[0].content).toBe("");
    spy.mockRestore();
  });
});
