const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
if (!admin.apps.length) {
  let serviceAccount;

  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Use individual environment variables
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
  } else {
    // Fallback to the service account file in project root
    try {
      serviceAccount = require(path.resolve(
        process.cwd(),
        "firebase-service-account.json"
      ));
    } catch (error) {
      console.error(
        "Firebase service account file not found. Please check your configuration."
      );
      throw error;
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id ||
      "eal-project",
  });
}

const db = admin.firestore();

const englishQuestions = [
  // Difficulty 1 - Basic decoding
  {
    language: "en",
    text: "Cat sat on the ___",
    choices: ["mat", "map", "mop", "mug"],
    correctIdx: 0,
    difficulty: 1,
    skillTag: "decoding",
  },
  {
    language: "en",
    text: "Which word rhymes with dog?",
    choices: ["log", "dig", "dot", "dug"],
    correctIdx: 0,
    difficulty: 1,
    skillTag: "decoding",
  },
  {
    language: "en",
    text: "Pick the word that starts with the same sound as sun.",
    choices: ["sock", "run", "tan", "fun"],
    correctIdx: 0,
    difficulty: 1,
    skillTag: "decoding",
  },
  {
    language: "en",
    text: "Blend the sounds /b/-/a/-/t/. Which word?",
    choices: ["bat", "bit", "bot", "but"],
    correctIdx: 0,
    difficulty: 1,
    skillTag: "decoding",
  },

  // Difficulty 2 - Literal comprehension
  {
    language: "en",
    text: "Tom has 3 apples and eats 1. How many are left?",
    choices: ["2", "3", "1", "4"],
    correctIdx: 0,
    difficulty: 2,
    skillTag: "literal-comprehension",
  },
  {
    language: "en",
    text: "The story says Mia's bike is red. What colour is her bike?",
    choices: ["red", "blue", "green", "yellow"],
    correctIdx: 0,
    difficulty: 2,
    skillTag: "literal-comprehension",
  },
  {
    language: "en",
    text: "Where does a fish live?",
    choices: ["water", "tree", "sky", "desert"],
    correctIdx: 0,
    difficulty: 2,
    skillTag: "literal-comprehension",
  },
  {
    language: "en",
    text: "Which animal barks?",
    choices: ["dog", "cat", "cow", "sheep"],
    correctIdx: 0,
    difficulty: 2,
    skillTag: "literal-comprehension",
  },

  // Difficulty 3 - Vocabulary and basic inference
  {
    language: "en",
    text: "Choose the synonym of angry.",
    choices: ["mad", "happy", "tired", "calm"],
    correctIdx: 0,
    difficulty: 3,
    skillTag: "vocabulary",
  },
  {
    language: "en",
    text: "Enormous most nearly means ___",
    choices: ["huge", "tiny", "quick", "warm"],
    correctIdx: 0,
    difficulty: 3,
    skillTag: "vocabulary",
  },
  {
    language: "en",
    text: "If Sam forgot his umbrella and came home wet, what probably happened?",
    choices: ["It rained", "He swam", "It snowed", "He slept"],
    correctIdx: 0,
    difficulty: 3,
    skillTag: "inference",
  },
  {
    language: "en",
    text: "Sara turned off the lights and pulled up the blanket. What will she do next?",
    choices: ["Sleep", "Cook", "Run", "Draw"],
    correctIdx: 0,
    difficulty: 3,
    skillTag: "inference",
  },

  // Difficulty 4 - Advanced inference and vocabulary
  {
    language: "en",
    text: "The leaves rustled as Maya tip-toed past the nest, not wanting to wake the chicks. Why did Maya move quietly?",
    choices: [
      "So birds stayed asleep",
      "She was cold",
      "She liked noise",
      "It was dark",
    ],
    correctIdx: 0,
    difficulty: 4,
    skillTag: "inference",
  },
  {
    language: "en",
    text: "Which sentence implies that Ben was nervous?",
    choices: [
      "Ben's hands were shaking.",
      "Ben laughed loudly.",
      "Ben ate dinner.",
      "Ben closed the door.",
    ],
    correctIdx: 0,
    difficulty: 4,
    skillTag: "inference",
  },
  {
    language: "en",
    text: "The opposite of scarce is ___",
    choices: ["plentiful", "rare", "fragile", "shallow"],
    correctIdx: 0,
    difficulty: 4,
    skillTag: "vocabulary",
  },
  {
    language: "en",
    text: "A nocturnal animal is active mostly at ___",
    choices: ["night", "dawn", "day", "noon"],
    correctIdx: 0,
    difficulty: 4,
    skillTag: "vocabulary",
  },

  // Difficulty 5 - Critical comprehension
  {
    language: "en",
    text: "In the article, the author argues schools should start later. Which evidence best supports this claim?",
    choices: [
      "Teens need more sleep",
      "Some like breakfast",
      "Buses are yellow",
      "Homework exists",
    ],
    correctIdx: 0,
    difficulty: 5,
    skillTag: "critical-comprehension",
  },
  {
    language: "en",
    text: "While renewable energy upfront costs are high, the long-term savings are substantial. The author's tone is ___",
    choices: ["persuasive", "angry", "humorous", "indifferent"],
    correctIdx: 0,
    difficulty: 5,
    skillTag: "critical-comprehension",
  },
  {
    language: "en",
    text: "Which statement is an opinion?",
    choices: [
      "Summer is the best season.",
      "Earth orbits the sun.",
      "Water freezes at 0°C.",
      "Humans need oxygen.",
    ],
    correctIdx: 0,
    difficulty: 5,
    skillTag: "critical-comprehension",
  },
  {
    language: "en",
    text: "The main purpose of a bibliography is to ___",
    choices: [
      "credit sources",
      "tell a story",
      "sell books",
      "illustrate ideas",
    ],
    correctIdx: 0,
    difficulty: 5,
    skillTag: "critical-comprehension",
  },
];

