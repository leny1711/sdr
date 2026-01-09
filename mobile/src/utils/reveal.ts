export const calculateRevealLevel = (count: number): number => {
  if (count >= 50) return 4;
  if (count >= 35) return 3;
  if (count >= 20) return 2;
  if (count >= 10) return 1;
  return 0;
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
    return { blurRadius: 22, grayscale, overlayOpacity: 0.28, coverRatio: 0.4 };
  }

  if (clampedLevel === 1) return { blurRadius: 16, grayscale, overlayOpacity: 0.18, coverRatio: 0.25 };
  if (clampedLevel === 2) return { blurRadius: 9, grayscale: false, overlayOpacity: 0.12, coverRatio: 0.12 };
  if (clampedLevel === 3) return { blurRadius: 4, grayscale: false, overlayOpacity: 0.06, coverRatio: 0 };

  return { blurRadius: 0, grayscale: false, overlayOpacity: 0, coverRatio: 0 };
};

export const getChapterNarrative = (level: number): string => {
  switch (Math.max(0, Math.min(4, Math.round(level)))) {
    case 0:
      return 'The beginning';
    case 1:
      return 'Discovery';
    case 2:
      return 'Connection';
    case 3:
      return 'Clarity';
    default:
      return 'Revelation';
  }
};

export const shouldHidePhoto = (revealLevel: number, photoHidden?: boolean, photoUrl?: string | null) => {
  const hasPhoto = !!photoUrl;
  if (!hasPhoto) return true;
  if (photoHidden && revealLevel < 0) return true;
  return false;
};
