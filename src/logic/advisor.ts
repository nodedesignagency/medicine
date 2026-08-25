import { Medicine, SymptomId } from '../data/types';
import { symptomLabel } from '../data/symptoms';

export type ProfileKey =
  | 'pregnant' | 'child' | 'asthma' | 'ulcer' | 'thinner' | 'alcohol'
  | 'kidney' | 'liver' | 'bp' | 'diabetes' | 'thyroid' | 'driving';

export type Profile = Partial<Record<ProfileKey, boolean>>;

export const PROFILE_OPTIONS: { key: ProfileKey; label: string }[] = [
  { key: 'pregnant', label: 'Pregnant' },
  { key: 'child', label: 'For a child' },
  { key: 'asthma', label: 'Asthma' },
  { key: 'ulcer', label: 'Ulcer / acidity' },
  { key: 'alcohol', label: 'Had alcohol' },
  { key: 'driving', label: 'Have to drive' },
  { key: 'bp', label: 'High BP' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'kidney', label: 'Kidney issue' },
  { key: 'liver', label: 'Liver issue' },
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'thinner', label: 'Blood thinners' },
];

type Rule = {
  key: ProfileKey;
  flag: Medicine['flags'][number];
  level: 'block' | 'caution';
  message: string;
};

/** Profile answer + medicine flag → a plain-English warning. */
const RULES: Rule[] = [
  { key: 'pregnant', flag: 'pregnancy', level: 'block',
    message: 'Not considered safe in pregnancy. Ask your doctor for an alternative — paracetamol is usually the one they allow.' },
  { key: 'child', flag: 'kids', level: 'block',
    message: 'Not meant for children. Both the drug and the dose are different for kids — this is a paediatrician call.' },
  { key: 'ulcer', flag: 'ulcer', level: 'block',
    message: 'You said you get ulcers or acidity. This class of painkiller can burn and even bleed the stomach lining.' },
  { key: 'asthma', flag: 'asthma', level: 'block',
    message: 'Anti-inflammatory painkillers can set off an asthma attack in some people. Paracetamol is the safer swap.' },
  { key: 'thinner', flag: 'thinner', level: 'block',
    message: 'You are on blood thinners. This raises your bleeding risk on top of them.' },
  { key: 'alcohol', flag: 'alcohol', level: 'block',
    message: 'With alcohol still in your system this is rough on the liver. Wait until tomorrow.' },
  { key: 'kidney', flag: 'kidney', level: 'caution',
    message: 'Go easy with kidney trouble — your doctor may want a lower dose or a different medicine.' },
  { key: 'liver', flag: 'liver', level: 'caution',
    message: 'Your liver has to process this. With liver trouble, confirm the dose before you take it.' },
  { key: 'bp', flag: 'bp', level: 'caution',
    message: 'This can nudge blood pressure upward. Worth watching if yours already runs high.' },
  { key: 'diabetes', flag: 'diabetes', level: 'caution',
    message: 'Check the sugar content or the effect on your sugars if you are diabetic.' },
  { key: 'thyroid', flag: 'thyroid', level: 'caution',
    message: 'Can interfere with thyroid function or your thyroid medicine.' },
  { key: 'driving', flag: 'drowsy', level: 'caution',
    message: 'This will make you sleepy. Do not drive or ride after taking it.' },
];

export type Verdict = 'yes' | 'caution' | 'no' | 'wrong-fit';

export type Advice = {
  verdict: Verdict;
  headline: string;
  reason: string;
  /** Only the warnings actually triggered by the answers given. */
  warnings: string[];
  fit: 'direct' | 'partial' | 'none';
  matched: SymptomId[];
};

