import type { User, Conference, Paper, Review, ConferenceStats, Notification, Track, ReviewAssignment } from "./types"

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Dr. Sarah Chen",
    email: "sarah.chen@mit.edu",
    affiliation: "MIT Computer Science",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Machine Learning", "Natural Language Processing", "Deep Learning"],
    h_index: 42,
    total_papers: 87,
    total_reviews: 156,
  },
  {
    id: "user-2",
    name: "Prof. Michael Rodriguez",
    email: "michael.rodriguez@stanford.edu",
    affiliation: "Stanford University",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Computer Vision", "Robotics", "AI Ethics"],
    h_index: 68,
    total_papers: 142,
    total_reviews: 289,
  },
  {
    id: "user-3",
    name: "Dr. Yuki Tanaka",
    email: "yuki.tanaka@tokyo-tech.ac.jp",
    affiliation: "Tokyo Institute of Technology",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Distributed Systems", "Cloud Computing", "Edge AI"],
    h_index: 35,
    total_papers: 64,
    total_reviews: 98,
  },
  {
    id: "user-4",
    name: "Dr. Emma Williams",
    email: "emma.williams@oxford.ac.uk",
    affiliation: "University of Oxford",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Human-Computer Interaction", "UX Research", "Accessibility"],
    h_index: 38,
    total_papers: 71,
    total_reviews: 124,
  },
  {
    id: "user-5",
    name: "Prof. James Anderson",
    email: "james.anderson@cmu.edu",
    affiliation: "Carnegie Mellon University",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Software Engineering", "Program Analysis", "Security"],
    h_index: 55,
    total_papers: 103,
    total_reviews: 234,
  },
  {
    id: "user-6",
    name: "Dr. Maria Garcia",
    email: "maria.garcia@berkeley.edu",
    affiliation: "UC Berkeley",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Data Mining", "Big Data", "Machine Learning"],
    h_index: 29,
    total_papers: 52,
    total_reviews: 87,
  },
  {
    id: "user-7",
    name: "Prof. David Kim",
    email: "david.kim@kaist.ac.kr",
    affiliation: "KAIST",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Neural Networks", "Computer Architecture", "Hardware Acceleration"],
    h_index: 61,
    total_papers: 128,
    total_reviews: 267,
  },
  {
    id: "user-8",
    name: "Dr. Lisa Zhang",
    email: "lisa.zhang@tsinghua.edu.cn",
    affiliation: "Tsinghua University",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Quantum Computing", "Algorithms", "Cryptography"],
    h_index: 24,
    total_papers: 38,
    total_reviews: 45,
  },
  {
    id: "user-9",
    name: "Prof. Robert Brown",
    email: "robert.brown@cambridge.ac.uk",
    affiliation: "University of Cambridge",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Bioinformatics", "Computational Biology", "Machine Learning"],
    h_index: 47,
    total_papers: 94,
    total_reviews: 178,
  },
  {
    id: "user-10",
    name: "Dr. Anna Kowalski",
    email: "anna.kowalski@ethz.ch",
    affiliation: "ETH Zurich",
    roles: ["author", "reviewer", "chair"],
    expertise: ["Reinforcement Learning", "Game Theory", "Multi-Agent Systems"],
    h_index: 31,
    total_papers: 56,
    total_reviews: 92,
  },
]

// Mock Tracks
export const mockTracks: Track[] = [
  {
    id: "track-1",
    name: "Machine Learning & AI",
    description: "Papers on machine learning algorithms, deep learning, and artificial intelligence",
    chairs: ["user-2"],
  },
  {
    id: "track-2",
    name: "Systems & Networking",
    description: "Distributed systems, cloud computing, and network protocols",
    chairs: ["user-5"],
  },
  {
    id: "track-3",
    name: "Human-Computer Interaction",
    description: "User experience, interface design, and accessibility research",
    chairs: ["user-4"],
  },
]

// Mock Conference
export const mockConference: Conference = {
  id: "conf-2025",
  name: "International Conference on Advanced Computing",
  acronym: "ICAC 2025",
  year: 2025,
  description: "Premier conference for cutting-edge research in computer science and artificial intelligence",
  submission_deadline: "2025-03-15T23:59:59Z",
  review_deadline: "2025-04-30T23:59:59Z",
  camera_ready_deadline: "2025-06-15T23:59:59Z",
  notification_date: "2025-05-20T00:00:00Z",
  conference_date: "2025-08-10T00:00:00Z",
  location: "San Francisco, CA, USA",
  website: "https://icac2025.org",
  status: "active",
  tracks: mockTracks,
}

