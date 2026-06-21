"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";

import { toMatchResult } from "./adapters";
import { matchResultAtom } from "./atoms";
import type { MatchRequest } from "./types";

export const useDiagnosePokemon = () => {
  const setMatchResult = useSetAtom(matchResultAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnose = async (request: MatchRequest) => {
    setError(null);
    setMatchResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`match API error: ${res.status}`);
      setMatchResult(toMatchResult(await res.json()));
    } catch {
      setError("IDが正しくないか、存在しないポケモンです。");
    } finally {
      setLoading(false);
    }
  };

  return { diagnose, loading, error };
};
