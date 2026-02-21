import { cn } from "@/lib/utils"
import { getArtisticGradient } from "../utils"

interface MemberAvatarProps {
  name: string
  email: string
  img?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
}

export function MemberAvatar({ name, email, img, size = "md" }: MemberAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "?"

  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0 overflow-hidden bg-cover bg-center shadow-sm flex items-center justify-center",
        sizeClasses[size],
      )}
      style={{
        backgroundImage: img ? `url('${img}')` : getArtisticGradient(email || name),
      }}
    >
      {!img && <span className="text-white font-bold text-sm drop-shadow-md">{initial}</span>}
    </div>
  )
}
