import type { PokemonName } from "../model/types";
import styles from "./PokemonCard.module.css";

type Props = {
  name: PokemonName;
  imageUrl: string;
};

export function PokemonCard({ name, imageUrl }: Props) {
  return (
    <div className={styles.pokemon}>
      <img src={imageUrl} alt={name} className={styles.image} />
      <p className={styles.pokemonName}>{name}</p>
    </div>
  );
}
