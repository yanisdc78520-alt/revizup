export type Plan = "free" | "pro";

export const LIMITS = {
  free: {
    generations: 5, // fiches + quiz + affinages, au total
    courses: 3,
    courseChars: 60_000, // ~25 pages de cours
    quizQuestions: 10,
  },
  pro: {
    generationsPer30Days: 500, // garde-fou contre les abus
    courses: 200,
    courseChars: 400_000, // ~150 à 200 pages
    quizQuestions: 20,
  },
} as const;

export const PRO_PRICE_LABEL = "4,99 €";

export function courseLimit(plan: Plan) {
  return plan === "pro" ? LIMITS.pro.courses : LIMITS.free.courses;
}
export function charLimit(plan: Plan) {
  return plan === "pro" ? LIMITS.pro.courseChars : LIMITS.free.courseChars;
}
export function quizLimit(plan: Plan) {
  return plan === "pro" ? LIMITS.pro.quizQuestions : LIMITS.free.quizQuestions;
}
