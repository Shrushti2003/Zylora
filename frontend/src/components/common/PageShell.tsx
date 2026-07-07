import { motion } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface PageShellProps {
  eyebrow: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  image?: string;
  imageAlt?: string;
}

export function PageShell({ eyebrow, title, description, children, image, imageAlt = "" }: PageShellProps) {
  return (
    <PlatformPage>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="organic-shell platform-hero"
      >
        <div className="platform-hero-copy">
          <div className="botanical-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {image ? (
          <div className="platform-hero-image">
            <img src={image} alt={imageAlt} />
          </div>
        ) : null}
      </motion.section>
      <section className="organic-shell platform-content">{children}</section>
    </PlatformPage>
  );
}

export function PlatformPage({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

type SurfaceCardProps = ComponentPropsWithoutRef<"article"> & {
  children: ReactNode;
};

export function SurfaceCard({ children, className = "", ...props }: SurfaceCardProps) {
  return <article className={`organic-card platform-card ${className}`} {...props}>{children}</article>;
}
