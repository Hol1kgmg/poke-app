import { DiagnoseForm } from "#/features/diagnose-pokemon/DiagnoseForm";
import { MatchResultPanel } from "#/widgets/match-result-panel";

import styles from "./page.module.css";

export const TopPage = () => (
  <main className={styles.main}>
    <DiagnoseForm />
    <MatchResultPanel />
  </main>
);
