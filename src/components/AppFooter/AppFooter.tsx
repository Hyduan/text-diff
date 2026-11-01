import styles from "./AppFooter.module.css";

type AppFooterProps = {
  version: string;
};

export function AppFooter({ version }: AppFooterProps) {
  return (
    <footer className={styles.appFooter}>
      <span>离线优先 · 文本留在本机</span>
      <span>v{version}</span>
    </footer>
  );
}
