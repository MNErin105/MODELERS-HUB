import { notFound } from "next/navigation";
import { getProfileById, getProfileByUsername, getPostsByUserId, getFollowersCount, getPostsByIds } from "@/lib/supabase/queries";
import { getPostLogsByUserId } from "@/lib/supabase/postLogsQueries";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import DynamicProfilePage from "@/components/profile/DynamicProfilePage";
import type { Author } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  if (id === "self") return <DynamicProfilePage />;

  const profile = await (UUID_RE.test(id) ? getProfileById(id) : getProfileByUsername(id));

  if (!profile) return notFound();

  const profileId = profile.id as string;

  const [authorPosts, followersCount, postLogs] = await Promise.all([
    getPostsByUserId(profileId),
    getFollowersCount(profileId),
    getPostLogsByUserId(profileId),
  ]);

  const featuredPostId     = profile.featured_post_id    as string | null;
  const rawFeaturedImageUrl = profile.featured_image_url as string | null;

  let featuredThumbnailUrl: string | undefined;
  if (rawFeaturedImageUrl) {
    featuredThumbnailUrl = rawFeaturedImageUrl;
  } else if (featuredPostId) {
    featuredThumbnailUrl = await getPostsByIds([featuredPostId])
      .then((posts) => posts[0]?.thumbnailUrl ?? undefined)
      .catch(() => undefined);
  }

  const author: Author = {
    id:             profileId,
    username:       profile.username as string,
    name:           profile.display_name as string,
    avatarUrl:      (profile.avatar_url as string | null) ?? "",
    country:        (profile.country as string | null) ?? "",
    bio:            (profile.bio as string | null) ?? "",
    followersCount: followersCount,
    followingCount: 0,
  };

  const totalLikes = authorPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const totalSaves = authorPosts.reduce((acc, p) => acc + p.saveCount, 0);

  return (
    <ProfilePageClient
      author={author}
      authorPosts={authorPosts}
      postLogs={postLogs}
      totalLikes={totalLikes}
      totalSaves={totalSaves}
      username={profile.username as string}
      featuredThumbnailUrl={featuredThumbnailUrl}
    />
  );
}
