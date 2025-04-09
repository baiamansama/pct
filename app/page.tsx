// Copyright (C) 2021 B factory, Inc. All rights reserved
"use client";
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from "@mediapipe/tasks-vision";
import Head from "next/head";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import paletteDataJson from "./color_palette.json";

const paletteData = paletteDataJson as unknown as {
  seasons: { name: string; palette: PaletteColor[] }[];
};

interface AnswerHistoryEntry {
  optionIndex: number;
  questionId: number;
  seasonScoreEffect?: Partial<SeasonScore>;
  stage: QuizStage;
  subSeasonScoreEffect?: Partial<SubSeasonScore>;
  undertoneScoreEffect?: Partial<UndertoneScore>;
}

interface ColorInfo {
  hex: string;
  name: string;
}

type PaletteColor = string;

interface QuizOption {
  choiceLabel: string;
  isUnsure?: boolean;
  seasonScoreEffect?: Partial<SeasonScore>;
  subSeasonScoreEffect?: Partial<SubSeasonScore>;
  swatches?: ColorInfo[];
  text: string;
  undertoneScoreEffect?: Partial<UndertoneScore>;
}

interface QuizQuestion {
  guidanceText?: string;
  id: number;
  options: QuizOption[];
  questionText: string;
  relevantSeasons?: Season[];
  relevantUndertones?: Undertone[];
  tier?: 1 | 2;
}

interface SeasonScore {
  autumn: number;
  spring: number;
  summer: number;
  winter: number;
}

interface SubSeasonScore {
  [key: string]: number;
}

interface UndertoneScore {
  cool: number;
  neutral: number;
  olive: number;
  warm: number;
}

type QuizStage = "Result" | "Season" | "SubSeason" | "Undertone";
type Season = "Autumn" | "Spring" | "Summer" | "Winter" | null;
type SubSeason = string | null;
type Undertone =
  | "Cool"
  | "Neutral"
  | "Neutral-Cool"
  | "Neutral-Warm"
  | "Olive"
  | "Warm"
  | null;

const COLORS = {
  beige: { hex: "#F5F5DC", name: "Beige" },
  bellwetherBlue: { hex: "#22305d", name: "Bellwether Blue" },
  black: { hex: "#000000", name: "Black" },
  bluePurple: { hex: "#8A2BE2", name: "Blue/Purple" },
  brightAqua: { hex: "#0FFFFF", name: "Bright Aqua" },
  brightYellow: { hex: "#FFFF00", name: "Bright Yellow" },
  burgundy: { hex: "#800020", name: "Burgundy" },
  butterYellow: { hex: "#FFFACD", name: "Butter Yellow" },
  chocolate: { hex: "#7B3F00", name: "Chocolate" },
  coolBlue: { hex: "#ADD8E6", name: "Cool Blue" },
  coolPink: { hex: "#FFC0CB", name: "Cool Pink" },
  coral: { hex: "#FF7F50", name: "Coral" },
  cream: { hex: "#FFFDD0", name: "Cream" },
  darkNavy: { hex: "#000080", name: "Dark Navy" },
  deepPlum: { hex: "#4B004B", name: "Deep Plum" },
  deepTeal: { hex: "#008080", name: "Deep Teal" },
  dustyRose: { hex: "#D8BFD8", name: "Dusty Rose" },
  emerald: { hex: "#2ECC71", name: "Emerald" },
  forestGreen: { hex: "#228B22", name: "Forest Green" },
  gold: { hex: "#FFD700", name: "Gold" },
  goldenYellow: { hex: "#FFDF00", name: "Golden Yellow" },
  grey: { hex: "#808080", name: "Grey" }, // Corrected hex for Grey
  hotPink: { hex: "#FF69B4", name: "Hot Pink" },
  icyBlue: { hex: "#AFFFFF", name: "Icy Blue" },
  ivory: { hex: "#FFFFF0", name: "Ivory" },
  ivyGreen: { hex: "#2E8B57", name: "Ivy Green" },
  khaki: { hex: "#C3B091", name: "Khaki" },
  lavender: { hex: "#E6E6FA", name: "Lavender" },
  lightAqua: { hex: "#AFEEEE", name: "Light Aqua" },
  limeGreen: { hex: "#32CD32", name: "Lime Green" },
  mahogany: { hex: "#C04000", name: "Mahogany" },
  mintGreen: { hex: "#98FB98", name: "Mint Green" },
  mustardYellow: { hex: "#FFDB58", name: "Mustard Yellow" },
  oliveGreen: { hex: "#808000", name: "Olive Green" },
  pastelPink: { hex: "#FFDDF4", name: "Pastel Pink" },
  peach: { hex: "#FFDAB9", name: "Peach" },
  pureWhite: { hex: "#FFFFFF", name: "Pure White" },
  sageGreen: { hex: "#BCB88A", name: "Sage Green" },
  silver: { hex: "#C0C0C0", name: "Silver" },
  skyBlue: { hex: "#87CEEB", name: "Sky Blue" },
  softNavy: { hex: "#6A6A9F", name: "Soft Navy" },
  softWhite: { hex: "#F5F5F5", name: "Soft White" },
  taupe: { hex: "#8B8589", name: "Taupe" },
  terracotta: { hex: "#E2725B", name: "Terracotta" },
  trueRed: { hex: "#FF0000", name: "True Red" },
  turquoise: { hex: "#40E0D0", name: "Turquoise" },
  veryBerry: { hex: "#b83273", name: "Very Berry" },
  hollyhock: { hex: "#823271", name: "Hollyhock" },
  deepGreen: { hex: "#0b6f6b", name: "Deep Green" },
};

