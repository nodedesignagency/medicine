import { SymptomId } from './types';

export type Symptom = { id: SymptomId; label: string; emoji: string; group: string };

/** The chips on the Ask screen. Ordered by how often you'd actually reach for the cabinet. */
export const SYMPTOMS: Symptom[] = [
  { id: 'fever', label: 'Fever', emoji: '🤒', group: 'Body' },
  { id: 'headache', label: 'Headache', emoji: '🤕', group: 'Body' },
  { id: 'bodyache', label: 'Body ache', emoji: '💪', group: 'Body' },
  { id: 'toothache', label: 'Toothache', emoji: '🦷', group: 'Body' },
  { id: 'cramps', label: 'Period cramps', emoji: '🌙', group: 'Body' },
  { id: 'sprain', label: 'Sprain / stiff neck', emoji: '🩹', group: 'Body' },

  { id: 'dry-cough', label: 'Dry cough', emoji: '😮‍💨', group: 'Cold & cough' },
  { id: 'wet-cough', label: 'Cough with phlegm', emoji: '🫁', group: 'Cold & cough' },
  { id: 'blocked-nose', label: 'Blocked nose', emoji: '👃', group: 'Cold & cough' },
  { id: 'runny-nose', label: 'Runny nose', emoji: '🤧', group: 'Cold & cough' },
  { id: 'sore-throat', label: 'Sore throat', emoji: '🗣️', group: 'Cold & cough' },

  { id: 'gas', label: 'Gas / bloating', emoji: '🎈', group: 'Stomach' },
  { id: 'acidity', label: 'Acidity / burning', emoji: '🔥', group: 'Stomach' },
  { id: 'indigestion', label: 'Heavy stomach', emoji: '🍛', group: 'Stomach' },
  { id: 'loose-motions', label: 'Loose motions', emoji: '🚻', group: 'Stomach' },
  { id: 'constipation', label: 'Constipation', emoji: '🧱', group: 'Stomach' },
  { id: 'nausea', label: 'Nausea / vomiting', emoji: '🤢', group: 'Stomach' },
  { id: 'dehydration', label: 'Weak / dehydrated', emoji: '💧', group: 'Stomach' },

  { id: 'sneezing', label: 'Sneezing / allergy', emoji: '🌸', group: 'Allergy & skin' },
  { id: 'itch-rash', label: 'Itchy rash', emoji: '🫧', group: 'Allergy & skin' },
  { id: 'fungal', label: 'Fungal itch', emoji: '🍄', group: 'Allergy & skin' },

  { id: 'cut', label: 'Cut / wound', emoji: '🩸', group: 'First aid' },
  { id: 'burn', label: 'Minor burn', emoji: '♨️', group: 'First aid' },
  { id: 'motion-sickness', label: 'Motion sickness', emoji: '🚗', group: 'First aid' },
  { id: 'low-energy', label: 'Low energy', emoji: '🔋', group: 'First aid' },
];

export const SYMPTOM_BY_ID: Record<string, Symptom> = Object.fromEntries(
  SYMPTOMS.map((s) => [s.id, s])
);

export const symptomLabel = (id: SymptomId) => SYMPTOM_BY_ID[id]?.label ?? id;
