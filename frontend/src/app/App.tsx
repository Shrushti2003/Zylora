import { AppRoutes } from "../routes/AppRoutes";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { completeRedirectLogin, hadPendingGoogleRedirect, isUnauthorizedAuthError, loadCurrentUser, logout, subscribeToMessageEvents } from "../services/auth.service";
import { clearAuthenticatedUser, setAuthenticatedUser, setAuthInitialized } from "../features/auth/authSlice";
import { setTheme, THEME_STORAGE_KEY } from "../features/theme/themeSlice";
import type { AppDispatch } from "../store/store";
import type { RootState } from "../store/store";
import { GlobalAnimation } from "../components/layout/GlobalAnimation";
import { GlobalErrorBoundary } from "../components/common/GlobalErrorBoundary";
import { syncProfileReferences } from "../data/mvpData";
import { clearEmailVerificationBannerDismissal } from "../utils/emailVerificationBanner";

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.theme.value);
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = user?.id;
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const wasGoogleRedirect = hadPendingGoogleRedirect();

    completeRedirectLogin()
      .then((result) => {
        if (result?.user) {
          dispatch(setAuthenticatedUser(result.user));
          syncProfileReferences(result.user);
          navigate(result.destination, { replace: true });
        }
      })
      .catch((error) => {
        if (isUnauthorizedAuthError(error)) {
          void logout(userRef.current?.id);
        }
        if (wasGoogleRedirect) {
          const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
            ? error.code
            : "google";
          navigate(`/login?authError=${encodeURIComponent(code)}`, { replace: true });
        }
      })
      .finally(() => {
        if (wasGoogleRedirect) {
          dispatch(setAuthInitialized());
        }
      });
  }, [dispatch, navigate]);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        clearEmailVerificationBannerDismissal(userRef.current?.id);
        dispatch(clearAuthenticatedUser());
        dispatch(setAuthInitialized());
        return;
      }

      loadCurrentUser(firebaseUser)
        .then((user) => {
          if (user) {
            dispatch(setAuthenticatedUser(user));
            syncProfileReferences(user);
          } else {
            dispatch(clearAuthenticatedUser());
          }
        })
        .catch((error) => {
          dispatch(clearAuthenticatedUser());
          if (isUnauthorizedAuthError(error)) {
            void logout(userRef.current?.id);
          }
        })
        .finally(() => {
          dispatch(setAuthInitialized());
        });
    });
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!userId) return undefined;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    subscribeToMessageEvents((event) => {
      if (event.type !== "messages" || typeof event.unreadCount !== "number") return;
      const currentUser = userRef.current;
      if (!currentUser || currentUser.unreadMessageCount === event.unreadCount) return;
      dispatch(setAuthenticatedUser({ ...currentUser, unreadMessageCount: event.unreadCount }));
    }).then((cleanup) => {
      if (!isMounted) {
        cleanup();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [dispatch, userId]);

  useEffect(() => {
    const syncThemeAcrossTabs = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        dispatch(setTheme(event.newValue === "dark" ? "dark" : "light"));
      }
    };

    window.addEventListener("storage", syncThemeAcrossTabs);
    return () => window.removeEventListener("storage", syncThemeAcrossTabs);
  }, [dispatch]);

  return (
    <GlobalErrorBoundary>
      <GlobalAnimation />
      <AppRoutes />
    </GlobalErrorBoundary>
  );
}
