import prisma from '../config/database';

export class ReportService {
  static async reportUser(reporterId: string, reportedId: string, reason: string) {
    if (reporterId === reportedId) {
      throw new Error('Cannot report yourself');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
      },
    });

    return report;
  }

  static async getReports(userId: string) {
    const reports = await prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        reported: {
          select: {
            id: true,
            name: true,
            age: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports.map((r) => ({
      reportId: r.id,
      user: r.reported,
      reason: r.reason,
      reportedAt: r.createdAt,
    }));
  }
}
