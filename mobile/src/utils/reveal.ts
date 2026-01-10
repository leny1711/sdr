import { Conversation, Message } from '../types';
import { CHAPTER_THRESHOLDS, MAX_REVEAL_LEVEL } from '../constants/reveal';

export const calculateRevealLevel = (count: number): number => {
  if (count >= CHAPTER_THRESHOLDS[4]) return 4;
  if (count >= CHAPTER_THRESHOLDS[3]) return 3;
  if (count >= CHAPTER_THRESHOLDS[2]) return 2;
  if (count >= CHAPTER_THRESHOLDS[1]) return 1;
  return 0;
};

const countTextMessages = (messages: Message[]) =>
  messages.filter((message) => message?.type === 'TEXT').length;

export const deriveRevealProgress = (conversation?: Conversation | null, messages: Message[] = []) => {
  const messageTextCount = countTextMessages(messages);
  const conversationCount = conversation?.textMessageCount;
  const derivedCount = conversationCount ?? messageTextCount;
  const derivedReveal =
    conversation?.revealLevel ??
    (conversationCount !== undefined
      ? calculateRevealLevel(conversationCount)
      : calculateRevealLevel(messageTextCount));
  return {
    textMessageCount: derivedCount,
    revealLevel: derivedReveal,
  };
};

export const getRevealChapter = (level: number): string => {
  switch (level) {
    case 0:
      return 'Chapitre 0 — Verrouillé';
    case 1:
      return 'Chapitre 1 — Le début';
    case 2:
      return 'Chapitre 2 — La découverte';
    case 3:
      return 'Chapitre 3 — La connexion';
    default:
      return 'Chapitre 4 — Révélation';
  }
};

export const getPhotoEffects = (level: number) => {
  const clampedLevel = Math.max(0, Math.min(MAX_REVEAL_LEVEL, Math.round(level)));

  if (clampedLevel === 0) {
    return { blurRadius: 24, grayscale: true, imageOpacity: 0.8, overlayColor: 'rgba(0,0,0,0.35)' };
  }

  if (clampedLevel === 1) {
    return { blurRadius: 18, grayscale: true, imageOpacity: 0.9, overlayColor: 'rgba(0,0,0,0.28)' };
  }

  if (clampedLevel === 2) {
    return { blurRadius: 12, grayscale: true, imageOpacity: 0.95, overlayColor: 'rgba(0,0,0,0.18)' };
  }

  if (clampedLevel === 3) {
    return { blurRadius: 6, grayscale: false, imageOpacity: 0.96, overlayColor: 'rgba(255,255,255,0.1)' };
  }

  return { blurRadius: 0, grayscale: false, imageOpacity: 1 };
};

export const getChapterNarrative = (level: number): string => {
  const clampedLevel = Math.max(0, Math.min(MAX_REVEAL_LEVEL, Math.round(level)));
  switch (clampedLevel) {
    case 0:
      return 'Chapitre 0 – Verrouillé';
    case 1:
      return 'Chapitre 1 – Le début';
    case 2:
      return 'Chapitre 2 – La découverte';
    case 3:
      return 'Chapitre 3 – La connexion';
    default:
      return 'Chapitre 4 – Révélation';
  }
};

export const shouldHidePhoto = (revealLevel: number, photoUrl?: string | null) => {
  if (!photoUrl) return true;
  return revealLevel < 0;
};
