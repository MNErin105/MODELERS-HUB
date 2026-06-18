import { notFound } from "next/navigation";
import { posts } from "@/lib/dummy-data";
import { CATEGORIES, categorySlug, slugToCategory } from "@/lib/types";
import CategoryPageClient from "@/components/category/CategoryPageClient";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: categorySlug(c) }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = slugToCategory(slug);
  if (!category) notFound();

  const categoryPosts = posts.filter((p) => p.category === category);

  return (
    <CategoryPageClient
      category={category}
      categoryPosts={categoryPosts}
      allPosts={posts}
    />
  );
}
