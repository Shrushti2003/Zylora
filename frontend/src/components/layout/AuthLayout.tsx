import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Leaf, Recycle, Route, ShieldCheck } from "lucide-react";
import { projectPhotos } from "../../data/visuals";

interface AuthLayoutProps extends PropsWithChildren {
  mode: "login" | "register";
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const isRegister = mode === "register";

  return (
    <main className={`botanical-page auth-page ${isRegister ? "auth-register" : "auth-login"}`}>
      <div className="paper-texture" aria-hidden="true" />
      <div className="auth-shell">
        <section className="auth-story">
          <Link to="/" className="botanical-brand">
            <span>
              <Recycle size={20} strokeWidth={1.5} />
            </span>
            Zylora
          </Link>
          <div>
            <span className="botanical-eyebrow">{isRegister ? "Circular impact network" : "Trusted resource sharing"}</span>
            <h1>
              {isRegister
                ? "Start Sharing Resources That Matter and Give More, Waste Less"
                : "Welcome Back to Smarter Sharing and Meaningful Impact"}
            </h1>
            <p>
              {isRegister
                ? "Join a trusted network where unused items get a second life, waste is reduced, and schools, NGOs, and communities gain affordable access."
                : "Manage donations, affordable listings, verified community connections, and ongoing impact from one purposeful workspace."}
            </p>
            <div className="auth-impact-points">
              {(isRegister
                ? ["Give unused items a second life", "Reduce waste through reuse", "Support affordable community access"]
                : ["Verified users and NGOs", "Smart resource management", "Continue positive impact"]
              ).map((item) => (
                <span key={item}>
                  {isRegister ? <Leaf size={14} /> : <ShieldCheck size={14} />}
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="auth-visual">
            <div className={isRegister ? "auth-earth-orbit" : "auth-network-orbit"} aria-hidden="true">
              <span>
                {isRegister ? <img src={projectPhotos.earth} alt="" /> : <Route size={30} strokeWidth={1.4} />}
              </span>
            </div>
            <div className="auth-photo">
              <img
                src={isRegister ? projectPhotos.authSignup : projectPhotos.authSignin}
                alt={
                  isRegister
                    ? "Person sorting useful items into donation boxes for reuse"
                    : "Volunteers moving boxes for community resource redistribution"
                }
              />
            </div>
            <div className={isRegister ? "auth-resource-loop" : "auth-network-map"} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
        <section className="auth-form-panel">{children}</section>
      </div>
    </main>
  );
}
