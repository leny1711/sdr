import { Conversation, Message } from '../types';

export const calculateRevealLevel = (count: number): number => {
  if (count >= 50) return 3;
  if (count >= 25) return 2;
  if (count >= 10) return 1;
  return 0;
};

const countTextMessages = (messages: Message[]) =>
  messages.filter((message) => message?.type === 'TEXT').length;

export const deriveRevealProgress = (conversation?: Conversation | null, messages: Message[] = []) => {
  return {
    textMessageCount: conversation?.textMessageCount ?? countTextMessages(messages),
    revealLevel: conversation?.revealLevel ?? calculateRevealLevel(countTextMessages(messages)),
  };
};

export const getRevealChapter = (level: number): string => {
  switch (level) {
    case 0:
      return 'Chapitre 1 — Le début';
    case 1:
      return 'Chapitre 2 — La découverte';
    case 2:
      return 'Chapitre 3 — La connexion';
    default:
      return 'Chapitre 4 — Révélation';
  }
};

export const getPhotoEffects = (level: number) => {
  const clampedLevel = Math.max(0, Math.min(3, Math.round(level)));

  if (clampedLevel === 0) {
    return { blurRadius: 22, grayscale: true, imageOpacity: 0.9 };
  }

  if (clampedLevel === 1) return { blurRadius: 12, grayscale: true, imageOpacity: 1 };
  if (clampedLevel === 2) return { blurRadius: 6, grayscale: false, imageOpacity: 0.95 };
  return { blurRadius: 0, grayscale: false, imageOpacity: 1 };
};

export const getChapterNarrative = (level: number): string => {
  const clampedLevel = Math.max(0, Math.min(3, Math.round(level)));
  switch (clampedLevel) {
    case 0:
      return 'Chapitre 1 – Le début';
    case 1:
      return 'Chapitre 2 – La découverte';
    case 2:
      return 'Chapitre 3 – La connexion';
    default:
      return 'Chapitre 4 – Révélation';
  }
};

export const shouldHidePhoto = (revealLevel: number, photoUrl?: string | null) => {
  if (!photoUrl) return true;
  if (revealLevel < 0) return true;
  // We keep rendering the photo with strong visual obfuscation for early chapters
  // to avoid empty or grey placeholders.
  return false;
};
