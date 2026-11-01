import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    color: "#293d33",
    backgroundColor: "#fffefa",
    flex: "1",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily:
      'ui-monospace, "SFMono-Regular", Menlo, Consolas, "PingFang SC", "Microsoft YaHei", monospace',
    lineHeight: "1.9",
    overflow: "visible",
  },
  ".cm-content": { padding: "18px 0 60px", caretColor: "#214e43" },
  ".cm-line": { padding: "0 18px 0 12px" },
  ".cm-gutters": {
    backgroundColor: "#fffefa",
    color: "#626e63",
    border: "none",
    paddingLeft: "10px",
  },
  ".cm-gutterElement": { padding: "0 10px 0 4px" },
  ".cm-placeholder": {
    color: "#69766a",
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
  },
  ".cm-cursor": { borderLeftColor: "#214e43" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "#d8e6d1 !important" },
  "&.cm-merge-a .cm-changedLine": { backgroundColor: "#fcf0eb" },
  "&.cm-merge-b .cm-changedLine": { backgroundColor: "#edf5e8" },
  ".cm-exactDeleted": { backgroundColor: "#f3cfc2", textDecoration: "none" },
  ".cm-exactInserted": { backgroundColor: "#cce4be", textDecoration: "none" },
  ".cm-deletedLineGutter": { backgroundColor: "#c57a65" },
  ".cm-insertedLineGutter": { backgroundColor: "#779c64" },
  ".cm-panels": { backgroundColor: "#f2f4ed", color: "#293d33" },
  ".cm-textfield": {
    backgroundColor: "#fffefa",
    border: "1px solid #9aa88f",
    borderRadius: "4px",
    color: "#293d33",
  },
  ".cm-button": {
    backgroundImage: "none",
    backgroundColor: "#fffefa",
    border: "1px solid #9aa88f",
    borderRadius: "4px",
    color: "#293d33",
  },
});
