export type CategoryId = 'pain' | 'cold' | 'stomach' | 'allergy' | 'firstaid' | 'daily' | 'antibiotic';

export type SymptomId =
  | 'fever' | 'headache' | 'bodyache' | 'toothache' | 'cramps' | 'sprain'
  | 'dry-cough' | 'wet-cough' | 'blocked-nose' | 'runny-nose' | 'sore-throat'
  | 'gas' | 'acidity' | 'indigestion' | 'loose-motions' | 'constipation' | 'nausea' | 'dehydration'
  | 'sneezing' | 'itch-rash' | 'fungal'
  | 'cut' | 'burn' | 'motion-sickness'
  | 'low-energy';

/** Machine-readable contraindications. These drive the "should I take this?" answer. */
export type FlagId =
  | 'liver' | 'kidney' | 'ulcer' | 'asthma' | 'pregnancy' | 'alcohol'
  | 'drowsy' | 'bp' | 'diabetes' | 'thinner' | 'kids' | 'thyroid' | 'longterm';

export type Form = 'tablet' | 'capsule' | 'syrup' | 'gel' | 'cream' | 'sachet' | 'spray' | 'lozenge' | 'liquid' | 'strip' | 'rub';

/** Cover treatments, so a shelf reads like a row of different book spines. */
export type Cover = 'block' | 'stripe' | 'split' | 'band' | 'circle';

export type Medicine = {
  id: string;
  brand: string;
  salt: string;
  maker: string;
  category: CategoryId;
  form: Form;
  /** Prescription-only in India (Schedule H / H1). */
  rx: boolean;
  /** One plain-English line. No jargon. */
  whatItDoes: string;
  treats: SymptomId[];
  /** Helps indirectly — the advisor grades these lower than `treats`. */
  alsoHelps?: SymptomId[];
  dose: string;
  every: string;
  maxPerDay: string;
  food: 'before' | 'after' | 'either';
  /** Plain-English cautions shown as a list. */
  avoid: string[];
  flags: FlagId[];
  /** Months of shelf life used to seed a believable expiry date. */
  shelfLifeMonths: number;
  color: string;
  ink: string;
  cover: Cover;
  /** True when the card was built by AI recognition rather than the bundled DB. */
  synthetic?: boolean;
};

export type Category = {
  id: CategoryId;
  title: string;
  short: string;
};
