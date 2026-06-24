const TAG_JA: Record<string, string> = {
  // Paints
  "Mr. Color":            "Mr.カラー",
  "Gaia Notes":           "ガイアノーツ",
  "Tamiya Acrylic":       "タミヤアクリル",
  "Vallejo":              "バレホ",
  "Finisher's":           "フィニッシャーズ",
  "Mr. Surfacer":         "Mr.サーフェイサー",
  "AK Interactive":       "AKインタラクティブ",
  "Ammo by Mig":          "Ammo by Mig",
  "Citadel":              "シタデル",
  "Oil Paint":            "油彩",
  // Tools
  "Airbrush":             "エアブラシ",
  "Hand-brushed":         "手塗り",
  "Decals":               "デカール",
  "Pla-plate":            "プラ板",
  "Photo-etch":           "エッチングパーツ",
  "LED integration":      "LED組み込み",
  "Soldering":            "ハンダ付け",
  "Tools / Equipment":    "工具・ツール",
  // Techniques
  "Weathering":           "ウェザリング",
  "Chipping":             "チッピング",
  "Drybrushing":          "ドライブラシ",
  "Panel Lining":         "パネルライン",
  "Salt weathering":      "塩ウェザリング",
  "Hair spray technique": "ヘアスプレー技法",
  "Oil dot filtering":    "オイルドットフィルタリング",
  "Pin wash":             "ピンウォッシュ",
  "NMM":                  "NMM",
  "OSL":                  "OSL",
  "Zenithal priming":     "ゼニサルプライミング",
  "Pre-shading":          "プリシェーディング",
  "Post-shading":         "ポストシェーディング",
  "Scribing":             "スジボリ",
  "Masking":              "マスキング",
};

export function translateTag(english: string, locale: string): string {
  if (locale === "ja") return TAG_JA[english] ?? english;
  return english;
}

export function buildSuggestions(
  values: string[],
  locale: string,
): { value: string; label: string }[] {
  return values.map((v) => ({ value: v, label: translateTag(v, locale) }));
}
