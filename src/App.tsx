/**
 * Root App component — switches between screens based on appStore.currentScreen.
 *
 * Screens:
 *  - picker:    ProjectPicker (list of existing projects + "new" button)
 *  - wizard:    NewProjectWizard (4-step setup)
 *  - workspace: Workspace (main mapping area)
 */
import { useAppStore } from "./stores/appStore";
import { ProjectPicker } from "./components/ProjectPicker/ProjectPicker";
import { Wizard } from "./components/Wizard/Wizard";
import { Workspace } from "./components/Workspace/Workspace";
import styles from "./App.module.css";

export default function App() {
  const screen = useAppStore((s) => s.currentScreen);

  return (
    <div className={`k-app ${styles.appRoot}`}>
      {screen === "picker" && <ProjectPicker />}
      {screen === "wizard" && <Wizard />}
      {screen === "workspace" && <Workspace />}
    </div>
  );
}
