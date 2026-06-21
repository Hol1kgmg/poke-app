"use client";

import { useAtom } from "jotai";

import { langAtom } from "#/shared/state/langAtom";
import styles from "./LangToggle.module.css";

export const LangToggle = () => {
  const [lang, setLang] = useAtom(langAtom);
  const isJa = lang === "ja";

  return (
    <div className={styles.label}>
      <span className={`${styles.option} ${isJa ? styles.active : ""}`} aria-hidden="true">JP</span>
      <button
        type="button"
        role="switch"
        aria-checked={isJa}
        aria-label={isJa ? "Switch to English" : "日本語に切り替え"}
        onClick={() => setLang(isJa ? "en" : "ja")}
        className={styles.track}
      >
        <span className={`${styles.thumb} ${isJa ? "" : styles.thumbRight}`} />
      </button>
      <span className={`${styles.option} ${!isJa ? styles.active : ""}`} aria-hidden="true">EN</span>
    </div>
  );
};
