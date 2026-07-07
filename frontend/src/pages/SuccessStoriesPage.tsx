import { type ChangeEvent, FormEvent, useState } from "react";
import { ArrowRight, Camera, ImagePlus, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { createId, createStorySlug, loadStories, saveStory, type ImpactStory } from "../data/mvpData";
import { projectPhotos } from "../data/visuals";
import type { RootState } from "../store/store";

export function SuccessStoriesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stories, setStories] = useState<ImpactStory[]>(() => loadStories());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const featured = stories[0];

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submitStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const story: ImpactStory = {
      id: createId("story"),
      slug: createStorySlug(title),
      title,
      subtitle: description,
      description,
      userName: user?.name || "Zylora community member",
      createdAt: new Date().toISOString(),
      image: image || projectPhotos.community,
      introduction: description,
      background: `${user?.name || "A Zylora community member"} shared this story after a useful resource found a new recipient instead of staying unused.`,
      journey: "The item was listed with context, matched with a relevant recipient, and moved through a coordinated local handoff.",
      impact: description,
      outcome: "This story adds to Zylora's growing impact journal and shows how everyday resources can create meaningful opportunities.",
      readingMinutes: 2,
      impactStats: [
        { label: "Story type", value: "New" },
        { label: "Community value", value: "High" },
        { label: "Resources reused", value: "1+" }
      ]
    };
    setStories(saveStory(story));
    setTitle("");
    setDescription("");
    setImage("");
  }

  return (
    <PlatformLayout>
      <section className="story-showcase-hero">
        <div>
          <p className="botanical-eyebrow">Impact stories</p>
          <h1>Every Item Has a Story</h1>
          <p><strong>See how simple donations become meaningful opportunities.</strong></p>
          <p>Explore inspiring journeys of items reaching families, students, nonprofits, and community initiatives.</p>
          <div className="story-counters">
            <span><strong>{stories.length}</strong> stories</span>
            <span><strong>540+</strong> people helped</span>
            <span><strong>18 t</strong> waste diverted</span>
          </div>
        </div>
        <img src="/Stories%202.jpg" alt={featured.title} />
      </section>

      <section className="story-create-panel">
        <form onSubmit={submitStory}>
          <Camera className="h-6 w-6" />
          <h2>Share a new impact story</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Story title" required />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What changed because this resource was shared?" required />
          <label>
            <ImagePlus className="h-4 w-4" />
            Add cover image
            <input type="file" accept="image/*" onChange={handleImage} />
          </label>
          <button type="submit">Publish story</button>
        </form>
        {image ? <img src={image} alt="Selected story cover preview" /> : <div className="story-preview-empty">Cover preview</div>}
      </section>

      <section className="story-timeline">
        {stories.map((story, index) => {
          const date = new Date(story.createdAt);
          return (
            <article className={index % 2 ? "story-feature-row reverse" : "story-feature-row"} key={story.id}>
              <div className="story-cover">
                <img src={story.image} alt={story.title} />
                <span>{date.toLocaleDateString()} - {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="story-copy-panel">
                <Sparkles className="h-6 w-6" />
                <p className="botanical-eyebrow">{story.userName}</p>
                <h2>{story.title}</h2>
                <p>{story.description}</p>
                <div className="before-after">
                  <span><strong>Before</strong> Useful surplus was idle or at risk of waste.</span>
                  <Link className="story-read-link" to={`/stories/${story.slug || createStorySlug(story.title)}`} aria-label={`Read full story: ${story.title}`}>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <span><strong>After</strong> A verified recipient turned it into measurable community value.</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PlatformLayout>
  );
}
