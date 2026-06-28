import { notFound } from "next/navigation";
import { CATEGORIES, categorySlug, slugToCategory } from "@/lib/types";
import { getPostsForHome } from "@/lib/supabase/queries";
import CategoryPageClient from "@/components/category/CategoryPageClient";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: categorySlug(c) }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = slugToCategory(slug);
  if (!category) notFound();

  const allPosts      = await getPostsForHome(200);
  const categoryPosts = allPosts.filter((p) => p.categories.includes(category!));

  return (
    <CategoryPageClient
      category={category}
      categoryPosts={categoryPosts}
      allPosts={allPosts}
    />
  );
}
