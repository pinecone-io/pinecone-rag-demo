const mockQuery = jest.fn();
const mockNamespace = jest.fn(() => ({ query: mockQuery }));
const mockIndex = jest.fn(() => ({ namespace: mockNamespace }));

jest.mock("@pinecone-database/pinecone", () => ({
  Pinecone: jest.fn().mockImplementation(() => ({ Index: mockIndex })),
}));

import { getMatchesFromEmbeddings } from "@/services/pinecone";

describe("getMatchesFromEmbeddings", () => {
  const originalIndexEnv = process.env.PINECONE_INDEX;

  beforeEach(() => {
    process.env.PINECONE_INDEX = "test-index";
  });

  afterAll(() => {
    process.env.PINECONE_INDEX = originalIndexEnv;
  });

  it("throws when PINECONE_INDEX is not set", async () => {
    delete process.env.PINECONE_INDEX;

    await expect(getMatchesFromEmbeddings([0.1], 5, "ns")).rejects.toThrow(
      "PINECONE_INDEX environment variable not set"
    );
  });

  it("queries the namespace with the vector, topK and metadata flag", async () => {
    mockQuery.mockResolvedValueOnce({ matches: [] });

    await getMatchesFromEmbeddings([0.1, 0.2], 7, "docs");

    expect(mockNamespace).toHaveBeenCalledWith("docs");
    expect(mockQuery).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      topK: 7,
      includeMetadata: true,
    });
  });

  it("returns the matches from the query result", async () => {
    const matches = [{ id: "a", score: 0.9 }];
    mockQuery.mockResolvedValueOnce({ matches });

    await expect(getMatchesFromEmbeddings([0.1], 3, "ns")).resolves.toBe(
      matches
    );
  });

  it("returns an empty array when the result has no matches", async () => {
    mockQuery.mockResolvedValueOnce({});

    await expect(getMatchesFromEmbeddings([0.1], 3, "ns")).resolves.toEqual([]);
  });

  it("wraps query failures in an Error", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockQuery.mockRejectedValueOnce(new Error("upstream 500"));

    await expect(getMatchesFromEmbeddings([0.1], 3, "ns")).rejects.toThrow(
      /Error querying embeddings/
    );
    spy.mockRestore();
  });
});
