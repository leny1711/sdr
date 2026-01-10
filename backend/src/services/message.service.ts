import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, SystemMessagePayload } from '../types';
import { computeRevealLevel, getChapterFromLevel, getChapterSystemLabel } from '../utils/reveal.utils';

const buildSystemMessage = (
  conversationId: string,
  chapter: ChapterNumber,
  createdAt: Date,
  senderId: string
): SystemMessagePayload => {
  const systemDate = new Date(createdAt.getTime() + 1);
  const timestamp = systemDate.getTime();
  return {
    id: `system-${conversationId}-${chapter}-${timestamp}`,
    conversationId,
    senderId,
    type: 'SYSTEM',
    content: getChapterSystemLabel(chapter),
    createdAt: systemDate.toISOString(),
  };
};

export class MessageService {
  static async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<MessageEnvelope> {
    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          user1Id: true,
          user2Id: true,
          textMessageCount: true,
          revealLevel: true,
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
        throw new Error('Unauthorized access to conversation');
      }

      const message = await tx.message.create({
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

      const updatedConversation = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          textMessageCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
        select: {
          textMessageCount: true,
          revealLevel: true,
        },
      });

      const updatedRevealLevel = computeRevealLevel(updatedConversation.textMessageCount);
      const chapterChanged = updatedRevealLevel > updatedConversation.revealLevel;

      if (chapterChanged) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            revealLevel: updatedRevealLevel,
          },
        });
      }

      const chapter = getChapterFromLevel(updatedRevealLevel);

      const systemMessage = chapterChanged
        ? buildSystemMessage(conversationId, chapter, message.createdAt, conversation.user1Id)
        : undefined;

      return {
        message,
        revealLevel: updatedRevealLevel,
        textMessageCount: updatedConversation.textMessageCount,
        chapter,
        chapterChanged,
        systemMessage,
      };
    });

    return result;
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
