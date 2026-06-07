import { createFileRoute } from "@tanstack/react-router";

import { DiagnoseForm } from "#/features/diagnose-pokemon/DiagnoseForm";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DiagnoseForm />;
}
