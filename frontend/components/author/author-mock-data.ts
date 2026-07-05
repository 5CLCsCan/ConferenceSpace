import type { AuthorConference, AuthorTabType } from "./author-conference-cards"
import type { ExploreConference } from "@/components/conference/types"

// -------------------------------------------------------------------------
// Mock Data for Author "My Conferences" Tab
// -------------------------------------------------------------------------

export const MOCK_AUTHOR_CONFERENCES: AuthorConference[] = [
  {
    id: "auth-1",
    name: "38th AAAI Conference on Artificial Intelligence",
    acronym: "AAAI 2024",
    location: "Vancouver Convention Centre, Canada",
    dates: "Feb 20 - Feb 27, 2024",
    status: "under-review",
    paperTitle: "Improving Vision-Language Models via Multi-Modal Alignment",
    trackName: "Main Track",
    reviewProgress: 65,
  },
  {
    id: "auth-2",
    name: "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
    acronym: "CVPR 2024",
    location: "Seattle, Washington, USA",
    dates: "Jun 17 - Jun 21, 2024",
    status: "accepted",
    paperTitle: "Self-Supervised Representation Learning for 3D Point Clouds",
    trackName: "Vision Track",
  },
  {
    id: "auth-3",
    name: "International Conference on Machine Learning",
    acronym: "ICML 2024",
    location: "Vienna, Austria",
    dates: "Jul 21 - Jul 27, 2024",
    status: "submitted",
    paperTitle: "Efficient Fine-Tuning of Large Language Models",
    trackName: "Main Track",
    submissionDate: "Jan 15, 2024",
  },
  {
    id: "auth-4",
    name: "Neural Information Processing Systems",
    acronym: "NeurIPS 2024",
    location: "Vancouver, Canada",
    dates: "Dec 9 - Dec 15, 2024",
    status: "revision-requested",
    paperTitle: "On the Generalization of Diffusion Models",
    trackName: "Deep Learning",
    fullPaperDeadline: "Mar 15, 2024",
  },
  {
    id: "auth-5",
    name: "ACM SIGCHI Conference on Human Factors in Computing Systems",
    acronym: "CHI 2024",
    location: "Honolulu, Hawaii, USA",
    dates: "May 11 - May 16, 2024",
    status: "rejected",
    paperTitle: "Adaptive User Interfaces for Accessibility",
    trackName: "Accessibility",
  },
  {
    id: "auth-6",
    name: "European Conference on Computer Vision",
    acronym: "ECCV 2024",
    location: "Milan, Italy",
    dates: "Sep 29 - Oct 4, 2024",
    status: "bookmarked",
    submissionDeadline: "Mar 7, 2024",
  },
]

// -------------------------------------------------------------------------
// Mock Data for Author "Explore" Tab (Open Conferences)
// -------------------------------------------------------------------------

export const MOCK_EXPLORE_CONFERENCES: ExploreConference[] = [
  {
    id: "exp-1",
    name: "SIGGRAPH 2025",
    fullDescription: "Computer Graphics & Interactive Techniques",
    location: "Los Angeles Convention Center, USA",
    dates: "Aug 03 - Aug 07, 2025",
    exploreStatus: "call-for-papers",
    topics: ["Animation", "Rendering", "VR/AR"],
  },
  {
    id: "exp-2",
    name: "CHI 2025",
    fullDescription: "Human Factors in Computing Systems",
    location: "Hawaii Convention Center, Honolulu, USA",
    dates: "Apr 26 - May 01, 2025",
    exploreStatus: "registration-open",
    topics: ["HCI", "UX", "Design"],
  },
  {
    id: "exp-3",
    name: "ICML 2025",
    fullDescription: "International Conference on Machine Learning",
    location: "Vancouver, Canada",
    dates: "July 2025 (Tentative)",
    exploreStatus: "upcoming",
    topics: ["ML", "Deep Learning"],
  },
  {
    id: "exp-4",
    name: "ACL 2025",
    fullDescription: "Association for Computational Linguistics",
    location: "Dublin, Ireland",
    dates: "Jul 27 - Aug 01, 2025",
    exploreStatus: "call-for-papers",
    topics: ["NLP", "LLMs", "Linguistics"],
  },
]

// -------------------------------------------------------------------------
// Mock Data for Author "Archived" Tab (Past Submissions)
// -------------------------------------------------------------------------

export const MOCK_ARCHIVED_CONFERENCES: ExploreConference[] = [
  {
    id: "arch-1",
    name: "NeurIPS 2023",
    fullDescription: "Neural Information Processing Systems",
    location: "New Orleans, USA",
    dates: "Dec 10 - Dec 16, 2023",
    exploreStatus: "upcoming",
    topics: [],
  },
  {
    id: "arch-2",
    name: "ICML 2023",
    fullDescription: "International Conference on Machine Learning",
    location: "Honolulu, Hawaii",
    dates: "Jul 23 - Jul 29, 2023",
    exploreStatus: "upcoming",
    topics: [],
  },
  {
    id: "arch-3",
    name: "CVPR 2023",
    fullDescription: "Computer Vision and Pattern Recognition",
    location: "Vancouver, Canada",
    dates: "Jun 18 - Jun 22, 2023",
    exploreStatus: "upcoming",
    topics: [],
  },
]

// -------------------------------------------------------------------------
// Empty State Content
// -------------------------------------------------------------------------

export const EMPTY_STATE_ICONS: Record<AuthorTabType, string> = {
  "my-conferences": "description",
  explore: "explore",
  archived: "archive",
}

const EMPTY_STATE_MESSAGE_KEYS: Record<
  AuthorTabType,
  { title: string; description: string }
> = {
  "my-conferences": {
    title: "common.emptyStates.author.myConferences.title",
    description: "common.emptyStates.author.myConferences.description",
  },
  explore: {
    title: "common.emptyStates.author.explore.title",
    description: "common.emptyStates.author.explore.description",
  },
  archived: {
    title: "common.emptyStates.author.archived.title",
    description: "common.emptyStates.author.archived.description",
  },
}

export function getAuthorEmptyStateKeys(type: AuthorTabType) {
  return EMPTY_STATE_MESSAGE_KEYS[type]
}
