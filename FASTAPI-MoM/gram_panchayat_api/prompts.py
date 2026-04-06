from textwrap import dedent


CATEGORIES = [
    "Issue / Grievance",
    "Review / Status",
    "Planning / Preparatory",
    "Information / Intimation",
    "Multi-Topic / Miscellaneous",
    "Other / Can't Categorize",
]

DEFAULT_CATEGORY = "Other / Can't Categorize"


def build_categorization_prompt(agenda_subject: str, mom_discussion: str) -> str:
    """Build the prompt for LLM-based categorization."""
    return dedent(
        f"""
        You are a classifier for Gram Panchayat meeting agenda items.
        Classify the following agenda item into exactly one of these categories:
        1. Issue / Grievance — complaints, problems raised by citizens or members
        2. Review / Status — progress updates, status checks on ongoing work or schemes
        3. Planning / Preparatory — future plans, preparation for events or works
        4. Information / Intimation — sharing of circulars, updates, or announcements
        5. Multi-Topic / Miscellaneous — agenda item covers multiple unrelated subjects
        6. Other / Can't Categorize — does not fit any of the above

        Agenda Subject: {agenda_subject}
        Minutes Discussion: {mom_discussion}

        Respond in exactly this JSON format (no extra text, no markdown):
        {{
          "category": "<one of the six category names above>",
          "reason": "<one sentence explaining why>"
        }}
        """
    ).strip()


FEEDBACK_SYSTEM_PROMPT = dedent(
    """
    You are an AI assistant providing real-time, constructive feedback on meeting minutes
    for a specific Gram Panchayat. Your goal is to help the Panchayat secretary and members
    improve the clarity, completeness, and actionability of the minutes, without changing
    the decisions that were actually taken.

    Always:
    - Be concise and practical.
    - Focus on how the minutes are written, not on judging the decisions.
    - Suggest concrete wording or structure improvements where helpful.
    - Pay special attention to whether actions, responsible persons, and timelines are clear.
    - Adapt your feedback to the category of the agenda item (grievance, review, planning, etc.).

    When giving feedback, think about:
    - Clarity: Are the decisions and discussions clearly described?
    - Specificity: Are locations, people, schemes, and amounts clearly named?
    - Actions: Are follow-up actions, responsible persons, and deadlines documented?
    - Compliance: Does the wording look appropriate for official government records?
    - Structure: Are there long, confusing sentences that can be made crisper?

    Your output MUST be a bulleted list, one suggestion per line.
    Do not restate the entire minutes; focus only on improvements.
    """
).strip()


def build_feedback_prompt(
    agenda_subject: str,
    mom_discussion: str,
    category: str,
) -> str:
    """Build the prompt for LLM-based feedback generation (two-step pipeline)."""
    return dedent(
        f"""
        {FEEDBACK_SYSTEM_PROMPT}

        User Input:
        Agenda Item: {agenda_subject}
        Category: {category}
        Minutes Text: {mom_discussion}

        Your Feedback (bulleted list, each on a new line):
        """
    ).strip()


def build_single_call_prompt(agenda_subject: str, mom_discussion: str, feedback_language: str = 'en') -> str:
    """
    Build the prompt for a single LLM call that categorizes and generates
    fill-in-the-blank feedback with per-item span references to the original text.
    """
    if feedback_language == 'kn':
        lang_instruction = (
            "IMPORTANT: Write ALL feedback suggestions in Kannada (ಕನ್ನಡ). "
            "Use formal, official Kannada appropriate for government Gram Panchayat meeting minutes. "
            "Hint text inside [ ] blanks must also be in Kannada."
        )
    else:
        lang_instruction = (
            "Write all feedback suggestions in English."
        )

    categories_text = "\n".join(
        [
            "1. Issue / Grievance — complaints, problems raised by citizens or members",
            "2. Review / Status — progress updates, status checks on ongoing work or schemes",
            "3. Planning / Preparatory — future plans, preparation for events or works",
            "4. Information / Intimation — sharing of circulars, updates, or announcements",
            "5. Multi-Topic / Miscellaneous — agenda item covers multiple unrelated subjects",
            "6. Other / Can't Categorize — does not fit any of the above",
        ]
    )

    return dedent(
        f"""
        You are an AI assistant providing real-time, constructive feedback on meeting minutes
        for a specific Gram Panchayat. Your goal is to help the Panchayat secretary improve
        the clarity, completeness, and actionability of the minutes — without changing the
        decisions that were actually taken.

        {lang_instruction}

        TASK:
        1) Classify the agenda item into exactly one of these categories:
        {categories_text}
        2) Provide one short sentence explaining the categorization.
        3) Generate 3 to 6 feedback items. Each item has:
           - "span": a short phrase (3–8 words) copied EXACTLY from the minutes text that is
             vague, incomplete, or needs improvement. Set to null if the gap is entirely absent
             from the text.
           - "suggestion": a reconstructed sentence with [ ] blanks, following all rules below.

        HOW TO WRITE THE SUGGESTION (fill-in-the-blank reconstruction):
        Read the full minutes text before deciding how to handle each span.
        For each span, choose between two modes:

        REPLACE MODE — if the sentence containing the span is standalone and vague,
        with no elaboration on that topic anywhere in the subsequent text:
        - Restructure the sentence into a new formal MoM sentence with [ ] blanks.
        - This reconstructed sentence is meant to replace the original in the minutes.

        APPEND MODE — if the sentence containing the span is an overview or introductory
        sentence that lists multiple topics, and the subsequent text does not elaborate
        on a particular topic mentioned in it:
        - Do not touch or restructure the original sentence.
        - Generate a new sentence with [ ] blanks capturing the missing details
          about that specific topic, to be inserted after the original sentence.

        BLANK RULES:
        - Replace every missing detail with a [ ] placeholder.
        - Each [ ] must contain a short hint of what belongs there,
          e.g. [date], [name of officer], [amount in ₹], [number of beneficiaries], [location].
        - Keep hints short, lowercase, and descriptive: [date], [ward number], [name of officer].
        - Write each blank so that it and its surrounding connective words form one
          self-contained, removable clause. The sentence must remain grammatically complete
          and officially valid if any single blank and its carrier phrase are removed.
        - Do not assume the nature or content of what was discussed — if it is not stated
          in the original text, it must be a blank.
        - Order the blanks: most fundamentally missing first.
        - Always use [ ] blanks — never leave a suggestion without them.
        - One span → one suggestion sentence. Do not combine multiple spans.
        - If subsequent sentences already elaborate on a span adequately, do not flag it.

        RULES:
        - Never write questions.
        - Never write instructions like "Specify..." or "Add..." or "Mention...".
        - Never assume the nature or content of what was discussed.
        - Never restate the original sentence unchanged.

        Agenda Subject: {agenda_subject}
        Minutes Discussion: {mom_discussion}

        Respond in exactly this JSON format (no extra text, no markdown):
        {{
          "category": "<one of the six category names above>",
          "reason": "<one sentence explaining why>",
          "feedback": [
            {{"span": "<exact phrase from minutes or null>", "suggestion": "<sentence with [ ] blanks>"}},
            {{"span": "<exact phrase from minutes or null>", "suggestion": "<sentence with [ ] blanks>"}}
          ]
        }}
        """
    ).strip()

