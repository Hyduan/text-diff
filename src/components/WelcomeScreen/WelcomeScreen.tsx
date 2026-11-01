import { useId } from "react";
import { ComparisonIllustration } from "../ComparisonIllustration/ComparisonIllustration";
import styles from "./WelcomeScreen.module.css";

export function WelcomeScreen() {
  const titleId = useId();

  return (
    <main className={styles.welcome} aria-labelledby={titleId}>
      <ComparisonIllustration />
      <p className={styles.eyebrow}>比一比 · TextDiff</p>
      <h1 className={styles.title} id={titleId}>
        两段文本，<br />
        一眼看清不同。
      </h1>
      <p className={styles.welcomeDescription}>一个安静、专注的文本对比空间。</p>
      <p className={styles.developmentNote}>应用开发中，文本对比功能即将加入。</p>
    </main>
  );
}
