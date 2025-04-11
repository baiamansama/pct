"use client";

import {
  FilesetResolver,
  ImageSegmenter,
  type ImageSegmenterResult,
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
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  paletteData,
  allSubSeasonNames,
  seasonQuestions,
  subSeasonQuestions,
  undertoneQuestions,
} from "./constants";

import {
  canvasPreview,
  toDataUrl,
  calculateSeason,
  calculateSubSeason,
  calculateUndertone,
  getSeasonEmoji,
  getUndertoneEmoji,
  hexToRgb,
  modifySeasonScores,
  modifySubSeasonScores,
  modifyUndertoneScores,
  getGradient,
} from "./utils";

import type {
  AnswerHistoryEntry,
  QuizQuestion,
  SeasonScore,
  SubSeasonScore,
  UndertoneScore,
  QuizStage,
  Season,
  SubSeason,
  Undertone,
} from "./types";

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

  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const aspect = 3 / 4;

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
    return getGradient(viewedPalette);
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
    if (imageOriginal && segmentationMask && canvasRef.current && !isCropping) {
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
    isCropping,
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

    setIsCropping(false);
    setOriginalImageUrl(null);
    setCrop(undefined);
    setCompletedCrop(null);
    imgRef.current = null;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          previewCanvasRef.current.width,
          previewCanvasRef.current.height
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      restartQuiz();

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (!imageUrl) {
          alert("Could not read image data.");
          return;
        }
        setOriginalImageUrl(imageUrl);
        setIsCropping(true);
        setCrop(undefined);
        setCompletedCrop(null);
      };
      reader.onerror = () => {
        alert("Could not read file.");
      };
      reader.readAsDataURL(file);
      if (event.target) event.target.value = "";
    },
    [restartQuiz]
  );

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop({
      ...initialCrop,
      unit: "px",
      x: (initialCrop.x / 100) * width,
      y: (initialCrop.y / 100) * height,
      width: (initialCrop.width / 100) * width,
      height: (initialCrop.height / 100) * height,
    });
  }

  const drawPreview = useCallback(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }
    canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
  }, [completedCrop]);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      debounceTimeout.current = setTimeout(() => {
        drawPreview();
        debounceTimeout.current = null;
      }, 100);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [completedCrop, drawPreview]);

  const handleCropConfirm = useCallback(async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      console.error("Missing image, canvas ref, or crop data");
      alert("Cropping data missing. Please try adjusting the crop again.");
      return;
    }
    if (!imageSegmenter) {
      if (!isSegmenterReady)
        alert("AI Model not ready. Please wait or refresh.");
      return;
    }

    setIsProcessing(true);
    setIsCropping(false);

    try {
      await canvasPreview(image, previewCanvas, completedCrop);
      const croppedImageDataUrl = await toDataUrl(previewCanvas);

      if (!croppedImageDataUrl) {
        throw new Error("Failed to generate cropped image data URL.");
      }

      const img = new Image();
      img.onload = async () => {
        setImageOriginal(img);
        try {
          const result = await imageSegmenter.segment(img);
          setSegmentationMask(result);
          setFrameColor("#FFFFFF");
          setSplitPosition(50);
        } catch (error) {
          console.error("Segmentation error:", error);
          alert(
            `Failed to process cropped image. Error: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          restartQuiz();
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        alert("Failed to load cropped image data.");
        setIsProcessing(false);
        restartQuiz();
      };
      img.src = croppedImageDataUrl;
    } catch (e) {
      console.error("Error during cropping confirmation:", e);
      alert(
        `Image cropping failed: ${e instanceof Error ? e.message : String(e)}`
      );
      setIsProcessing(false);
      restartQuiz();
    }
  }, [completedCrop, imageSegmenter, isSegmenterReady, restartQuiz]);

  const handleCropCancel = useCallback(() => {
    restartQuiz();
  }, [restartQuiz]);

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
          {isCropping && originalImageUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="relative h-[85vh] w-full max-w-xl rounded-lg bg-white p-4 shadow-2xl flex flex-col">
                <h3 className="text-lg font-semibold text-center mb-2 text-gray-700">
                  Crop Your Photo
                </h3>
                <p className="text-xs text-center text-gray-500 mb-3">
                  Adjust the box to focus on your face and upper chest.
                </p>
                <div className="relative flex-grow mb-4 overflow-hidden bg-gray-100 rounded">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={originalImageUrl}
                      style={{ transform: `scale(1)`, objectFit: "contain" }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    display: "none",
                    objectFit: "contain",
                    width: completedCrop?.width ?? 0,
                    height: completedCrop?.height ?? 0,
                  }}
                />
                <div className="flex justify-center gap-4 mt-2">
                  <button
                    onClick={handleCropCancel}
                    className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropConfirm}
                    disabled={!completedCrop?.width || !completedCrop?.height}
                    className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Confirm Crop
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isCropping &&
            !isSegmenterReady &&
            !imageOriginal &&
            !isProcessing && (
              <div className="py-8 text-center">
                <div className="animate-pulse text-base text-indigo-600 md:text-lg sm:text-lg">
                  Loading AI Model... Please Wait.
                </div>
              </div>
            )}

          {!isCropping &&
            isSegmenterReady &&
            !imageOriginal &&
            !isProcessing && (
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
                {isCropping ? "Preparing Cropper..." : "Analyzing Image..."}
              </p>
            </div>
          )}

          {!isCropping && imageOriginal && !isProcessing && (
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
                <div className="flex flex-col lg:w-1/2 lg:sticky top-4 self-start w-full lg:max-w-[45%]">
                  <div
                    className={`relative w-full max-w-[280px] mx-auto aspect-[3/4] overflow-hidden rounded-lg border-0 bg-gray-50 shadow-md sm:max-w-[320px] mb-1`} // Ensure w-full, removed border
                  >
                    <canvas
                      className="absolute inset-0 block h-full w-full object-cover" // Ensure canvas stretches fully
                      ref={canvasRef}
                      style={{
                        visibility: segmentationMask ? "visible" : "hidden",
                      }}
                    />
                    {!segmentationMask && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <p className="text-xs text-gray-400 sm:text-sm">
                          Loading Preview...
                        </p>
                      </div>
                    )}
                  </div>
                  {Array.isArray(frameColor) &&
                    frameColor.length === 2 &&
                    currentStage !== "Result" && (
                      <div className="w-full max-w-[280px] mx-auto px-1 mt-0.5 mb-0.5 sm:max-w-[320px] sm:px-2">
                        <label htmlFor="colorSplitSlider" className="sr-only">
                          Adjust Color Split
                        </label>
                        <input
                          id="colorSplitSlider"
                          type="range"
                          min="0"
                          max="100"
                          value={splitPosition}
                          onChange={(e) =>
                            setSplitPosition(parseInt(e.target.value, 10))
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 range-sm accent-indigo-500"
                          aria-label="Adjust color split percentage"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 mt-0.5 sm:text-[10px]">
                          <span>◀ Left</span>
                          <span>Right ▶</span>
                        </div>
                      </div>
                    )}
                </div>
                <div className="w-full lg:w-1/2">
                  {currentStage === "Result" ? (
                    <div className="rounded-xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-3 text-center shadow-md sm:p-4">
                      <div className="mb-3 w-full text-center">
                        <h2 className="text-base font-semibold text-gray-800 sm:text-lg mb-3">
                          Your Analysis Results
                        </h2>

                        <div className="flex">
                          <div className="flex-1 text-left space-y-0.5">
                            <p className="text-xs text-gray-600 sm:text-sm">
                              Undertone:{" "}
                              <span className="font-semibold text-gray-800">
                                {getUndertoneEmoji(undertoneFinal)}{" "}
                                {undertoneFinal ?? "N/A"}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600 sm:text-sm">
                              Season:{" "}
                              <span className="font-semibold text-gray-800">
                                {getSeasonEmoji(seasonDetermined)}{" "}
                                {seasonDetermined ?? "N/A"}
                              </span>
                            </p>
                            <p className="text-xs font-semibold text-gray-500 sm:text-sm">
                              Subseason: {subSeasonDetermined ?? "N/A"}
                            </p>
                          </div>

                          <div className="flex flex-col justify-center gap-2 ml-2">
                            <button
                              type="button"
                              onClick={restartQuiz}
                              className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                            >
                              Start Over
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  "Compare 2 Seasons functionality coming soon!"
                                )
                              }
                              className="rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-1 text-xs font-semibold text-white shadow-sm transition duration-200 hover:from-indigo-600 hover:to-purple-600 hover:shadow-md focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                            >
                              Compare Seasons
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-200 pt-3"></div>
                      </div>

                      {viewedPalette ? (
                        <div className="mt-2">
                          <div className="relative w-full max-w-[200px] sm:max-w-[220px] mx-auto mb-3 z-10">
                            <label
                              htmlFor="subSeasonSelect"
                              className="sr-only"
                            >
                              Explore Palettes:
                            </label>
                            <select
                              id="subSeasonSelect"
                              value={viewedSubSeasonName ?? ""}
                              onChange={handleViewedSubSeasonChange}
                              className="w-full appearance-none rounded-full border border-gray-300 bg-white px-4 py-1.5 text-center text-xs font-semibold text-indigo-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            >
                              {allSubSeasonNames.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-700">
                              <svg
                                className="h-4 w-4 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>

                          <div className="mx-auto w-full max-w-[300px] grid grid-cols-6 gap-0.5 sm:max-w-[340px] sm:grid-cols-8 sm:gap-1">
                            <button
                              onClick={() => setResultSingleColorView(null)}
                              className={`col-span-2 sm:col-span-4 relative p-0 w-full rounded-md border border-gray-300/50 cursor-pointer transition-all duration-200 overflow-hidden focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-cyan-400 ${
                                resultSingleColorView === null
                                  ? "ring-2 ring-offset-1 ring-cyan-500 shadow-md scale-105"
                                  : "hover:scale-105 hover:shadow-sm"
                              }`}
                              title="Reset background to full palette"
                              aria-label="Reset background to full palette"
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
                                  key={`${viewedPalette.name}-${index}-${hex}`}
                                  onClick={() => setResultSingleColorView(hex)}
                                  className={`relative aspect-square w-full rounded-md border border-gray-300/50 cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-cyan-400 ${
                                    isSelected
                                      ? "ring-2 ring-offset-1 ring-cyan-500 shadow-md scale-105"
                                      : "hover:shadow-sm"
                                  }`}
                                  style={{ backgroundColor: hex }}
                                  role="button"
                                  tabIndex={0}
                                  title={`Preview ${name}`}
                                  aria-label={`Preview background ${name}`}
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
                          <p className="mt-1 text-[9px] text-gray-500 sm:text-[10px] text-center">
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
                              key={`${currentQuestion.id}-choice-${index}`}
                              type="button"
                              onClick={() => handleAnswerSelect(index)}
                              className={`flex w-full flex-col items-start gap-1 rounded-lg border p-2 text-left text-xs font-medium transition-all duration-150 ease-in-out hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:ring-offset-1 sm:items-center sm:gap-2 sm:p-2.5 ${
                                selectedOptionIndex === index
                                  ? "border-indigo-400 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300 ring-offset-1 scale-[1.02]"
                                  : "border-gray-200 bg-gray-50 text-gray-700 hover:scale-[1.03]"
                              } ${
                                option.isUnsure
                                  ? "opacity-90 hover:opacity-100"
                                  : ""
                              }`}
                            >
                              {option.swatches && (
                                <div className="mt-0.5 flex flex-shrink-0 space-x-1 sm:mt-0">
                                  {option.swatches.slice(0, 5).map((sw) => (
                                    <div
                                      key={sw.hex}
                                      className="h-4 w-4 rounded-sm border border-gray-300/50 shadow-sm sm:h-5 sm:w-5"
                                      style={{ backgroundColor: sw.hex }}
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex-grow">
                                <span className="text-xs font-semibold leading-tight sm:text-sm">
                                  {option.choiceLabel}{" "}
                                  {option.isUnsure ? "🤔" : ""}
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
                          type="button"
                          onClick={handlePrev}
                          disabled={answerHistory.length === 0}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent sm:text-sm transition-colors"
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
                          type="button"
                          onClick={handleNext}
                          disabled={selectedOptionIndex === null}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-500 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:text-sm transition-all"
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
