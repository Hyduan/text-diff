import type { EditorSnapshot } from "./MergeEditor";
import { summarizeGroups } from "./diff";
import styles from "./ComparisonStatus.module.css";

export function ComparisonStatus({ snapshot }: { snapshot: EditorSnapshot }) {
  const { added, removed, modified } = summarizeGroups(snapshot.groups);
  const hasText = snapshot.left.characters > 0 || snapshot.right.characters > 0;
  const description = !hasText
    ? "输入文本开始对比"
    : snapshot.groups.length
      ? `${snapshot.groups.length} 处差异`
      : "两侧文本一致";
  return (
    <div className={styles.status}>
      <div
        className={styles.summary}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={
            !snapshot.groups.length && hasText ? styles.identical : undefined
          }
        >
          {description}
        </span>
        {snapshot.groups.length > 0 && (
          <span className={styles.counts}>
            <span className={styles.added}>新增 {added}</span>
            <span className={styles.removed}>删除 {removed}</span>
            <span className={styles.modified}>修改 {modified}</span>
          </span>
        )}
      </div>
      <span
        className={snapshot.approximate ? styles.warning : styles.hint}
        aria-live="polite"
        aria-atomic="true"
      >
        {snapshot.approximate ? "复杂差异已按整段标记" : "自动对齐 · 同步滚动"}
      </span>
    </div>
  );
}
