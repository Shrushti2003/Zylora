import { FormEvent, useState } from "react";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { getAuthErrorMessage, sendPasswordResetLink } from "../services/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await sendPasswordResetLink(email.trim());
      setMessage("Password reset link sent. Check your email, set a new password, then sign in again.");
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="auth-card" onSubmit={handleSubmit}>
        <KeyRound className="h-8 w-8 text-secondary" />
        <span className="botanical-eyebrow mt-4">Account recovery</span>
        <h2>Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Enter your registered email for a secure reset link.</p>
        <label className="mt-6 block auth-fields">
          <span>Email</span>
          <div className="auth-password">
            <Mail className="h-4 w-4 text-zinc-400" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>
        </label>
        {message ? <p className="auth-help">{message}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="organic-button primary auth-submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Send reset request
        </button>
        <Link to="/login" className="mt-4 block text-center text-sm text-ocean">Back to sign in</Link>
      </form>
    </AuthLayout>
  );
}