const list = (items: string[]) =>
  items.length <= 1
    ? items[0] ?? ''
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** The core question: I have X — can I take this? */
export function advise(medicine: Medicine, symptoms: SymptomId[], profile: Profile = {}): Advice {
  const direct = symptoms.filter((s) => medicine.treats.includes(s));
  const partial = symptoms.filter((s) => (medicine.alsoHelps ?? []).includes(s));
  const fit: Advice['fit'] = direct.length ? 'direct' : partial.length ? 'partial' : 'none';

  const triggered = RULES.filter((r) => profile[r.key] && medicine.flags.includes(r.flag));
  const blocks = triggered.filter((r) => r.level === 'block');
  const cautions = triggered.filter((r) => r.level === 'caution');

  const warnings = [
    ...blocks.map((r) => r.message),
    ...cautions.map((r) => r.message),
  ];
  if (medicine.rx) {
    warnings.push('This is a prescription medicine. It should be a doctor starting it, not the cabinet.');
  }

  const names = list(direct.map(symptomLabel).map((s) => s.toLowerCase()));
  const partialNames = list(partial.map(symptomLabel).map((s) => s.toLowerCase()));

  if (!symptoms.length) {
    return {
      verdict: 'caution',
      headline: 'Tell me what is wrong',
      reason: 'Pick a symptom and I will tell you whether this is the right thing to reach for.',
      warnings,
      fit,
      matched: [],
    };
  }

  if (fit === 'none') {
    return {
      verdict: 'wrong-fit',
      headline: 'Wrong tool for this',
      reason: `${medicine.brand} is for ${list(medicine.treats.map(symptomLabel).map((s) => s.toLowerCase())) || 'a different problem'} — it will not do anything for ${list(symptoms.map(symptomLabel).map((s) => s.toLowerCase()))}.`,
      warnings: medicine.rx ? ['This is a prescription medicine.'] : [],
      fit,
      matched: [],
    };
  }

  if (blocks.length) {
    return {
      verdict: 'no',
      headline: 'Better not',
      reason: `It would help your ${names || partialNames}, but one of your answers rules it out.`,
      warnings,
      fit,
      matched: [...direct, ...partial],
    };
  }

  if (cautions.length || medicine.rx || fit === 'partial') {
    return {
      verdict: 'caution',
      headline: fit === 'partial' ? 'It might take the edge off' : 'Yes — with one thing to know',
      reason:
        fit === 'partial'
          ? `${medicine.brand} is not made for ${partialNames}, but it does help a bit.`
          : `${medicine.brand} is the right kind of medicine for ${names}.`,
      warnings,
      fit,
      matched: [...direct, ...partial],
    };
  }

  return {
    verdict: 'yes',
    headline: 'Yes, that is the right one',
    reason: `${medicine.brand} is exactly what you reach for with ${names}. ${medicine.dose}, ${medicine.every}.`,
    warnings,
    fit,
    matched: direct,
  };
}

export type Suggestion = { medicine: Medicine; advice: Advice; score: number };

/** Rank what is already in the cabinet against how the person feels. */
export function suggestFrom(
  cabinet: Medicine[],
  symptoms: SymptomId[],
  profile: Profile = {}
): Suggestion[] {
  if (!symptoms.length) return [];
  return cabinet
    .map((medicine) => {
      const advice = advise(medicine, symptoms, profile);
      let score = advice.fit === 'direct' ? 100 : advice.fit === 'partial' ? 55 : 0;
      // Reward covering more than one of the selected symptoms at once.
      score += advice.matched.length * 8;
      if (advice.verdict === 'no') score -= 90;
      if (advice.verdict === 'caution') score -= 12;
      if (medicine.rx) score -= 18;
      return { medicine, advice, score };
    })
    .filter((s) => s.advice.fit !== 'none')
    .sort((a, b) => b.score - a.score);
}

/** Same-ingredient and spacing traps, checked across a whole shortlist. */
export function overlapWarnings(medicines: Medicine[]): string[] {
  const out: string[] = [];
  const paracetamol = medicines.filter((m) => /paracetamol/i.test(m.salt));
  if (paracetamol.length > 1) {
    out.push(
      `${list(paracetamol.map((m) => m.brand))} all contain paracetamol. Take only one of them — stacking them is an overdose, and the liver is what pays.`
    );
  }
  const nsaid = medicines.filter((m) => /(ibuprofen|aspirin|diclofenac|mefenamic|naproxen)/i.test(m.salt) && m.form !== 'gel' && m.form !== 'cream');
  if (nsaid.length > 1) {
    out.push(`${list(nsaid.map((m) => m.brand))} are the same family of painkiller. Doubling them raises stomach-bleed risk without adding relief.`);
  }
  const antacid = medicines.find((m) => /hydroxide|bicarbonate/i.test(m.salt));
  const tablets = medicines.filter((m) => m.form === 'tablet' || m.form === 'capsule');
  if (antacid && tablets.length) {
    out.push(`Leave about 2 hours between ${antacid.brand} and your tablets — antacids block how much of the other medicine gets absorbed.`);
  }
  return out;
}

/** Things no app should quietly sit on. Shown above any suggestion. */
export const RED_FLAGS: Partial<Record<SymptomId, string>> = {
  fever: 'Fever above 103°F, or any fever running past 3 days, needs a doctor — not another tablet.',
  burn: 'Cool the burn under running water for 15 minutes before any cream. If it blisters or is bigger than your palm, go in.',
  cut: 'A deep cut, one that will not stop bleeding, or anything from rusty metal needs proper attention and possibly a tetanus shot.',
  'loose-motions': 'Blood in the stool, or loose motions with a high fever, means see a doctor — do not just stop the gut.',
  nausea: 'Vomiting that will not let you keep water down for a day is a dehydration risk. Get seen.',
  'itch-rash': 'A rash with swelling of the face or any trouble breathing is an emergency. Go now, do not self-treat.',
  cramps: 'Pain that stops you functioning every single month is worth investigating, not just medicating.',
  dehydration: 'Dizziness on standing, or not passing urine for 8 hours, means fluids are not keeping up. Get help.',
};
