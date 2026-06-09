const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Shop Items
  await prisma.shopItem.createMany({
    data: [
      {
        name: 'Streak Freeze',
        description: 'Keep your streak safe for one day of inactivity.',
        price: 50,
        type: 'POWER_UP',
      },
      {
        name: 'Heart Refill',
        description: 'Refill your hearts to full.',
        price: 20,
        type: 'POWER_UP',
      },
    ],
  });

  // Create Course
  const course = await prisma.course.create({
    data: {
      title: 'JavaScript Basics',
      description: 'Learn the fundamentals of JavaScript.',
      icon: 'js-icon',
    },
  });

  // Create Unit
  const unit = await prisma.unit.create({
    data: {
      title: 'Unit 1: Variables & Types',
      description: 'Understand how to store data.',
      order: 1,
      courseId: course.id,
    },
  });

  // Create Lesson
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'Intro to Variables',
      order: 1,
      xpReward: 10,
      unitId: unit.id,
    },
  });

  // Create Questions
  await prisma.question.createMany({
    data: [
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'Which keyword is used to declare a variable in JavaScript?',
        options: JSON.stringify(['var', 'let', 'const', 'All of the above']),
        correctAnswer: 'All of the above',
        explanation: 'var, let, and const are all used to declare variables in JS.',
        lessonId: lesson1.id,
      },
      {
        type: 'MULTIPLE_CHOICE',
        prompt: 'What is the type of true?',
        options: JSON.stringify(['string', 'boolean', 'number', 'undefined']),
        correctAnswer: 'boolean',
        explanation: 'true and false are boolean values.',
        lessonId: lesson1.id,
      },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
