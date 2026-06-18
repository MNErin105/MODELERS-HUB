import { BuildStep } from "./types";

function img(seed: string, caption: string) {
  return { url: `https://picsum.photos/seed/${seed}/800/600`, caption };
}

export const buildSteps: Record<string, BuildStep[]> = {
  "1": [
    {
      id: "1-1", stepNumber: 1, title: "Dry Fit & Modification Planning",
      description: "Assembled the entire kit without glue to assess overall silhouette and identify problem areas. Decided to extend the waist by 2mm using 1mm pla-plate sandwiching, and widen the shoulder armor for a more imposing stance.",
      date: "2026-04-20",
      images: [img("step-1-1-1","Dry fit — front assessment"), img("step-1-1-2","Waist gap — planning 2mm extension"), img("step-1-1-3","Shoulder comparison — stock vs planned")],
    },
    {
      id: "1-2", stepNumber: 2, title: "Panel Scribing & Surface Prep",
      description: "Added 0.3mm scribe lines to all major surfaces using a BMC P-Cutter chisel. Scribed the iconic V-fin detail lines and added extra panel separation on the shoulder binders. Filled seam lines with Tamiya Extra Thin and sanded with 400→800→1500 grit.",
      date: "2026-04-25",
      images: [img("step-1-2-1","P-Cutter work on chest armor"), img("step-1-2-2","Shoulder binder scribing"), img("step-1-2-3","Seam line filled and sanded")],
    },
    {
      id: "1-3", stepNumber: 3, title: "LED Wiring — Psycho-Frame",
      description: "Drilled 1.2mm channels through the frame parts to route 28AWG wire. Used 0402 SMD LEDs in blue for the psycho-frame glow. Resistors calculated for 3V supply at 15mA per LED chain. Tested fit before sealing the frame halves with cement.",
      date: "2026-05-01",
      images: [img("step-1-3-1","Drilling channels in chest frame"), img("step-1-3-2","LED placement test — glowing"), img("step-1-3-3","Wiring routed through leg frame")],
    },
    {
      id: "1-4", stepNumber: 4, title: "Priming & Base Coat",
      description: "Sprayed Mr. Surfacer 1200 thinned 1:1.5 as primer coat. Checked for any missed seams or surface defects under raking light. Applied Gaia Notes Ex White as base coat — 3 thin coats at 20psi.",
      date: "2026-05-03",
      images: [img("step-1-4-1","Gray primer — checking surface"), img("step-1-4-2","First white base coat"), img("step-1-4-3","Masked psycho-frame parts")],
    },
    {
      id: "1-5", stepNumber: 5, title: "Color Separation & Main Coat",
      description: "Masked all white areas with Tamiya tape and applied Mr. Color GX Metal Blue for the frame parts. Used a post-shading technique — lightened the center of each panel with slightly thinned base color for a subtle gradient.",
      date: "2026-05-05",
      images: [img("step-1-5-1","Masking — armor vs frame"), img("step-1-5-2","Blue frame coat applied"), img("step-1-5-3","Post-shading — panel center highlight")],
    },
    {
      id: "1-6", stepNumber: 6, title: "Weathering — Wash & Pigments",
      description: "Applied Tamiya Panel Line Accent Black as an overall pin wash, then selectively added brown wash on the lower extremities. Chipping with silver AK Interactive pencil on edges. Finished with MIG Ammo rust pigments on joints and Tamiya smoke on thruster bells.",
      date: "2026-05-08",
      images: [img("step-1-6-1","Pin wash — black on panel lines"), img("step-1-6-2","Edge chipping with silver pencil"), img("step-1-6-3","Rust pigments on hip joint")],
    },
  ],

  "4": [
    {
      id: "4-1", stepNumber: 1, title: "Kit Construction & Structural Mods",
      description: "Assembled the RG Evangelion Unit-01. Added internal styrene support to prevent drooping of the progressive knife arm at the elbow. Extended the wrist pins with brass tubing for durability.",
      date: "2026-03-15",
      images: [img("step-4-1-1","Base construction"), img("step-4-1-2","Brass wrist pin reinforcement")],
    },
    {
      id: "4-2", stepNumber: 2, title: "Diorama Base — Rubble Sculpting",
      description: "Sculpted the destroyed city base using Sculpey III mixed with fine gravel. Embedded broken styrene rod as rebar. Baked at 130°C for 20 min, then primed with Mr. Surfacer 1000.",
      date: "2026-03-22",
      images: [img("step-4-2-1","Sculpey rubble sculpting"), img("step-4-2-2","Rebar from broken styrene rod"), img("step-4-2-3","Primed base — gray")],
    },
    {
      id: "4-3", stepNumber: 3, title: "LED Integration — Eye & AT Field",
      description: "Drilled out the eye socket and fitted a 3mm white LED. Added a blue tinted resin pour for the AT Field effect — cured with UV torch. Internal wiring routed through the base.",
      date: "2026-03-28",
      images: [img("step-4-3-1","Eye LED test"), img("step-4-3-2","AT Field resin pour — UV curing"), img("step-4-3-3","Full LED test in dark")],
    },
    {
      id: "4-4", stepNumber: 4, title: "Painting — Battle Damage & Chipping",
      description: "Base coated in Tamiya XF-14 J.A. Green + XF-23 Light Blue mix. Applied oil dot filtering for color variation. Battle damage achieved with Dremel + hot nail technique. AK Interactive chipping fluid for extensive worn paint effect.",
      date: "2026-04-05",
      images: [img("step-4-4-1","Chipping fluid applied"), img("step-4-4-2","Scrubbing with water — chips revealed"), img("step-4-4-3","Burn marks with Dremel")],
    },
    {
      id: "4-5", stepNumber: 5, title: "Base Painting & Final Assembly",
      description: "Painted the concrete rubble in Tamiya XF-53 Neutral Gray with oil washes. Added dried grass tufts and static foliage. Final matte coat (Vallejo Matte Varnish) on all surfaces before assembly on the base.",
      date: "2026-04-15",
      images: [img("step-4-5-1","Base painting — concrete tones"), img("step-4-5-2","Foliage and tufts added"), img("step-4-5-3","Final assembly on base")],
    },
  ],

  "10": [
    {
      id: "10-1", stepNumber: 1, title: "Planning & LED Circuit Design",
      description: "The PG Unicorn's size allows a much more complex LED circuit than smaller kits. Planned 3 separate LED zones: head antennae (cold white), torso psycho-frame (UV reactive + warm white), and shield/binders (blue). Calculated total current draw at ~180mA using a 3.7V 500mAh LiPo.",
      date: "2025-12-10",
      images: [img("step-10-1-1","Circuit schematic sketch"), img("step-10-1-2","LED component layout"), img("step-10-1-3","LiPo battery test fit in waist cavity")],
    },
    {
      id: "10-2", stepNumber: 2, title: "Structural Modifications for Wiring",
      description: "Drilled 2mm channels through the spine, thigh, and shoulder frame parts to route wires without affecting articulation. Replaced the original polycap joints in the shoulders with brass ball joints for better wire clearance and load bearing.",
      date: "2025-12-18",
      images: [img("step-10-2-1","Drilling spine channel — 2mm bit"), img("step-10-2-2","Brass ball joint installation"), img("step-10-2-3","Wire clearance test — full articulation")],
    },
    {
      id: "10-3", stepNumber: 3, title: "Psycho-Frame Masking & Fluorescent Coat",
      description: "The psycho-frame parts were masked using liquid masking agent with a brush. Applied Mr. Color GX Fluorescent Pink as the first coat — this is the key to the 'glowing' effect even under normal light. Topcoated with Gaianotes GX Clear for depth.",
      date: "2026-01-08",
      images: [img("step-10-3-1","Liquid mask applied to psycho-frame"), img("step-10-3-2","Fluorescent pink first coat"), img("step-10-3-3","Comparison — stock vs fluorescent")],
    },
    {
      id: "10-4", stepNumber: 4, title: "Armor Coat — White Base & Post-shading",
      description: "Applied Mr. Surfacer 1500 White as primer/base. Post-shading with slightly darkened white (add 3 drops gray to white) on panel recesses. The contrast makes the armor feel three-dimensional under photography lights.",
      date: "2026-01-20",
      images: [img("step-10-4-1","White surfacer — all armor parts"), img("step-10-4-2","Post-shading in panel recesses"), img("step-10-4-3","Panel lining with Tamiya black liner")],
    },
    {
      id: "10-5", stepNumber: 5, title: "LED Installation & Testing",
      description: "Final LED installation: hot glued the 0402 LEDs into each psycho-frame part, connected all three zones to a custom PCB switch panel hidden in the backpack. Tested all modes: Unicorn mode (white), Destroy mode (full LED), and ambient glow mode.",
      date: "2026-02-01",
      images: [img("step-10-5-1","LED glued into chest frame"), img("step-10-5-2","PCB switch panel in backpack"), img("step-10-5-3","Full LED test — all modes")],
    },
    {
      id: "10-6", stepNumber: 6, title: "Photography Setup",
      description: "Built a custom lightbox with blackout fabric for dark shots. Used a diffused LED strip at 45° for the main light, and a blue gel secondary light to enhance the psycho-frame glow. Shot with 50mm macro lens at f/8.",
      date: "2026-03-28",
      images: [img("step-10-6-1","Lightbox setup"), img("step-10-6-2","Blue gel light test"), img("step-10-6-3","Final photography session")],
    },
  ],

  "13": [
    {
      id: "13-1", stepNumber: 1, title: "Construction & Zimmerit Application",
      description: "Built the Tamiya Tiger I straight from sprue, filling only the hull seams. Applied Mr. Surfacer 500 as zimmerit texture using a square-tipped brush in a stippling motion before it fully dried. This replicates the field-applied anti-magnetic paste.",
      date: "2026-04-10",
      images: [img("step-13-1-1","Hull construction completed"), img("step-13-1-2","Zimmerit stippling technique"), img("step-13-1-3","Dried zimmerit texture closeup")],
    },
    {
      id: "13-2", stepNumber: 2, title: "Pre-shading & Dunkelgelb Base",
      description: "Pre-shaded all recesses with Tamiya XF-1 Flat Black at low pressure (12psi). Applied Tamiya XF-60 Dark Yellow as the base Dunkelgelb color, keeping it slightly lighter on upper horizontal surfaces to simulate sun bleaching.",
      date: "2026-04-15",
      images: [img("step-13-2-1","Pre-shading black recesses"), img("step-13-2-2","Dunkelgelb base coat"), img("step-13-2-3","Upper surface sun-bleach effect")],
    },
    {
      id: "13-3", stepNumber: 3, title: "Mud & Track Weathering",
      description: "Applied AK Interactive Heavy Mud with a palette knife to the lower hull, tracks, and roadwheels. While still wet, pressed real dried earth from the garden into the mud for authentic texture. Allowed to dry fully before sealing with a matte varnish.",
      date: "2026-04-22",
      images: [img("step-13-3-1","Mud applied with palette knife"), img("step-13-3-2","Real earth pressed into wet mud"), img("step-13-3-3","Finished track mud")],
    },
    {
      id: "13-4", stepNumber: 4, title: "Diorama Base — Kursk Steppe",
      description: "Sculpted a Kursk summer steppe scene using XTC-3D epoxy putty over a wooden base. Added dried grass (Miniature Natur 4mm Summer), wheat stalks, and a shell casing made from brass tubing. Figures positioned to tell the story.",
      date: "2026-04-28",
      images: [img("step-13-4-1","Epoxy steppe base"), img("step-13-4-2","Summer grass tufts applied"), img("step-13-4-3","Figure positioning test")],
    },
  ],

  "16": [
    {
      id: "16-1", stepNumber: 1, title: "Construction & Surface Prep",
      description: "Built the Tamiya F-14A and filled all seam lines with Tamiya extra thin. The wing pivot mechanism was left operational. Polished all surfaces to 2000 grit in preparation for the NMF Alclad coat — any scratches will show through.",
      date: "2026-03-20",
      images: [img("step-16-1-1","Construction — wing sweep test"), img("step-16-1-2","Seam lines filled"), img("step-16-1-3","2000 grit polishing for NMF prep")],
    },
    {
      id: "16-2", stepNumber: 2, title: "Alclad NMF Application",
      description: "Applied Alclad Chrome as a mirror base, then Alclad Pale Burnt Metal on the exhaust areas, Polished Aluminum on upper surfaces, and Duraluminum on lower surfaces. Each panel was masked individually to create the subtle variation seen on real aircraft.",
      date: "2026-03-28",
      images: [img("step-16-2-1","Chrome mirror base"), img("step-16-2-2","Panel masking for tone variation"), img("step-16-2-3","NMF variation — complete")],
    },
    {
      id: "16-3", stepNumber: 3, title: "Jolly Rogers Decals & Markings",
      description: "Applied Tamiya markings using Mr. Mark Setter to conform to panel lines. The Jolly Rogers skull insignia decals were sealed under a semi-gloss topcoat before applying the NMF panels to prevent silvering.",
      date: "2026-04-02",
      images: [img("step-16-3-1","Skull insignia — wet transfer"), img("step-16-3-2","Mr. Mark Softer on curved surfaces"), img("step-16-3-3","Decals sealed — complete")],
    },
  ],
};

