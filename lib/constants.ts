// Shared pagination page size for post grids (New Arrivals, Popular Works,
// home search/category-filter results, category archive pages).
export const POSTS_PAGE_SIZE = 24;

// Feature flag: Stories (add-story button, story bar, StoryViewer/StoryCreateModal).
// Code is kept in place but hidden from the UI while this is off. Defaults to
// disabled unless the env var is explicitly set to "true" — unset/missing
// (e.g. not yet configured in Vercel) is treated the same as "false".
export const STORIES_ENABLED = process.env.NEXT_PUBLIC_FEATURE_STORIES_ENABLED === "true";
