import { truncateStringByBytes } from "@/utils/truncateString";

describe("truncateStringByBytes", () => {
  it("returns the string unchanged when it is shorter than the byte limit", () => {
    expect(truncateStringByBytes("hello", 100)).toBe("hello");
  });

  it("truncates ASCII strings to the requested number of bytes", () => {
    expect(truncateStringByBytes("hello world", 5)).toBe("hello");
  });

  it("returns an empty string when the limit is zero", () => {
    expect(truncateStringByBytes("hello", 0)).toBe("");
  });

  it("counts bytes rather than characters for multi-byte input", () => {
    const euro = "€";
    expect(new TextEncoder().encode(euro)).toHaveLength(3);
    expect(truncateStringByBytes(euro, 3)).toBe("€");
  });

  it("produces the replacement character when a multi-byte char is cut mid-sequence", () => {
    const result = truncateStringByBytes("€", 2);
    expect(result).not.toBe("€");
    expect(result).toContain("�");
  });
});
