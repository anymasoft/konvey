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

export default function App() {
  const screen = useAppStore((s) => s.currentScreen);

  return (
    <div className="k-app" style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      {screen === "picker" && <ProjectPicker />}
      {screen === "wizard" && <Wizard />}
      {screen === "workspace" && <Workspace />}
    </div>
  );
}