const seasonQuestions: QuizQuestion[] = [
  {
    guidanceText:
      "Look at the overall impression of these palettes against your skin. Which group makes you look most vibrant and healthy?",
    id: 101,
    options: [
      {
        choiceLabel: "Cool & Bright",
        seasonScoreEffect: { autumn: -2, spring: 1, summer: -1, winter: 2 },
        swatches: [
          COLORS.pureWhite,
          COLORS.veryBerry,
          COLORS.hollyhock,
          COLORS.bellwetherBlue,
          COLORS.deepGreen,
        ],
        text: "High contrast, cool, saturated (icy, jewel tones, pure white/black)",
      },
      {
        choiceLabel: "Warm & Muted",
        seasonScoreEffect: { autumn: 2, spring: -1, summer: 1, winter: -2 },
        swatches: [
          COLORS.cream,
          COLORS.oliveGreen,
          COLORS.terracotta,
          COLORS.mustardYellow,
          COLORS.deepTeal,
        ],
        text: "Earthy, rich, blended, warm (olive, terracotta, mustard, deep teal)",
      },
      {
        choiceLabel: "Cool & Soft",
        seasonScoreEffect: { autumn: -1, spring: -2, summer: 2, winter: 1 },
        swatches: [
          COLORS.softWhite,
          COLORS.grey,
          COLORS.skyBlue,
          COLORS.dustyRose,
          COLORS.softNavy,
        ],
        text: "Muted, cool, gentle, blended (greys, soft blues, dusty rose, lavender)",
      },
      {
        choiceLabel: "Warm & Bright",
        seasonScoreEffect: { autumn: 1, spring: 2, summer: -2, winter: -1 },
        swatches: [
          COLORS.ivory,
          COLORS.coral,
          COLORS.goldenYellow,
          COLORS.turquoise,
          COLORS.limeGreen,
        ],
        text: "Clear, vibrant, sunny, warm (coral, golden yellow, turquoise, lime)",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        seasonScoreEffect: {},
        text: "Hard to choose / Unsure",
      },
    ],
    questionText: "Which color group feels most harmonious and flattering?",
  },
  {
    guidanceText:
      "Compare pure black with a softer dark like charcoal grey or deep navy near your face.",
    id: 102,
    options: [
      {
        choiceLabel: "Pure Black is striking and clear",
        seasonScoreEffect: { autumn: -1, spring: 0.5, summer: -1, winter: 2 },
        swatches: [COLORS.black, COLORS.pureWhite],
        text: "Clear black suggests high contrast",
      },
      {
        choiceLabel: "Charcoal/Soft Black is softer/better",
        seasonScoreEffect: { autumn: 1.5, spring: -1, summer: 1.5, winter: -1 },
        swatches: [COLORS.grey, COLORS.softNavy],
        text: "Softer darks suggest less contrast",
      },
      {
        choiceLabel: "Both look acceptable",
        seasonScoreEffect: {},
        swatches: [COLORS.black, COLORS.grey],
        text: "May indicate Neutral season influence or adaptability",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        seasonScoreEffect: {},
        text: "Hard to tell / Unsure",
      },
    ],
    questionText: "How does your skin react to Black vs. Off-Black/Charcoal?",
  },
  {
    guidanceText:
      "Compare a warm off-white/ivory/cream with a stark, pure white near your face.",
    id: 103,
    options: [
      {
        choiceLabel: "Cream/Ivory is more harmonious",
        seasonScoreEffect: { autumn: 2, spring: 1.5, summer: -1, winter: -1 },
        swatches: [COLORS.cream, COLORS.beige],
        text: "Cream preference indicates warmth",
      },
      {
        choiceLabel: "Pure White looks cleaner/brighter",
        seasonScoreEffect: { autumn: -1, spring: -1, summer: 2, winter: 1.5 },
        swatches: [COLORS.pureWhite, COLORS.icyBlue],
        text: "Pure white preference indicates coolness",
      },
      {
        choiceLabel: "Both look acceptable",
        seasonScoreEffect: {},
        swatches: [COLORS.cream, COLORS.pureWhite],
        text: "May indicate Neutral season influence",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        seasonScoreEffect: {},
        text: "Hard to tell / Unsure",
      },
    ],
    questionText: "How does your skin react to Cream vs. Pure White?",
  },
];

const subSeasonQuestions: QuizQuestion[] = [
  {
    guidanceText:
      "Among these cool & bright/deep palettes, which group contains the most colors you naturally gravitate towards or feel best in?",
    id: 201,
    options: [
      {
        choiceLabel: "Deep & Rich",
        subSeasonScoreEffect: { winterdark: 2 },
        swatches: [
          COLORS.black,
          COLORS.burgundy,
          COLORS.forestGreen,
          COLORS.darkNavy,
          COLORS.deepPlum,
        ],
        text: "Darkest colors, high contrast, richness (black, burgundy, forest green)",
      },
      {
        choiceLabel: "Cool & Icy",
        subSeasonScoreEffect: { wintercool: 2 },
        swatches: [
          COLORS.pureWhite,
          COLORS.coolBlue,
          COLORS.hotPink,
          COLORS.trueRed,
          COLORS.grey,
        ],
        text: "Purely cool, medium-high contrast, clear (pure white, cool blue, hot pink, grey)",
      },
      {
        choiceLabel: "Bright & Clear",
        subSeasonScoreEffect: { winterbright: 2 },
        swatches: [
          COLORS.black,
          COLORS.pureWhite,
          COLORS.emerald,
          COLORS.trueRed,
          COLORS.brightAqua,
        ],
        text: "Highest saturation, high contrast, hints of neutral influence (emerald, true red, bright aqua)",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        subSeasonScoreEffect: {},
        text: "Hard to choose / Unsure",
      },
    ],
    questionText: 'Which Winter palette feels most "you"?',
    relevantSeasons: ["Winter"],
  },
  {
    guidanceText:
      "Among these cool & soft palettes, which group contains the most colors that feel gentle and harmonious on you?",
    id: 202,
    options: [
      {
        choiceLabel: "Light & Delicate",
        subSeasonScoreEffect: { summerlight: 2 },
        swatches: [
          COLORS.softWhite,
          COLORS.pastelPink,
          COLORS.lightAqua,
          COLORS.mintGreen,
          COLORS.lavender,
        ],
        text: "Lightest overall, cool, soft, ethereal (pastels, light aqua, mint)",
      },
      {
        choiceLabel: "Cool & Dusty",
        subSeasonScoreEffect: { summercool: 2 },
        swatches: [
          COLORS.grey,
          COLORS.skyBlue,
          COLORS.dustyRose,
          COLORS.softNavy,
          COLORS.coolPink,
        ],
        text: "Purely cool, medium softness, slightly greyed (sky blue, dusty rose, soft navy)",
      },
      {
        choiceLabel: "Soft & Muted",
        subSeasonScoreEffect: { summersoft: 2 },
        swatches: [
          COLORS.taupe,
          COLORS.sageGreen,
          COLORS.deepTeal,
          COLORS.dustyRose,
          COLORS.softNavy,
        ],
        text: "Most blended, neutral-cool, gentle depth (taupe, sage, deep rose, soft teal)",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        subSeasonScoreEffect: {},
        text: "Hard to choose / Unsure",
      },
    ],
    questionText: 'Which Summer palette feels most "you"?',
    relevantSeasons: ["Summer"],
  },
  {
    guidanceText:
      "Among these warm & muted/rich palettes, which group feels most natural and earthy on you?",
    id: 203,
    options: [
      {
        choiceLabel: "Deep & Rich",
        subSeasonScoreEffect: { autumndark: 2 },
        swatches: [
          COLORS.chocolate,
          COLORS.forestGreen,
          COLORS.burgundy,
          COLORS.deepTeal,
          COLORS.mustardYellow,
        ],
        text: "Darkest overall, warm, muted intensity (chocolate, deep olive, burgundy)",
      },
      {
        choiceLabel: "Warm & Earthy",
        subSeasonScoreEffect: { autumnwarm: 2 },
        swatches: [
          COLORS.cream,
          COLORS.terracotta,
          COLORS.oliveGreen,
          COLORS.gold,
          COLORS.khaki,
        ],
        text: "Purely warm, rich, medium intensity, golden (terracotta, olive green, gold)",
      },
      {
        choiceLabel: "Soft & Muted",
        subSeasonScoreEffect: { autumnsoft: 2 },
        swatches: [
          COLORS.beige,
          COLORS.sageGreen,
          COLORS.mahogany,
          COLORS.softWhite,
          COLORS.taupe,
        ],
        text: "Most blended, neutral-warm, gentle (beige, sage, mahogany, soft taupe)",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        subSeasonScoreEffect: {},
        text: "Hard to choose / Unsure",
      },
    ],
    questionText: 'Which Autumn palette feels most "you"?',
    relevantSeasons: ["Autumn"],
  },
  {
    guidanceText:
      "Among these warm & bright/light palettes, which group makes you look fresh, vibrant, and awake?",
    id: 204,
    options: [
      {
        choiceLabel: "Light & Delicate",
        subSeasonScoreEffect: { springlight: 2 },
        swatches: [
          COLORS.ivory,
          COLORS.peach,
          COLORS.butterYellow,
          COLORS.lightAqua,
          COLORS.pastelPink,
        ],
        text: "Lightest overall, warm, clear, sunny (ivory, peach, butter yellow, light aqua)",
      },
      {
        choiceLabel: "Warm & Golden",
        subSeasonScoreEffect: { springwarm: 2 },
        swatches: [
          COLORS.cream,
          COLORS.coral,
          COLORS.goldenYellow,
          COLORS.turquoise,
          COLORS.limeGreen,
        ],
        text: "Purely warm, clear, medium intensity, sunny (cream, coral, golden yellow, turquoise)",
      },
      {
        choiceLabel: "Bright & Clear",
        subSeasonScoreEffect: { springbright: 2 },
        swatches: [
          COLORS.pureWhite,
          COLORS.hotPink,
          COLORS.brightAqua,
          COLORS.limeGreen,
          COLORS.trueRed,
        ],
        text: "Highest saturation, high contrast, neutral-warm (bright aqua, lime green, true red - clear versions)",
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        subSeasonScoreEffect: {},
        text: "Hard to choose / Unsure",
      },
    ],
    questionText: 'Which Spring palette feels most "you"?',
    relevantSeasons: ["Spring"],
  },
];

