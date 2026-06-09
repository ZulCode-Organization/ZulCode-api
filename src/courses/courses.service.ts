import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        units: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        questions: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async completeLesson(userId: string, lessonId: string, score: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Process progress and rewards in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Update/Create Progress
      const existingProgress = await tx.userProgress.findUnique({
        where: {
          userId_lessonId: { userId, lessonId },
        },
      });

      let xpReward = lesson.xpReward;
      let coinReward = Math.floor(xpReward / 2); // Example ratio

      if (existingProgress?.completed) {
        // If already completed, give fewer rewards
        xpReward = Math.floor(xpReward / 5);
        coinReward = 0;
      }

      if (existingProgress) {
        await tx.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            completed: true,
            completedAt: new Date(),
            score: score,
          },
        });
      } else {
        await tx.userProgress.create({
          data: {
            userId,
            lessonId,
            completed: true,
            completedAt: new Date(),
            score: score,
          },
        });
      }

      // 2. Grant rewards
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpReward },
          coins: { increment: coinReward },
        },
      });

      return {
        success: true,
        xpReward,
        coinReward,
      };
    });
  }
}
