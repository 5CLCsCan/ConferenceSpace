# ConferenceAI - AI-Powered Conference Management System

A comprehensive conference management platform with intelligent AI recommendations for academic conferences.

## Features

### For Authors

- **Smart Paper Submission**: Submit papers with AI-powered quality assessment
- **Real-time Feedback**: Get instant suggestions on title, abstract, and keywords
- **Track Recommendations**: AI suggests the best conference track for your paper
- **Reviewer Suggestions**: See recommended reviewers based on expertise matching
- **Similar Papers**: Discover related published work automatically
- **Review Tracking**: Monitor your paper's review progress with detailed analytics
- **AI Review Analysis**: Understand reviewer feedback with AI-generated insights

### For Reviewers

- **Intelligent Assignment**: Get papers matched to your expertise
- **AI Review Assistant**: Receive suggestions for strengths, weaknesses, and questions
- **Consistency Checking**: AI validates that your scores align with your comments
- **Progress Tracking**: Monitor your review workload and deadlines
- **Quality Metrics**: Track your review performance over time

### For Chairs/PC Members

- **Comprehensive Dashboard**: Real-time conference statistics and visualizations
- **AI Reviewer Matching**: Automatically match papers with optimal reviewers
- **Conflict Detection**: AI identifies potential conflicts of interest
- **Workload Balancing**: Distribute reviews fairly based on availability
- **Submission Analytics**: Track trends, keywords, and acceptance rates
- **Data Visualization**: Interactive charts for submissions, reviews, and progress
- **Decision Support**: AI-powered insights for acceptance decisions

## AI Features

### 1. Paper Submission Intelligence

- Quality assessment for title, abstract, and keywords
- Track recommendation with confidence scores
- Keyword suggestions based on content analysis
- Similar paper discovery for literature review

### 2. Reviewer Recommendation System

- Expertise matching using semantic analysis
- Availability and workload consideration
- Past performance metrics
- Conflict of interest detection
- Match confidence scoring (0-100%)

### 3. Review Quality Analysis

- Sentiment analysis of review comments
- Consistency checking between scores and text
- Key strengths and weaknesses extraction
- Suggested questions for authors
- Bias detection in reviews

### 4. Conference Analytics

- Submission trend prediction
- Acceptance rate optimization
- Keyword trend analysis
- Review progress monitoring
- Quality metrics visualization

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for data visualization
- **Type Safety**: TypeScript
- **State Management**: React hooks and SWR

## Data Structure

### Core Entities

- **Users**: Authors, reviewers, PC members, chairs
- **Papers**: Submissions with metadata and status tracking
- **Reviews**: Detailed evaluations with scores and comments
- **Conferences**: Event information and deadlines
- **Tracks**: Conference tracks with chairs
- **Assignments**: Reviewer-paper mappings

### AI Data Models

- **AISuggestion**: Paper submission recommendations
- **ReviewAIAnalysis**: Review quality insights
- **RecommendedReviewer**: Matched reviewers with scores
- **SimilarPaper**: Related work suggestions

## Key Pages

### Author Interface

- `/author` - Dashboard with paper overview
- `/author/submit` - Paper submission form with AI assistance
- `/author/papers/[id]` - Detailed paper view with reviews and AI insights

### Reviewer Interface

- `/reviewer` - Dashboard with assigned papers
- `/reviewer/papers/[id]` - Review form with AI suggestions

### Chair Interface

- `/chair` - Conference overview with analytics
- `/chair/papers` - All submissions management
- `/chair/reviewers` - AI-powered reviewer assignment

## Design System

### Color Palette

- **Background**: Dark theme (oklch(0.145 0 0))
- **Foreground**: Light text (oklch(0.985 0 0))
- **Primary**: White for emphasis
- **Accent**: Chart colors for data visualization
- **Semantic**: Success, warning, destructive states

### Typography

- Clean, professional sans-serif font
- Hierarchical sizing for readability
- Optimal line-height for academic content

### Components

- Consistent card-based layouts
- Interactive data visualizations
- Real-time progress indicators
- Badge system for status and metadata
- Alert components for AI insights

## Scalability & Maintainability

### Code Organization

- Modular component structure
- Reusable UI components
- Type-safe data models
- Utility functions for common operations
- Consistent naming conventions

### Data Management

- Normalized data structures
- Helper functions for data access
- Mock data for development
- Ready for backend integration

### Performance

- Server-side rendering where appropriate
- Client-side interactivity for forms
- Optimized chart rendering
- Lazy loading for large datasets

## Future Enhancements

1. **Real AI Integration**: Connect to actual ML models for recommendations
2. **Database Integration**: PostgreSQL/Supabase for production data
3. **Authentication**: Secure user authentication and authorization
4. **Email Notifications**: Automated alerts for deadlines and updates
5. **PDF Processing**: Automatic text extraction and analysis
6. **Plagiarism Detection**: AI-powered similarity checking
7. **Multi-language Support**: Internationalization for global conferences
8. **Mobile App**: Native mobile experience for on-the-go access

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and adjust values:

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` so the backend URLs match your setup (see [Environment Variables](#environment-variables)).

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### For Authors

1. Navigate to `/author` to see your dashboard
2. Click "Submit New Paper" to start a submission
3. Fill in paper details and get real-time AI feedback
4. Click "Get AI Recommendations" for reviewer and track suggestions
5. Submit your paper and track its progress

### For Reviewers

1. Go to `/reviewer` to see assigned papers
2. Click on a paper to start reviewing
3. Use "Get AI-Powered Review Assistance" for suggestions
4. Fill in scores and comments
5. Submit your review

### For Chairs

1. Access `/chair` for conference overview
2. View analytics and statistics
3. Go to `/chair/reviewers` for AI-powered assignment
4. Select a paper and get ranked reviewer recommendations
5. Assign reviewers based on AI matching scores

## License

MIT License - feel free to use for academic conferences

## Environment Variables

The app expects the following keys (populate `.env.local` based on `.env.example`):

| Key                        | Description                                                                         | Default                 |
| -------------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Public base URL used when the client bypasses the proxy                             | `http://localhost:8080` |
| `BACKEND_API_BASE_URL`     | Internal base URL used by Next.js API routes when forwarding authenticated requests | `http://localhost:8080` |
| `JWT_EXPIRY_SECONDS`       | JWT lifetime in seconds; used as the HTTP-only cookie max-age                       | `86400`                 |
| `NODE_ENV`                 | Environment flag (`development`, `production`, etc.). Usually set automatically.    | `development`           |

Create your environment file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` before running the dev server.
