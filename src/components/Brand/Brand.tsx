import styles from "./Brand.module.css";

export function Brand() {
  return (
    <div className={styles.brand}>
      <img src="/app-icon.svg" width="36" height="36" alt="" />
      <span className={styles.brandName}>
        比一比 <span>TextDiff</span>
      </span>
    </div>
  );
}
