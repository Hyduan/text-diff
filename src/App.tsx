import { version } from "../package.json";
import { AppFooter } from "./components/AppFooter/AppFooter";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { WelcomeScreen } from "./components/WelcomeScreen/WelcomeScreen";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.appShell}>
      <AppHeader />
      <WelcomeScreen />
      <AppFooter version={version} />
    </div>
  );
}
