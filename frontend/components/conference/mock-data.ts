import type { Conference } from "./types"

export const MOCK_MY_CONFERENCES: Conference[] = [
  {
    id: "1",
    name: "38th AAAI Conference on Artificial Intelligence",
    acronym: "AAAI 2024",
    role: "Chair",
    track: "General Track",
    location: "Vancouver Convention Centre, Canada",
    dates: "Feb 20 - Feb 27, 2024",
    status: "active",
    reviewProgress: { label: "Review Progress", value: 91, submissions: 1245, daysLeft: 14 },
  },
  {
    id: "2",
    name: "CVPR 2025",
    role: "Co-Chair",
    track: "Vision Track",
    location: "Nashville, Tennessee, USA",
    dates: "Jun 17 - Jun 21, 2025",
    status: "planning",
    setupStatus: { phase: "Committee Formation", progress: 45, actionRequired: true },
  },
  {
    id: "3",
    name: "ICML 2025 Workshop",
    role: "Workshop Chair",
    location: "TBD",
    dates: "July 2025 (Tentative)",
    status: "draft",
    draftSavedDaysAgo: 2,
  },
  {
    id: "4",
    name: "NeurIPS 2023",
    role: "Area Chair",
    location: "New Orleans, USA",
    dates: "Dec 10 - Dec 16, 2023",
    status: "completed",
    acceptedPapers: 2341,
  },
  {
    id: "5",
    name: "ICLR 2024",
    role: "Senior Area Chair",
    location: "Vienna, Austria",
    dates: "May 07 - May 11, 2024",
    status: "active",
    reviewProgress: { label: "Camera Ready", value: 35, submissions: 0, daysLeft: 5 },
  },
]

export const MOCK_EXPLORE_CONFERENCES: Conference[] = []
export const MOCK_ARCHIVED_CONFERENCES: Conference[] = []
