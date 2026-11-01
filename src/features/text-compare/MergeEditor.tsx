import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import { StateEffect, StateField, EditorState } from "@codemirror/state";
import {
  Decoration,
  drawSelection,
  EditorView,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  isolateHistory,
} from "@codemirror/commands";
import {
  highlightSelectionMatches,
  search,
  searchKeymap,
} from "@codemirror/search";
import { Change, MergeView } from "@codemirror/merge";
import { classifyGroup, compareTexts, normalizeNewlines } from "./diff";
import type { Comparison, DiffGroup } from "./diff";
import { editorTheme } from "./editorTheme";
import styles from "./MergeEditor.module.css";

const setHighlights = StateEffect.define<DecorationSet>();
const exactHighlights = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (highlights, transaction) => {
    const replacement = transaction.effects.find((effect) =>
      effect.is(setHighlights),
    );
    return replacement
      ? replacement.value
      : highlights.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export type EditorSnapshot = {
  left: { characters: number; lines: number };
  right: { characters: number; lines: number };
  groups: DiffGroup[];
  activeIndex: number;
  approximate: boolean;
};

export const emptySnapshot: EditorSnapshot = {
  left: { characters: 0, lines: 1 },
  right: { characters: 0, lines: 1 },
  groups: [],
  activeIndex: -1,
  approximate: false,
};

export type MergeEditorHandle = {
  replaceTexts(left: string, right: string): void;
  swap(): void;
  navigate(direction: -1 | 1): void;
};

type MergeEditorProps = {
  ref: Ref<MergeEditorHandle>;
  onStateChange(snapshot: EditorSnapshot): void;
};

export function MergeEditor({ ref, onStateChange }: MergeEditorProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<MergeEditorHandle | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      replaceTexts: (left, right) =>
        actionsRef.current?.replaceTexts(left, right),
      swap: () => actionsRef.current?.swap(),
      navigate: (direction) => actionsRef.current?.navigate(direction),
    }),
    [],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let queued = false;
    let activeIndex = -1;
    let selecting = false;
    let approximate = false;
    let previousComparison: Comparison | undefined;
    let view: MergeView | undefined;

    const publish = () => {
      queued = false;
      if (disposed || !view) return;
      if (!view.chunks.length) approximate = false;
      const left = view.a.state.doc.toString();
      const right = view.b.state.doc.toString();
      if (
        !previousComparison ||
        previousComparison.left !== left ||
        previousComparison.right !== right
      ) {
        previousComparison = compareTexts(left, right);
        approximate = !previousComparison.precise;
        // MergeView expands changes to word boundaries. Our own decorations keep
        // Chinese and other text highlighted at the exact changed characters.
        for (const [editor, side] of [
          [view.a, "a"],
          [view.b, "b"],
        ] as const) {
          const marks = previousComparison.changes.flatMap((change) => {
            const from = side === "a" ? change.fromA : change.fromB;
            const to = side === "a" ? change.toA : change.toB;
            return from < to
              ? [
                  Decoration.mark({
                    class:
                      side === "a" ? "cm-exactDeleted" : "cm-exactInserted",
                  }).range(from, to),
                ]
              : [];
          });
          editor.dispatch({
            effects: setHighlights.of(Decoration.set(marks, true)),
          });
        }
      }
      const comparison = previousComparison;
      onStateChange({
        left: {
          characters: Array.from(left).length,
          lines: view.a.state.doc.lines,
        },
        right: {
          characters: Array.from(right).length,
          lines: view.b.state.doc.lines,
        },
        groups: view.chunks.map(({ fromA, toA, fromB, toB }) => {
          const range = { fromA, toA, fromB, toB };
          return { ...range, kind: classifyGroup(range, comparison.changes) };
        }),
        activeIndex,
        approximate,
      });
    };
    const queuePublish = () => {
      if (!queued) {
        queued = true;
        queueMicrotask(publish);
      }
    };

    const navigate = (direction: -1 | 1) => {
      if (!view?.chunks.length) return;
      const count = view.chunks.length;
      const index =
        activeIndex < 0
          ? direction > 0
            ? 0
            : count - 1
          : (activeIndex + direction + count) % count;
      const chunk = view.chunks[index];
      selecting = true;
      for (const [editor, start] of [
        [view.a, chunk.fromA],
        [view.b, chunk.fromB],
      ] as const) {
        const position = Math.min(start, editor.state.doc.length);
        editor.dispatch({
          selection: { anchor: position },
          effects: EditorView.scrollIntoView(position, { y: "center" }),
          userEvent: "select.byChunk",
        });
      }
      selecting = false;
      activeIndex = index;
      view.b.focus();
      queuePublish();
    };

    const extensions = (label: string, side: "a" | "b") => [
      exactHighlights,
      lineNumbers(),
      history(),
      drawSelection(),
      // Keep a single-sided search panel from shifting the document origin.
      search({ top: false }),
      highlightSelectionMatches(),
      keymap.of([
        {
          key: "F7",
          run: () => {
            navigate(1);
            return true;
          },
        },
        {
          key: "Shift-F7",
          run: () => {
            navigate(-1);
            return true;
          },
        },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      EditorView.lineWrapping,
      editorTheme,
      placeholder(
        side === "a"
          ? "在这里输入或粘贴原始文本…"
          : "在这里输入或粘贴修改后文本…",
      ),
      EditorView.contentAttributes.of({
        "aria-label": label,
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
      }),
      EditorState.phrases.of({
        Find: "查找",
        Replace: "替换",
        next: "下一个",
        previous: "上一个",
        all: "全部",
        "match case": "区分大小写",
        "by word": "整词匹配",
        regexp: "正则表达式",
        replace: "替换",
        "replace all": "全部替换",
        close: "关闭",
      }),
      EditorView.updateListener.of((update) => {
        if (!view || disposed) return;
        if (update.docChanged) activeIndex = -1;
        else if (update.selectionSet && !selecting) {
          const head = update.state.selection.main.head;
          activeIndex = view.chunks.findIndex((chunk) => {
            const from = side === "a" ? chunk.fromA : chunk.fromB;
            const to = side === "a" ? chunk.toA : chunk.toB;
            return (
              head >= from && (head < to || (from === to && head === from))
            );
          });
        }
        if (update.docChanged || update.selectionSet) queuePublish();
      }),
    ];

    view = new MergeView({
      parent: mount,
      a: { doc: "", extensions: extensions("原始文本", "a") },
      b: { doc: "", extensions: extensions("修改后文本", "b") },
      highlightChanges: false,
      gutter: true,
      diffConfig: {
        override: (left, right) => {
          const result = compareTexts(left, right);
          approximate ||= !result.precise;
          return result.changes.map(
            (range) =>
              new Change(range.fromA, range.toA, range.fromB, range.toB),
          );
        },
      },
    });

    const replaceTexts = (left: string, right: string) => {
      if (!view) return;
      approximate = false;
      for (const [editor, raw] of [
        [view.a, left],
        [view.b, right],
      ] as const) {
        const text = normalizeNewlines(raw);
        if (editor.state.doc.toString() !== text) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: text },
            selection: { anchor: 0 },
            annotations: isolateHistory.of("full"),
            userEvent: "input",
          });
        }
      }
      activeIndex = -1;
      view.dom.scrollTop = 0;
      queuePublish();
    };
    actionsRef.current = {
      replaceTexts,
      navigate,
      swap: () => {
        if (view)
          replaceTexts(
            view.b.state.doc.toString(),
            view.a.state.doc.toString(),
          );
      },
    };
    publish();

    return () => {
      disposed = true;
      actionsRef.current = null;
      view?.destroy();
      mount.replaceChildren();
    };
  }, [onStateChange]);

  return <div className={styles.mount} ref={mountRef} />;
}
