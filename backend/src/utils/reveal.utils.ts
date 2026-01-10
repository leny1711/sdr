import { ChapterNumber, RevealLevel } from '../types';

type WithPhoto = {
  photoUrl?: string | null;
};

export const normalizePhotoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const computeChapterFromMessageCount = (messageCount: number): ChapterNumber => {
  if (messageCount >= 50) return 3;
  if (messageCount >= 25) return 2;
  if (messageCount >= 10) return 1;
  return 0;
};

export const computeRevealLevel = (textMessageCount: number): RevealLevel => {
  if (textMessageCount >= 50) return 3;
  if (textMessageCount >= 25) return 2;
  if (textMessageCount >= 10) return 1;
  return 0;
};

export const applyRevealToUser = <T extends WithPhoto>(user: T, revealLevel: number) => {
  const normalizedPhoto = normalizePhotoUrl(user.photoUrl);

  const canRevealPhoto = revealLevel > 0;
  const photoHidden = !normalizedPhoto || !canRevealPhoto;

  return {
    ...user,
    photoUrl: normalizedPhoto,
    photoHidden,
  };
};

export const getChapterSystemLabel = (chapter: ChapterNumber) => {
  switch (chapter) {
    case 0:
      return 'Chapitre 0 — Verrouillé';
    case 1:
      return 'Chapitre 1 — Le début';
    case 2:
      return 'Chapitre 2 — La découverte';
    case 3:
      return 'Chapitre 3 — La connexion';
    default:
      throw new Error(`Invalid chapter number: ${chapter}`);
  }
};
