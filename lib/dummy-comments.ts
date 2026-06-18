import { Comment } from "./types";

// Shared author stubs (reuse avatars from dummy-data authors)
const A = (id: string, name: string, country: string) => ({
  id, name, country, bio: "",
  avatarUrl: `https://picsum.photos/seed/author-${id}/64/64`,
  followersCount: 0, followingCount: 0,
});

const ua = A("u-alex",  "Alex Reinholt",   "US");
const ub = A("u-mika",  "Mika Saitō",      "JP");
const uc = A("u-lucas", "Lucas Ferreira",  "BR");
const ud = A("u-sarah", "Sarah Kim",       "KR");

// Post authors by id (for reply attribution)
import { posts } from "./dummy-data";
function getAuthor(postId: string) {
  return posts.find((p) => p.id === postId)?.author ?? ua;
}

function c(
  id: string, postId: string, commenter: typeof ua,
  content: string, daysAgo: number,
  replies?: { by: "author" | typeof ua; content: string; daysAgo: number }[]
): Comment {
  const base = new Date("2026-06-01").getTime();
  const createdAt = new Date(base - daysAgo * 86400000).toISOString();
  return {
    id,
    author: commenter,
    content,
    createdAt,
    replies: (replies ?? []).map((r, i) => ({
      id: `${id}-r${i}`,
      author: r.by === "author" ? getAuthor(postId) : r.by,
      content: r.content,
      createdAt: new Date(base - r.daysAgo * 86400000).toISOString(),
    })),
  };
}

