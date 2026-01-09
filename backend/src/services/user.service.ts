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

    return user;
  }

  static async updateProfile(userId: string, data: {
    name?: string;
    age?: number;
    gender?: string;
    matchPreference?: string;
    city?: string;
    description?: string;
    photoUrl?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
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

    return user;
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
