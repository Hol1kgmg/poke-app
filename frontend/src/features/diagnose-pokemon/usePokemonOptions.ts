"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";

import { isJaAtom } from "#/shared/state/langAtom";

import type { RawPokemonListItem } from "./types";

export type PokemonOption = { value: number; label: string };

const toLabel = (id: number, name: string): string =>
  `${String(id).padStart(3, "0")} - ${name}`;

const getJapaneseName = (item: RawPokemonListItem): string => {
  const jaHrkt = item.names.find((n) => n.language.name === "ja-Hrkt");
  if (jaHrkt !== undefined) return jaHrkt.name;
  const ja = item.names.find((n) => n.language.name === "ja");
  if (ja !== undefined) return ja.name;
  return item.name;
};

const toOption = (item: RawPokemonListItem, isJa: boolean): PokemonOption => ({
  value: item.id,
  label: toLabel(item.id, isJa ? getJapaneseName(item) : item.name),
});

export const usePokemonOptions = () => {
  const isJa = useAtomValue(isJaAtom);
  const [items, setItems] = useState<RawPokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/pokemon-list");
        if (!res.ok) throw new Error(`pokemon-list error: ${res.status}`);
        setItems((await res.json()) as RawPokemonListItem[]);
      } catch {
        setError("ポケモン一覧の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const options = items.map((item) => toOption(item, isJa));

  return { options, loading, error };
};
