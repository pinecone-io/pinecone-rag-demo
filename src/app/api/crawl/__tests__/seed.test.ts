const mockListIndexes = jest.fn();
const mockCreateIndex = jest.fn();
const mockPineconeIndex = jest.fn(() => ({}));
const mockCrawl = jest.fn();

jest.mock("@pinecone-database/pinecone", () => ({
  Pinecone: jest.fn(() => ({
    listIndexes: mockListIndexes,
    createIndex: mockCreateIndex,
    Index: mockPineconeIndex,
  })),
}));
jest.mock("../crawler", () => ({
  Crawler: jest.fn(() => ({ crawl: mockCrawl })),
}));
jest.mock("@/services/embeddings", () => ({
  getEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));
jest.mock("@/services/chunkedUpsert", () => ({
  chunkedUpsert: jest.fn().mockResolvedValue(true),
}));

import seed from "../seed";
import { chunkedUpsert } from "@/services/chunkedUpsert";

const mockChunkedUpsert = chunkedUpsert as jest.Mock;

const options = { splittingMethod: "markdown", chunkSize: 100, chunkOverlap: 0 };

beforeEach(() => {
  mockCrawl.mockResolvedValue([
    { url: "https://example.com/", content: "# Heading\n\nSome page content to embed." },
  ]);
});

describe("seed", () => {
  it("creates the index when it does not already exist", async () => {
    mockListIndexes.mockResolvedValueOnce({ indexes: [] });

    await seed("https://example.com/", 1, "my-index", options);

    expect(mockCreateIndex).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my-index", dimension: 1536 })
    );
  });

  it("does not recreate an index that already exists", async () => {
    mockListIndexes.mockResolvedValueOnce({ indexes: [{ name: "my-index" }] });

    await seed("https://example.com/", 1, "my-index", options);

    expect(mockCreateIndex).not.toHaveBeenCalled();
  });

  it("upserts embedded vectors carrying a hash id and chunk metadata", async () => {
    mockListIndexes.mockResolvedValueOnce({ indexes: [{ name: "my-index" }] });

    await seed("https://example.com/", 1, "my-index", options);

    expect(mockChunkedUpsert).toHaveBeenCalledTimes(1);
    const vectors = mockChunkedUpsert.mock.calls[0][1];
    expect(vectors.length).toBeGreaterThan(0);
    for (const v of vectors) {
      expect(typeof v.id).toBe("string");
      expect(v.id.length).toBeGreaterThan(0);
      expect(v.values).toEqual([0.1, 0.2, 0.3]);
      expect(v.metadata.chunk).toEqual(expect.any(String));
    }
  });

  it("propagates errors from the crawl step", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCrawl.mockReset();
    mockCrawl.mockRejectedValueOnce(new Error("crawl failed"));

    await expect(
      seed("https://example.com/", 1, "my-index", options)
    ).rejects.toThrow("crawl failed");
    spy.mockRestore();
  });
});
