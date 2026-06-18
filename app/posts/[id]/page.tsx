import { Suspense } from "react";
import { notFound } from "next/navigation";
import { posts } from "@/lib/dummy-data";
import { buildSteps } from "@/lib/dummy-build-steps";
import { comments } from "@/lib/dummy-comments";
import PostDetailClient from "@/components/post/PostDetailClient";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = posts.find((p) => p.id === id);
  if (!post) return {};
  return {
    title: `${post.title} — Modelers Hub`,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  const steps = buildSteps[id] ?? [];
  const postComments = comments[id] ?? [];

  return (
    <Suspense>
      <PostDetailClient post={post} buildSteps={steps} comments={postComments} />
    </Suspense>
  );
}
