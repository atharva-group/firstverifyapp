"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Answer = {
  label: string;
  percentage: number;
};

type QuestionData = {
  question: string;
  answers: Answer[];
};

type AnalysisData = {
  questions: QuestionData[];
};

interface AnalysisBarsProps {
  data: AnalysisData;
}

const colorPalette = [
  "#7D9178", // muted green-gray
  "#E8E8E8", // light gray
  "#C9A889", // warm tan
];

// Text scramble/typewriter effect
const TypingText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Speed of typing

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
};

export default function AnalysisBars({ data }: AnalysisBarsProps) {
  if (!data || !data.questions) return null;

  return (
    <TooltipProvider delayDuration={10}>
      <div className="w-full space-y-8 mt-6">
        {data.questions.map((q, idx) => (
          <motion.div
            key={idx}
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2 h-5">
              <TypingText text={q.question} />
            </h3>

            {/* Horizontal Stacked Bar */}
            <div className="w-full h-8 flex rounded-lg overflow-hidden shadow-sm bg-gray-100">
              {q.answers.map((ans, ansIdx) => (
                <Tooltip key={ansIdx}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ans.percentage}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.5 + (idx * 0.1), // Start after text appears
                        ease: "easeOut"
                      }}
                      style={{
                        backgroundColor: colorPalette[ansIdx % colorPalette.length],
                      }}
                      className="h-full transition-opacity duration-300 hover:opacity-80 cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {ans.label}: {ans.percentage}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Legend */}
            <motion.div
              className="flex flex-wrap gap-4 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + (idx * 0.1) }}
            >
              {q.answers.map((ans, ansIdx) => (
                <div key={ansIdx} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: colorPalette[ansIdx % colorPalette.length] }}
                  />
                  <span className="text-xs text-gray-500">
                    {ans.label} ({ans.percentage}%)
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
}
