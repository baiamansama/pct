import paletteDataJson from "./color_palette.json";
import { QuizQuestion, ColorInfo } from "./types";

export const paletteData = paletteDataJson as unknown as {
  seasons: { name: string; palette: string[] }[];
};
export const allSubSeasonNames = paletteData.seasons
  .map((p) => p.name)
  .sort((a, b) => a.localeCompare(b));

export const COLORS: { [key: string]: ColorInfo } = {
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
  grey: { hex: "#808080", name: "Grey" },
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

export const seasonQuestions: QuizQuestion[] = [
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

export const subSeasonQuestions: QuizQuestion[] = [
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

export const undertoneQuestions: QuizQuestion[] = [
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
