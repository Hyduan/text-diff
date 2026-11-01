import { diffChars, diffLines } from "diff";

export type DiffRange = {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
};

export type Comparison = {
  left: string;
  right: string;
  changes: DiffRange[];
  precise: boolean;
};

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Offsets are UTF-16 positions in the returned, newline-normalized documents. */
export function compareTexts(
  before: string,
  after: string,
  timeBudgetMs = 60,
): Comparison {
  const left = normalizeNewlines(before);
  const right = normalizeNewlines(after);
  const result: Comparison = { left, right, changes: [], precise: true };
  if (left === right) return result;

  const deadline = performance.now() + timeBudgetMs;
  const remaining = () => Math.max(0, Math.ceil(deadline - performance.now()));
  const coarse = (fromA: number, toA: number, fromB: number, toB: number) => {
    result.precise = false;
    result.changes.push({ fromA, toA, fromB, toB });
  };
  if (!remaining()) {
    coarse(0, left.length, 0, right.length);
    return result;
  }
  const lines = diffLines(left, right, { timeout: remaining() });
  if (!lines) {
    coarse(0, left.length, 0, right.length);
    return result;
  }

  let offsetA = 0;
  let offsetB = 0;
  let pendingA = "";
  let pendingB = "";

  const flush = () => {
    if (!pendingA && !pendingB) return;
    if (!pendingA || !pendingB) {
      result.changes.push({
        fromA: offsetA,
        toA: offsetA + pendingA.length,
        fromB: offsetB,
        toB: offsetB + pendingB.length,
      });
    } else {
      const chars = remaining()
        ? diffChars(pendingA, pendingB, { timeout: remaining() })
        : undefined;
      if (!chars) {
        coarse(
          offsetA,
          offsetA + pendingA.length,
          offsetB,
          offsetB + pendingB.length,
        );
      } else {
        let a = offsetA;
        let b = offsetB;
        let change: DiffRange | null = null;
        const emit = () => {
          if (change) result.changes.push(change);
          change = null;
        };
        for (const part of chars) {
          if (!part.added && !part.removed) {
            emit();
            a += part.value.length;
            b += part.value.length;
          } else {
            change ??= { fromA: a, toA: a, fromB: b, toB: b };
            if (part.removed) a += part.value.length;
            if (part.added) b += part.value.length;
            change.toA = a;
            change.toB = b;
          }
        }
        emit();
      }
    }
    offsetA += pendingA.length;
    offsetB += pendingB.length;
    pendingA = pendingB = "";
  };

  for (const part of lines) {
    if (part.removed) pendingA += part.value;
    else if (part.added) pendingB += part.value;
    else {
      flush();
      offsetA += part.value.length;
      offsetB += part.value.length;
    }
  }
  flush();
  return result;
}

export type DiffKind = "added" | "removed" | "modified";
export type DiffGroup = DiffRange & { kind: DiffKind };

export function classifyGroup(
  group: DiffRange,
  changes: readonly DiffRange[],
): DiffKind {
  const within = changes.filter(
    (change) =>
      change.fromA >= group.fromA &&
      change.toA <= group.toA &&
      change.fromB >= group.fromB &&
      change.toB <= group.toB,
  );
  const removed = within.some((change) => change.toA > change.fromA);
  const added = within.some((change) => change.toB > change.fromB);
  if (added && !removed) return "added";
  if (removed && !added) return "removed";
  return "modified";
}

export function summarizeGroups(groups: readonly DiffGroup[]) {
  return groups.reduce(
    (totals, group) => {
      if (group.kind === "added") totals.added++;
      else if (group.kind === "removed") totals.removed++;
      else totals.modified++;
      return totals;
    },
    { added: 0, removed: 0, modified: 0 },
  );
}
