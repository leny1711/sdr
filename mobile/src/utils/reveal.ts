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
      return 'Chapitre 0 • Photo cachée';
    case 1:
      return 'Chapitre 1 • Silhouette floutée (N&B)';
    case 2:
      return 'Chapitre 2 • Les contours se dessinent (N&B)';
    case 3:
      return 'Chapitre 3 • Les couleurs apparaissent';
    case 4:
      return 'Chapitre final • Photo dévoilée';
    default:
      return 'Chapitre inconnu';
  }
};

export const getPhotoEffects = (level: number) => {
  if (level <= 0) {
    return { blurRadius: 24, grayscale: true, overlayOpacity: 0.45 };
  }

  if (level === 1) return { blurRadius: 18, grayscale: true, overlayOpacity: 0.35 };
  if (level === 2) return { blurRadius: 10, grayscale: true, overlayOpacity: 0.22 };
  if (level === 3) return { blurRadius: 4, grayscale: false, overlayOpacity: 0.12 };

  return { blurRadius: 0, grayscale: false, overlayOpacity: 0 };
};

export const shouldHidePhoto = (revealLevel: number, photoHidden?: boolean, photoUrl?: string | null) => {
  const hasPhoto = !!photoUrl;
  if (!hasPhoto) return true;
  return revealLevel <= 0 || !!photoHidden;
};
