import { Bell, Camera, Globe2, Grid2X2, Heart, Lock, LogOut, MessageCircle, Moon, Save, ShieldCheck, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { updateProfile } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { ProfileAvatar } from "../components/common/ProfileAvatar";
import { VerifiedBadge } from "../components/common/VerifiedBadge";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { auth } from "../config/firebase";
import { clearAuthenticatedUser, setAuthenticatedUser } from "../features/auth/authSlice";
import { setTheme } from "../features/theme/themeSlice";
import { loadResources, loadStories, syncProfileReferences } from "../data/mvpData";
import { getAuthErrorMessage, logout, saveUserProfile } from "../services/auth.service";
import { loadMyResources, type OwnedResource } from "../services/resource.service";
import type { AppDispatch, RootState } from "../store/store";
import type { AuthUser, NotificationSettings, PrivacySettings } from "../types/auth";

const languages = ["English", "Hindi"];

const translations: Record<string, Record<string, string>> = {
  English: {
    profile: "Profile & settings",
    manage: "Manage identity, verification, privacy, and notifications from one reliable workspace.",
    hi: "Hi",
    editProfile: "Edit profile",
    name: "Name",
    organizationName: "Organization name",
    bio: "Bio / About",
    profilePhoto: "Profile photo",
    language: "Language",
    settings: "Settings",
    privacySettings: "Privacy Settings",
    notificationSettings: "Notification Settings",
    themeSettings: "Theme Settings",
    savedResources: "Saved Resources",
    messages: "Messages",
    posts: "Posts",
    verificationStatus: "Verification Status",
    logout: "Logout",
    userId: "User ID",
    publicProfile: "Public Profile",
    showEmail: "Show Email",
    showSavedResources: "Show Saved Resources",
    showOnlineStatus: "Show Online Status",
    allowSearchVisibility: "Allow Search Visibility",
    allowMessageRequests: "Allow Message Requests",
    pushNotifications: "Push Notifications",
    emailNotifications: "Email Notifications",
    messageNotifications: "Message Notifications",
    resourceUpdates: "Resource Updates",
    verificationUpdates: "Verification Updates",
    marketingNotifications: "Marketing Notifications",
    newFollowerNotifications: "New Follower Notifications",
    systemAlerts: "System Alerts",
    verified: "Verified",
    notVerified: "Not verified",
    saved: "saved",
    unread: "unread"
  },
  Hindi: {
    profile: "प्रोफाइल और सेटिंग्स",
    manage: "पहचान, सत्यापन, गोपनीयता और सूचनाओं को एक ही जगह से संभालें।",
    hi: "नमस्ते",
    editProfile: "प्रोफाइल संपादित करें",
    name: "नाम",
    organizationName: "संस्था का नाम",
    bio: "परिचय / विवरण",
    profilePhoto: "प्रोफाइल फोटो",
    language: "भाषा",
    settings: "सेटिंग्स",
    privacySettings: "गोपनीयता सेटिंग्स",
    notificationSettings: "सूचना सेटिंग्स",
    themeSettings: "थीम सेटिंग्स",
    savedResources: "सेव किए गए संसाधन",
    messages: "संदेश",
    posts: "पोस्ट",
    verificationStatus: "सत्यापन स्थिति",
    logout: "लॉगआउट",
    userId: "यूजर आईडी",
    publicProfile: "सार्वजनिक प्रोफाइल",
    showEmail: "ईमेल दिखाएं",
    showSavedResources: "सेव संसाधन दिखाएं",
    showOnlineStatus: "ऑनलाइन स्थिति दिखाएं",
    allowSearchVisibility: "खोज में दिखाएं",
    allowMessageRequests: "संदेश अनुरोध स्वीकार करें",
    pushNotifications: "पुश सूचनाएं",
    emailNotifications: "ईमेल सूचनाएं",
    messageNotifications: "संदेश सूचनाएं",
    resourceUpdates: "संसाधन अपडेट",
    verificationUpdates: "सत्यापन अपडेट",
    marketingNotifications: "मार्केटिंग सूचनाएं",
    newFollowerNotifications: "नए फॉलोअर सूचनाएं",
    systemAlerts: "सिस्टम अलर्ट",
    verified: "सत्यापित",
    notVerified: "सत्यापित नहीं",
    saved: "सेव",
    unread: "अपठित"
  }
};

const privacyFields: Array<keyof PrivacySettings> = [
  "publicProfile",
  "showEmail",
  "showSavedResources",
  "showOnlineStatus",
  "allowSearchVisibility",
  "allowMessageRequests"
];

const notificationFields: Array<keyof NotificationSettings> = [
  "pushNotifications",
  "emailNotifications",
  "messageNotifications",
  "resourceUpdates",
  "verificationUpdates",
  "marketingNotifications",
  "newFollowerNotifications",
  "systemAlerts"
];

type ProfileDraft = {
  name: string;
  username: string;
  organizationName: string;
  bio: string;
  phoneNumber: string;
  location: string;
  socialLinks: AuthUser["profile"]["socialLinks"];
  photoUrl: string;
  theme: "light" | "dark";
  language: string;
  privacy: PrivacySettings | null;
  notifications: NotificationSettings | null;
};

export function ProfileSettingsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.profile?.username ?? "");
  const [organizationName, setOrganizationName] = useState(user?.profile?.organizationName ?? "");
  const [bio, setBio] = useState(user?.profile?.bio ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber ?? "");
  const [location, setLocation] = useState(user?.profile?.location ?? "");
  const [socialLinks, setSocialLinks] = useState<AuthUser["profile"]["socialLinks"]>(user?.profile?.socialLinks ?? createDefaultSocialLinks());
  const [photoUrl, setPhotoUrl] = useState(user?.profile?.photoUrl ?? "");
  const theme = useSelector((state: RootState) => state.theme.value);
  const [language, setLanguage] = useState(user?.preferences?.language ?? "English");
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(user?.preferences?.privacy ?? null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(user?.preferences?.notifications ?? null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [accountDeletionMessage, setAccountDeletionMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [, setIsSavingSettings] = useState(false);
  const [savingSettingKeys, setSavingSettingKeys] = useState<Set<string>>(() => new Set());
  const [posts, setPosts] = useState<OwnedResource[]>([]);
  const initialDraftRef = useRef<ProfileDraft | null>(user ? createProfileDraft(user) : null);
  const settingSaveChainsRef = useRef<Record<string, Promise<void>>>({});
  const settingSaveVersionsRef = useRef<Record<string, number>>({});

  const t = useMemo(() => translations[language] ?? translations.English, [language]);
  const resources = useMemo(() => loadResources(), []);
  const stories = useMemo(() => loadStories(), []);
  const isVerified = Boolean(user?.verification?.isIdentityVerified || user?.verification?.status === "Approved");

  useEffect(() => {
    if (!user) return;
    syncFromUser(user);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    loadMyResources()
      .then((resources) => {
        if (!isMounted) return;
        setPosts(resources);
      })
      .catch(() => {
        if (!isMounted) return;
        setPosts([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function persist(next: {
    name?: string;
    username?: string;
    organizationName?: string;
    bio?: string;
    photoUrl?: string | null;
    phoneNumber?: string;
    location?: string;
    socialLinks?: AuthUser["profile"]["socialLinks"];
    theme?: "light" | "dark";
    language?: string;
    privacy?: Partial<PrivacySettings>;
    notifications?: Partial<NotificationSettings>;
  }) {
    if (auth.currentUser) {
      const firebaseUpdate: { displayName?: string; photoURL?: string | null } = {};

      if (typeof next.name === "string" && next.name.trim()) {
        firebaseUpdate.displayName = next.name.trim();
      }

      if ("photoUrl" in next && canSyncFirebasePhotoUrl(next.photoUrl)) {
        firebaseUpdate.photoURL = next.photoUrl ?? null;
      }

      if (Object.keys(firebaseUpdate).length) {
        await updateProfile(auth.currentUser, firebaseUpdate);
      }
    }

    const updated = await saveUserProfile(next);
    dispatch(setAuthenticatedUser(updated));
    syncProfileReferences(updated);
    initialDraftRef.current = createProfileDraft(updated);
    return updated;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      await persist({
        name: name.trim(),
        username,
        organizationName,
        bio,
        phoneNumber,
        location,
        socialLinks,
        photoUrl,
        theme,
        language,
        privacy: privacy ?? undefined,
        notifications: notifications ?? undefined
      });
      setMessage("Profile changes saved.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previous = photoUrl;

    setIsSavingPhoto(true);
    try {
      validateProfileImage(file);
      const resized = await resizeImage(file);
      setPhotoUrl(resized);
      setError("");
      await persist({ photoUrl: resized });
      setMessage("Profile photo saved.");
    } catch (caughtError) {
      setPhotoUrl(previous);
      setError(caughtError instanceof Error ? caughtError.message : "Could not process this photo. Please choose a smaller image.");
    } finally {
      setIsSavingPhoto(false);
      event.target.value = "";
    }
  }

  async function removePhoto() {
    const previous = photoUrl;
    setPhotoUrl("");
    setIsSavingPhoto(true);
    setError("");
    setMessage("");

    try {
      await persist({ photoUrl: null });
      setMessage("Profile photo removed.");
    } catch (caughtError) {
      setPhotoUrl(previous);
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function toggleTheme(checked: boolean) {
    const previous = theme;
    const next = checked ? "dark" : "light";
    dispatch(setTheme(next));

    await saveSettings(async () => {
      try {
        await persist({ theme: next });
        setMessage("Theme preference saved.");
      } catch (caughtError) {
        dispatch(setTheme(previous));
        throw caughtError;
      }
    });
  }

  async function changeLanguage(next: string) {
    const previous = language;
    setLanguage(next);

    await saveSettings(async () => {
      try {
        await persist({ language: next });
        setMessage("Language preference saved.");
      } catch (caughtError) {
        setLanguage(previous);
        throw caughtError;
      }
    });
  }

  async function handleLogout() {
    await logout(user?.id);
    dispatch(clearAuthenticatedUser());
    navigate("/", { replace: true });
  }

  function requestAccountDeletion() {
    setAccountDeletionMessage("Account deletion request noted. Contact support@zylora.app from your account email so the team can verify identity, review active listings/messages, and process deletion under the retention rules.");
  }

  function syncFromUser(nextUser: AuthUser) {
    const draft = createProfileDraft(nextUser);
    const hasPendingSettings = Object.keys(settingSaveChainsRef.current).length > 0;
    initialDraftRef.current = draft;
    setName(draft.name);
    setUsername(draft.username);
    setOrganizationName(draft.organizationName);
    setBio(draft.bio);
    setPhoneNumber(draft.phoneNumber);
    setLocation(draft.location);
    setSocialLinks(draft.socialLinks);
    setPhotoUrl(draft.photoUrl);
    setLanguage(draft.language);
    if (!hasPendingSettings) {
      setPrivacy(draft.privacy);
      setNotifications(draft.notifications);
    }
  }

  function resetProfileDraft() {
    const draft = initialDraftRef.current;
    if (!draft) return;
    setName(draft.name);
    setUsername(draft.username);
    setOrganizationName(draft.organizationName);
    setBio(draft.bio);
    setPhoneNumber(draft.phoneNumber);
    setLocation(draft.location);
    setSocialLinks(draft.socialLinks);
    setPhotoUrl(draft.photoUrl);
    setLanguage(draft.language);
    setError("");
    setMessage("Unsaved profile changes discarded.");
  }

  function setSocialLink(key: keyof AuthUser["profile"]["socialLinks"], value: string) {
    setSocialLinks((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(action: () => Promise<void>) {
    setError("");
    setMessage("");
    setIsSavingSettings(true);
    try {
      await action();
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function updatePrivacySetting(key: keyof PrivacySettings, checked: boolean) {
    const previous = privacy;
    const next: PrivacySettings = { ...(privacy ?? createDefaultPrivacySettings()), [key]: checked };
    setPrivacy(next);

    queueSettingSave(
      `privacy.${String(key)}`,
      () => saveUserProfile({ privacy: { [key]: checked } }),
      () => setPrivacy(previous),
      () => {
        const currentDraft = initialDraftRef.current;
        if (currentDraft) {
          initialDraftRef.current = {
            ...currentDraft,
            privacy: { ...(currentDraft.privacy ?? createDefaultPrivacySettings()), [key]: checked }
          };
        }
        setMessage("Privacy settings saved.");
      }
    );
  }

  async function updateNotificationSetting(key: keyof NotificationSettings, checked: boolean) {
    const previous = notifications;
    const next: NotificationSettings = { ...(notifications ?? createDefaultNotificationSettings()), [key]: checked };
    setNotifications(next);

    queueSettingSave(
      `notifications.${String(key)}`,
      () => saveUserProfile({ notifications: { [key]: checked } }),
      () => setNotifications(previous),
      () => {
        const currentDraft = initialDraftRef.current;
        if (currentDraft) {
          initialDraftRef.current = {
            ...currentDraft,
            notifications: { ...(currentDraft.notifications ?? createDefaultNotificationSettings()), [key]: checked }
          };
        }
        setMessage("Notification settings saved.");
      }
    );
  }

  function queueSettingSave(
    settingKey: string,
    action: () => Promise<AuthUser>,
    rollback: () => void,
    onSuccess: () => void
  ) {
    setError("");
    setMessage("");
    setSavingSettingKeys((current) => new Set(current).add(settingKey));
    const version = (settingSaveVersionsRef.current[settingKey] ?? 0) + 1;
    settingSaveVersionsRef.current[settingKey] = version;

    const previousTask = settingSaveChainsRef.current[settingKey] ?? Promise.resolve();
    const nextTask = previousTask
      .catch(() => undefined)
      .then(async () => {
        try {
          const updated = await action();
          dispatch(setAuthenticatedUser(updated));
          if (settingSaveVersionsRef.current[settingKey] === version) {
            onSuccess();
          }
        } catch (caughtError) {
          if (settingSaveVersionsRef.current[settingKey] === version) {
            rollback();
            setError(getAuthErrorMessage(caughtError));
          }
        }
      })
      .finally(() => {
        if (settingSaveChainsRef.current[settingKey] === nextTask) {
          delete settingSaveChainsRef.current[settingKey];
          setSavingSettingKeys((current) => {
            const next = new Set(current);
            next.delete(settingKey);
            return next;
          });
        }
      });

    settingSaveChainsRef.current[settingKey] = nextTask;
  }

  if (!user || !privacy || !notifications) return null;

  const isProfileDirty = JSON.stringify({
    name,
    username,
    organizationName,
    bio,
    phoneNumber,
    location,
    socialLinks,
    photoUrl,
    language
  }) !== JSON.stringify({
    name: initialDraftRef.current?.name ?? "",
    username: initialDraftRef.current?.username ?? "",
    organizationName: initialDraftRef.current?.organizationName ?? "",
    bio: initialDraftRef.current?.bio ?? "",
    phoneNumber: initialDraftRef.current?.phoneNumber ?? "",
    location: initialDraftRef.current?.location ?? "",
    socialLinks: initialDraftRef.current?.socialLinks ?? createDefaultSocialLinks(),
    photoUrl: initialDraftRef.current?.photoUrl ?? "",
    language: initialDraftRef.current?.language ?? "English"
  });

  return (
    <PlatformLayout>
      <PageShell eyebrow={t.profile} title={`${t.hi}, ${name.split(" ")[0] || "Zylora"}`} description={t.manage}>
        <div className="profile-summary">
          <SurfaceCard>
            <ProfileAvatar profile={{ id: user.id, name, photoUrl }} className="profile-avatar" />
            <h2 className="profile-name-heading mt-4">
              {name || "Zylora member"}
              {isVerified ? <VerifiedBadge className="profile-card-verified-icon" /> : null}
            </h2>
            {username ? <p className="profile-username">@{username}</p> : null}
            <p className="mt-2 text-on-surface-variant">{user.email}</p>
            <p className="mt-2 text-xs text-on-surface-variant">{t.userId}: {user.id}</p>
            <span className={isVerified ? "verified-badge verified-badge-profile mt-4" : "status-pill mt-4"}>
              {isVerified ? <VerifiedBadge small className="profile-card-verified-icon" /> : <ShieldCheck className="h-4 w-4" />} {isVerified ? t.verified : t.notVerified}
            </span>
          </SurfaceCard>
          <SurfaceCard><strong>{posts.length || resources.length}</strong><span>Resources Shared</span></SurfaceCard>
          <SurfaceCard><strong>{user.savedResourceIds.length}</strong><span>{t.savedResources}</span></SurfaceCard>
          <SurfaceCard><strong>{user.unreadMessageCount}</strong><span>{t.messages} {t.unread}</span></SurfaceCard>
        </div>

        <div className="grid gap-5 md:grid-cols-2 mt-5">
          <SurfaceCard>
            <Camera className="h-6 w-6 text-secondary" />
            <h2 className="mt-4 text-xl font-semibold">{t.editProfile}</h2>
            <form className="listing-form" onSubmit={saveProfile}>
              <label><span>{t.name}</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label><span>{t.username ?? "Username"}</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="zylora-member" /></label>
              <label><span>{t.organizationName}</span><input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label>
              <label><span>{t.phoneNumber ?? "Phone Number"}</span><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></label>
              <label className="span-2"><span>{t.location ?? "Location"}</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state, country" /></label>
              <label className="span-2">
                <span>{t.bio}</span>
                <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell buyers about you, your organization, and how you share resources." />
              </label>
              <label className="span-2"><span>{t.website ?? "Website"}</span><input value={socialLinks.website} onChange={(event) => setSocialLink("website", event.target.value)} placeholder="https://example.org" /></label>
              <label><span>{t.linkedin ?? "LinkedIn"}</span><input value={socialLinks.linkedin} onChange={(event) => setSocialLink("linkedin", event.target.value)} /></label>
              <label><span>{t.instagram ?? "Instagram"}</span><input value={socialLinks.instagram} onChange={(event) => setSocialLink("instagram", event.target.value)} /></label>
              <label><span>{t.profilePhoto}</span><input type="file" accept="image/*" onChange={handlePhoto} disabled={isSavingPhoto} /></label>
              <label><span>{t.language}</span><select value={language} onChange={(event) => void changeLanguage(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
              <div className="span-2 profile-form-actions">
                <button className="organic-button primary" type="submit" disabled={isSavingProfile || !isProfileDirty}>
                  <Save className="h-4 w-4" /> {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button className="organic-button secondary" type="button" onClick={resetProfileDraft} disabled={isSavingProfile || !isProfileDirty}>
                  Cancel
                </button>
              </div>
              {photoUrl ? (
                <button
                  className="organic-button secondary span-2"
                  type="button"
                  onClick={() => void removePhoto()}
                  disabled={isSavingPhoto}
                >
                  <Trash2 className="h-4 w-4" /> {isSavingPhoto ? "Updating photo..." : t.removePhoto ?? "Remove photo"}
                </button>
              ) : null}
            </form>
            {message ? <p className="auth-help mt-3">{message}</p> : null}
            {error ? <p className="auth-error mt-3">{error}</p> : null}
          </SurfaceCard>

          <SurfaceCard>
            <Lock className="h-6 w-6 text-secondary" />
            <h2 className="mt-4 text-xl font-semibold">{t.settings}</h2>
            <div className="settings-list">
              <label>
                <Moon className="h-4 w-4" />
                <span>{t.themeSettings}</span>
                <span className="settings-switch-control">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={(event) => void toggleTheme(event.target.checked)}
                    aria-label={t.themeSettings}
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
              <button type="button" onClick={() => navigate("/profile/posts")}><Grid2X2 className="h-4 w-4" /> {t.posts} ({posts.length})</button>
              <button type="button" onClick={() => navigate("/saved")}><Heart className="h-4 w-4" /> {t.savedResources} ({user.savedResourceIds.length})</button>
              <button type="button" onClick={() => navigate("/messages")}><MessageCircle className="h-4 w-4" /> {t.messages} ({user.unreadMessageCount})</button>
              <button type="button" onClick={() => navigate("/verify")}><Globe2 className="h-4 w-4" /> {t.verificationStatus}</button>
              <button type="button" onClick={handleLogout}><LogOut className="h-4 w-4" /> {t.logout}</button>
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-5 md:grid-cols-2 mt-5">
          <SettingsPanel
            title={t.privacySettings}
            section="privacy"
            icon={<ShieldCheck className="h-6 w-6 text-secondary" />}
            fields={privacyFields}
            values={privacy}
            savingKeys={savingSettingKeys}
            t={t}
            onChange={(key, checked) => void updatePrivacySetting(key, checked)}
          />
          <SettingsPanel
            title={t.notificationSettings}
            section="notifications"
            icon={<Bell className="h-6 w-6 text-secondary" />}
            fields={notificationFields}
            values={notifications}
            savingKeys={savingSettingKeys}
            t={t}
            onChange={(key, checked) => void updateNotificationSetting(key, checked)}
          />
        </div>

        <SurfaceCard className="mt-5">
          <div className="verification-status-heading">
            <h2 className="text-xl font-semibold">{t.verificationStatus}</h2>
          </div>
          <p className="verification-status-value mt-2 text-on-surface-variant">
            {isVerified ? <VerifiedBadge small /> : null}
            <span>{user.verification?.status ?? "Not Submitted"} {stories.length ? "" : ""}</span>
          </p>
        </SurfaceCard>

        <SurfaceCard className="mt-5 account-deletion-card">
          <Trash2 className="h-6 w-6 text-secondary" />
          <h2 className="mt-4 text-xl font-semibold">Account deletion</h2>
          <p className="mt-2 text-on-surface-variant">
            Request deletion of your account, listings, profile information, and related data. Some records may be retained temporarily for support, safety, fraud prevention, or legal obligations.
          </p>
          <button type="button" className="organic-button secondary mt-4" onClick={requestAccountDeletion}>
            Request account deletion
          </button>
          {accountDeletionMessage ? <p className="auth-help mt-3" role="status">{accountDeletionMessage}</p> : null}
        </SurfaceCard>
      </PageShell>
    </PlatformLayout>
  );
}

function SettingsPanel<T extends object>({
  title,
  section,
  icon,
  fields,
  values,
  savingKeys,
  t,
  onChange
}: {
  title: string;
  section: "privacy" | "notifications";
  icon: JSX.Element;
  fields: Array<keyof T>;
  values: T;
  savingKeys: Set<string>;
  t: Record<string, string>;
  onChange: (key: keyof T, checked: boolean) => void;
}) {
  return (
    <SurfaceCard>
      {icon}
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <div className="settings-list">
        {fields.map((field) => (
          <label key={String(field)} className="settings-switch-row" data-saving={savingKeys.has(`${section}.${String(field)}`)}>
            <span>{t[String(field)] ?? String(field)}</span>
            <span className="settings-switch-control">
              <input
                type="checkbox"
                checked={Boolean(values[field] as boolean)}
                onChange={(event) => onChange(field, event.target.checked)}
                aria-label={t[String(field)] ?? String(field)}
              />
              <span aria-hidden="true" />
            </span>
          </label>
        ))}
      </div>
    </SurfaceCard>
  );
}

function createProfileDraft(user: AuthUser): ProfileDraft {
  return {
    name: user.name,
    username: user.profile?.username ?? "",
    organizationName: user.profile?.organizationName ?? "",
    bio: user.profile?.bio ?? "",
    phoneNumber: user.profile?.phoneNumber ?? "",
    location: user.profile?.location ?? "",
    socialLinks: user.profile?.socialLinks ?? createDefaultSocialLinks(),
    photoUrl: user.profile?.photoUrl ?? "",
    theme: user.preferences?.theme ?? "light",
    language: user.preferences?.language ?? "English",
    privacy: user.preferences?.privacy ?? null,
    notifications: user.preferences?.notifications ?? null
  };
}

function createDefaultSocialLinks(): AuthUser["profile"]["socialLinks"] {
  return {
    website: "",
    linkedin: "",
    instagram: ""
  };
}

function createDefaultPrivacySettings(): PrivacySettings {
  return {
    publicProfile: true,
    showEmail: false,
    showSavedResources: true,
    showOnlineStatus: true,
    allowSearchVisibility: true,
    allowMessageRequests: true
  };
}

function createDefaultNotificationSettings(): NotificationSettings {
  return {
    pushNotifications: true,
    emailNotifications: true,
    messageNotifications: true,
    resourceUpdates: true,
    verificationUpdates: true,
    marketingNotifications: false,
    newFollowerNotifications: true,
    systemAlerts: true
  };
}

function canSyncFirebasePhotoUrl(photoUrl: string | null | undefined) {
  if (photoUrl === null) return true;
  if (!photoUrl) return false;
  return /^https?:\/\//i.test(photoUrl) && photoUrl.length <= 2048;
}

function validateProfileImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Profile photo must be 5 MB or smaller.");
  }
}

function resizeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas not available"));
          return;
        }
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
