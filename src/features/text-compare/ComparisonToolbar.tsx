import { Icon } from "./Icon";
import styles from "./ComparisonToolbar.module.css";

type ComparisonToolbarProps = {
  total: number;
  activeIndex: number;
  hasText: boolean;
  onSwap(): void;
  onClear(): void;
  onNavigate(direction: -1 | 1): void;
};

export function ComparisonToolbar({
  total,
  activeIndex,
  hasText,
  onSwap,
  onClear,
  onNavigate,
}: ComparisonToolbarProps) {
  return (
    <div className={styles.toolbar} role="group" aria-label="对比操作">
      <div className={styles.viewLabel}>
        <Icon name="columns" />
        <span>双栏对照</span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.textButton}
          type="button"
          disabled={!hasText}
          onClick={onSwap}
        >
          <Icon name="swap" />
          交换
        </button>
        <button
          className={styles.textButton}
          type="button"
          disabled={!hasText}
          onClick={onClear}
        >
          <Icon name="clear" />
          清空
        </button>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.position} aria-live="polite" aria-atomic="true">
          {activeIndex < 0 ? "—" : activeIndex + 1} / {total}
        </span>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="上一处差异"
          title="上一处差异（Shift+F7）"
          disabled={!total}
          onClick={() => onNavigate(-1)}
        >
          <Icon name="up" />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="下一处差异"
          title="下一处差异（F7）"
          disabled={!total}
          onClick={() => onNavigate(1)}
        >
          <Icon name="down" />
        </button>
      </div>
    </div>
  );
}
