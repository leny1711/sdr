import prisma from '../config/database';

export class DiscoveryService {
  static async getDiscoverableUsers(userId: string, limit: number = 10) {
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
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        city: true,
        description: true,
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
      throw new Error('Cannot like yourself');
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
      throw new Error('Already liked this user');
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
      throw new Error('Cannot dislike yourself');
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
      throw new Error('Already disliked this user');
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
