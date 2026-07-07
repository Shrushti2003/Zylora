const EMAIL_VERIFICATION_BANNER_DISMISSED_KEY_PREFIX = "emailVerificationBannerDismissed_";

export function getEmailVerificationBannerDismissalKey(userId: string) {
  return `${EMAIL_VERIFICATION_BANNER_DISMISSED_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

export function isEmailVerificationBannerDismissed(userId: string) {
  try {
    return getStorage()?.getItem(getEmailVerificationBannerDismissalKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function dismissEmailVerificationBanner(userId: string) {
  try {
    getStorage()?.setItem(getEmailVerificationBannerDismissalKey(userId), "true");
  } catch {
    return;
  }
}

export function clearEmailVerificationBannerDismissal(userId: string | null | undefined) {
  if (!userId) return;

  try {
    getStorage()?.removeItem(getEmailVerificationBannerDismissalKey(userId));
  } catch {
    return;
  }
}

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
