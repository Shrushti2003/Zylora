import { useEffect, useMemo, useState } from "react";
import { getAvatarColor, getDisplayName, getProfileInitial, getProfilePhoto, type ProfileIdentity } from "../../utils/profile";
import type { AuthUser } from "../../types/auth";

type ProfileAvatarProps = {
  profile?: ProfileIdentity | AuthUser | null;
  name?: string;
  src?: string;
  className?: string;
};

export function ProfileAvatar({ profile, name, src, className = "profile-avatar" }: ProfileAvatarProps) {
  const displayName = name || getDisplayName(profile);
  const photoUrl = (src ?? getProfilePhoto(profile)).trim();
  const [hasImageError, setHasImageError] = useState(false);
  const seed = useMemo(() => {
    if (profile && "profile" in profile) return profile.id;
    return `${profile?.id ?? profile?.userId ?? profile?.username ?? profile?.slug ?? displayName}`;
  }, [displayName, profile]);

  useEffect(() => {
    setHasImageError(false);
  }, [photoUrl]);

  if (photoUrl && !hasImageError) {
    return (
      <img
        className={`${className} profile-avatar-image`}
        src={photoUrl}
        alt={`${displayName} profile`}
        loading="lazy"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <span
      className={`${className} profile-avatar-initial`}
      style={{ backgroundColor: getAvatarColor(seed) }}
      aria-label={`${displayName} profile`}
    >
      {getProfileInitial(displayName)}
    </span>
  );
}
