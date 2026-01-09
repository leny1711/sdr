import prisma from '../config/database';
import { splitFullName, buildFullName } from '../utils/name.utils';

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

    const { firstName, lastName } = splitFullName(user.name);

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
      payload.name = buildFullName(firstName, lastName);
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

    const { firstName, lastName } = splitFullName(user.name);

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
