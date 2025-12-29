import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ConversationService } from './conversation.service';

export class MessageService {
  static async sendTextMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      throw new Error('Unauthorized access to conversation');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: MessageType.TEXT,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        textMessageCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    const revealLevel = await ConversationService.updateRevealLevel(conversationId);

    return { message, revealLevel };
  }

  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUrl: string,
    audioDuration: number
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      throw new Error('Unauthorized access to conversation');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: MessageType.VOICE,
        audioUrl,
        audioDuration,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  }
}
