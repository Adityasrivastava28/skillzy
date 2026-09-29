export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const PARTS = [
  { id: "morn", label: "Morning" },
  { id: "aft", label: "Afternoon" },
  { id: "eve", label: "Evening" },
] as const;

export const GOALS = [
  { id: "portfolio", label: "Build a portfolio" },
  { id: "hackathon", label: "Hackathon / project" },
  { id: "placements", label: "Placements & jobs" },
  { id: "hobby", label: "Hobby & fun" },
  { id: "freelancing", label: "Freelancing" },
  { id: "career-switch", label: "Career switch" },
] as const;

export const SUGGESTED_SKILLS = [
  "Python", "DSA", "JavaScript", "React", "UI/UX Design", "Figma", "Prototyping",
  "Guitar", "Music Theory", "Fitness", "Nutrition", "Public Speaking", "Spanish",
  "Photography", "Video Editing", "Data Analysis", "Excel", "Writing", "Marketing",
];
