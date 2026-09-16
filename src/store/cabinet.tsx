import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CABINET, MEDICINE_BY_ID } from '../data/medicines';
import { Form, Medicine } from '../data/types';
import { Profile } from '../logic/advisor';

const CABINET_KEY = 'cabinet.items.v1';
const SETTINGS_KEY = 'cabinet.settings.v1';

const MONTH = 1000 * 60 * 60 * 24 * 30;

export type CabinetItem = {
  medicineId: string;
  addedAt: number;
  expiresAt: number;
  /** How much is left in the pack. Optional so cabinets saved before this existed still load. */
  quantity?: number;
  /** Full record for medicines that came from AI recognition rather than the bundled DB. */
  custom?: Medicine;
};

export type ExpiryStatus = 'expired' | 'soon' | 'ok';

export function expiryStatus(item: CabinetItem, now = Date.now()): ExpiryStatus {
  if (item.expiresAt < now) return 'expired';
  if (item.expiresAt - now < 2 * MONTH) return 'soon';
  return 'ok';
}

export function expiryLabel(item: CabinetItem, now = Date.now()): string {
  const remaining = item.expiresAt - now;
  // Check expiry before rounding, or something 3 days gone reads as "expires this month".
  if (remaining < 0) {
    const gone = Math.max(1, Math.round(-remaining / MONTH));
    return `Expired ${gone} mo ago`;
  }
  const months = Math.round(remaining / MONTH);
  if (months === 0) return 'Expires this month';
  if (months === 1) return 'Expires next month';
  return `Good for ${months} mo`;
}

/**
 * Seeded cabinets pretend the box was bought at some point in the past, so the shelf
 * shows a believable mix of fresh, nearly-out and already-expired stock on first run.
 */
/** A drawer at home holds part-used packs, not a shop shelf of sealed boxes. */
function seedQuantity(m: Medicine): number {
  const full = fullPack(m.form);
  const used = (m.shelfLifeMonths * 3) % 5; // 0–4, deterministic per medicine
  return Math.max(1, full - used * Math.max(1, Math.round(full / 12)));
}

function seedExpiry(m: Medicine, now: number): number {
  const offsetMonths = ((m.shelfLifeMonths * 7) % 26) - 2;
  // The half-month shift keeps a seeded date off today exactly, which would otherwise
  // flip between "expired" and "expires this month" depending on when the status is read.
  return now + offsetMonths * MONTH + MONTH / 2;
}

/** A full pack, by the form the medicine comes in. */
export function fullPack(form: Form): number {
  switch (form) {
    case 'tablet': return 15;
    case 'capsule': return 10;
    case 'lozenge': return 8;
    case 'syrup':
    case 'liquid': return 100;
    case 'gel': return 30;
    case 'cream': return 20;
    case 'rub': return 25;
    case 'sachet': return 6;
    case 'strip': return 10;
    case 'spray': return 10;
  }
}

export function packUnit(form: Form): string {
  switch (form) {
    case 'tablet': return 'tablets';
    case 'capsule': return 'capsules';
    case 'lozenge': return 'lozenges';
    case 'syrup':
    case 'liquid': return 'ml';
    case 'gel':
    case 'cream':
    case 'rub': return 'g';
    case 'sachet': return 'sachets';
    case 'strip': return 'strips';
    case 'spray': return 'ml';
  }
}

/** Quantity left, falling back to a full pack for items stored before quantity existed. */
export function quantityOf(item: CabinetItem | undefined, m: Medicine | undefined): number {
  if (item?.quantity !== undefined) return item.quantity;
  return m ? fullPack(m.form) : 0;
}

/** Which of the two home designs to render. */
export type HomeStyle = 'glass' | 'shelf';

type Settings = { apiKey: string; profile: Profile; homeStyle: HomeStyle };

type Ctx = {
  ready: boolean;
  items: CabinetItem[];
  medicines: Medicine[];
  settings: Settings;
  has: (id: string) => boolean;
  itemFor: (id: string) => CabinetItem | undefined;
  resolve: (id: string) => Medicine | undefined;
  add: (m: Medicine) => void;
  remove: (id: string) => void;
  setApiKey: (key: string) => void;
  setProfile: (p: Profile) => void;
  setHomeStyle: (s: HomeStyle) => void;
  setQuantity: (id: string, n: number) => void;
  resetCabinet: () => void;
};

const CabinetContext = createContext<Ctx | null>(null);

export function CabinetProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [settings, setSettings] = useState<Settings>({ apiKey: '', profile: {}, homeStyle: 'glass' });

  // Load once on boot, seeding a starter cabinet the first time the app runs.
  useEffect(() => {
    (async () => {
      try {
        const [rawItems, rawSettings] = await Promise.all([
          AsyncStorage.getItem(CABINET_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (rawItems) {
          setItems(JSON.parse(rawItems));
        } else {
          const now = Date.now();
          setItems(
            DEFAULT_CABINET.flatMap((id) => {
              const m = MEDICINE_BY_ID[id];
              if (!m) return [];
              return [{
                medicineId: id,
                addedAt: now,
                expiresAt: seedExpiry(m, now),
                quantity: seedQuantity(m),
              }];
            })
          );
        }
        if (rawSettings) {
          setSettings({ apiKey: '', profile: {}, homeStyle: 'glass', ...JSON.parse(rawSettings) });
        }
      } catch {
        // A corrupt store should not brick the app — fall back to an empty cabinet.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(CABINET_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  const resolve = useCallback(
    (id: string) => {
      const custom = items.find((i) => i.medicineId === id)?.custom;
      return custom ?? MEDICINE_BY_ID[id];
    },
    [items]
  );

  const medicines = useMemo(
    () => items.flatMap((i) => {
      const m = i.custom ?? MEDICINE_BY_ID[i.medicineId];
      return m ? [m] : [];
    }),
    [items]
  );

  const add = useCallback((m: Medicine) => {
    setItems((prev) => {
      if (prev.some((i) => i.medicineId === m.id)) return prev;
      const now = Date.now();
      return [
        ...prev,
        {
          medicineId: m.id,
          addedAt: now,
          expiresAt: now + m.shelfLifeMonths * MONTH,
          quantity: fullPack(m.form),
          ...(m.synthetic ? { custom: m } : {}),
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.medicineId !== id));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      items,
      medicines,
      settings,
      has: (id) => items.some((i) => i.medicineId === id),
      itemFor: (id) => items.find((i) => i.medicineId === id),
      resolve,
      add,
      remove,
      setApiKey: (apiKey) => setSettings((s) => ({ ...s, apiKey })),
      setProfile: (profile) => setSettings((s) => ({ ...s, profile })),
      setHomeStyle: (homeStyle) => setSettings((s) => ({ ...s, homeStyle })),
      setQuantity: (id, n) =>
        setItems((prev) =>
          prev.map((i) => (i.medicineId === id ? { ...i, quantity: Math.max(0, n) } : i))
        ),
      resetCabinet: () => {
        const now = Date.now();
        setItems(
          DEFAULT_CABINET.flatMap((id) => {
            const m = MEDICINE_BY_ID[id];
            return m
              ? [{ medicineId: id, addedAt: now, expiresAt: seedExpiry(m, now), quantity: seedQuantity(m) }]
              : [];
          })
        );
      },
    }),
    [ready, items, medicines, settings, resolve, add, remove]
  );

  return <CabinetContext.Provider value={value}>{children}</CabinetContext.Provider>;
}

export function useCabinet() {
  const ctx = useContext(CabinetContext);
  if (!ctx) throw new Error('useCabinet must be used inside CabinetProvider');
  return ctx;
}
