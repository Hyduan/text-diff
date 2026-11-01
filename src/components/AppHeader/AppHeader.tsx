import { Brand } from "../Brand/Brand";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  return (
    <header className={styles.appHeader}>
      <Brand />
      <span className={styles.localBadge}>
        <span aria-hidden="true" />
        本地运行
      </span>
    </header>
  );
}
