# EAL Reading Gap Assessment - MVP Prototype

A Next.js 15 application for assessing reading proficiency gaps between English and home language skills for EAL (English as Additional Language) students.

## Features

- **Adaptive Assessment**: 15 English questions + 3 home language questions that adapt based on student responses
- **Real-time Dashboard**: Teachers can monitor student progress live
- **GPT-4o Scoring**: AI-powered assessment and gap analysis
- **No Authentication**: Public access for easy classroom use
- **CSV Export**: Download session results for further analysis
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Database**: Firebase Cloud Firestore
- **AI**: OpenAI GPT-4o
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd eal
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your credentials in `.env.local`:

```env
OPENAI_API_KEY=your-openai-api-key-here
FIREBASE_PROJECT_ID=eal-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@eal-project.iam.gserviceaccount.com
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (Native mode)
3. Create a service account:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Use the credentials in your `.env.local`

### 4. Seed Sample Questions

You'll need to manually add some sample questions to Firestore. Here's the structure:

**Collection: `questions`**

English questions (language: "en"):

```json
{
  "language": "en",
  "text": "What is the main idea of this passage?",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correctIdx": 0,
  "difficulty": 2.5,
  "skillTag": "comprehension"
}
```

Home language questions (language: "l1"):

```json
{
  "language": "l1",
  "text": "¿Cuál es la idea principal de este párrafo?",
  "choices": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correctIdx": 1,
  "difficulty": 2.0,
  "skillTag": "comprensión"
}
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Teachers

1. Go to `/teacher`
2. Click "New Baseline Session" to generate a 6-digit code
3. Share the code with students
4. Monitor progress on the real-time dashboard
5. Export results as CSV when complete

### For Students

1. Go to `/start`
2. Enter the session code and personal details
3. Complete the adaptive English assessment (15 questions)
4. Complete the home language mini-test (3 questions)
5. View your results and colour-coded feedback

## API Endpoints

- `POST /api/create-session` - Generate new session code
- `POST /api/answer` - Submit student answer and get next question
- `GET /api/export?code=123456` - Export session results as CSV

## Database Schema

### Collections

- **students**: Student information
- **questions**: Assessment questions (English and L1)
- **assessments**: Question groupings
- **attempts**: Student assessment attempts (subcollection under students)
- **responses**: Individual question responses (subcollection under attempts)
- **resources**: Learning resources by gap band

### Key Fields

- **Student**: name, yearGroup, homeLanguage, createdAt
- **Question**: language, text, choices[], correctIdx, difficulty, skillTag
- **Attempt**: sessionCode, started, completed, englishScore, l1Score, gap, colourBand, summary
- **Response**: questionId, selectedIdx, isCorrect, timeMs

## Adaptive Algorithm

The system uses a simple adaptive algorithm:

```typescript
function selectNextQuestion(prev: Question, wasCorrect: boolean): Question {
  let target = prev.difficulty + (wasCorrect ? 0.5 : -0.5);
  return findNearestDifficulty(target);
}
```

## Colour Band System

- **Green**: Gap ≤ 0.5 (well-balanced skills)
- **Amber**: Gap 0.5-1.5 (some areas to focus on)
- **Red**: Gap > 1.5 (significant support needed)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform supporting Node.js.

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── teacher/        # Teacher dashboard
│   └── start/          # Student assessment
├── lib/                # Utility functions
│   ├── firebase.ts     # Firebase configuration
│   ├── gptScore.ts     # GPT-4o integration
│   └── adaptive.ts     # Question selection logic
└── types/              # TypeScript definitions
```

### Key Components

- **Adaptive Engine**: Selects questions based on difficulty and previous responses
- **Real-time Updates**: Uses Firestore listeners for live dashboard updates
- **GPT Integration**: Scores assessments and generates summaries
- **CSV Export**: Streams results for download

## Troubleshooting

### Common Issues

1. **Firebase Connection**: Ensure service account credentials are correct
2. **OpenAI API**: Check API key and rate limits
3. **No Questions**: Manually seed questions in Firestore
4. **Real-time Updates**: Verify Firestore security rules allow reads

### Security Notes

- This MVP has no authentication (as specified)
- In production, add proper authentication and authorization
- Firestore security rules should be configured appropriately
- Environment variables should be secured

## License

This project is for educational/prototype purposes.
