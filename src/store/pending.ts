import { Medicine } from '../data/types';

/**
 * Holds a freshly recognised medicine that has not been saved to the cabinet yet,
 * so the detail screen can show it before the user decides to keep it.
 */
const pending = new Map<string, Medicine>();

export const rememberPending = (m: Medicine) => {
  pending.set(m.id, m);
};

export const getPending = (id: string) => pending.get(id);