// Default 3-step skeleton for posts without detailed records
function defaultSteps(postId: string, kitName: string, techniques: string[]): BuildStep[] {
  return [
    {
      id: `${postId}-d1`, stepNumber: 1, title: "Construction & Surface Preparation",
      description: `Assembled the ${kitName}. Filled all seam lines and sanded progressively through 400→800→1500 grit. Checked fit of all major subassemblies before priming.`,
      date: "2026-03-01",
      images: [img(`step-${postId}-d1-1`, "Parts laid out for assembly"), img(`step-${postId}-d1-2`, "Seam lines filled and sanded")],
    },
    {
      id: `${postId}-d2`, stepNumber: 2, title: `Priming & ${techniques[0] ?? "Base Coat"}`,
      description: `Applied Mr. Surfacer 1200 as primer, then executed the main ${techniques[0]?.toLowerCase() ?? "painting"} process. Multiple thin coats for even coverage.`,
      date: "2026-03-10",
      images: [img(`step-${postId}-d2-1`, "Primer coat — gray"), img(`step-${postId}-d2-2`, "Base color applied")],
    },
    {
      id: `${postId}-d3`, stepNumber: 3, title: `Finishing — ${techniques[1] ?? "Detail Work"}`,
      description: `Completed ${techniques[1]?.toLowerCase() ?? "detail work"} and final assembly. Applied matte/gloss top coat to protect the finish.`,
      date: "2026-03-18",
      images: [img(`step-${postId}-d3-1`, "Detail work in progress"), img(`step-${postId}-d3-2`, "Final clear coat applied")],
    },
  ];
}

// Fill in default steps for posts without detailed records
import { posts } from "./dummy-data";
for (const post of posts) {
  if (!buildSteps[post.id]) {
    buildSteps[post.id] = defaultSteps(post.id, post.kit, post.techniques);
  }
}
