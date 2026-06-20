import { notFound } from "next/navigation";
import { getProfileById, getPostsByUserId } from "@/lib/supabase/queries";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import DynamicProfilePage from "@/components/profile/DynamicProfilePage";
import type { Author } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  if (id === "self") return <DynamicProfilePage />;

  const [profile, authorPosts] = await Promise.all([
    getProfileById(id),
    getPostsByUserId(id),
  ]);

  if (!profile) return notFound();

  const author: Author = {
    id:             profile.id as string,
    name:           profile.display_name as string,
    avatarUrl:      (profile.avatar_url as string | null) ?? "",
    country:        (profile.country as string | null) ?? "",
    bio:            (profile.bio as string | null) ?? "",
    followersCount: 0,
    followingCount: 0,
  };

  const totalLikes = authorPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves = authorPosts.reduce((acc, p) => acc + p.saveCount, 0);

  return (
    <ProfilePageClient
      author={author}
      authorPosts={authorPosts}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
      username={profile.username as string}
    />
  );
}
