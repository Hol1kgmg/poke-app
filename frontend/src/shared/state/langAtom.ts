import { atom } from "jotai";

export type Lang = "ja" | "en";

export const langAtom = atom<Lang>("ja");

export const isJaAtom = atom((get) => get(langAtom) === "ja");
