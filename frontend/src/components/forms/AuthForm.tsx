import { FormEvent, useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getAccountStatus, getAuthErrorMessage, type AccountStatus } from "../../services/auth.service";
import type { UserRole } from "../../types/auth";
import { PasswordInput } from "./PasswordInput";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (payload: { name?: string; email: string; password: string; role?: UserRole; rememberMe?: boolean }) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
}

const roles: Array<{ value: UserRole; label: string }> = [
  { value: "individual", label: "Individual" },
  { value: "ngo", label: "NGO" },
  { value: "volunteer", label: "School" },
  { value: "business", label: "Business" }
];

export function AuthForm({ mode, onSubmit, onGoogleLogin }: AuthFormProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<UserRole>("individual");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    const requestedEmail = searchParams.get("email");
    if (requestedEmail && !email) {
      setEmail(requestedEmail);
      void checkEmail(requestedEmail);
    }
  // The query parameter is only used to prefill a linked auth action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function checkEmail(value = email) {
    const normalizedEmail = value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setAccountStatus(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      setAccountStatus(await getAccountStatus(normalizedEmail));
    } catch {
      // The primary Firebase request remains authoritative if the status API is unavailable.
      setAccountStatus(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }

  useEffect(() => {
    const authError = searchParams.get("authError");

    if (mode !== "login" || !authError) {
      return;
    }

    const googleErrorMessages: Record<string, string> = {
      "auth/unauthorized-domain": "Google sign-in is not enabled for this site domain yet.",
      "auth/operation-not-allowed": "Google sign-in is not enabled for this Firebase project.",
      "auth/network-request-failed": "Google sign-in could not reach Firebase. Check your connection and try again."
    };
    setFormError(googleErrorMessages[authError] ?? "Google sign-in could not finish. Please try again.");
    setSearchParams((current) => {
      current.delete("authError");
      return current;
    }, { replace: true });
  }, [mode, searchParams, setSearchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const form = new FormData(event.currentTarget);
    const submittedPassword = form.get("password")?.toString() ?? "";
    const confirmPassword = form.get("confirmPassword")?.toString() ?? "";

    if (mode === "register" && submittedPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "register" && !isStrongPassword(submittedPassword)) {
      setFormError("Use at least 8 characters with uppercase, lowercase, and a number.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "register" && accountStatus?.exists) {
      setFormError("This email is already registered. Please sign in instead.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "login" && accountStatus && !accountStatus.exists) {
      setFormError("No account found with this email. Create an account or continue with Google.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "login" && accountStatus?.providers.includes("google") && !accountStatus.providers.includes("email")) {
      setFormError("This account was created using Google. Please continue with Google.");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        name: form.get("name")?.toString(),
        email: form.get("email")?.toString() ?? "",
        password: submittedPassword,
        role,
        rememberMe
      });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, mode === "login" ? "Unable to sign in. Please check your credentials and try again." : "Unable to create your account. Please check your details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setFormError("");

    try {
      await onGoogleLogin();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, "Unable to sign in with Google. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-card">
      <span className="botanical-eyebrow">{mode === "login" ? "Secure login" : "Create account"}</span>
      <h2>{mode === "login" ? "Sign in to Zylora" : "Join the marketplace"}</h2>
      <div className="auth-socials">
        <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>
          <Mail size={16} />
          Continue with Google
        </button>
      </div>
      <div className="auth-fields">
        {mode === "register" ? (
          <label className="block">
            <span>Name</span>
            <input name="name" autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        ) : null}
        <label className="block">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setAccountStatus(null);
            }}
            onBlur={() => void checkEmail()}
          />
        </label>
        {isCheckingEmail ? <p className="auth-help">Checking account...</p> : null}
        {accountStatus ? (
          <div className="auth-account-status" role="status">
            {accountStatus.exists ? (
              accountStatus.providers.includes("google") && !accountStatus.providers.includes("email")
                ? "Google account detected. Continue with Google."
                : "Account found. Sign in to continue."
            ) : mode === "register" ? "Email available." : "No account found. Create one or continue with Google."}
          </div>
        ) : null}
        <label className="block">
          <span>Password</span>
          <PasswordInput name="password" value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        {mode === "register" ? (
          <>
            <label className="block">
              <span>Confirm password</span>
              <PasswordInput name="confirmPassword" autoComplete="new-password" />
            </label>
            <div>
              <div className="auth-strength">
                <span style={{ width: password.length > 11 ? "100%" : password.length > 7 ? "66%" : "33%" }} />
              </div>
              <p className="auth-help">Password strength: {password.length > 11 ? "Strong" : password.length > 7 ? "Good" : "Basic"}</p>
            </div>
            <fieldset>
              <legend>Account type</legend>
              <div className="auth-roles">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={role === item.value ? "selected" : ""}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="auth-check">
              <input type="checkbox" required />
              <span>I agree to the Terms, Privacy Policy, and Responsible Resource Exchange Guidelines.</span>
            </label>
          </>
        ) : null}
        {mode === "login" ? (
          <div className="auth-row">
            <label>
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        ) : null}
      </div>
      {formError ? <p className="auth-error">{formError}</p> : null}
      {accountStatus?.exists && mode === "register" ? (
        <Link className="auth-provider-action" to={`/login?email=${encodeURIComponent(email)}`}>Continue to Sign In</Link>
      ) : null}
      {accountStatus && !accountStatus.exists && mode === "login" ? (
        <Link className="auth-provider-action" to={`/register?email=${encodeURIComponent(email)}`}>Create Account</Link>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="organic-button primary auth-submit"
      >
        {isSubmitting ? <Loader2 className="animate-spin" size={17} /> : null}
        {mode === "login" ? "Sign in" : "Create secure account"}
      </button>
    </form>
  );
}

function isStrongPassword(value: string) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}
