import { Conversation, Message } from '../types';

export const calculateRevealLevel = (count: number): number => {
  if (count >= 50) return 4;
  if (count >= 35) return 3;
  if (count >= 20) return 2;
  if (count >= 10) return 1;
  return 0;
};

const countTextMessages = (messages: Message[]) =>
  messages.filter((message) => message?.type === 'TEXT').length;

export const deriveRevealProgress = (conversation?: Conversation | null, messages: Message[] = []) => {
  const localTextCount = countTextMessages(messages);
  const persistedCount = conversation?.textMessageCount ?? 0;
  const textMessageCount = Math.max(localTextCount, persistedCount);
  const derivedLevel = calculateRevealLevel(textMessageCount);
  const persistedLevel = conversation?.revealLevel ?? 0;

  return {
    textMessageCount,
    revealLevel: Math.max(derivedLevel, persistedLevel),
  };
};

export const getRevealChapter = (level: number): string => {
  switch (level) {
    case 0:
      return 'Chapitre 1 • Début flouté';
    case 1:
      return 'Chapitre 2 • Découverte (flou + N&B)';
    case 2:
      return 'Chapitre 3 • Connexion (couleurs partielles)';
    case 3:
      return 'Chapitre 4 • Clarté (presque net)';
    case 4:
      return 'Chapitre 5 • Révélation complète';
    default:
      return 'Chapitre inconnu';
  }
};

export const getPhotoEffects = (level: number) => {
  const clampedLevel = Math.max(0, Math.min(4, Math.round(level)));
  const grayscale = clampedLevel <= 1;

  if (clampedLevel === 0) {
    return { blurRadius: 28, grayscale, overlayOpacity: 0.48, imageOpacity: 0.35, coverRatio: 0.3 };
  }

  if (clampedLevel === 1) return { blurRadius: 20, grayscale, overlayOpacity: 0.32, imageOpacity: 0.55, coverRatio: 0.18 };
  if (clampedLevel === 2) return { blurRadius: 12, grayscale: false, overlayOpacity: 0.18, imageOpacity: 0.7, coverRatio: 0.08 };
  if (clampedLevel === 3) return { blurRadius: 7, grayscale: false, overlayOpacity: 0.08, imageOpacity: 0.85, coverRatio: 0 };

  return { blurRadius: 0, grayscale: false, overlayOpacity: 0, imageOpacity: 1, coverRatio: 0 };
};

export const getChapterNarrative = (level: number): string => {
  const clampedLevel = Math.max(0, Math.min(4, Math.round(level)));
  switch (clampedLevel) {
    case 0:
      return 'Chapitre 1 – Le commencement';
    case 1:
      return 'Chapitre 2 – La découverte';
    case 2:
      return 'Chapitre 3 – Les contours se dessinent';
    case 3:
      return 'Chapitre 4 – La clarté se rapproche';
    default:
      return 'Chapitre 5 – Révélation complète';
  }
};

export const shouldHidePhoto = (revealLevel: number, photoUrl?: string | null) => {
  if (!photoUrl) return true;
  if (revealLevel < 0) return true;
  // We keep rendering the photo with strong visual obfuscation for early chapters
  // to avoid empty or grey placeholders.
  return false;
};
