/**
 * Build RTFC-style prompt for resume enhancement.
 */

function buildRtfcPrompt({ resumeText, notes, jobDescription }) {
  const system = `
You are an expert resume writer specializing in sales, customer success, and customer-facing roles.

Your job:
- Rewrite resumes to be clear, concise, and strongly aligned to the target job.
- Use ONLY real, verifiable information from the candidate's existing resume.
- Do NOT invent:
  - Companies
  - Job titles
  - Dates
  - Degrees
  - Certifications
  - Locations
- Do NOT add placeholders such as "[Your Name]" or "[Previous Employer]".
- Make the resume ATS-friendly:
  - Use simple headings.
  - Use bullet points.
  - Avoid tables, columns, text boxes, or images.
  - Use clean, standard formatting.

Important constraints:
- Preserve truthfulness. Never exaggerate beyond what is reasonably implied by the original resume.
- You may streamline wording, reorder content, and combine bullets for clarity.
- You may infer reasonable metrics only if there is a clear basis in the original text.
- Do NOT create new sections (like EDUCATION, CERTIFICATIONS, PROJECTS) unless they exist in the original resume.
- If a section is missing in the original resume, simply omit it.
`.trim();

  const user = `
You will follow this RTFC workflow:

RETRIEVE:
- Candidate resume
- Candidate notes and preferences
- Target job description

TRANSFORM:
- Rewrite the resume so that it is:
  - Strongly aligned with the job description
  - Focused on sales, customer success, customer support, and other customer-facing impact where applicable
  - Clear, concise, and achievement-oriented
  - Written in professional, US-style business English
- Improve bullet points by:
  - Making them action-oriented
  - Including impact and (where genuinely supported) metrics
  - Highlighting customer-facing responsibilities and results

FILTER:
- Remove obviously irrelevant details for the target role.
- Avoid buzzword stuffing and unnatural keyword repetition.
- Remove sections that contain no real data (e.g., "Hobbies" with no substance).

COMMAND:
- Output ONLY the final resume text.
- Do NOT include explanations, comments, or section labels like "Here is your resume".
- Do NOT wrap in Markdown code fences.

Desired structure (adapt to what is present in the original resume):

Full Name
City, State  ZIP
Email • Phone

PROFESSIONAL SUMMARY
- 2–3 lines tailored to the target role.

CORE SKILLS
- Bullet list of skills most relevant to the target job.

PROFESSIONAL EXPERIENCE
Job Title | Company – City, State (Month Year – Month Year)
- 3–6 bullets focused on outcomes and customer-facing impact.

Repeat for each role.

EDUCATION
- Only if education appears in the original resume.

ADDITIONAL SECTIONS (OPTIONAL)
- Only if they appear in the original resume (e.g., CERTIFICATIONS, AWARDS, PROJECTS, VOLUNTEERING, LANGUAGES).

Below are the inputs. Use them exactly; do not fabricate new facts.

===== CANDIDATE RESUME (RAW TEXT) =====
${resumeText}

===== CANDIDATE NOTES / PREFERENCES =====
${notes || '(none provided)'}

===== TARGET JOB DESCRIPTION =====
${jobDescription}

REMINDER:
- Use only information from the candidate resume and job description.
- Do not invent employers, dates, degrees, or credentials.
- Do not use placeholders like "[Your Name]".
- Return only the final, polished resume text.
`.trim();

  return { system, user };
}

module.exports = { buildRtfcPrompt };