import prisma from '../config/database';

export class MatchService {
  static async getUserMatches(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            matchPreference: true,
            city: true,
            description: true,
            photoUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            matchPreference: true,
            city: true,
            description: true,
            photoUrl: true,
          },
        },
        conversation: {
          select: {
            id: true,
            textMessageCount: true,
            revealLevel: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedMatches = matches.map((match) => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        matchId: match.id,
        user: otherUser,
        conversation: match.conversation,
        createdAt: match.createdAt,
      };
    });

    return formattedMatches;
  }

  static async checkIfMatched(userId1: string, userId2: string): Promise<boolean> {
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 },
        ],
      },
    });

    return !!match;
  }
}