const l1Questions = [
  // Spanish questions
  {
    language: "l1",
    text: "¿Cuál es la idea principal del texto sobre la escuela?",
    choices: [
      "La importancia de la educación",
      "Los problemas del transporte",
      "La historia de los edificios",
      "Las actividades deportivas",
    ],
    correctIdx: 0,
    difficulty: 2.5,
    skillTag: "comprensión",
  },
  {
    language: "l1",
    text: 'El antónimo de "caliente" es:',
    choices: ["frío", "lento", "dulce", "seco"],
    correctIdx: 0,
    difficulty: 3.0,
    skillTag: "vocabulario",
  },
  {
    language: "l1",
    text: "Si Juan lleva paraguas y el cielo está gris, ¿qué tiempo espera?",
    choices: ["lluvia", "viento", "nieve", "sol"],
    correctIdx: 0,
    difficulty: 3.0,
    skillTag: "inferencia",
  },

  // French questions
  {
    language: "l1",
    text: "Qu'est-ce que l'auteur veut dire dans le dernier paragraphe?",
    choices: [
      "Il faut agir maintenant",
      "C'est trop tard",
      "Tout va bien",
      "Il ne sait pas",
    ],
    correctIdx: 0,
    difficulty: 3.0,
    skillTag: "compréhension",
  },

  // Arabic questions
  {
    language: "l1",
    text: "ما هو الهدف الرئيسي من هذا النص؟",
    choices: ["تقديم المعلومات", "تعليم القراءة", "شرح التاريخ", "الترفيه"],
    correctIdx: 0,
    difficulty: 2.0,
    skillTag: "فهم",
  },

  // Polish questions
  {
    language: "l1",
    text: "Jaki jest główny temat tego tekstu?",
    choices: [
      "Znaczenie edukacji",
      "Problemy transportu",
      "Historia miasta",
      "Tradycje rodzinne",
    ],
    correctIdx: 0,
    difficulty: 2.5,
    skillTag: "rozumienie",
  },
];

const resources = [
  // Green band resources (minimal gap)
  {
    language: "spanish",
    gapBand: "green",
    url: "https://www.storyweaver.org.in/es",
    description: "Bilingual storybooks for balanced readers",
  },
  {
    language: "spanish",
    gapBand: "green",
    url: "https://read.bookcreator.com/library/es-free",
    description: "Free Spanish-English picture e-books",
  },

  // Amber band resources (moderate gap)
  {
    language: "spanish",
    gapBand: "amber",
    url: "https://freerice.com/categories/spanish-english-vocabulary",
    description: "Vocabulary bridging game (Spanish-English)",
  },
  {
    language: "spanish",
    gapBand: "amber",
    url: "https://spanishenglish.com/short-stories.html",
    description: "Parallel short stories with comprehension quizzes",
  },

  // Red band resources (significant gap)
  {
    language: "spanish",
    gapBand: "red",
    url: "https://albalearning.com/audiolibros/",
    description: "Spanish audiobooks with text support",
  },
  {
    language: "spanish",
    gapBand: "red",
    url: "https://www.gutenberg.org/browse/languages/es",
    description: "Project Gutenberg Spanish classics",
  },

  // General resources
  {
    language: "general",
    gapBand: "green",
    url: "https://www.duolingo.com/stories",
    description: "Interactive bilingual stories",
  },
  {
    language: "general",
    gapBand: "amber",
    url: "https://www.bbc.co.uk/bitesize/subjects/z4mmn39",
    description: "BBC Bitesize English reading comprehension",
  },
  {
    language: "general",
    gapBand: "red",
    url: "https://www.readingrockets.org/strategies",
    description: "Reading strategies for struggling readers",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Seed English questions
    console.log("📚 Seeding English questions...");
    for (const question of englishQuestions) {
      await db.collection("questions").add(question);
    }
    console.log(`✅ Added ${englishQuestions.length} English questions`);

    // Seed L1 questions
    console.log("🌍 Seeding L1 questions...");
    for (const question of l1Questions) {
      await db.collection("questions").add(question);
    }
    console.log(`✅ Added ${l1Questions.length} L1 questions`);

    // Seed resources
    console.log("📖 Seeding resources...");
    for (const resource of resources) {
      await db.collection("resources").add(resource);
    }
    console.log(`✅ Added ${resources.length} resources`);

    console.log("🎉 Database seeding completed successfully!");
    console.log(
      `Total: ${englishQuestions.length + l1Questions.length} questions, ${
        resources.length
      } resources`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
