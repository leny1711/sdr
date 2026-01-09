type WithPhoto = {
  photoUrl?: string | null;
};

export const normalizePhotoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const computeRevealLevel = (textMessageCount: number): number => {
  if (textMessageCount >= 50) return 4;
  if (textMessageCount >= 35) return 3;
  if (textMessageCount >= 20) return 2;
  if (textMessageCount >= 10) return 1;
  return 0;
};

export const applyRevealToUser = <T extends WithPhoto>(user: T, revealLevel: number) => {
  const normalizedPhoto = normalizePhotoUrl(user.photoUrl);

  const canRevealPhoto = revealLevel >= 0;
  const photoHidden = !normalizedPhoto || !canRevealPhoto;

  return {
    ...user,
    photoUrl: normalizedPhoto,
    photoHidden,
  };
};
