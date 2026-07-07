import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AuthForm } from "../components/forms/AuthForm";
import { AuthLayout } from "../components/layout/AuthLayout";
import { register, startGoogleLogin } from "../services/auth.service";
import { setAuthenticatedUser } from "../features/auth/authSlice";
import type { AppDispatch } from "../store/store";
import type { UserRole } from "../types/auth";

export function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  return (
    <AuthLayout mode="register">
      <AuthForm
        mode="register"
        onSubmit={async (payload) => {
          const { user } = await register({
            name: payload.name ?? "",
            email: payload.email,
            password: payload.password,
            role: payload.role as UserRole
          });
          dispatch(setAuthenticatedUser(user));
          navigate(payload.role === "individual" ? "/dashboard/sell" : "/dashboard/buy", { replace: true });
        }}
        onGoogleLogin={async () => {
          const result = await startGoogleLogin();
          if (result?.user) {
            dispatch(setAuthenticatedUser(result.user));
            navigate(result.destination, { replace: true });
          }
        }}
      />
    </AuthLayout>
  );
}
