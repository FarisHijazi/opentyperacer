import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTracks = [
  // English tracks
  {
    name: "The Quick Brown Fox",
    text: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. It has been used to test typewriters and computer keyboards.",
    language: "en",
    difficulty: "easy",
    isPublic: true,
  },
  {
    name: "Programming Wisdom",
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. The best code is no code at all. Every new line of code you willingly bring into the world is code that has to be debugged.",
    language: "en",
    difficulty: "medium",
    isPublic: true,
  },
  {
    name: "Tech Innovation",
    text: "Innovation distinguishes between a leader and a follower. Technology is nothing. What's important is that you have faith in people, that they're basically good and smart, and if you give them tools, they'll do wonderful things with them.",
    language: "en",
    difficulty: "medium",
    isPublic: true,
  },
  {
    name: "Code Philosophy",
    text: "First, solve the problem. Then, write the code. Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.",
    language: "en",
    difficulty: "hard",
    isPublic: true,
  },
  {
    name: "Software Engineering",
    text: "Programs must be written for people to read, and only incidentally for machines to execute. The function of good software is to make the complex appear to be simple. Simplicity is prerequisite for reliability.",
    language: "en",
    difficulty: "medium",
    isPublic: true,
  },
  // Spanish tracks
  {
    name: "El Quijote",
    text: "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.",
    language: "es",
    difficulty: "medium",
    isPublic: true,
  },
  {
    name: "Tecnología Moderna",
    text: "La tecnología no es nada. Lo importante es que tengas fe en la gente, que sean básicamente buenas e inteligentes, y si les das herramientas, harán cosas maravillosas con ellas.",
    language: "es",
    difficulty: "easy",
    isPublic: true,
  },
  // French tracks
  {
    name: "Le Petit Prince",
    text: "On ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux. C'est le temps que tu as perdu pour ta rose qui fait ta rose si importante.",
    language: "fr",
    difficulty: "medium",
    isPublic: true,
  },
  // German tracks
  {
    name: "Deutsche Weisheit",
    text: "Wer fremde Sprachen nicht kennt, weiß nichts von seiner eigenen. Die beste Bildung findet ein gescheiter Mensch auf Reisen. Es ist nicht genug zu wissen, man muss auch anwenden.",
    language: "de",
    difficulty: "hard",
    isPublic: true,
  },
  // Arabic tracks
  {
    name: "حكمة عربية",
    text: "العلم نور والجهل ظلام. من جد وجد ومن زرع حصد. الصبر مفتاح الفرج. العقل السليم في الجسم السليم. القراءة غذاء العقل والروح.",
    language: "ar",
    difficulty: "medium",
    isPublic: true,
  },
  // Portuguese tracks
  {
    name: "Sabedoria Portuguesa",
    text: "A simplicidade é o último grau de sofisticação. A única maneira de fazer um excelente trabalho é amar o que você faz. Se você ainda não encontrou, continue procurando.",
    language: "pt",
    difficulty: "medium",
    isPublic: true,
  },
  // Italian tracks
  {
    name: "Saggezza Italiana",
    text: "La semplicità è la raffinatezza suprema. Ogni artista è stato prima un dilettante. L'arte non è ciò che vedi, ma ciò che fai vedere agli altri.",
    language: "it",
    difficulty: "medium",
    isPublic: true,
  },
  // Japanese (Romaji) tracks
  {
    name: "Japanese Proverbs",
    text: "Nana korobi ya oki. Fall seven times, stand up eight. Ichi-go ichi-e. One time, one meeting. Ganbatte kudasai. Please do your best.",
    language: "ja",
    difficulty: "easy",
    isPublic: true,
  },
  // Chinese (Pinyin) tracks
  {
    name: "Chinese Wisdom",
    text: "Xue wu zhi jing. Learning has no boundaries. Qian li zhi xing, shi yu zu xia. A journey of a thousand miles begins with a single step.",
    language: "zh",
    difficulty: "medium",
    isPublic: true,
  },
  // Code snippets
  {
    name: "JavaScript Basics",
    text: "const greeting = 'Hello, World!'; function add(a, b) { return a + b; } const numbers = [1, 2, 3, 4, 5]; const doubled = numbers.map(n => n * 2);",
    language: "code",
    difficulty: "medium",
    isPublic: true,
  },
  {
    name: "Python Snippet",
    text: "def fibonacci(n): if n <= 1: return n return fibonacci(n-1) + fibonacci(n-2) result = [fibonacci(i) for i in range(10)] print(result)",
    language: "code",
    difficulty: "hard",
    isPublic: true,
  },
];

async function main() {
  console.log('Seeding database...');

  for (const track of defaultTracks) {
    await prisma.raceTrack.upsert({
      where: { id: track.name.toLowerCase().replace(/\s+/g, '-') },
      update: track,
      create: {
        id: track.name.toLowerCase().replace(/\s+/g, '-'),
        ...track,
      },
    });
  }

  console.log(`Seeded ${defaultTracks.length} race tracks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
