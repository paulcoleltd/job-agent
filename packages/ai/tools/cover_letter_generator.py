"""
cover_letter_generator — generates a tailored cover letter using Claude.
Returns plain text cover letter.
"""

SYSTEM_PROMPT = """You are an expert career coach. Write a concise, professional cover letter (3 paragraphs, under 300 words).
- Paragraph 1: Express interest and highlight the strongest match to the role.
- Paragraph 2: Give one specific example of relevant experience.
- Paragraph 3: Short closing with call to action.
Do not include headers, dates, or address blocks. Return plain text only."""


async def generate_cover_letter(
    job_title: str,
    company: str,
    job_description: str,
    cv_text: str,
    api_key: str,
) -> str:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": (
                    f"Job: {job_title} at {company}\n\n"
                    f"Job Description:\n{job_description[:1500]}\n\n"
                    f"My CV:\n{cv_text[:2000]}"
                ),
            }],
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f"cover_letter_generator error: {e}")
        return (
            f"Dear Hiring Manager,\n\n"
            f"I am writing to express my interest in the {job_title} position at {company}. "
            f"Based on my experience and skills, I believe I would be a strong fit for this role.\n\n"
            f"I look forward to discussing how I can contribute to your team.\n\n"
            f"Sincerely"
        )
