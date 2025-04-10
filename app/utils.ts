import type { PixelCrop } from "react-image-crop";
import {
  SeasonScore,
  Undertone,
  Season,
  SubSeasonScore,
  SubSeason,
  UndertoneScore,
  PaletteColor,
} from "./types";
import { paletteData } from "./constants";

export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop
): Promise<void> {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);

  ctx.translate(centerX, centerY);

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    -centerX,
    -centerY,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
}

export function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
}

export async function toDataUrl(
  canvas: HTMLCanvasElement
): Promise<string | null> {
  const blob = await toBlob(canvas);
  if (!blob) {
    return null;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const calculateSeason = (
  scores: SeasonScore,
  undertone: Undertone
): Season => {
  let likelySeason: Season = null;
  const undertoneBias = (season: keyof SeasonScore): number => {
    if (
      (undertone === "Cool" || undertone === "Neutral-Cool") &&
      (season === "winter" || season === "summer")
    )
      return 0.5;
    if (
      (undertone === "Warm" || undertone === "Neutral-Warm") &&
      (season === "autumn" || season === "spring")
    )
      return 0.5;
    if (undertone === "Olive" && (season === "autumn" || season === "winter"))
      return 0.5;
    if (undertone === "Neutral" && (season === "summer" || season === "spring"))
      return 0.2;
    return 0;
  };

  const adjustedScores: { score: number; season: Season }[] = (
    Object.keys(scores) as Array<keyof SeasonScore>
  ).map((key) => ({
    score: scores[key] + undertoneBias(key),
    season: (key.charAt(0).toUpperCase() + key.slice(1)) as Season,
  }));
  adjustedScores.sort((a, b) => b.score - a.score);

  if (adjustedScores.length > 0 && adjustedScores[0].score > 0) {
    likelySeason = adjustedScores[0].season;
    if (
      adjustedScores.length > 1 &&
      adjustedScores[0].score < adjustedScores[1].score + 1.5
    ) {
      const topTwoSeasons = [
        adjustedScores[0].season,
        adjustedScores[1].season,
      ];
      if (undertone === "Cool" || undertone === "Neutral-Cool")
        likelySeason =
          topTwoSeasons.find((s) => s === "Winter" || s === "Summer") ??
          likelySeason;
      else if (undertone === "Warm" || undertone === "Neutral-Warm")
        likelySeason =
          topTwoSeasons.find((s) => s === "Autumn" || s === "Spring") ??
          likelySeason;
      else if (undertone === "Olive")
        likelySeason =
          topTwoSeasons.find((s) => s === "Autumn" || s === "Winter") ??
          likelySeason;
      else
        likelySeason =
          topTwoSeasons.find((s) => s === "Summer" || s === "Spring") ??
          likelySeason;
    }
  } else {
    if (undertone === "Cool" || undertone === "Neutral-Cool")
      likelySeason = "Summer";
    else if (undertone === "Warm" || undertone === "Neutral-Warm")
      likelySeason = "Spring";
    else if (undertone === "Olive") likelySeason = "Autumn";
    else likelySeason = "Summer";
  }
  return likelySeason;
};

export const calculateSubSeason = (
  season: Season,
  scores: SubSeasonScore
): SubSeason => {
  if (!season) return null;

  const seasonPrefix = season.toLowerCase() + "_";
  const relevantKeys = Object.keys(scores).filter((key) =>
    key.startsWith(seasonPrefix)
  );

  const getDefaultSubSeason = (s: Season): SubSeason => {
    switch (s) {
      case "Winter":
        return "Winter Cool";
      case "Summer":
        return "Summer Soft";
      case "Autumn":
        return "Autumn Warm";
      case "Spring":
        return "Spring Light";
      default:
        return null;
    }
  };

  if (relevantKeys.length === 0) return getDefaultSubSeason(season);

  let maxScore = -Infinity;
  let subSeasonKey: string = "";
  relevantKeys.forEach((key) => {
    if (scores[key] > maxScore) {
      maxScore = scores[key];
      subSeasonKey = key;
    }
  });

  if (!subSeasonKey || maxScore <= 0) return getDefaultSubSeason(season);

  const subTypeName = subSeasonKey?.substring(seasonPrefix.length) || "";
  const subSeasonName =
    subTypeName.charAt(0).toUpperCase() + subTypeName.slice(1);
  const finalName = `${season} ${subSeasonName}`;

  const foundPalette = paletteData.seasons.find(
    (p) => p.name.toLowerCase() === finalName.toLowerCase()
  );

  return foundPalette ? foundPalette.name : finalName;
};

export const calculateUndertone = (
  scores: UndertoneScore,
  oliveIndicators: Set<number>
): Undertone => {
  const { cool, neutral, olive, warm } = scores;
  const scoreList: {
    score: number;
    type: Exclude<Undertone, "Neutral-Cool" | "Neutral-Warm" | null>;
  }[] = [
    { score: cool, type: "Cool" },
    { score: neutral, type: "Neutral" },
    { score: olive, type: "Olive" },
    { score: warm, type: "Warm" },
  ];
  scoreList.sort((a, b) => b.score - a.score);

  const primary = scoreList[0];
  const secondary = scoreList[1];

  const hasStrongOlive =
    olive > 1 && (oliveIndicators.has(4) || oliveIndicators.has(7));

  if (
    primary.type === "Olive" &&
    primary.score > 1 &&
    (primary.score > secondary.score + 1.5 || hasStrongOlive)
  )
    return "Olive";

  if (
    primary.type !== "Olive" &&
    secondary.type === "Olive" &&
    secondary.score > 1 &&
    hasStrongOlive &&
    primary.score < secondary.score + 2
  )
    return "Olive";

  if (
    primary.type === "Cool" &&
    primary.score > Math.max(warm, neutral, olive) + 1.5
  )
    return "Cool";
  if (
    primary.type === "Warm" &&
    primary.score > Math.max(cool, neutral, olive) + 1.5
  )
    return "Warm";

  if (primary.type === "Neutral") {
    if (secondary.type === "Cool" && cool > warm + 1) return "Neutral-Cool";
    if (secondary.type === "Warm" && warm > cool + 1) return "Neutral-Warm";
    return "Neutral";
  }

  if (
    (primary.type === "Cool" &&
      secondary.type === "Warm" &&
      Math.abs(cool - warm) < 2) ||
    (primary.type === "Warm" &&
      secondary.type === "Cool" &&
      Math.abs(cool - warm) < 2)
  ) {
    if (cool > warm) return "Neutral-Cool";
    if (warm > cool) return "Neutral-Warm";
    return "Neutral";
  }

  if (
    primary.type === "Cool" &&
    (secondary.type === "Neutral" || secondary.type === "Olive") &&
    primary.score < secondary.score + 2
  )
    return "Neutral-Cool";
  if (
    primary.type === "Warm" &&
    (secondary.type === "Neutral" || secondary.type === "Olive") &&
    primary.score < secondary.score + 2
  )
    return "Neutral-Warm";

  if (primary.score > secondary.score + 1) {
    if (primary.type === "Cool") return "Cool";
    if (primary.type === "Warm") return "Warm";
  }

  return "Neutral";
};

export const getSeasonEmoji = (season: Season): string => {
  switch (season) {
    case "Winter":
      return "☃️";
    case "Summer":
      return "🏖️";
    case "Autumn":
      return "🍂";
    case "Spring":
      return "🌷";
    default:
      return "";
  }
};

export const getUndertoneEmoji = (undertone: Undertone): string => {
  switch (undertone) {
    case "Cool":
      return "❄️";
    case "Warm":
      return "☀️";
    case "Neutral":
      return "⚖️";
    case "Olive":
      return "🫒";
    case "Neutral-Cool":
      return "⚖️❄️";
    case "Neutral-Warm":
      return "⚖️☀️";
    default:
      return "";
  }
};

export const hexToRgb = (hex: string): { b: number; g: number; r: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        b: parseInt(result[3], 16),
        g: parseInt(result[2], 16),
        r: parseInt(result[1], 16),
      }
    : { b: 255, g: 255, r: 255 };
};

export const modifySeasonScores = (
  current: SeasonScore,
  effect: Partial<SeasonScore>,
  operation: "add" | "subtract"
): SeasonScore => {
  const multiplier = operation === "add" ? 1 : -1;
  const updated = { ...current };
  (Object.keys(effect) as Array<keyof SeasonScore>).forEach(
    (key) =>
      (updated[key] = (updated[key] || 0) + (effect[key] ?? 0) * multiplier)
  );
  return updated;
};

export const modifySubSeasonScores = (
  current: SubSeasonScore,
  effect: Partial<SubSeasonScore>,
  operation: "add" | "subtract"
): SubSeasonScore => {
  const multiplier = operation === "add" ? 1 : -1;
  const updated = { ...current };

  (Object.keys(effect) as Array<keyof SubSeasonScore>).forEach(
    (key) =>
      (updated[key] = (updated[key] || 0) + (effect[key] ?? 0) * multiplier)
  );
  return updated;
};

export const modifyUndertoneScores = (
  current: UndertoneScore,
  effect: Partial<UndertoneScore>,
  operation: "add" | "subtract"
): UndertoneScore => {
  const multiplier = operation === "add" ? 1 : -1;
  const updated = { ...current };
  (Object.keys(effect) as Array<keyof UndertoneScore>).forEach(
    (key) =>
      (updated[key] = (updated[key] || 0) + (effect[key] ?? 0) * multiplier)
  );
  return updated;
};

export const getGradient = (
  palette: { name: string; palette: PaletteColor[] } | null
): string => {
  if (!palette || palette.palette.length === 0) return "lightgrey";

  const colors = palette.palette.filter(Boolean);

  if (colors.length === 0) return "lightgrey";
  if (colors.length === 1) return colors[0];

  const stripePercentage = 100 / colors.length;
  const gradientStops = colors.map((color, index) => {
    const start = index * stripePercentage;
    const end = (index + 1) * stripePercentage;
    return `${color} ${start.toFixed(2)}%, ${color} ${end.toFixed(2)}%`;
  });

  return `linear-gradient(to bottom, ${gradientStops.join(", ")})`;
};
