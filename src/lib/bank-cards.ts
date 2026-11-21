"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export type BankCard = {
  id: string;
  bank: string;
  last4: string;
  iban: string;
  cardNumber?: string;
  isDefault: boolean;
};

const STORAGE_KEY = "kif-bank-cards-v1";
const DEFAULT_CARDS: BankCard[] = [
  { id: "card1", bank: "بانک ملی ایران", last4: "4589", iban: "IR050170000000123456789012", isDefault: true },
  { id: "card2", bank: "بانک سامان", last4: "7823", iban: "IR700560000000987654321098", isDefault: false },
];

export function useBankCards() {
  const { user } = useAuth();
  const scopedStorageKey = `${STORAGE_KEY}:${user?.phone || "guest"}`;
  const [cards, setCards] = useState<BankCard[]>(DEFAULT_CARDS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset card list while switching account storage scopes
    setReady(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset card list while switching account storage scopes
    setCards(DEFAULT_CARDS);
    try {
      const saved = localStorage.getItem(scopedStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as BankCard[];
        if (Array.isArray(parsed)) {
          const safe = parsed.filter((card) => card && typeof card.id === "string" && typeof card.bank === "string" && typeof card.last4 === "string")
            .map((card) => ({ id: card.id, bank: card.bank, last4: card.last4, iban: typeof card.iban === "string" ? card.iban : "", isDefault: !!card.isDefault }));
          if (safe.length && !safe.some(card => card.isDefault)) safe[0].isDefault = true;
          let defaultFound = false;
          safe.forEach(card => { if (card.isDefault && !defaultFound) defaultFound = true; else if (card.isDefault) card.isDefault = false; });
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved bank cards on mount
          setCards(safe);
        }
      }
    } catch {
      // Keep the demo defaults if local storage is unavailable or malformed.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mark local bank-card storage hydration complete
    setReady(true);
  }, [scopedStorageKey]);

  const persist = useCallback((next: BankCard[]) => {
    const safe = next.map((card) => ({ id: card.id, bank: card.bank, last4: card.last4, iban: card.iban, isDefault: card.isDefault }));
    setCards(safe);
    try { localStorage.setItem(scopedStorageKey, JSON.stringify(safe)); } catch { /* storage may be disabled */ }
  }, [scopedStorageKey]);

  const addCard = useCallback((card: BankCard) => {
    const next = [...cards, { ...card, cardNumber: undefined, isDefault: cards.length === 0 }];
    persist(next);
  }, [cards, persist]);

  const removeCard = useCallback((id: string) => {
    const remaining = cards.filter((card) => card.id !== id);
    if (remaining.length && !remaining.some((card) => card.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
    persist(remaining);
  }, [cards, persist]);

  const setDefault = useCallback((id: string) => {
    persist(cards.map((card) => ({ ...card, isDefault: card.id === id })));
  }, [cards, persist]);

  return { cards: ready ? cards : [], ready, addCard, removeCard, setDefault };
}
