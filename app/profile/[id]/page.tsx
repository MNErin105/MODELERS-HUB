import { notFound } from "next/navigation";
import { posts } from "@/lib/dummy-data";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import DynamicProfilePage from "@/components/profile/DynamicProfilePage";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  const ids = [...new Set(posts.map((p) => p.author.id))];
  return [...ids.map((id) => ({ id })), { id: "self" }];
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  if (id === "self") return <DynamicProfilePage />;

  const authorPosts = posts.filter((p) => p.author.id === id);
  if (authorPosts.length === 0) notFound();

  const author     = authorPosts[0].author;
  const totalLikes = authorPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves = authorPosts.reduce((acc, p) => acc + p.saveCount, 0);

  return (
    <ProfilePageClient
      author={author}
      authorPosts={authorPosts}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
    />
  );
}
