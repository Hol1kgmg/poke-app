import { createFileRoute } from "@tanstack/react-router";

import { TopPage } from "#/pages/Top";

export const Route = createFileRoute("/")({ component: TopPage });
