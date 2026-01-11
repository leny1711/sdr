import { ChapterNumber, RevealLevel } from '../types';

export const CHAPTER_THRESHOLDS: number[] = [0, 10, 25, 50, 80];

type WithPhoto = {
  photoUrl?: string | null;
};

export const normalizePhotoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const computeChapterFromMessageCount = (messageCount: number): ChapterNumber => {
  if (messageCount >= CHAPTER_THRESHOLDS[4]) return 4;
  if (messageCount >= CHAPTER_THRESHOLDS[3]) return 3;
  if (messageCount >= CHAPTER_THRESHOLDS[2]) return 2;
  if (messageCount >= CHAPTER_THRESHOLDS[1]) return 1;
  return 0;
};

export const computeRevealLevel = (textMessageCount: number): RevealLevel => {
  if (textMessageCount >= CHAPTER_THRESHOLDS[4]) return 4;
  if (textMessageCount >= CHAPTER_THRESHOLDS[3]) return 3;
  if (textMessageCount >= CHAPTER_THRESHOLDS[2]) return 2;
  if (textMessageCount >= CHAPTER_THRESHOLDS[1]) return 1;
  return 0;
};

export const applyRevealToUser = <T extends WithPhoto>(user: T, _revealLevel: number) => {
  const normalizedPhoto = normalizePhotoUrl(user.photoUrl);

  const photoHidden = !normalizedPhoto;

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
    case 4:
      return 'Chapitre 4 — Révélation';
    default:
      return 'Chapitre 4 — Révélation';
  }
};
