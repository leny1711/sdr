import prisma from '../config/database';

export class UserService {
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        matchPreference: true,
        city: true,
        description: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const [firstName = '', ...lastParts] = (user.name ?? '').trim().split(' ');
    const lastName = lastParts.join(' ');

    return {
      ...user,
      firstName,
      lastName,
    };
  }

  static async updateProfile(userId: string, data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    matchPreference?: string;
    city?: string;
    description?: string;
    photoUrl?: string;
  }) {
    const { firstName, lastName, ...rest } = data;
    const payload = { ...rest };

    if (!payload.name && (firstName || lastName)) {
      payload.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: payload,
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        matchPreference: true,
        city: true,
        description: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    const [firstName = '', ...lastParts] = (user.name ?? '').trim().split(' ');
    const lastName = lastParts.join(' ');

    return {
      ...user,
      firstName,
      lastName,
    };
  }

  static async deactivateAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  static async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
