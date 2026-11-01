import { version } from "../package.json";
import { AppFooter } from "./components/AppFooter/AppFooter";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { TextCompare } from "./features/text-compare/TextCompare";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.appShell}>
      <AppHeader />
      <TextCompare />
      <AppFooter version={version} />
    </div>
  );
}
