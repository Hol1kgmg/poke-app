import { atom } from "jotai";

import type { MatchResult } from "./types";

export const matchResultAtom = atom<MatchResult | null>(null);
