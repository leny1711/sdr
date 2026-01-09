export const buildFullName = (firstName?: string, lastName?: string, fallbackName?: string): string => {
  const composed = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  const name = fallbackName ?? composed;
  return name.trim();
};

export const splitFullName = (fullName: string | null | undefined): { firstName: string; lastName: string } => {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') };
};
