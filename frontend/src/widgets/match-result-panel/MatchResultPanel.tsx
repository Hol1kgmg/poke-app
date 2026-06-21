"use client";

import { useAtomValue } from "jotai";

import { PokemonCard } from "#/entities/pokemon/ui/PokemonCard";
import { isJaAtom } from "#/shared/state/langAtom";
import { matchResultAtom } from "#/features/diagnose-pokemon/atoms";

import styles from "./MatchResultPanel.module.css";

const i18n = {
  ja: { score: (n: number) => `❤️ 相性: ${n}%` },
  en: { score: (n: number) => `❤️ Compatibility: ${n}%` },
} as const;

export const MatchResultPanel = () => {
  const result = useAtomValue(matchResultAtom);
  const isJa = useAtomValue(isJaAtom);
  const t = isJa ? i18n.ja : i18n.en;

  if (result === null) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.pokemons}>
        <PokemonCard name={result.nameA} imageUrl={result.imgA} />
        <PokemonCard name={result.nameB} imageUrl={result.imgB} />
      </div>
      <p className={styles.score}>{t.score(result.score)}</p>
    </div>
  );
};
