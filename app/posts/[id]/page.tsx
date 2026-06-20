import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/supabase/queries";
import PostDetailClient from "@/components/post/PostDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { post } = await getPostById(id);
  if (!post) return {};
  return {
    title: `${post.title} — Modelers Hub`,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const { post, buildSteps } = await getPostById(id);

  if (!post) return notFound();

  return (
    <Suspense>
      <PostDetailClient post={post} buildSteps={buildSteps} />
    </Suspense>
  );
}
