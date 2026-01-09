import prisma from '../config/database';
import { MATCH_PREFERENCE_OPTIONS, GENDER_OPTIONS } from '../constants/user.constants';

export class DiscoveryService {
  static async getDiscoverableUsers(userId: string, limit: number = 10) {
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        matchPreference: true,
      },
    });

    if (!requester) {
      throw new Error('Utilisateur introuvable');
    }

    const preference: (typeof MATCH_PREFERENCE_OPTIONS)[number] = MATCH_PREFERENCE_OPTIONS.includes(
      requester.matchPreference as (typeof MATCH_PREFERENCE_OPTIONS)[number]
    )
      ? (requester.matchPreference as (typeof MATCH_PREFERENCE_OPTIONS)[number])
      : 'Les deux';

    const preferenceToGender: Record<
      (typeof MATCH_PREFERENCE_OPTIONS)[number],
      (typeof GENDER_OPTIONS)[number] | undefined
    > = {
      Hommes: 'Homme',
      Femmes: 'Femme',
      'Les deux': undefined,
    };

    const genderFilter = preferenceToGender[preference];

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
        ...(genderFilter && { gender: genderFilter }),
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        matchPreference: true,
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

    return users;
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
