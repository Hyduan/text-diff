import { describe, expect, it } from "vitest";
import {
  classifyGroup,
  compareTexts,
  normalizeNewlines,
  summarizeGroups,
} from "./diff";
import type { Comparison } from "./diff";

function verifyRanges(result: Comparison) {
  let a = 0;
  let b = 0;
  let rebuilt = "";
  for (const change of result.changes) {
    expect(change.fromA).toBeGreaterThanOrEqual(a);
    expect(change.fromB).toBeGreaterThanOrEqual(b);
    expect(change.toA).toBeGreaterThanOrEqual(change.fromA);
    expect(change.toB).toBeGreaterThanOrEqual(change.fromB);
    expect(change.toA).toBeLessThanOrEqual(result.left.length);
    expect(change.toB).toBeLessThanOrEqual(result.right.length);
    expect(change.toA > change.fromA || change.toB > change.fromB).toBe(true);
    expect(result.left.slice(a, change.fromA)).toBe(
      result.right.slice(b, change.fromB),
    );
    rebuilt +=
      result.left.slice(a, change.fromA) +
      result.right.slice(change.fromB, change.toB);
    a = change.toA;
    b = change.toB;
  }
  expect(result.left.slice(a)).toBe(result.right.slice(b));
  expect(rebuilt + result.left.slice(a)).toBe(result.right);
}

describe("text comparison", () => {
  it.each(["", "相同文本", " \n\n", "hello 😀"])(
    "finds no changes in identical input %j",
    (text) => {
      expect(compareTexts(text, text)).toMatchObject({
        changes: [],
        precise: true,
      });
    },
  );

  it("only highlights the modified Chinese character", () => {
    const result = compareTexts("今天天气很好", "今天天气真好");
    expect(result.changes).toEqual([{ fromA: 4, toA: 5, fromB: 4, toB: 5 }]);
    verifyRanges(result);
  });

  it("uses UTF-16 editor offsets without splitting emoji", () => {
    const result = compareTexts("你好😀世界", "你好😃世界");
    expect(result.changes).toEqual([{ fromA: 2, toA: 4, fromB: 2, toB: 4 }]);
    verifyRanges(result);
  });

  it("normalizes CRLF and lone CR before comparing", () => {
    expect(normalizeNewlines("甲\r\n乙\r丙")).toBe("甲\n乙\n丙");
    expect(compareTexts("甲\r\n乙\r丙", "甲\n乙\n丙").changes).toEqual([]);
  });

  it.each([
    ["", "第一行\n第二行"],
    ["第一行\n第二行", ""],
    ["甲\n乙", "甲\n新增一\n新增二\n乙"],
    ["甲\n删一\n删二\n乙", "甲\n乙"],
    ["甲\n\n乙", "甲\n乙"],
    ["甲\n乙", "甲\n\n乙"],
    ["行尾", "行尾\n"],
    ["行尾\n", "行尾"],
    ["甲\n乙\n丙", "甲\n乙"],
    ["甲\n乙", "甲\n乙\n丙"],
    ["Hello", "hello"],
    ["空 格", "空格"],
    ["A\nA\nB\n", "A\nB\nA\n"],
    ["👩‍💻工作", "👨‍💻工作"],
  ])("preserves all content for %j → %j", (left, right) => {
    const result = compareTexts(left, right);
    expect(result.changes.length).toBeGreaterThan(0);
    verifyRanges(result);
  });

  it("falls back to a valid coarse change when the budget is exhausted", () => {
    const result = compareTexts("旧文本\n第二行", "全新文本\n第三行", 0);
    expect(result.precise).toBe(false);
    verifyRanges(result);
  });

  it("maintains valid ranges across randomized Unicode and newline edits", () => {
    let seed = 20261101;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const tokens = ["甲", "乙", "A", " ", "\n", "\r", "😀", "𠮷"];
    const text = () =>
      Array.from(
        { length: Math.floor(random() * 35) },
        () => tokens[Math.floor(random() * tokens.length)],
      ).join("");
    for (let i = 0; i < 150; i++) verifyRanges(compareTexts(text(), text()));
  });

  it("classifies a deletion even when the aligned chunk includes an unchanged line", () => {
    const chunk = { fromA: 0, toA: 7, fromB: 0, toB: 3 };
    const changes = [{ fromA: 3, toA: 7, fromB: 3, toB: 3 }];
    expect(classifyGroup(chunk, changes)).toBe("removed");
  });

  it("counts each aligned group once and treats replacements as modified", () => {
    const range = { fromA: 0, toA: 1, fromB: 0, toB: 1 };
    expect(
      summarizeGroups([
        { ...range, kind: "added" },
        { ...range, kind: "removed" },
        { ...range, kind: "modified" },
        { ...range, kind: "modified" },
      ]),
    ).toEqual({ added: 1, removed: 1, modified: 2 });
  });
});
