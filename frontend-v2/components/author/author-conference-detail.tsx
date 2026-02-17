"use client"

import { useState, useEffect } from "react"
import {
  getConferenceById,
  getConferenceDates,
  type Conference,
  type ImportantDate,
} from "@/lib/api/conferences"
import {
  ConferenceHeader,
  OverviewTab,
  CallForPapersTab,
  ImportantDatesTab,
  CommitteeTab,
  type TabType,
} from "./conference-detail"

// Mock conference data for demo purposes
const MOCK_CONFERENCE: Conference = {
  id: "mock-1",
  name: "38th AAAI Conference on Artificial Intelligence",
  acronym: "AAAI 2024",
  year: 2024,
  description: `The AAAI Conference on Artificial Intelligence is a premier forum for advancing the science and practice of AI. The conference brings together researchers, practitioners, and industry leaders to share the latest advances in artificial intelligence and machine learning.

This year's conference features a special focus on responsible AI, large language models, and their applications in healthcare, robotics, and autonomous systems. We invite submissions on all aspects of AI research, including but not limited to machine learning, natural language processing, computer vision, robotics, and AI safety.

AAAI 2024 will also feature workshops, tutorials, and a student program designed to foster the next generation of AI researchers. Join us in Vancouver for what promises to be an exciting week of cutting-edge research and collaborative discussion.`,
  submission_deadline: "2024-08-15",
  review_deadline: "2024-10-30",
  camera_ready_deadline: "2024-12-15",
  notification_date: "2024-11-15",
  conference_date: "2024-02-20",
  conference_end_date: "2024-02-27",
  location: "Vancouver Convention Centre, Vancouver, Canada",
  website: "https://aaai.org/aaai-conference/",
  status: "open",
  tracks: [
    "Main Track",
    "AI for Social Impact",
    "Senior Member Presentations",
    "Student Abstract",
    "Demonstration",
  ],
  domain: [
    "Machine Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Robotics",
    "AI Safety",
    "Knowledge Representation",
    "Planning and Scheduling",
    "Multi-Agent Systems",
  ],
  call_for_paper_text: `# Call for Papers

The Thirty-Eighth AAAI Conference on Artificial Intelligence (AAAI-24) invites submission of technical papers describing original, fundamental contributions to the science and technology of AI.

## Topics of Interest

AAAI-24 welcomes submissions reporting research that advances artificial intelligence, broadly conceived. The conference scope includes all subareas of AI research:

- **Machine Learning**: Deep learning, reinforcement learning, representation learning, transfer learning, meta-learning
- **Natural Language Processing**: Large language models, dialogue systems, machine translation, information extraction
- **Computer Vision**: Object detection, scene understanding, image generation, video analysis
- **Knowledge Representation and Reasoning**: Ontologies, semantic web, logic programming, probabilistic reasoning
- **Robotics and Autonomous Systems**: Motion planning, manipulation, human-robot interaction
- **AI Ethics and Safety**: Fairness, explainability, robustness, alignment

## Submission Guidelines

- Papers must be submitted in PDF format
- Maximum 7 pages of content plus 1 page for references
- Papers must be anonymized for double-blind review
- Submissions must represent original, unpublished work

## Important Information

All submissions will be reviewed through a rigorous double-blind peer review process. Authors should not include any identifying information in their submissions. Please refer to the formatting guidelines for detailed instructions.`,
  chair: "Dr. Michael Wooldridge",
  co_chairs: ["chair@aaai.org", "program-chair@aaai.org"],
  configurations: {
    start_date: "2024-02-20",
    end_date: "2024-02-27",
    abstract_submission_deadline: "2024-08-08",
    full_paper_submission_deadline: "2024-08-15",
    camera_ready_deadline: "2024-12-15",
    format: "Double Column",
    review_type: "Double Blind",
    have_coi: true,
    maximum_pages: 7,
    submission_format: "PDF",
    require_complete_author_profile: true,
    allow_paper_withdrawls: true,
  },
}

const MOCK_DATES: ImportantDate[] = [
  {
    id: "1",
    title: "Abstract Submission",
    date: "2024-08-08",
    description: "Deadline for abstract submission",
    type: "deadline",
    isPast: true,
  },
  {
    id: "2",
    title: "Full Paper Submission",
    date: "2024-08-15",
    description: "Deadline for full paper submission",
    type: "deadline",
    isPast: true,
  },
  {
    id: "3",
    title: "Review Deadline",
    date: "2024-10-30",
    description: "Reviews must be completed by reviewers",
    type: "deadline",
    isPast: true,
  },
  {
    id: "4",
    title: "Author Notification",
    date: "2024-11-15",
    description: "Authors will be notified of acceptance decisions",
    type: "notification",
    isPast: true,
  },
  {
    id: "5",
    title: "Camera Ready Deadline",
    date: "2024-12-15",
    description: "Final camera-ready papers due",
    type: "deadline",
    isPast: true,
  },
  {
    id: "6",
    title: "Conference Start",
    date: "2024-02-20",
    description: "AAAI 2024 conference begins",
    type: "event",
    isPast: false,
  },
  {
    id: "7",
    title: "Conference End",
    date: "2024-02-27",
    description: "AAAI 2024 conference concludes",
    type: "event",
    isPast: false,
  },
]

interface AuthorConferenceDetailProps {
  conferenceId: string
}

export function AuthorConferenceDetail({ conferenceId }: AuthorConferenceDetailProps) {
  const [conference, setConference] = useState<Conference | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [hasSubmission, setHasSubmission] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [confResp, datesResp] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceDates(conferenceId),
      ])

      // Use API data if available, otherwise fall back to mock data
      setConference(confResp.data || MOCK_CONFERENCE)
      setDates(datesResp.data?.length ? datesResp.data : MOCK_DATES)
      setHasSubmission(false) // TODO: Check if user has submission

      setLoading(false)
    }

    fetchData()
  }, [conferenceId])

  if (loading || !conference) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500">Loading conference details...</div>
      </div>
    )
  }

  return (
    <main className="flex-grow flex flex-col h-screen overflow-hidden">
      {/* Sticky Header with Tabs */}
      <ConferenceHeader
        conference={conference}
        conferenceId={conferenceId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSubmission={hasSubmission}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
        <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
          {activeTab === "overview" && <OverviewTab conference={conference} />}
          {activeTab === "cfp" && <CallForPapersTab conference={conference} />}
          {activeTab === "dates" && <ImportantDatesTab dates={dates} />}
          {activeTab === "committee" && <CommitteeTab conference={conference} />}
        </div>
      </div>
    </main>
  )
}
