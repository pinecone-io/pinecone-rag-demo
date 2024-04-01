import { ICard } from "./Card";
import { IUrlEntry } from "./UrlButton";

export async function seedDocuments(
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>,
  splittingMethod: string,
  chunkSize: number,
  overlap: number
): Promise<void> {
  // setEntries((seeded: IUrlEntry[]) =>
  //   seeded.map((seed: IUrlEntry) => { ...seed, loading: true })

  // );
  const response = await fetch("/api/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      options: {
        splittingMethod,
        chunkSize,
        overlap,
      },
    }),
  });

  const { documents } = await response.json();

  setCards(documents);

  // setEntries((prevEntries: IUrlEntry[]) =>
  //   prevEntries.map((entry: IUrlEntry) =>
  //     entry.url === url ? { ...entry, seeded: true, loading: false } : entry
  //   )
  // );
}

export async function clearIndex(
  setEntries: React.Dispatch<React.SetStateAction<IUrlEntry[]>>,
  setCards: React.Dispatch<React.SetStateAction<ICard[]>>
) {
  const response = await fetch("/api/clearIndex", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    setEntries((prevEntries: IUrlEntry[]) =>
      prevEntries.map((entry: IUrlEntry) => ({
        ...entry,
        seeded: false,
        loading: false,
      }))
    );
    setCards([]);
    return true
  }
}