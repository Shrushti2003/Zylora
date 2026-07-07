import { Globe2, Leaf, Recycle, Sparkles } from "lucide-react";
import { PageShell, SurfaceCard } from "../components/common/PageShell";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { projectPhotos } from "../data/visuals";

export function AboutPage() {
  return (
    <PlatformLayout>
      <PageShell
        eyebrow="About Zylora"
        title="A practical sharing network for Indian communities."
        description="Zylora turns useful surplus into social value through trusted matching, pickup coordination, affordable reuse, and measurable impact reporting."
        image={projectPhotos.community}
        imageAlt="Indian community support program receiving donated items"
      >
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["Mission", "Move usable items from idle homes and sites to people who need them.", Leaf],
            ["Vision", "Make donation, free sharing, and affordable reuse normal in every city.", Globe2],
            ["Story", "Built for families, NGOs, schools, sellers, and community organizers.", Sparkles],
            ["Circular Economy", "Keep cement, books, tools, furniture, and instruments in use longer.", Recycle]
          ].map(([title, body, Icon]) => (
            <SurfaceCard key={title as string}>
              <Icon className="h-6 w-6 text-secondary" />
              <h2 className="mt-4 text-xl font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{body as string}</p>
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PlatformLayout>
  );
}
