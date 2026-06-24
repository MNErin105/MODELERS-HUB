import { notFound } from "next/navigation";
import { getPostById } from "@/lib/supabase/queries";
import EditPostForm from "@/components/post/EditPostForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { post } = await getPostById(id);
  if (!post) return {};
  return { title: `Edit — ${post.title} | Modelers Hub` };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const { post } = await getPostById(id);

  if (!post) return notFound();

  return <EditPostForm post={post} />;
}
