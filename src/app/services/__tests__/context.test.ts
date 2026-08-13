jest.mock("../embeddings");
jest.mock("../pinecone");

import { getContext } from "@/services/context";
import { getEmbeddings } from "../embeddings";
import { getMatchesFromEmbeddings } from "../pinecone";

const mockGetEmbeddings = getEmbeddings as jest.Mock;
const mockGetMatchesFromEmbeddings = getMatchesFromEmbeddings as jest.Mock;

const match = (id: string, score: number) => ({
  id,
  score,
  metadata: { url: "u", text: "t", chunk: "c" },
});

describe("getContext", () => {
  beforeEach(() => {
    mockGetEmbeddings.mockResolvedValue([0.1, 0.2, 0.3]);
  });

  it("embeds the incoming message", async () => {
    mockGetMatchesFromEmbeddings.mockResolvedValueOnce([]);

    await getContext("what is pinecone?", "ns");

    expect(mockGetEmbeddings).toHaveBeenCalledWith("what is pinecone?");
  });

  it("requests the top matches from the given namespace", async () => {
    mockGetMatchesFromEmbeddings.mockResolvedValueOnce([]);

    await getContext("q", "my-ns");

    expect(mockGetMatchesFromEmbeddings).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3],
      10,
      "my-ns"
    );
  });

  it("keeps only matches scoring above the minimum", async () => {
    mockGetMatchesFromEmbeddings.mockResolvedValueOnce([
      match("high", 0.95),
      match("low", 0.5),
      match("edge", 0.7),
    ]);

    const result = await getContext("q", "ns", 3000, 0.7);

    expect(result.map((m) => m.id)).toEqual(["high"]);
  });

  it("uses a default minimum score of 0.7", async () => {
    mockGetMatchesFromEmbeddings.mockResolvedValueOnce([
      match("keep", 0.8),
      match("drop", 0.6),
    ]);

    const result = await getContext("q", "ns");

    expect(result.map((m) => m.id)).toEqual(["keep"]);
  });

  it("drops matches that have no score", async () => {
    mockGetMatchesFromEmbeddings.mockResolvedValueOnce([
      { id: "no-score", metadata: {} },
      match("scored", 0.9),
    ]);

    const result = await getContext("q", "ns");

    expect(result.map((m) => m.id)).toEqual(["scored"]);
  });
});
