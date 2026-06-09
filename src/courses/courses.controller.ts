import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserDto } from '../auth/current-user.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  getAllCourses() {
    return this.coursesService.getAllCourses();
  }

  @Get(':id')
  getCourseById(@Param('id') id: string) {
    return this.coursesService.getCourseById(id);
  }

  @Get('lessons/:id')
  getLesson(@Param('id') id: string) {
    return this.coursesService.getLesson(id);
  }

  @Post('lessons/:id/complete')
  completeLesson(
    @CurrentUser() user: CurrentUserDto,
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.coursesService.completeLesson(user.sub, id, score || 100);
  }
}
