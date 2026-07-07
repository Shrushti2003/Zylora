import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";
import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PlatformLayout } from "../components/layout/PlatformLayout";
import { createStorySlug, loadStories } from "../data/mvpData";

export function StoryDetailsPage() {
  const { slug = "" } = useParams();
  const stories = useMemo(() => loadStories(), []);
  const story = stories.find((item) => (item.slug || createStorySlug(item.title)) === slug || item.id === slug);

  if (!story) {
    return <Navigate to="/stories" replace />;
  }

  const published = new Date(story.createdAt);
  const sections = [
    ["Introduction", story.introduction || story.description],
    ["Background", story.background],
    ["Journey of the Donation", story.journey],
    ["Impact Created", story.impact],
    ["Conclusion", story.outcome]
  ];

  return (
    <PlatformLayout>
      <article className="story-article-shell">
        <Link className="story-back-link" to="/stories">
          <ArrowLeft className="h-4 w-4" />
          Back to Stories
        </Link>

        <header className="story-article-header">
          <img src={story.image} alt={story.title} />
          <div className="story-article-heading">
            <p className="botanical-eyebrow">Impact story</p>
            <h1>{story.title}</h1>
            <div className="story-article-meta">
              <span><UserRound className="h-4 w-4" /> {story.userName}</span>
              <span><CalendarDays className="h-4 w-4" /> {published.toLocaleDateString()}</span>
              <span><Clock className="h-4 w-4" /> {story.readingMinutes || 3} min read</span>
            </div>
          </div>
        </header>

        <section className="story-article-body">
          {sections.map(([heading, content]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{content}</p>
            </section>
          ))}
          <p className="story-article-author">Author: {story.userName}</p>
        </section>
      </article>
    </PlatformLayout>
  );
}