// Mock Papers
export const mockPapers: Paper[] = [
  {
    id: "paper-1",
    title: "Efficient Transformer Architectures for Low-Resource Language Processing",
    abstract:
      "We propose a novel transformer architecture that reduces computational complexity while maintaining high performance on low-resource languages. Our approach leverages cross-lingual transfer learning and adaptive attention mechanisms to achieve state-of-the-art results with 40% fewer parameters.",
    keywords: ["Transformers", "NLP", "Low-Resource Languages", "Transfer Learning"],
    authors: [
      {
        user_id: "user-1",
        name: "Dr. Sarah Chen",
        email: "sarah.chen@mit.edu",
        affiliation: "MIT Computer Science",
        is_corresponding: true,
        order: 1,
      },
      {
        user_id: "user-3",
        name: "Dr. Yuki Tanaka",
        email: "yuki.tanaka@tokyo-tech.ac.jp",
        affiliation: "Tokyo Institute of Technology",
        is_corresponding: false,
        order: 2,
      },
    ],
    conference_id: "conf-2025",
    track_id: "track-1",
    status: "under_review",
    submitted_at: "2025-03-10T14:30:00Z",
    updated_at: "2025-03-10T14:30:00Z",
    version: 1,
    reviews: [],
    ai_suggestions: {
      recommended_reviewers: [
        {
          user_id: "user-2",
          name: "Prof. Michael Rodriguez",
          affiliation: "Stanford University",
          expertise_match: 85,
          availability: "high",
          past_reviews: 45,
          avg_review_quality: 4.6,
          reasoning:
            "Strong background in NLP and transformer architectures. Has reviewed 12 similar papers in the past year.",
        },
        {
          user_id: "user-5",
          name: "Prof. James Anderson",
          affiliation: "Carnegie Mellon University",
          expertise_match: 72,
          availability: "medium",
          past_reviews: 38,
          avg_review_quality: 4.4,
          reasoning: "Experience with computational efficiency and model optimization.",
        },
      ],
      similar_papers: [
        {
          id: "ref-1",
          title: "Lightweight Transformers for Multilingual NLP",
          authors: ["Wang et al."],
          year: 2024,
          venue: "ACL 2024",
          similarity_score: 0.87,
          relevance: "Similar approach to model compression for multilingual tasks",
        },
      ],
      keyword_suggestions: ["Model Compression", "Multilingual NLP", "Attention Mechanisms"],
      track_recommendation: {
        track_id: "track-1",
        track_name: "Machine Learning & AI",
        confidence: 0.95,
        reasoning: "Paper focuses on ML architecture optimization and NLP applications",
      },
      quality_assessment: {
        abstract_clarity: 4.5,
        keyword_relevance: 4.8,
        title_effectiveness: 4.6,
        suggestions: [
          "Consider adding quantitative results in the abstract",
          "The title effectively communicates the main contribution",
        ],
      },
    },
  },
  {
    id: "paper-2",
    title: "Federated Learning with Differential Privacy for Healthcare Applications",
    abstract:
      "This paper presents a federated learning framework that incorporates differential privacy mechanisms to protect sensitive healthcare data. We demonstrate that our approach maintains model accuracy while providing strong privacy guarantees, making it suitable for real-world medical applications.",
    keywords: ["Federated Learning", "Differential Privacy", "Healthcare", "Machine Learning"],
    authors: [
      {
        user_id: "user-4",
        name: "Dr. Emma Williams",
        email: "emma.williams@oxford.ac.uk",
        affiliation: "University of Oxford",
        is_corresponding: true,
        order: 1,
      },
    ],
    conference_id: "conf-2025",
    track_id: "track-1",
    status: "under_review",
    submitted_at: "2025-03-08T09:15:00Z",
    updated_at: "2025-03-08T09:15:00Z",
    version: 1,
    reviews: [
      {
        id: "review-1",
        paper_id: "paper-2",
        reviewer_id: "user-2",
        reviewer_name: "Prof. Michael Rodriguez",
        status: "completed",
        overall_score: 4,
        confidence: 4,
        novelty: 4,
        technical_quality: 4,
        clarity: 5,
        relevance: 5,
        comments_to_authors:
          "This is a well-written paper that addresses an important problem in healthcare AI. The differential privacy mechanisms are well-designed and the experimental results are convincing. I recommend acceptance with minor revisions to address the scalability concerns mentioned below.",
        comments_to_pc: "Strong paper with practical applications. The authors have done a thorough job.",
        recommendation: "minor_revision",
        submitted_at: "2025-03-25T16:45:00Z",
        ai_analysis: {
          sentiment: "positive",
          consistency_score: 0.92,
          key_strengths: [
            "Well-designed privacy mechanisms",
            "Convincing experimental results",
            "Clear writing and presentation",
          ],
          key_weaknesses: ["Scalability concerns need to be addressed"],
          suggested_questions: [
            "How does the approach scale to larger datasets?",
            "What is the computational overhead of the privacy mechanisms?",
          ],
          bias_detection: {
            has_potential_bias: false,
            confidence: 0.88,
          },
        },
      },
    ],
  },
  {
    id: "paper-3",
    title: "Real-Time Edge Computing for Autonomous Vehicle Decision Making",
    abstract:
      "We present a novel edge computing architecture optimized for real-time decision making in autonomous vehicles. Our system reduces latency by 60% compared to cloud-based approaches while maintaining high accuracy in object detection and path planning tasks.",
    keywords: ["Edge Computing", "Autonomous Vehicles", "Real-Time Systems", "Computer Vision"],
    authors: [
      {
        user_id: "user-3",
        name: "Dr. Yuki Tanaka",
        email: "yuki.tanaka@tokyo-tech.ac.jp",
        affiliation: "Tokyo Institute of Technology",
        is_corresponding: true,
        order: 1,
      },
    ],
    conference_id: "conf-2025",
    track_id: "track-2",
    status: "submitted",
    submitted_at: "2025-03-12T11:20:00Z",
    updated_at: "2025-03-12T11:20:00Z",
    version: 1,
    reviews: [],
  },
  {
    id: "paper-4",
    title: "Accessible Web Design Patterns for Users with Cognitive Disabilities",
    abstract:
      "This research identifies and evaluates web design patterns that improve accessibility for users with cognitive disabilities. Through user studies with 120 participants, we demonstrate that our proposed patterns significantly improve task completion rates and user satisfaction.",
    keywords: ["Accessibility", "Web Design", "Cognitive Disabilities", "User Experience"],
    authors: [
      {
        user_id: "user-4",
        name: "Dr. Emma Williams",
        email: "emma.williams@oxford.ac.uk",
        affiliation: "University of Oxford",
        is_corresponding: true,
        order: 1,
      },
    ],
    conference_id: "conf-2025",
    track_id: "track-3",
    status: "accepted",
    submitted_at: "2025-02-28T15:00:00Z",
    updated_at: "2025-05-21T10:00:00Z",
    version: 2,
    reviews: [],
  },
]