export const comments: Record<string, Comment[]> = {
  "1": [
    c("c1-1","1", ua,
      "Amazing weathering on the psycho-frame! What did you use to get that greenish tint on the white armor?",
      12,
      [{ by: "author", content: "Thanks! It's a mix of Mr. Color GX Cool White with a tiny drop of Gaia Notes surfacer gray. The key is to spray it at very low PSI so it pools naturally in the panel recesses.", daysAgo: 11 }]
    ),
    c("c1-2","1", ub,
      "スジ彫りのラインはどのくらいの深さで入れていますか？0.3mmですか？",
      10,
      [{ by: "author", content: "そうです！基本0.3mmのBMCタガネを使っています。細かいディテールには0.2mmも使いました。力を入れすぎず、軽くなぞるように5〜6回です。", daysAgo: 9 }]
    ),
    c("c1-3","1", uc,
      "Can you share more about the LED circuit? I'm planning a similar build and wasn't sure how to handle the wiring through the waist.",
      7,
      [{ by: "author", content: "Sure! I drilled 1.5mm channels through both halves of the waist joint, then used 28AWG silicone wire which is super flexible. Left about 50mm of slack at each articulation point. Check the Build Journal tab for detailed photos!", daysAgo: 6 }]
    ),
    c("c1-4","1", ud, "The rust pigments on the joints look incredibly realistic. MIG Ammo brand?", 4),
    c("c1-5","1", ua, "What's your recommended airbrush PSI for the weathering pass?", 2,
      [{ by: "author", content: "Around 8-10 PSI for the post-shading and weathering. Lower pressure = more control, especially near edges. I use a Badger Patriot 105.", daysAgo: 1 }]
    ),
  ],

  "4": [
    c("c4-1","4", ub,
      "リービングケースとアルミ線でフィン部分を補強されたのですか？それとも純正パーツのまま？",
      20,
      [{ by: "author", content: "アルミ線で補強しています！RGは細かいパーツが多いので、胴体の接続部分に0.8mmのアルミ線を通しました。", daysAgo: 19 }]
    ),
    c("c4-2","4", uc,
      "The AT field resin effect is incredible! What UV resin did you use and how long did you let it cure?",
      15,
      [{ by: "author", content: "I used Padico's UV resin with a tiny amount of Tamiya Clear Blue mixed in. Poured in layers — each layer about 3mm, cured for 90 seconds under a 36W UV lamp. Total about 5 layers.", daysAgo: 14 }]
    ),
    c("c4-3","4", ud,
      "How did you achieve the battle damage on the chest without losing the surface detail?",
      8,
      [{ by: "author", content: "Used a hot needle for burn marks, and a Dremel with a ball-end bit at very low speed for the gouge marks. The key is to do it BEFORE painting so you can prime over the rough edges for a realistic look.", daysAgo: 7 }]
    ),
    c("c4-4","4", ua, "What Sculpey color did you start with for the rubble? White or grey?", 3),
  ],

  "10": [
    c("c10-1","10", uc,
      "This is absolutely legendary. How many hours total did this build take?",
      60,
      [{ by: "author", content: "About 340 hours over 3 months 😅 The LED circuit alone took 40 hours. But I enjoyed every minute of it!", daysAgo: 58 }]
    ),
    c("c10-2","10", ua,
      "What LiPo battery and controller did you use for the LED system? Can it be switched between Unicorn and Destroy mode?",
      55,
      [{ by: "author", content: "I used a 3.7V 500mAh LiPo with a custom PCB I designed in KiCad. There's a slide switch in the backpack — one position = Unicorn mode (just head glow), full position = Destroy mode (all LEDs). The schematic is in my build journal!", daysAgo: 53 }]
    ),
    c("c10-3","10", ub,
      "フルオレッセントピンクのサイコフレームが本当に綺麗です。塗装順序を教えていただけますか？",
      48,
      [{ by: "author", content: "ありがとうございます！順番は: ①Mr.サーフェイサー1500白②ガイアノーツ蛍光ピンク×3回③ガイアノーツGXクリアー です。蛍光色の下にはウルトラ白よりも通常白の方がむしろ発色が良かったです。", daysAgo: 47 }]
    ),
    c("c10-4","10", ud,
      "The panel shading technique for the white armor is incredible. How subtle is the gray you add?",
      40,
      [{ by: "author", content: "Very subtle — about 3 drops of Tamiya XF-53 Neutral Gray to a full cup of Mr. Color Super White. You barely see it in the bottle but it reads strongly on the finished model. Apply at 15psi in a cross-hatch motion.", daysAgo: 39 }]
    ),
    c("c10-5","10", uc,
      "What photography equipment did you use? The depth of field in the LED shots is perfect.",
      30,
      [{ by: "author", content: "Sony A7 III + 90mm Tamron macro lens. f/8 for the LED shots to keep the whole model in focus. Used a custom lightbox with 2 LED strips + 1 blue gel fill light. Exposure at 1/100s, ISO 200.", daysAgo: 29 }]
    ),
  ],

  "13": [
    c("c13-1","13", ua,
      "The zimmerit texture looks incredibly authentic. Is that Mr. Surfacer 500 technique or did you use a commercial tool?",
      25,
      [{ by: "author", content: "Pure Mr. Surfacer 500! The trick is applying it when it's about 60% dry — still slightly tacky. Use a square-ended brush and press in a rolling motion. Much cheaper than the commercial tools and more controllable.", daysAgo: 24 }]
    ),
    c("c13-2","13", ub,
      "What grass product did you use for the steppe base? It looks very realistic.",
      18,
      [{ by: "author", content: "Miniature Natur 4mm Summer grass, mixed with some 2mm Spring Green for color variation. Applied with Noch Grassmaster for the upright static effect. Total application time was about 3 hours.", daysAgo: 17 }]
    ),
    c("c13-3","13", uc, "Is the mud on the tracks made to be removable or is it permanently fixed?", 10,
      [{ by: "author", content: "Permanent, sealed with Vallejo Matte Varnish. I prefer the look to be fixed and durable. If you want removable mud, use plaster of Paris + earth pigments — it comes off cleanly with a toothbrush.", daysAgo: 9 }]
    ),
  ],

  "16": [
    c("c16-1","16", ua,
      "What's the secret to getting even NMF panels with Alclad? Mine always shows brush marks from the chrome base.",
      30,
      [{ by: "author", content: "Sand to 2000 grit, then polish with Tamiya Polishing Compound. Any scratch = visible in the chrome. Spray Alclad at 18-22 PSI in one continuous pass — don't go back and forth. Let it sit 24h before handling.", daysAgo: 29 }]
    ),
    c("c16-2","16", ub,
      "The Jolly Rogers skull decal sits perfectly flat. Did you use any solvent?",
      20,
      [{ by: "author", content: "Yes! Micro Sol after the decal is in position. Let it dry for 10 min, then apply a second coat. For raised panel lines, score the decal with a pin where it needs to conform, then apply more Micro Sol.", daysAgo: 19 }]
    ),
    c("c16-3","16", uc, "What scale is this? 1/48 or 1/72?", 8,
      [{ by: "author", content: "1/48 — my favourite scale for aircraft. Great balance between detail and space on the shelf!", daysAgo: 7 }]
    ),
  ],
};

// Fill default comments for posts without explicit entries
for (const post of posts) {
  if (!comments[post.id]) {
    comments[post.id] = [
      c(`c${post.id}-1`, post.id, ua,
        `Great work on the ${post.kit}! What was the most challenging part of this build?`,
        14,
        [{ by: "author", content: "Thank you! The trickiest part was definitely the color separation masking. Getting clean lines between the main colors took multiple attempts.", daysAgo: 12 }]
      ),
      c(`c${post.id}-2`, post.id, ub,
        `What brand of primer did you use? The surface looks incredibly smooth.`,
        8,
      ),
      c(`c${post.id}-3`, post.id, uc,
        `How long did the total build take?`,
        4,
        [{ by: "author", content: "About 80-100 hours total over 6 weeks. Most of the time was the painting and weathering stages.", daysAgo: 3 }]
      ),
    ];
  }
}
