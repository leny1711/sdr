import prisma from '../config/database';
import { GENDER_OPTIONS } from '../constants/user.constants';

const GENDER_SYNONYMS: Record<(typeof GENDER_OPTIONS)[number], string[]> = {
  male: ['male', 'homme', 'man', 'Male', 'Homme'],
  female: ['female', 'femme', 'woman', 'Female', 'Femme'],
  other: ['other', 'autre', 'Other', 'Autre'],
};

const LEGACY_MATCH_PREFERENCE: Record<(typeof GENDER_OPTIONS)[number], string[]> = {
  male: ['Hommes', 'hommes', 'homme', 'male', 'Male', 'Les deux', 'les deux', 'both'],
  female: ['Femmes', 'femmes', 'femme', 'female', 'Female', 'Les deux', 'les deux', 'both'],
  other: ['Les deux', 'les deux', 'both', 'Autre', 'autre', 'other', 'Other'],
};

const normalizeGender = (value?: string): (typeof GENDER_OPTIONS)[number] => {
  const lowered = (value || '').toLowerCase();
  if (GENDER_SYNONYMS.male.some((v) => v.toLowerCase() === lowered)) return 'male';
  if (GENDER_SYNONYMS.female.some((v) => v.toLowerCase() === lowered)) return 'female';
  if (GENDER_SYNONYMS.other.some((v) => v.toLowerCase() === lowered)) return 'other';
  throw new Error('Genre invalide');
};

const normalizeInterestedIn = (values?: string[] | null): (typeof GENDER_OPTIONS)[number][] => {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((value) => {
      try {
        return normalizeGender(value);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as (typeof GENDER_OPTIONS)[number][];
  return Array.from(new Set(normalized));
};

const deriveInterestedInFromLegacy = (matchPreference?: string | null): (typeof GENDER_OPTIONS)[number][] => {
  const lowered = (matchPreference || '').toLowerCase();
  if (lowered === 'hommes' || lowered === 'homme' || lowered === 'male') return ['male'];
  if (lowered === 'femmes' || lowered === 'femme' || lowered === 'female') return ['female'];
  if (lowered === 'les deux' || lowered === 'both') return [...GENDER_OPTIONS];
  return [];
};

export class DiscoveryService {
  static async getDiscoverableUsers(userId: string, limit: number = 10) {
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gender: true,
        interestedIn: true,
        matchPreference: true,
      },
    });

    if (!requester) {
      throw new Error('Utilisateur introuvable');
    }

    const requesterGender = normalizeGender(requester.gender);
    const requesterInterestedIn = normalizeInterestedIn(requester.interestedIn);
    const finalInterestedIn =
      requesterInterestedIn.length > 0 ? requesterInterestedIn : deriveInterestedInFromLegacy(requester.matchPreference);

    if (!finalInterestedIn.length) {
      throw new Error('Aucune préférence de rencontre définie');
    }

    const blockedIds = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    });

    const blockedUserIds = new Set(
      blockedIds.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== userId)
    );

    const likedUserIds = await prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    });

    const likedIds = new Set(likedUserIds.map((l) => l.toUserId));

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [userId, ...Array.from(blockedUserIds), ...Array.from(likedIds)],
        },
        isActive: true,
        gender: { in: finalInterestedIn.flatMap((gender) => GENDER_SYNONYMS[gender]) },
        AND: [
          {
            OR: [
              { interestedIn: { hasSome: GENDER_SYNONYMS[requesterGender] } },
              { matchPreference: { in: LEGACY_MATCH_PREFERENCE[requesterGender] } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        interestedIn: true,
        city: true,
        description: true,
        photoUrl: true,
        createdAt: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      ...user,
      photoUrl: null,
      photoHidden: true,
    }));
  }

  static async likeUser(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new Error('Impossible de vous liker vous-même');
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    if (existingLike) {
      throw new Error('Utilisateur déjà liké');
    }

    const like = await prisma.like.create({
      data: {
        fromUserId,
        toUserId,
        isLike: true,
      },
    });

    const reciprocalLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId,
        },
      },
    });

    let match = null;

    if (reciprocalLike && reciprocalLike.isLike) {
      const conversation = await prisma.conversation.create({
        data: {
          user1Id: fromUserId < toUserId ? fromUserId : toUserId,
          user2Id: fromUserId < toUserId ? toUserId : fromUserId,
          textMessageCount: 0,
          revealLevel: 0,
        },
      });

      match = await prisma.match.create({
        data: {
          user1Id: fromUserId < toUserId ? fromUserId : toUserId,
          user2Id: fromUserId < toUserId ? toUserId : fromUserId,
          conversationId: conversation.id,
        },
      });
    }

    return { like, match };
  }

  static async dislikeUser(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new Error('Impossible de vous auto-refuser');
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId,
        },
      },
    });

    if (existingLike) {
      throw new Error('Utilisateur déjà refusé');
    }

    const dislike = await prisma.like.create({
      data: {
        fromUserId,
        toUserId,
        isLike: false,
      },
    });

    return dislike;
  }
}
