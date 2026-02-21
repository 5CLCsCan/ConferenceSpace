import { Notification } from "@/components/notifications/notification-card"

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "deadline",
    title: "Final Review Deadline Approach",
    content:
      "The deadline for ICML 2026 paper submissions is approaching in 48 hours. Please ensure all supplementary materials are uploaded.",
    time: "2 hours ago",
    isRead: false,
    actionLabel: "View Submission",
    actionHref: "#",
    meta: "Paper ID: 4821 • Security & Privacy track",
  },
  {
    id: "2",
    type: "success",
    title: "Submission Successfully Received",
    content:
      "Your paper 'Towards Agentic Coding with Large Language Models' has been successfully submitted to KDD 2026.",
    time: "5 hours ago",
    isRead: true,
    actionLabel: "Download Receipt",
    actionHref: "#",
  },
  {
    id: "3",
    type: "mention",
    title: "Dr. Elena Petrova mentioned you",
    content:
      "I think we should reconsider the baseline comparison in Section 4. @you, could you double check the results?",
    time: "8 hours ago",
    isRead: false,
    authorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    meta: "Thread: Paper Revision v2.1",
    actionLabel: "Reply",
  },
  {
    id: "4",
    type: "review",
    title: "New Review Assignment",
    content:
      "You have been assigned as a reviewer for 'Optimization Methods in Deep Learning'. Review deadline: March 15th.",
    time: "Yesterday",
    isRead: true,
    actionLabel: "Access Portal",
  },
  {
    id: "5",
    type: "deadline",
    title: "Camera Ready Deadline",
    content:
      "Remember to submit the camera-ready version of your accepted paper for NeurIPS 2025 by midnight tonight.",
    time: "Yesterday",
    isRead: false,
    actionLabel: "Upload Final",
    meta: "Publication Fee Paid: [PASS]",
  },
  {
    id: "6",
    type: "system",
    title: "Profile Update Required",
    content:
      "Please update your Conflict of Interest (COI) information before the next review cycle starts.",
    time: "2 days ago",
    isRead: true,
    actionLabel: "Update Profile",
  },
]
