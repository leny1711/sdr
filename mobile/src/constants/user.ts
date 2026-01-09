export const GENDER_OPTIONS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
] as const;

export const INTEREST_OPTIONS = GENDER_OPTIONS;

export const getGenderLabel = (value?: string) =>
  GENDER_OPTIONS.find((option) => option.value === value)?.label ?? value ?? 'Non renseigné';
