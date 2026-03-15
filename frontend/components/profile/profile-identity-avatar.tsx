import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getProfileGradient, getProfileInitials } from "@/lib/profile/presentation"
import { cn } from "@/lib/utils"

export function ProfileIdentityAvatar({
  name,
  seed,
  className,
}: {
  name: string
  seed: string
  className?: string
}) {
  return (
    <Avatar className={cn("h-16 w-16 border-2 border-white/80 shadow-md", className)}>
      <AvatarFallback
        className="text-lg font-bold text-white"
        style={{ backgroundImage: getProfileGradient(seed) }}
      >
        {getProfileInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
