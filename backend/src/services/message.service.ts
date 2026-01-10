import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, SystemMessagePayload } from '../types';
import { computeChapterFromMessageCount, computeRevealLevel, getChapterSystemLabel } from '../utils/reveal.utils';

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
  private static conversationLocks = new Map<string, Promise<void>>();

  private static async withConversationLock<T>(conversationId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.conversationLocks.get(conversationId) ?? Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current);
    this.conversationLocks.set(conversationId, chained);
    await previous;
    try {
      return await task();
    } finally {
      release();
      if (this.conversationLocks.get(conversationId) === chained) {
        this.conversationLocks.delete(conversationId);
      }
    }
  }

  static async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<MessageEnvelope> {
    return this.withConversationLock(conversationId, async () => {
      const result = await prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: {
            id: true,
            user1Id: true,
            user2Id: true,
            textMessageCount: true,
          },
        });

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
          throw new Error('Unauthorized access to conversation');
        }

        const currentCount = conversation.textMessageCount;
        const nextTextCount = currentCount + 1;
        const previousChapter = computeChapterFromMessageCount(currentCount);
        const nextChapter = computeChapterFromMessageCount(nextTextCount);
        const chapterChanged = nextChapter !== previousChapter;

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
          },
        });

        const finalRevealLevel = computeRevealLevel(updatedConversation.textMessageCount);
        const finalChapter = computeChapterFromMessageCount(updatedConversation.textMessageCount);

        const systemMessage = chapterChanged
          ? buildSystemMessage(conversationId, finalChapter, message.createdAt, conversation.user1Id)
          : undefined;

        return {
          message,
          revealLevel: finalRevealLevel,
          textMessageCount: updatedConversation.textMessageCount,
          chapter: finalChapter,
          chapterChanged,
          systemMessage,
        };
      });

      return result;
    });
  }

  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUrl: string,
    audioDuration: number
  ) {
    return this.withConversationLock(conversationId, async () => {
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
    });
  }
}
