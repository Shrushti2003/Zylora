import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AuthForm } from "../components/forms/AuthForm";
import { AuthLayout } from "../components/layout/AuthLayout";
import { login, startGoogleLogin } from "../services/auth.service";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import type { AppDispatch } from "../store/store";

export function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const destination = from?.pathname ? `${from.pathname}${from.search ?? ""}` : "/dashboard/buy";

  return (
    <AuthLayout mode="login">
      <AuthForm
        mode="login"
        onSubmit={async (payload) => {
          const { user } = await login({ email: payload.email, password: payload.password, rememberMe: payload.rememberMe });
          dispatch(setAuthenticatedUser(user));
          navigate(destination, { replace: true });
        }}
        onGoogleLogin={async () => {
          const result = await startGoogleLogin(destination);
          if (result?.user) {
            dispatch(setAuthenticatedUser(result.user));
            navigate(result.destination, { replace: true });
          }
        }}
      />
    </AuthLayout>
  );
}
