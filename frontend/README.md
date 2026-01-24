# Consequence AI - Frontend

Next.js 14 frontend dashboard for the Consequence AI causal reasoning engine.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom Shadcn/ui components
- **Data Fetching**: Native fetch API
- **Icons**: Lucide React

## Features

- **Landing Page**: Hero section with features and statistics
- **Prediction Interface**: Submit earnings events and view cascade predictions
- **Graph Exploration**: Browse entity statistics and search relationships
- **Track Record**: View model accuracy metrics and methodology

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=https://cognitive-production.up.railway.app
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── predict/      # Prediction interface
│   │   ├── explore/      # Graph exploration
│   │   └── accuracy/     # Track record page
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── Navbar.tsx
│   │   ├── PredictionForm.tsx
│   │   ├── CascadeTimeline.tsx
│   │   ├── GraphStats.tsx
│   │   └── EntitySearch.tsx
│   ├── lib/
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # Utility functions
│   └── types/
│       └── api.ts        # TypeScript types
├── public/               # Static assets
├── .env.local            # Environment variables
└── README.md
```

## API Integration

The frontend connects to the Consequence AI FastAPI backend deployed on Railway:

- **Base URL**: https://cognitive-production.up.railway.app
- **Endpoints**:
  - `GET /graph/stats` - Graph statistics
  - `GET /graph/entity/{ticker}` - Entity details
  - `GET /graph/entity/{ticker}/connections` - Entity connections
  - `GET /entities/search?q={query}` - Search entities
  - `POST /predict/earnings` - Predict cascade effects

## Deployment

### Deploy to Vercel

1. Push frontend code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Environment Variables**: Add `NEXT_PUBLIC_API_URL`
6. Click "Deploy"

The app will be live at `https://<your-project>.vercel.app`

### Vercel Configuration

The project includes:
- `next.config.js` - Next.js configuration
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variable template

## Development

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file
3. Use "use client" directive if using React hooks or interactivity
4. Update navigation in `Navbar.tsx`

### Adding New Components

1. Create component file in `src/components/`
2. Use TypeScript for type safety
3. Import types from `src/types/api.ts`
4. Use Tailwind CSS for styling

### API Client

The `ConsequenceAPI` class in `src/lib/api.ts` provides methods for all backend endpoints:

```typescript
import { ConsequenceAPI } from "@/lib/api";

// Get graph statistics
const stats = await ConsequenceAPI.getGraphStats();

// Predict cascade
const cascade = await ConsequenceAPI.predictEarningsCascade({
  ticker: "AAPL",
  surprise_percent: -8.0,
  horizon_days: 14,
});
```

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Delete `.next` directory and `node_modules`
2. Run `npm install` again
3. Run `npm run build`

### CORS Errors

If you see CORS errors when calling the API:

1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify the backend has CORS configured for your frontend domain
3. Check browser console for detailed error messages

### Styling Issues

If Tailwind styles aren't applying:

1. Check that `globals.css` has `@import "tailwindcss"`
2. Verify component is using correct Tailwind class names
3. Check browser DevTools for CSS loading errors

## License

MIT
