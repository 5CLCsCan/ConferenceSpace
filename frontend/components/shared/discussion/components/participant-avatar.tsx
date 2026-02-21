import type { Participant } from "../types"
import { ROLE_STYLES } from "../config"

interface ParticipantAvatarProps {
  participant: Participant
  size?: "sm" | "md" | "lg"
}

export function ParticipantAvatar({ participant, size = "md" }: ParticipantAvatarProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[8px]",
    md: "w-8 h-8 text-[10px]",
    lg: "w-10 h-10 text-[11px]",
  }
  const style = ROLE_STYLES[participant.role]

  // System avatar
  if (participant.role === "system") {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-slate-200 flex items-center justify-center`}
      >
        <span className="material-symbols-outlined text-slate-500 text-[14px]">smart_toy</span>
      </div>
    )
  }

  // Current user with actual avatar
  if (participant.isCurrentUser && participant.avatar) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-cover bg-center ring-2 ring-[#1B3C53]/20`}
        style={{ backgroundImage: `url("${participant.avatar}")` }}
      />
    )
  }

  // Current user placeholder
  if (participant.isCurrentUser) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#1B3C53] text-white flex items-center justify-center font-bold ring-2 ring-[#1B3C53]/20`}
      >
        You
      </div>
    )
  }

  // Role-based avatar with initials
  const getInitials = () => {
    if (participant.role === "area_chair") return "AC"
    if (participant.role === "senior_pc") return "SPC"
    if (participant.anonymousId) {
      const match = participant.anonymousId.match(/#(\d+)/)
      return match ? `R${match[1]}` : "R"
    }
    return participant.displayName.charAt(0).toUpperCase()
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${style.bg} ${style.text} flex items-center justify-center font-bold`}
    >
      {getInitials()}
    </div>
  )
}
