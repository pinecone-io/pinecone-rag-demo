import type { Index, PineconeRecord } from "@pinecone-database/pinecone";
import { chunkedUpsert } from "@/services/chunkedUpsert";

const makeVectors = (n: number): PineconeRecord[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    values: [i, i, i],
  }));

type MockNamespace = { upsert: jest.Mock };

function makeIndex() {
  const upsert = jest.fn().mockResolvedValue(undefined);
  const namespace = jest.fn<MockNamespace, [string]>(() => ({ upsert }));
  const index = { namespace } as unknown as Index;
  return { index, namespace, upsert };
}

describe("chunkedUpsert", () => {
  it("splits vectors into batches of the given chunk size", async () => {
    const { index, upsert } = makeIndex();
    await chunkedUpsert(index, makeVectors(25), "ns", 10);

    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it("upserts each chunk's own vectors, not the whole array", async () => {
    const { index, upsert } = makeIndex();
    const vectors = makeVectors(25);

    await chunkedUpsert(index, vectors, "ns", 10);

    const upsertedIds = upsert.mock.calls
      .flatMap((call) => call[0] as PineconeRecord[])
      .map((v) => v.id);

    expect(upsertedIds).toHaveLength(25);
    expect(new Set(upsertedIds).size).toBe(25);
  });

  it("targets the requested namespace", async () => {
    const { index, namespace } = makeIndex();
    await chunkedUpsert(index, makeVectors(5), "my-namespace", 10);

    expect(namespace).toHaveBeenCalledWith("my-namespace");
  });

  it("returns true on success", async () => {
    const { index } = makeIndex();
    await expect(chunkedUpsert(index, makeVectors(5), "ns", 10)).resolves.toBe(
      true
    );
  });

  it("defaults to a chunk size of 10 when none is provided", async () => {
    const { index, upsert } = makeIndex();
    await chunkedUpsert(index, makeVectors(21), "ns");

    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it("produces no upserts for an empty vector list", async () => {
    const { index, upsert } = makeIndex();
    await chunkedUpsert(index, [], "ns", 10);

    expect(upsert).not.toHaveBeenCalled();
  });

  it("swallows per-chunk upsert errors and still resolves", async () => {
    const { index, upsert } = makeIndex();
    upsert.mockRejectedValueOnce(new Error("boom"));
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await expect(chunkedUpsert(index, makeVectors(20), "ns", 10)).resolves.toBe(
      true
    );

    spy.mockRestore();
  });
});
