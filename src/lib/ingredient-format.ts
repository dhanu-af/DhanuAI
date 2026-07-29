export function ingredientKeywords(i: { alternateName: string | null; synonyms: string | null; aanValue: string | null; type: string; category: string | null }) {
  return [i.alternateName, i.synonyms, i.aanValue, i.type, i.category].filter(Boolean).join(", ");
}

function ensureFullStop(s: string) {
  return /[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;
}

export function ingredientAnswer(i: {
  name: string;
  synonyms: string | null;
  notes: string | null;
  verified: boolean;
  verificationSource: string | null;
  classification: string | null;
  chemicalName: string | null;
  casNumber: string | null;
  mainBenefit: string | null;
  usedFor: string | null;
  typicalDosage: string | null;
  storageConditions: string | null;
  safetyNotes: string | null;
  regulatoryStatus: string | null;
  tgaStatus: string | null;
  apvmaStatus: string | null;
  fdaStatus: string | null;
  emaStatus: string | null;
  aicisStatus: string | null;
}) {
  const sentences: string[] = [];
  if (i.synonyms) sentences.push(`Also known as ${i.synonyms}.`);
  if (i.notes) sentences.push(ensureFullStop(i.notes));
  if (i.mainBenefit) sentences.push(`Main benefit: ${ensureFullStop(i.mainBenefit)}`);
  if (i.usedFor) sentences.push(`Used for: ${ensureFullStop(i.usedFor)}`);
  if (i.chemicalName) sentences.push(`Chemical name: ${i.chemicalName}.`);
  if (i.casNumber) sentences.push(`CAS number: ${i.casNumber}.`);
  if (i.typicalDosage) sentences.push(`Typical dosage/use: ${ensureFullStop(i.typicalDosage)}`);
  const authorities = [
    i.tgaStatus && `TGA: ${i.tgaStatus}`,
    i.apvmaStatus && `APVMA: ${i.apvmaStatus}`,
    i.fdaStatus && `FDA: ${i.fdaStatus}`,
    i.emaStatus && `EMA: ${i.emaStatus}`,
    i.aicisStatus && `AICIS: ${i.aicisStatus}`,
  ].filter(Boolean);
  if (authorities.length > 0) sentences.push(`Regulatory status — ${authorities.join(", ")}.`);
  if (i.regulatoryStatus) sentences.push(`Regulatory summary: ${ensureFullStop(i.regulatoryStatus)}`);
  if (i.safetyNotes) sentences.push(`Safety & handling: ${ensureFullStop(i.safetyNotes)}`);
  if (i.storageConditions) sentences.push(`Storage: ${ensureFullStop(i.storageConditions)}`);

  if (sentences.length === 0) {
    return i.verified
      ? `${i.name} is verified, but no detail fields have been populated yet.`
      : `${i.name} has not yet been verified against an authoritative source — no details are available yet.`;
  }

  const body = sentences.join(" ");
  return i.verified ? body : `${body} (Not yet verified against an authoritative source.)`;
}
