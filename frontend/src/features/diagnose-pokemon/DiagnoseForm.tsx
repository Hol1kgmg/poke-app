"use client";

import { useState } from "react";
import Select, { components } from "react-select";
import type { InputProps, GroupBase } from "react-select";
import { useAtomValue } from "jotai";

import { isJaAtom } from "#/shared/state/langAtom";

import { useDiagnosePokemon } from "./useDiagnosePokemon";
import type { PokemonOption } from "./usePokemonOptions";
import { usePokemonOptions } from "./usePokemonOptions";
import styles from "./DiagnoseForm.module.css";

const SelectInput = ({ "aria-activedescendant": ariaActiveDescendant, ...props }: InputProps<PokemonOption, boolean, GroupBase<PokemonOption>>) => (
  <components.Input {...props} aria-activedescendant={ariaActiveDescendant || undefined} />
);

const i18n = {
  ja: {
    title: "ポケモン相性診断",
    placeholderA: "ポケモンA を選択",
    placeholderB: "ポケモンB を選択",
    submit: "診断する",
    submitting: "診断中…",
    error: "IDが正しくないか、存在しないポケモンです。",
  },
  en: {
    title: "Pokémon Compatibility",
    placeholderA: "Select Pokémon A",
    placeholderB: "Select Pokémon B",
    submit: "Diagnose",
    submitting: "Diagnosing…",
    error: "Invalid Pokémon. Please check the selection.",
  },
} as const;

export const DiagnoseForm = () => {
  const [selectedA, setSelectedA] = useState<PokemonOption | null>(null);
  const [selectedB, setSelectedB] = useState<PokemonOption | null>(null);
  const isJa = useAtomValue(isJaAtom);
  const t = isJa ? i18n.ja : i18n.en;
  const { options, loading: optionsLoading } = usePokemonOptions();
  const { diagnose, loading: diagnosing, error } = useDiagnosePokemon();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedA === null || selectedB === null) return;
    await diagnose({ id_a: selectedA.value, id_b: selectedB.value });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t.title}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputs}>
          <Select
            instanceId="pokemon-a"
            isMulti={false}
            options={options}
            value={selectedA}
            onChange={(opt) => setSelectedA(opt)}
            isLoading={optionsLoading}
            placeholder={t.placeholderA}
            aria-label={t.placeholderA}
            components={{ Input: SelectInput }}
            className={styles.select}
            classNamePrefix="react-select"
          />
          <Select
            instanceId="pokemon-b"
            isMulti={false}
            options={options}
            value={selectedB}
            onChange={(opt) => setSelectedB(opt)}
            isLoading={optionsLoading}
            placeholder={t.placeholderB}
            aria-label={t.placeholderB}
            components={{ Input: SelectInput }}
            className={styles.select}
            classNamePrefix="react-select"
          />
        </div>
        <button
          type="submit"
          disabled={diagnosing || selectedA === null || selectedB === null}
          className={styles.button}
        >
          {diagnosing ? t.submitting : t.submit}
        </button>
      </form>
      {error !== null && <p className={styles.error}>{t.error}</p>}
    </div>
  );
};