const undertoneQuestions: QuizQuestion[] = [
  {
    guidanceText:
      "Which metallic jewelry or fabric makes your skin look clearest and brightest?",
    id: 1,
    options: [
      {
        choiceLabel: "Silver",
        swatches: [COLORS.silver],
        text: "Silver looks best",
        undertoneScoreEffect: { cool: 2.5, warm: -1 },
      },
      {
        choiceLabel: "Gold",
        swatches: [COLORS.gold],
        text: "Gold looks best",
        undertoneScoreEffect: { cool: -1, warm: 2.5 },
      },
      {
        choiceLabel: "Both OK",
        swatches: [COLORS.silver, COLORS.gold],
        text: "Both look acceptable",
        undertoneScoreEffect: { neutral: 1.5, olive: 1 },
      },
      {
        choiceLabel: "Neither",
        text: "Neither look particularly good",
        undertoneScoreEffect: { neutral: 1, olive: 1.5 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Metallics: Silver or Gold?",
    tier: 1,
  },
  {
    guidanceText:
      "Look at the veins on your inner wrist in natural light. What color do they appear most?",
    id: 8,
    options: [
      {
        choiceLabel: "Blue/Purple",
        swatches: [COLORS.bluePurple],
        text: "Mostly Blue or Purple",
        undertoneScoreEffect: { cool: 2 },
      },
      {
        choiceLabel: "Green/Olive",
        swatches: [COLORS.ivyGreen],
        text: "Mostly Green or Olive",
        undertoneScoreEffect: { olive: 1, warm: 1.5 },
      },
      {
        choiceLabel: "Mix / Teal",
        swatches: [COLORS.deepTeal],
        text: "A mix of Blue and Green",
        undertoneScoreEffect: { neutral: 1.5, olive: 0.5 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Vein Color on Wrist:",
    tier: 1,
  },
  {
    guidanceText:
      "How does your skin typically react to sun exposure (without sunscreen)?",
    id: 9,
    options: [
      {
        choiceLabel: "Burn Easily",
        text: "Burns easily, rarely or never tans",
        undertoneScoreEffect: { cool: 1.5, warm: -0.5 },
      },
      {
        choiceLabel: "Burn then Tan",
        text: "Burns first, then tans",
        undertoneScoreEffect: { neutral: 1 },
      },
      {
        choiceLabel: "Tan Easily",
        text: "Tans easily, rarely burns",
        undertoneScoreEffect: { olive: 1, warm: 1 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Unsure / Avoid Sun",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Sun Reaction:",
    tier: 1,
  },
  {
    guidanceText:
      "Which shade of white makes your complexion look healthiest? Hold fabric near your face if possible.",
    id: 2,
    options: [
      {
        choiceLabel: "Pure White",
        swatches: [COLORS.pureWhite],
        text: "Pure, stark white",
        undertoneScoreEffect: { cool: 1.5 },
      },
      {
        choiceLabel: "Cream",
        swatches: [COLORS.cream],
        text: "Off-white or cream",
        undertoneScoreEffect: { warm: 1.5 },
      },
      {
        choiceLabel: "Soft White",
        swatches: [COLORS.softWhite],
        text: "Soft, slightly muted white",
        undertoneScoreEffect: { neutral: 1, olive: 1 },
      },
      {
        choiceLabel: "None Look Good",
        text: "None seem quite right",
        undertoneScoreEffect: { neutral: 0.5, olive: 1 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Whites: Pure White, Cream, or Soft White?",
    tier: 1,
  },
  {
    guidanceText:
      "Imagine wearing blush. Does a cool-toned pink or a warm-toned peach generally look more natural?",
    id: 3,
    options: [
      {
        choiceLabel: "Cool Pink",
        swatches: [COLORS.coolPink],
        text: "Cool pink is more harmonious",
        undertoneScoreEffect: { cool: 1.5 },
      },
      {
        choiceLabel: "Peach",
        swatches: [COLORS.peach],
        text: "Warm peach blends better",
        undertoneScoreEffect: { warm: 1.5 },
      },
      {
        choiceLabel: "Both OK",
        swatches: [COLORS.coolPink, COLORS.peach],
        text: "Both can work depending on the shade",
        undertoneScoreEffect: { neutral: 1 },
      },
      {
        choiceLabel: "Both Clash!",
        text: "Both tend to look unnatural or clash",
        undertoneScoreEffect: { olive: 1.5 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Blush: Cool Pink or Warm Peach?",
    tier: 1,
  },
  {
    guidanceText:
      "How do earthy greens and khakis look near your face? Do they complement or wash you out?",
    id: 4,
    options: [
      {
        choiceLabel: "Looks Good",
        swatches: [COLORS.oliveGreen, COLORS.khaki],
        text: "They look quite flattering",
        undertoneScoreEffect: { neutral: 1, olive: 2.5, warm: 0.5 },
      },
      {
        choiceLabel: "Clashes",
        swatches: [COLORS.oliveGreen, COLORS.khaki],
        text: "They tend to clash or look muddy",
        undertoneScoreEffect: { cool: 0.5, olive: -1.5 },
      },
      {
        choiceLabel: "Just OK",
        swatches: [COLORS.oliveGreen, COLORS.khaki],
        text: "They are just okay, not great or bad",
        undertoneScoreEffect: { neutral: 1 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Earth Tones: Olive Green / Khaki?",
    tier: 2,
  },
  {
    guidanceText:
      "Compare a clear, bright yellow to a deeper, muted mustard yellow. Which feels more harmonious?",
    id: 5,
    options: [
      {
        choiceLabel: "Mustard",
        swatches: [COLORS.mustardYellow],
        text: "Mustard yellow is better",
        undertoneScoreEffect: { olive: 1, warm: 1.5 },
      },
      {
        choiceLabel: "Bright",
        swatches: [COLORS.brightYellow],
        text: "Bright lemon yellow is better",
        undertoneScoreEffect: { cool: 1, warm: 0.5 },
      },
      {
        choiceLabel: "Both OK",
        swatches: [COLORS.brightYellow, COLORS.mustardYellow],
        text: "Both yellows can work okay",
        undertoneScoreEffect: { neutral: 1 },
      },
      {
        choiceLabel: "Neither Good",
        swatches: [COLORS.brightYellow, COLORS.mustardYellow],
        text: "Neither yellow is particularly flattering",
        undertoneScoreEffect: { neutral: 0.5, olive: 2 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Yellows: Bright Lemon or Mustard?",
    tier: 2,
  },
  {
    guidanceText:
      "Generally, do you feel you look better in softer, more blended colors or clear, saturated, bright colors?",
    id: 6,
    options: [
      {
        choiceLabel: "Muted Better",
        swatches: [COLORS.taupe, COLORS.burgundy, COLORS.sageGreen],
        text: "Muted/soft colors are more harmonious",
        undertoneScoreEffect: { neutral: 1, olive: 1 },
      },
      {
        choiceLabel: "Bright Better",
        swatches: [COLORS.hotPink, COLORS.limeGreen, COLORS.brightAqua],
        text: "Clear/bright colors bring out my features",
        undertoneScoreEffect: { cool: 0.5, warm: 0.5 },
      },
      {
        choiceLabel: "Depends",
        text: "Depends heavily on the specific color",
        undertoneScoreEffect: { neutral: 0.5 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Hard to tell / Unsure",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Overall Feel: Muted/Soft or Clear/Bright Colors?",
    tier: 2,
  },
  {
    guidanceText:
      "Look closely at your skin, especially jawline/neck, in natural light. Do you perceive any subtle underlying green, grey, or yellowish-green tone compared to purely pink/peach/golden?",
    id: 7,
    options: [
      {
        choiceLabel: "Yes",
        text: "Yes, I can see a subtle green/grey/ashy cast",
        undertoneScoreEffect: { neutral: 0.5, olive: 3 },
      },
      {
        choiceLabel: "No",
        text: "No, my skin looks more pink, peachy, or golden",
        undertoneScoreEffect: { olive: -1 },
      },
      {
        choiceLabel: "Unsure",
        isUnsure: true,
        text: "Unsure, I cannot perceive such a cast",
        undertoneScoreEffect: { neutral: 0.5 },
      },
    ],
    questionText: "Skin Cast Perception: Subtle Green/Grey Hue?",
    tier: 2,
  },
];

const calculateSeason = (scores: SeasonScore, undertone: Undertone): Season => {
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

const calculateSubSeason = (
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

const calculateUndertone = (
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

const getSeasonEmoji = (season: Season): string => {
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

const getUndertoneEmoji = (undertone: Undertone): string => {
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

const hexToRgb = (hex: string): { b: number; g: number; r: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        b: parseInt(result[3], 16),
        g: parseInt(result[2], 16),
        r: parseInt(result[1], 16),
      }
    : { b: 255, g: 255, r: 255 };
};

const modifySeasonScores = (
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

const modifySubSeasonScores = (
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

const modifyUndertoneScores = (
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

const UndertoneQuiz: React.FC = () => {
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<QuizStage>("Undertone");
  const [frameColor, setFrameColor] = useState<string | string[]>("#FFFFFF");
  const [imageOriginal, setImageOriginal] = useState<HTMLImageElement | null>(
    null
  );
  const [imageSegmenter, setImageSegmenter] = useState<ImageSegmenter | null>(
    null
  );
  const [imageUploaded, setImageUploaded] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSegmenterReady, setIsSegmenterReady] = useState(false);
  const [oliveAnswersPositive, setOliveAnswersPositive] = useState<Set<number>>(
    new Set()
  );
  const [resultSingleColorView, setResultSingleColorView] = useState<
    string | null
  >(null);
  const [seasonDetermined, setSeasonDetermined] = useState<Season>(null);
  const [seasonScores, setSeasonScores] = useState<SeasonScore>({
    autumn: 0,
    spring: 0,
    summer: 0,
    winter: 0,
  });
  const [segmentationMask, setSegmentationMask] =
    useState<ImageSegmenterResult | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [subSeasonDetermined, setSubSeasonDetermined] =
    useState<SubSeason>(null);
  const [subSeasonScores, setSubSeasonScores] = useState<SubSeasonScore>({});
  const [tier2Visible, setTier2Visible] = useState<boolean>(false);
  const [undertoneFinal, setUndertoneFinal] = useState<Undertone>(null);
  const [undertoneScores, setUndertoneScores] = useState<UndertoneScore>({
    cool: 0,
    neutral: 0,
    olive: 0,
    warm: 0,
  });
  const [viewedSubSeasonName, setViewedSubSeasonName] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSubSeasonNames = useMemo(() => {
    return paletteData.seasons
      .map((p) => p.name)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  // Reset component state completely on mount (history is not persisted)
  useEffect(() => {
    // Minimal reset on mount, image upload triggers full reset via restartQuiz
    setCurrentStage("Undertone");
    setCurrentQuestionIndex(0);
    setAnswerHistory([]);
    setSelectedOptionIndex(null);
  }, []);

  useEffect(() => {
    let segmenterInstance: ImageSegmenter | null = null;
    const initializeSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm"
        );
        segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            delegate: "GPU",
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
          },
          outputCategoryMask: true,
          outputConfidenceMasks: false,
          runningMode: "IMAGE",
        });
        setImageSegmenter(segmenterInstance);
        setIsSegmenterReady(true);
      } catch (error) {
        console.error("Failed to load segmenter:", error);
        alert(
          "Failed to load AI Model. Please check your connection and refresh."
        );
        setIsSegmenterReady(false);
      }
    };
    initializeSegmenter();
    return () => {
      segmenterInstance?.close();
      setImageSegmenter(null);
      setIsSegmenterReady(false);
    };
  }, []);

  const viewedPalette = useMemo(() => {
    if (!viewedSubSeasonName) return null;
    if (!paletteData || !paletteData.seasons) return null;
    const normalizedSubSeason = viewedSubSeasonName
      .toLowerCase()
      .replace(/\s+/g, "");
    return (
      paletteData.seasons.find(
        (p) => p.name.toLowerCase().replace(/\s+/g, "") === normalizedSubSeason
      ) ?? null
    );
  }, [viewedSubSeasonName]);

  const viewedPaletteGradient = useMemo(() => {
    if (!viewedPalette || viewedPalette.palette.length === 0)
      return "lightgrey";
    const colors = viewedPalette.palette.filter(Boolean);

    if (colors.length === 0) return "lightgrey";
    if (colors.length === 1) return colors[0];

    const stripePercentage = 100 / colors.length;
    const gradientStops = colors.map((color, index) => {
      const start = index * stripePercentage;
      const end = (index + 1) * stripePercentage;
      return `${color} ${start.toFixed(2)}%, ${color} ${end.toFixed(2)}%`;
    });
    return `linear-gradient(to right, ${gradientStops.join(", ")})`; // Use to right for button preview
  }, [viewedPalette]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageOriginal || !segmentationMask?.categoryMask)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { naturalHeight: height, naturalWidth: width } = imageOriginal;
    canvas.height = height;
    canvas.width = width;

    if (currentStage === "Result") {
      if (resultSingleColorView) {
        const { b, g, r } = hexToRgb(resultSingleColorView);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, width, height);
      } else if (viewedPalette && viewedPalette.palette.length > 0) {
        const colors = viewedPalette.palette.filter(Boolean);

        if (colors.length > 0) {
          const stripeHeight = height / colors.length;
          colors.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, index * stripeHeight, width, stripeHeight);
          });
        } else {
          ctx.fillStyle = "#E0E0E0";
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        ctx.fillStyle = "#E0E0E0";
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      if (Array.isArray(frameColor)) {
        const validColors = frameColor.filter(Boolean);
        if (validColors.length > 0) {
          if (validColors.length === 2) {
            const splitX = (splitPosition / 100) * width;
            ctx.fillStyle = validColors[0];
            ctx.fillRect(0, 0, splitX, height);
            ctx.fillStyle = validColors[1];
            ctx.fillRect(splitX, 0, width - splitX, height);
          } else {
            const stripeHeight = height / validColors.length;
            validColors.forEach((color, index) => {
              ctx.fillStyle = color;
              ctx.fillRect(0, index * stripeHeight, width, stripeHeight);
            });
          }
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        const { b, g, r } = hexToRgb(frameColor || "#FFFFFF");
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.height = height;
    tempCanvas.width = width;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(imageOriginal, 0, 0, width, height);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const mask = segmentationMask.categoryMask.getAsFloat32Array();
    const pixelData = imageData.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] >= 0.5) {
        pixelData[i * 4 + 3] = 0;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    const scale = 0.8;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    ctx.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
  }, [
    frameColor,
    imageOriginal,
    segmentationMask,
    currentStage,
    viewedPalette,
    splitPosition,
    resultSingleColorView,
  ]);

  useEffect(() => {
    if (imageOriginal && segmentationMask && canvasRef.current) {
      drawCanvas();
    }
  }, [
    drawCanvas,
    frameColor,
    imageOriginal,
    segmentationMask,
    currentStage,
    viewedPalette,
    resultSingleColorView,
  ]);

  const checkTier2Visibility = useCallback(
    (scores: UndertoneScore) => {
      if (currentStage !== "Undertone") return false;

      const undertoneHistory = answerHistory.filter(
        (h) => h.stage === "Undertone"
      );
      const answeredTier1Ids = new Set(
        undertoneHistory.map((entry) => entry.questionId)
      );
      const tier1Questions = undertoneQuestions.filter((q) => q.tier === 1);
      const allTier1Answered = tier1Questions.every((q) =>
        answeredTier1Ids.has(q.id)
      );

      const shouldShow =
        allTier1Answered &&
        (scores.neutral > 1 ||
          scores.olive > 1 ||
          Math.abs(scores.cool - scores.warm) < 3 ||
          (scores.cool < 2 &&
            scores.warm < 2 &&
            scores.neutral < 2 &&
            scores.olive < 2));

      setTier2Visible(shouldShow);
      return shouldShow;
    },
    [currentStage, answerHistory]
  );

  const getCurrentStageQuestions = useCallback((): QuizQuestion[] => {
    switch (currentStage) {
      case "Undertone":
        return undertoneQuestions.filter(
          (q) => q.tier === 1 || (q.tier === 2 && tier2Visible)
        );
      case "Season":
        return seasonQuestions;
      case "SubSeason":
        return subSeasonQuestions.filter(
          (q) =>
            !seasonDetermined || q.relevantSeasons?.includes(seasonDetermined)
        );
      default:
        return [];
    }
  }, [currentStage, seasonDetermined, tier2Visible]);

  const currentQuestions = useMemo(
    () => getCurrentStageQuestions(),
    [getCurrentStageQuestions]
  );
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleAnswerSelect = useCallback(
    (index: number) => {
      if (!currentQuestion) return;
      setSelectedOptionIndex(index);
      const option = currentQuestion.options[index];
      if (option.swatches) {
        setFrameColor(
          option.swatches.length === 1
            ? option.swatches[0].hex
            : option.swatches.map((s) => s.hex)
        );
        if (option.swatches.length !== 2) {
          setSplitPosition(50);
        }
      } else {
        setFrameColor("#FFFFFF");
        setSplitPosition(50);
      }
    },
    [currentQuestion]
  );

  const restartQuiz = useCallback(() => {
    setAnswerHistory([]);
    setCurrentQuestionIndex(0);
    setCurrentStage("Undertone");
    setFrameColor("#FFFFFF");
    setSplitPosition(50);
    setResultSingleColorView(null);
    setViewedSubSeasonName(null);
    setImageOriginal(null);
    setImageUploaded(null);
    setIsProcessing(false);
    setOliveAnswersPositive(new Set());
    setSeasonDetermined(null);
    setSeasonScores({ autumn: 0, spring: 0, summer: 0, winter: 0 });
    setSegmentationMask(null);
    setSelectedOptionIndex(null);
    setSubSeasonDetermined(null);
    setSubSeasonScores({});
    setTier2Visible(false);
    setUndertoneFinal(null);
    setUndertoneScores({ cool: 0, neutral: 0, olive: 0, warm: 0 });
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!imageSegmenter) {
        if (!isSegmenterReady)
          alert("AI Model not ready. Please wait or refresh.");
        return;
      }
      setIsProcessing(true);
      restartQuiz();
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (!imageUrl) {
          alert("Could not read image data.");
          setIsProcessing(false);
          return;
        }
        setImageUploaded(imageUrl);
        const img = new Image();
        img.onload = async () => {
          setImageOriginal(img);
          try {
            if (!imageSegmenter)
              throw new Error("Segmenter not available after image load.");
            const result = await imageSegmenter.segment(img);
            setSegmentationMask(result);
            setFrameColor("#FFFFFF");
            setSplitPosition(50);
          } catch (error) {
            console.error("Segmentation error:", error);
            alert(
              `Failed to process image. Error: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
            setImageOriginal(null);
            setSegmentationMask(null);
          } finally {
            setIsProcessing(false);
          }
        };
        img.onerror = () => {
          alert("Failed to load image. Check file format or integrity.");
          setIsProcessing(false);
          setImageOriginal(null);
          setImageUploaded(null);
        };
        img.src = imageUrl;
      };
      reader.onerror = () => {
        alert("Could not read file.");
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
      if (event.target) event.target.value = "";
    },
    [imageSegmenter, isSegmenterReady, restartQuiz]
  );

  const handleNext = useCallback(() => {
    if (selectedOptionIndex === null || !currentQuestion) return;

    const option = currentQuestion.options[selectedOptionIndex];
    const questionId = currentQuestion.id;

    let nextUndertoneScores = undertoneScores;
    let nextSeasonScores = seasonScores;
    let nextSubSeasonScores = subSeasonScores;
    let nextOliveAnswersPositive = oliveAnswersPositive;

    const entry: AnswerHistoryEntry = {
      optionIndex: selectedOptionIndex,
      questionId,
      seasonScoreEffect: option.seasonScoreEffect,
      stage: currentStage,
      subSeasonScoreEffect: option.subSeasonScoreEffect,
      undertoneScoreEffect: option.undertoneScoreEffect,
    };

    if (currentStage === "Undertone" && option.undertoneScoreEffect) {
      nextUndertoneScores = modifyUndertoneScores(
        undertoneScores,
        option.undertoneScoreEffect,
        "add"
      );
      if (questionId === 4 || questionId === 7) {
        const currentOliveEffect = option.undertoneScoreEffect?.olive ?? 0;
        if (currentOliveEffect > 0) {
          nextOliveAnswersPositive = new Set(oliveAnswersPositive).add(
            questionId
          );
        }
      }
    } else if (currentStage === "Season" && option.seasonScoreEffect) {
      nextSeasonScores = modifySeasonScores(
        seasonScores,
        option.seasonScoreEffect,
        "add"
      );
    } else if (currentStage === "SubSeason" && option.subSeasonScoreEffect) {
      nextSubSeasonScores = modifySubSeasonScores(
        subSeasonScores,
        option.subSeasonScoreEffect,
        "add"
      );
    }

    setUndertoneScores(nextUndertoneScores);
    setSeasonScores(nextSeasonScores);
    setSubSeasonScores(nextSubSeasonScores);
    setOliveAnswersPositive(nextOliveAnswersPositive);
    setAnswerHistory((prevHistory) => [...prevHistory, entry]);

    let nextStage = currentStage;
    let nextQuestionIndex = currentQuestionIndex + 1;

    const currentStageQuestions = getCurrentStageQuestions();
    const isLastQuestionInStage =
      currentQuestionIndex >= currentStageQuestions.length - 1;

    if (isLastQuestionInStage) {
      if (currentStage === "Undertone") {
        const calculatedUndertone = calculateUndertone(
          nextUndertoneScores,
          nextOliveAnswersPositive
        );
        setUndertoneFinal(calculatedUndertone);
        nextStage = "Season";
        nextQuestionIndex = 0;
      } else if (currentStage === "Season") {
        const calculatedSeason = calculateSeason(
          nextSeasonScores,
          undertoneFinal
        );
        setSeasonDetermined(calculatedSeason);
        const relevantSubQs = subSeasonQuestions.filter((q) =>
          q.relevantSeasons?.includes(calculatedSeason)
        );
        nextStage = relevantSubQs.length > 0 ? "SubSeason" : "Result";
        nextQuestionIndex = 0;
      } else if (currentStage === "SubSeason") {
        const calculatedSubSeason = calculateSubSeason(
          seasonDetermined,
          nextSubSeasonScores
        );
        setSubSeasonDetermined(calculatedSubSeason);
        setViewedSubSeasonName(calculatedSubSeason);
        nextStage = "Result";
        nextQuestionIndex = 0;
      }
    }

    if (currentStage === "Undertone" || nextStage === "Undertone") {
      checkTier2Visibility(nextUndertoneScores);
    } else {
      setTier2Visible(false);
    }

    setCurrentStage(nextStage);
    setCurrentQuestionIndex(nextQuestionIndex);
    setSelectedOptionIndex(null);
    setFrameColor("#FFFFFF");
    setSplitPosition(50);
  }, [
    selectedOptionIndex,
    currentQuestion,
    undertoneScores,
    seasonScores,
    subSeasonScores,
    oliveAnswersPositive,
    answerHistory,
    currentStage,
    currentQuestionIndex,
    undertoneFinal,
    seasonDetermined,
    getCurrentStageQuestions,
    checkTier2Visibility,
  ]);

  const handlePrev = useCallback(() => {
    if (answerHistory.length === 0) return;

    const lastAnswer = answerHistory[answerHistory.length - 1];
    const {
      optionIndex: prevOptionIndex,
      questionId: prevId,
      stage: prevStage,
    } = lastAnswer;

    let revertedUndertoneScores = undertoneScores;
    let revertedSeasonScores = seasonScores;
    let revertedSubSeasonScores = subSeasonScores;
    let revertedOliveAnswers = oliveAnswersPositive;

    if (prevStage === "Undertone" && lastAnswer.undertoneScoreEffect) {
      revertedUndertoneScores = modifyUndertoneScores(
        undertoneScores,
        lastAnswer.undertoneScoreEffect,
        "subtract"
      );
      if (
        (prevId === 4 || prevId === 7) &&
        (lastAnswer.undertoneScoreEffect?.olive ?? 0) > 0
      ) {
        revertedOliveAnswers = new Set(oliveAnswersPositive);
        revertedOliveAnswers.delete(prevId);
      }
    } else if (prevStage === "Season" && lastAnswer.seasonScoreEffect) {
      revertedSeasonScores = modifySeasonScores(
        seasonScores,
        lastAnswer.seasonScoreEffect,
        "subtract"
      );
    } else if (prevStage === "SubSeason" && lastAnswer.subSeasonScoreEffect) {
      revertedSubSeasonScores = modifySubSeasonScores(
        subSeasonScores,
        lastAnswer.subSeasonScoreEffect,
        "subtract"
      );
    }

    setUndertoneScores(revertedUndertoneScores);
    setSeasonScores(revertedSeasonScores);
    setSubSeasonScores(revertedSubSeasonScores);
    setOliveAnswersPositive(revertedOliveAnswers);

    const revertedUndertone = calculateUndertone(
      revertedUndertoneScores,
      revertedOliveAnswers
    );
    setUndertoneFinal(revertedUndertone);

    let revertedSeason: Season = null;
    if (
      prevStage === "Season" ||
      prevStage === "SubSeason" ||
      currentStage === "Result"
    ) {
      revertedSeason = calculateSeason(revertedSeasonScores, revertedUndertone);
      setSeasonDetermined(revertedSeason);
    } else {
      setSeasonDetermined(null);
    }

    if (prevStage === "SubSeason" || currentStage === "Result") {
      const revertedSubSeason = calculateSubSeason(
        revertedSeason,
        revertedSubSeasonScores
      );
      setSubSeasonDetermined(revertedSubSeason);
    } else {
      setSubSeasonDetermined(null);
    }

    const updatedHistory = answerHistory.slice(0, -1);
    setAnswerHistory(updatedHistory);

    setCurrentStage(prevStage);

    const tempPrevStage = prevStage;
    const tempSeasonDet = revertedSeason;
    let tempTier2Vis = false;

    const getQuestionsForPrevStage = (): QuizQuestion[] => {
      switch (tempPrevStage) {
        case "Undertone": {
          const shouldShowTier2 = checkTier2Visibility(revertedUndertoneScores);
          tempTier2Vis = shouldShowTier2;
          return undertoneQuestions.filter(
            (q) => q.tier === 1 || (q.tier === 2 && shouldShowTier2)
          );
        }
        case "Season":
          return seasonQuestions;
        case "SubSeason":
          return subSeasonQuestions.filter(
            (q) => !tempSeasonDet || q.relevantSeasons?.includes(tempSeasonDet)
          );
        default:
          return [];
      }
    };

    const previousStageQuestions = getQuestionsForPrevStage();
    let targetIndex = previousStageQuestions.findIndex((q) => q.id === prevId);
    if (targetIndex < 0) targetIndex = 0;
    setCurrentQuestionIndex(targetIndex);

    setSelectedOptionIndex(prevOptionIndex);
    const question = previousStageQuestions[targetIndex];
    if (question && question.options[prevOptionIndex]?.swatches) {
      const swatches = question.options[prevOptionIndex].swatches;
      if (!swatches) {
        setFrameColor("#FFFFFF");
        setSplitPosition(50);
        return;
      }
      setFrameColor(
        swatches.length === 1 ? swatches[0].hex : swatches.map((s) => s.hex)
      );
      if (swatches.length !== 2) {
        setSplitPosition(50);
      }
    } else {
      setFrameColor("#FFFFFF");
      setSplitPosition(50);
    }

    if (currentStage === "Result" && prevStage !== "Result") {
      setResultSingleColorView(null);
      setViewedSubSeasonName(null);
    }

    // Set tier2Visible state based on the snapshot taken during question filtering
    setTier2Visible(tempTier2Vis);
  }, [
    answerHistory,
    undertoneScores,
    seasonScores,
    subSeasonScores,
    oliveAnswersPositive,
    currentStage,
    checkTier2Visibility,
  ]);

  const handleViewedSubSeasonChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newName = event.target.value;
      setViewedSubSeasonName(newName);
      setResultSingleColorView(null);
    },
    []
  );

  return (
    <>
      <Head>
        <title>Interactive Skin Tone & Season Visualizer</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          content="Visually determine your skin undertone and color season with interactive background previews and manual navigation."
          name="description"
        />
      </Head>
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 p-2 font-sans md:p-4 sm:p-3">
        <div className="relative w-full max-w-5xl rounded-xl bg-white p-3 shadow-xl md:p-6 sm:p-4">
          {!isSegmenterReady && !isProcessing && !imageUploaded && (
            <div className="py-8 text-center">
              <div className="animate-pulse text-base text-indigo-600 md:text-lg sm:text-lg">
                Loading AI Model... Please Wait.
              </div>
            </div>
          )}

          {isSegmenterReady && !imageOriginal && !isProcessing && (
            <div className="px-2 py-4 text-center">
              <h2 className="mb-2 text-base font-semibold text-gray-700 sm:text-lg">
                Upload Your Photo
              </h2>
              <div className="mb-3 mx-auto max-w-md space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-2 text-left text-xs text-gray-600 sm:p-3 sm:text-sm">
                <p className="font-semibold">Photo Tips:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  <li>Natural daylight (no direct sun).</li>
                  <li>Clean face, no makeup.</li>
                  <li>Hair pulled back.</li>
                  <li>Neutral top (white/grey/black) or bare shoulders.</li>
                  <li>Chest-up, looking straight, neutral expression.</li>
                </ul>
              </div>
              <label
                className="inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow transition duration-200 hover:bg-indigo-700 hover:shadow-md sm:px-5 sm:py-2 sm:text-base"
                htmlFor="imageUpload"
              >
                Choose Photo
              </label>
              <input
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
                disabled={isProcessing || !isSegmenterReady}
                id="imageUpload"
                onChange={handleImageUpload}
                ref={fileInputRef}
                type="file"
              />
              <p className="mt-2 text-xs text-gray-400">
                Image processed locally in your browser.
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-b-2 border-indigo-600 md:h-6 md:w-6 sm:h-6 sm:w-6"></div>
              <p className="text-sm text-indigo-600 md:text-base sm:text-base">
                Analyzing Image...
              </p>
            </div>
          )}

          {imageOriginal && !isProcessing && (
            <>
              {currentStage !== "Result" && (
                <div className="w-full text-center mb-3 mt-1">
                  <div className="flex justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                    <span
                      className={
                        currentStage === "Undertone"
                          ? "font-semibold text-[#6B4F41]"
                          : "text-gray-400"
                      }
                    >
                      Undertone
                    </span>
                    <span
                      className={
                        currentStage === "Season"
                          ? "font-semibold text-[#6B4F41]"
                          : "text-gray-400"
                      }
                    >
                      Season
                    </span>
                    <span
                      className={
                        currentStage === "SubSeason"
                          ? "font-semibold text-[#6B4F41]"
                          : "text-gray-400"
                      }
                    >
                      Sub-season
                    </span>
                  </div>
                  <div className="flex justify-center items-center gap-3 sm:gap-4 mt-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        currentStage === "Undertone"
                          ? "bg-[#6B4F41]"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`h-1.5 w-6 sm:w-8 rounded-full ${
                        currentStage === "Season"
                          ? "bg-gray-400"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        currentStage === "Season"
                          ? "bg-[#6B4F41]"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`h-1.5 w-6 sm:w-8 rounded-full ${
                        currentStage === "SubSeason"
                          ? "bg-gray-400"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        currentStage === "SubSeason"
                          ? "bg-[#6B4F41]"
                          : "bg-gray-300"
                      }`}
                    ></span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 lg:flex-row lg:gap-4 md:gap-3">
                <div className="flex flex-col items-center lg:w-1/2 lg:sticky top-4 self-start w-full lg:max-w-[45%]">
                  <div
                    className={`relative mx-auto aspect-[3/4] w-full max-w-[350px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-lg sm:max-w-[400px] mb-2`}
                  >
                    <canvas
                      className="absolute left-0 top-0 block h-full w-full object-contain"
                      ref={canvasRef}
                      style={{
                        visibility: segmentationMask ? "visible" : "hidden",
                      }}
                    />
                    {!segmentationMask && imageUploaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <p className="text-xs text-gray-400 sm:text-sm">
                          Processing...
                        </p>
                      </div>
                    )}
                  </div>

                  {currentStage === "Result" && (
                    <div className="relative w-full max-w-[240px] sm:max-w-xs mx-auto mb-2 z-10">
                      <label className="sr-only" htmlFor="subSeasonSelect">
                        Explore Palettes:
                      </label>
                      <select
                        className="w-full rounded-full border border-gray-300 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs shadow-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none text-center"
                        id="subSeasonSelect"
                        onChange={handleViewedSubSeasonChange}
                        value={viewedSubSeasonName ?? ""}
                      >
                        {allSubSeasonNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {Array.isArray(frameColor) &&
                    frameColor.length === 2 &&
                    currentStage !== "Result" && (
                      <div className="w-full max-w-[350px] px-2 mt-1 mb-1 sm:max-w-[400px] sm:px-4">
                        <label className="sr-only" htmlFor="colorSplitSlider">
                          Adjust Color Split
                        </label>
                        <input
                          aria-label="Adjust color split percentage"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 range-sm accent-indigo-500"
                          id="colorSplitSlider"
                          max="100"
                          min="0"
                          onChange={(e) =>
                            setSplitPosition(parseInt(e.target.value, 10))
                          }
                          type="range"
                          value={splitPosition}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5 sm:text-xs">
                          <span>◀ Left</span>
                          <span>Right ▶</span>
                        </div>
                      </div>
                    )}
                </div>

                <div className="w-full lg:w-1/2">
                  {currentStage === "Result" ? (
                    <div className="rounded-xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-3 text-center shadow-md sm:p-4">
                      <h2 className="mb-2 text-base font-semibold text-gray-800 sm:text-lg">
                        Your Analysis Result
                      </h2>
                      <div className="mb-3 space-y-0.5 border-b border-gray-200 pb-2">
                        <p className="text-xs text-gray-600 sm:text-sm">
                          Determined Undertone:{" "}
                          <span className="font-semibold text-gray-800">
                            {getUndertoneEmoji(undertoneFinal)}{" "}
                            {undertoneFinal ?? "N/A"}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 sm:text-sm">
                          Determined Season:{" "}
                          <span className="font-semibold text-gray-800">
                            {getSeasonEmoji(seasonDetermined)}{" "}
                            {seasonDetermined ?? "N/A"}
                          </span>
                        </p>
                        <p className="text-xs font-semibold text-gray-500 sm:text-sm">
                          Initially Matched: {subSeasonDetermined ?? "N/A"}
                        </p>
                      </div>

                      {viewedPalette ? (
                        <div className="mt-2">
                          <div className="text-center mb-2">
                            <h3 className="text-xs font-semibold text-gray-600 sm:text-sm">
                              {viewedPalette.name} Palette
                            </h3>
                          </div>
                          <div className="mx-auto grid max-w-[260px] grid-cols-6 gap-1 sm:max-w-xs sm:grid-cols-8 sm:gap-1.5">
                            <button
                              aria-label="Reset background to full palette"
                              className={`col-span-2 sm:col-span-4
                                           relative /* Needed for absolute positioning of overlay */
                                           p-0 /* Remove padding, inner div will fill */
                                           w-full rounded-md border border-gray-300/50
                                           cursor-pointer transition-all duration-200
                                           overflow-hidden /* Ensure inner div rounding is visible */
                                           focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-cyan-400
                                           ${
                                             resultSingleColorView === null
                                               ? "ring-2 ring-offset-1 ring-cyan-500 shadow-md scale-105"
                                               : "hover:scale-105 hover:shadow-sm"
                                           }`}
                              onClick={() => setResultSingleColorView(null)}
                              title="Reset background to full palette"
                            >
                              <div
                                className="h-full w-full rounded-md"
                                style={{ background: viewedPaletteGradient }}
                              />

                              {resultSingleColorView === null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                                  <svg
                                    className="h-4 w-4 text-white sm:h-5 sm:w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M5 13l4 4L19 7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                            {viewedPalette.palette.map((colorString, index) => {
                              const hex = colorString;
                              if (!hex) return null;
                              const isSelected = resultSingleColorView === hex;
                              const name = hex;

                              return (
                                <div
                                  aria-label={`Preview background ${name}`}
                                  className={`relative aspect-square w-full rounded-md border border-gray-300/50 cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-cyan-400 ${
                                    isSelected
                                      ? "ring-2 ring-offset-1 ring-cyan-500 shadow-md scale-105"
                                      : "hover:shadow-sm"
                                  }`}
                                  key={`${viewedPalette.name}-${index}-${hex}`}
                                  onClick={() => setResultSingleColorView(hex)}
                                  role="button"
                                  style={{ backgroundColor: hex }}
                                  tabIndex={0}
                                  title={`Preview ${name}`}
                                >
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                                      <svg
                                        className="h-3 w-3 text-white sm:h-4 sm:w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M5 13l4 4L19 7"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-1.5 text-[10px] text-gray-500 sm:text-xs text-center">
                            Click color square or palette preview to change
                            background.
                          </p>
                        </div>
                      ) : (
                        viewedSubSeasonName && (
                          <p className="mt-3 text-sm text-red-600">
                            Palette data missing for &quot;{viewedSubSeasonName}
                            &quot;.
                          </p>
                        )
                      )}
                      <div className="mt-3 mx-auto max-w-md space-y-1 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-gray-600">
                        <strong>Disclaimer:</strong> This tool provides a
                        suggestion. Results vary. Use as a starting point.
                      </div>
                      <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
                        <button
                          className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition duration-200 hover:shadow-lg hover:opacity-90 sm:px-4 sm:py-2 sm:text-base"
                          onClick={restartQuiz}
                          type="button"
                        >
                          Start Over
                        </button>
                      </div>
                    </div>
                  ) : currentQuestion ? (
                    <div className="flex min-h-[250px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm sm:min-h-[300px] sm:p-3">
                      <div>
                        <p className="mb-1 text-center text-sm font-semibold leading-tight text-gray-800 sm:text-base">
                          <span className="font-bold text-indigo-600">
                            Q{currentQuestionIndex + 1}:
                          </span>{" "}
                          {currentQuestion.questionText}
                        </p>
                        {currentQuestion.guidanceText && (
                          <p className="mb-2 px-1 text-center text-[11px] italic text-gray-500 sm:mb-3 sm:text-xs">
                            {currentQuestion.guidanceText}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {currentQuestion.options.map((option, index) => (
                            <button
                              className={`flex w-full flex-col items-start gap-1 rounded-lg border p-2 text-left text-xs font-medium transition-all duration-150 ease-in-out hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 sm:items-center sm:gap-2 sm:p-2.5 ${
                                selectedOptionIndex === index
                                  ? "border-indigo-400 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300 ring-offset-1 scale-[1.02]"
                                  : "border-gray-200 bg-gray-50 text-gray-700 hover:scale-[1.03]"
                              } ${
                                option.isUnsure
                                  ? "opacity-90 hover:opacity-100"
                                  : ""
                              }`}
                              key={`${currentQuestion.id}-choice-${index}`}
                              onClick={() => handleAnswerSelect(index)}
                              type="button"
                            >
                              {option.swatches && (
                                <div className="mt-0.5 flex flex-shrink-0 space-x-1 sm:mt-0">
                                  {option.swatches.slice(0, 5).map((sw) => (
                                    <div
                                      className="h-4 w-4 rounded-sm border border-gray-300/50 shadow-sm sm:h-5 sm:w-5"
                                      key={sw.hex}
                                      style={{ backgroundColor: sw.hex }}
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex-grow">
                                <span className="text-xs font-semibold leading-tight sm:text-sm">
                                  {option.choiceLabel}{" "}
                                  {option.isUnsure ? " 🤔" : ""}
                                </span>
                                {option.text && (
                                  <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">
                                    {option.text}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent sm:text-sm transition-colors"
                          disabled={answerHistory.length === 0}
                          onClick={handlePrev}
                          type="button"
                        >
                          <svg
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 19l-7-7 7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Prev
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-500 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:text-sm transition-all"
                          disabled={selectedOptionIndex === null}
                          onClick={handleNext}
                          type="button"
                        >
                          Next
                          <svg
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9 5l7 7-7 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-600">
                      Loading Question...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UndertoneQuiz;
