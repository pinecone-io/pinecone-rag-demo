jest.mock("openai-edge", () => {
  const createEmbedding = jest.fn();
  return {
    Configuration: jest.fn(),
    OpenAIApi: jest.fn(() => ({ createEmbedding })),
    createEmbedding,
  };
});

import { getEmbeddings } from "@/services/embeddings";

const { createEmbedding: mockCreateEmbedding } = jest.requireMock("openai-edge");

const embeddingResponse = (embedding: number[]) => ({
  json: async () => ({ data: [{ embedding }] }),
});

describe("getEmbeddings", () => {
  it("returns the embedding vector from the API response", async () => {
    mockCreateEmbedding.mockResolvedValueOnce(embeddingResponse([0.1, 0.2, 0.3]));

    await expect(getEmbeddings("hello")).resolves.toEqual([0.1, 0.2, 0.3]);
  });

  it("requests the ada-002 model", async () => {
    mockCreateEmbedding.mockResolvedValueOnce(embeddingResponse([1]));

    await getEmbeddings("hello");

    expect(mockCreateEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({ model: "text-embedding-ada-002" })
    );
  });

  it("collapses newlines in the input into spaces", async () => {
    mockCreateEmbedding.mockResolvedValueOnce(embeddingResponse([1]));

    await getEmbeddings("line one\nline two\nline three");

    expect(mockCreateEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({ input: "line one line two line three" })
    );
  });

  it("wraps API failures in an Error", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockCreateEmbedding.mockRejectedValueOnce(new Error("rate limited"));

    await expect(getEmbeddings("hello")).rejects.toThrow(
      /Error calling OpenAI embedding API/
    );
    spy.mockRestore();
  });
});