// Mock Review Assignments
export const mockReviewAssignments: ReviewAssignment[] = [
  {
    id: "assign-1",
    paper_id: "paper-1",
    reviewer_id: "user-2",
    assigned_by: "user-2",
    assigned_at: "2025-03-11T10:00:00Z",
    due_date: "2025-04-25T23:59:59Z",
    status: "pending",
    ai_match_score: 85,
  },
  {
    id: "assign-2",
    paper_id: "paper-1",
    reviewer_id: "user-5",
    assigned_by: "user-2",
    assigned_at: "2025-03-11T10:00:00Z",
    due_date: "2025-04-25T23:59:59Z",
    status: "in_progress",
    ai_match_score: 72,
  },
  {
    id: "assign-3",
    paper_id: "paper-2",
    reviewer_id: "user-2",
    assigned_by: "user-2",
    assigned_at: "2025-03-09T14:00:00Z",
    due_date: "2025-04-20T23:59:59Z",
    status: "completed",
    ai_match_score: 88,
  },
]

// Mock Conference Statistics
export const mockConferenceStats: ConferenceStats = {
  total_submissions: 247,
  total_reviews: 486,
  avg_reviews_per_paper: 2.8,
  acceptance_rate: 28.5,
  submissions_by_track: [
    { track: "Machine Learning & AI", count: 142 },
    { track: "Systems & Networking", count: 68 },
    { track: "Human-Computer Interaction", count: 37 },
  ],
  submissions_over_time: [
    { date: "2025-02-15", count: 12 },
    { date: "2025-02-22", count: 28 },
    { date: "2025-03-01", count: 45 },
    { date: "2025-03-08", count: 89 },
    { date: "2025-03-15", count: 73 },
  ],
  review_progress: {
    completed: 186,
    in_progress: 142,
    pending: 158,
  },
  top_keywords: [
    { keyword: "Machine Learning", count: 89 },
    { keyword: "Deep Learning", count: 67 },
    { keyword: "Natural Language Processing", count: 45 },
    { keyword: "Computer Vision", count: 38 },
    { keyword: "Federated Learning", count: 28 },
  ],
}

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    user_id: "user-1",
    type: "info",
    title: "Review Assignment",
    message: 'You have been assigned to review paper "Efficient Transformer Architectures..."',
    read: false,
    created_at: "2025-03-11T10:05:00Z",
    action_url: "/reviewer/papers/paper-1",
  },
  {
    id: "notif-2",
    user_id: "user-1",
    type: "success",
    title: "Paper Accepted",
    message: 'Your paper "Accessible Web Design Patterns..." has been accepted!',
    read: false,
    created_at: "2025-05-21T10:00:00Z",
    action_url: "/author/papers/paper-4",
  },
  {
    id: "notif-3",
    user_id: "user-1",
    type: "warning",
    title: "Deadline Approaching",
    message: "Camera-ready deadline is in 7 days",
    read: true,
    created_at: "2025-06-08T09:00:00Z",
  },
]

// Helper function to get user by ID
export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id)
}

// Helper function to get papers by user
export function getPapersByUser(userId: string): Paper[] {
  return mockPapers.filter((paper) => paper.authors.some((author) => author.user_id === userId))
}

// Helper function to get reviews by reviewer
export function getReviewsByReviewer(reviewerId: string): Review[] {
  const reviews: Review[] = []
  mockPapers.forEach((paper) => {
    paper.reviews.forEach((review) => {
      if (review.reviewer_id === reviewerId) {
        reviews.push(review)
      }
    })
  })
  return reviews
}
