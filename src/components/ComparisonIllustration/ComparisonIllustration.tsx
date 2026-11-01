import styles from "./ComparisonIllustration.module.css";

export function ComparisonIllustration() {
  return (
    <div className={styles.comparisonMark} aria-hidden="true">
      <div className={`${styles.paper} ${styles.paperBefore}`}>
        <i /><i /><i /><i />
      </div>
      <div className={`${styles.paper} ${styles.paperAfter}`}>
        <i /><i /><i /><i />
      </div>
      <span className={styles.comparisonSymbol}>↔</span>
    </div>
  );
}
