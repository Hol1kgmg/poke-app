"use client";

import { useState } from "react";

import { PokemonCard } from "#/entities/pokemon/ui/PokemonCard";

import { toMatchResult } from "./adapters";
import type { MatchRequest, MatchResult } from "./types";
import styles from "./DiagnoseForm.module.css";

export function DiagnoseForm() {
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body: MatchRequest = { id_a: Number(idA), id_b: Number(idB) };
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`match API error: ${res.status}`);
      setResult(toMatchResult(await res.json()));
    } catch {
      setError("IDが正しくないか、存在しないポケモンです。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ポケモン相性診断</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputs}>
          <input
            type="number"
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            placeholder="ポケモンA の ID"
            aria-label="ポケモンA の ID"
            min={1}
            required
            className={styles.input}
          />
          <input
            type="number"
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            placeholder="ポケモンB の ID"
            aria-label="ポケモンB の ID"
            min={1}
            required
            className={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "診断中…" : "診断する"}
        </button>
      </form>
      {error !== null && <p className={styles.error}>{error}</p>}
      {result !== null && (
        <div className={styles.result}>
          <div className={styles.pokemons}>
            <PokemonCard name={result.nameA} imageUrl={result.imgA} />
            <PokemonCard name={result.nameB} imageUrl={result.imgB} />
          </div>
          <p className={styles.score}>❤️ 相性: {result.score}%</p>
        </div>
      )}
    </div>
  );
}
