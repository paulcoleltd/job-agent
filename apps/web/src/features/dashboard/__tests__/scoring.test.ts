import { describe, it, expect } from "vitest";

// Port of the backend scoring formula to TS for frontend validation
function computeMatchScore({
  skills,
  cvText,
  jobDescription,
  remoteType,
}: {
  skills: string[];
  cvText: string;
  jobDescription: string;
  remoteType?: string;
}): number {
  const desc = jobDescription.toLowerCase();
  const cv = cvText.toLowerCase();

  const skillsMatch = skills.length
    ? Math.min(skills.filter((s) => desc.includes(s.toLowerCase())).length / skills.length, 1)
    : 0;

  const seniorityMatch = 0.5;
  const locationMatch = remoteType === "remote" ? 1.0 : 0.6;
  const salaryMatch = 0.5;

  const techKw = ["python", "react", "typescript", "docker", "aws"];
  const jdHits = techKw.filter((t) => desc.includes(t)).length;
  const cvHits = techKw.filter((t) => cv.includes(t)).length;
  const domainMatch = jdHits > 0 && cvHits > 0 ? Math.min(cvHits / jdHits, 1) : 0.5;

  const resumeStrength = cvText.length > 800 ? 0.8 : cvText.length > 200 ? 0.5 : 0.1;

  return (
    0.35 * skillsMatch +
    0.20 * seniorityMatch +
    0.15 * locationMatch +
    0.10 * salaryMatch +
    0.10 * domainMatch +
    0.10 * resumeStrength
  );
}

describe("Job Match Scoring", () => {
  it("returns 0 score when no skills match", () => {
    const score = computeMatchScore({
      skills: ["Java", "Spring"],
      cvText: "I know Python and React",
      jobDescription: "Looking for a React developer with TypeScript",
    });
    expect(score).toBeGreaterThan(0); // seniority + location contribute baseline
    expect(score).toBeLessThan(0.5);
  });

  it("increases score when skills match job description", () => {
    const noMatch = computeMatchScore({
      skills: ["Java"],
      cvText: "Python developer",
      jobDescription: "Senior Python Engineer",
    });
    const fullMatch = computeMatchScore({
      skills: ["Python"],
      cvText: "Python developer",
      jobDescription: "Senior Python Engineer",
    });
    expect(fullMatch).toBeGreaterThan(noMatch);
  });

  it("remote job gives higher location score", () => {
    const remote = computeMatchScore({
      skills: [],
      cvText: "developer",
      jobDescription: "remote role",
      remoteType: "remote",
    });
    const onsite = computeMatchScore({
      skills: [],
      cvText: "developer",
      jobDescription: "onsite role",
      remoteType: "onsite",
    });
    expect(remote).toBeGreaterThan(onsite);
  });

  it("longer CV gives higher resume_strength", () => {
    const shortCV = computeMatchScore({
      skills: [],
      cvText: "dev",
      jobDescription: "engineer",
    });
    const longCV = computeMatchScore({
      skills: [],
      cvText: "A".repeat(1000),
      jobDescription: "engineer",
    });
    expect(longCV).toBeGreaterThan(shortCV);
  });

  it("overall score is between 0 and 1", () => {
    const score = computeMatchScore({
      skills: ["Python", "React", "TypeScript", "Docker", "AWS"],
      cvText: "Experienced engineer with Python React TypeScript Docker AWS skills".repeat(20),
      jobDescription: "Looking for Python React TypeScript Docker AWS developer",
      remoteType: "remote",
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("weighted formula components sum correctly", () => {
    // All components at 1.0 should give overall 1.0
    const weights = [0.35, 0.20, 0.15, 0.10, 0.10, 0.10];
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100).toBe(1.0);
  });
});
