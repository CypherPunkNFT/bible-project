"""Versioned, chapter-grounded analysis blueprints for the local Qwen studio."""
from dataclasses import dataclass
import re


@dataclass(frozen=True)
class Pipeline:
    id: str
    title: str
    purpose: str
    sections: tuple[tuple[str, str], ...]
    instructions: str
    priority: int
    version: str = "1"
    output_tokens: int = 2400

    @property
    def schema(self):
        finding = {"type": "object", "additionalProperties": False,
            "properties": {"claim": {"type": "string", "minLength": 8, "maxLength": 800},
                "basis": {"type": "string", "enum": ["explicit", "inferred"]},
                "evidence": {"type": "array", "minItems": 1, "maxItems": 4,
                    "items": {"type": "object", "additionalProperties": False,
                        "properties": {"start": {"type": "integer", "minimum": 1}, "end": {"type": "integer", "minimum": 1}},
                        "required": ["start", "end"]}}},
            "required": ["claim", "basis", "evidence"]}
        return {"type": "object", "additionalProperties": False,
            "properties": {"overview": {"type": "string", "minLength": 8, "maxLength": 800},
                "sections": {"type": "object", "additionalProperties": False,
                    "properties": {key: {"type": "array", "maxItems": 4, "items": finding} for key, _ in self.sections},
                    "required": [key for key, _ in self.sections]}},
            "required": ["overview", "sections"]}

    def public(self):
        return {"id": self.id, "title": self.title, "purpose": self.purpose,
                "sections": [{"key": k, "label": label} for k, label in self.sections],
                "priority": self.priority, "version": self.version}


PIPELINES = [
    Pipeline("orientation", "Who, what, when, where", "Build a clear picture of the chapter's people, events, time, and setting.",
        (("who", "Who"), ("what", "What"), ("when", "When"), ("where", "Where")),
        "Identify the main people or groups, main events or argument, stated temporal markers, and stated places. "
        "For letters distinguish author, addressees, and people mentioned when the chapter identifies them. "
        "Do not supply an author's name, date, geography, or historical setting from outside knowledge. "
        "When dates or places are not stated, use an empty array rather than inventing them.", 1),
    Pipeline("outline", "Chapter outline", "Follow the chapter's main movements, scenes, or steps in its argument.",
        (("movements", "Main movements"), ("turning_points", "Turning points"), ("connections", "Connections within the chapter")),
        "Outline the chapter in verse order. For narrative describe scenes; for an epistle describe the argument; "
        "for a psalm describe the speaker's movement. Use evidence ranges covering the movements. "
        "Connections must stay within this chapter. Do not impose modern headings as Scripture.", 2),
    Pipeline("themes", "Themes and key ideas", "Create useful topic tags with evidence for discovery and study.",
        (("main_themes", "Main themes"), ("supporting_themes", "Supporting themes"), ("contrasts", "Important contrasts")),
        "Identify major themes, supporting themes, and contrasts actually developed in the chapter. "
        "Begin each claim with a concise theme name followed by its chapter-specific explanation. "
        "Avoid generic labels that fit nearly every chapter or importing systematic theology.", 3),
    Pipeline("sin", "Sin, rebellion, and consequences", "Trace wrongdoing, warnings, consequences, and responses without mislabeling people.",
        (("wrongdoing", "Wrongdoing"), ("warnings", "Warnings"), ("consequences", "Consequences"), ("responses", "Responses to sin")),
        "Identify acts or attitudes the text condemns, warns against, or connects to consequences. "
        "Distinguish wrongdoing portrayed from wrongdoing explicitly judged by the text. "
        "Name the actor when stated. Do not call suffering, disability, ethnicity, temptation, or a reported accusation sin. "
        "Do not endorse actions merely because a character performs them. No moral scoring or invented motives. "
        "Repentance, forgiveness, judgment, or restoration belongs in responses only when present.", 4),
    Pipeline("virtue", "Faith, obedience, and virtue", "Find examples and teachings about faithful conduct.",
        (("qualities", "Qualities encouraged"), ("examples", "Examples in the chapter"), ("responses", "Responses and outcomes")),
        "Identify faith, love, humility, courage, justice, mercy, obedience, or other qualities the chapter commends. "
        "Separate explicit commendation from your inference. Preserve flawed portrayals instead of declaring every protagonist virtuous. "
        "Do not treat wealth or success alone as proof of virtue.", 5),
    Pipeline("god", "God's character and actions", "Explore what this chapter says God does and how it describes him.",
        (("actions", "God's actions"), ("character", "Descriptions of God"), ("speech", "God's speech"), ("human_response", "Human responses")),
        "Record God's actions, character descriptions, speech, and human responses. Preserve who says each claim. "
        "Distinguish a narrator's assertion, a character's belief, a prayer, and divine speech. "
        "Do not treat hostile or mistaken character statements as settled theology. No claims imported from other chapters.", 6),
    Pipeline("commands", "Commands and their audiences", "Identify instructions while preserving who was addressed and in what setting.",
        (("divine_commands", "Divine commands"), ("human_instructions", "Human instructions"), ("audience_and_limits", "Audience and limits")),
        "For every command identify the speaker, recipient, action, and stated condition or setting inside the claim. "
        "Distinguish divine commands from human instructions, invitations, and narrative description. "
        "Do not automatically turn commands to a specific person or ancient group into universal modern instructions.", 7),
    Pipeline("promises", "Promises, warnings, and conditions", "Track assurances and warnings with their recipients and limits intact.",
        (("promises", "Promises and assurances"), ("warnings", "Warnings"), ("conditions", "Conditions and scope")),
        "Identify promises and warnings actually stated. For each preserve speaker, recipient, conditions, and scope. "
        "A character's promise is not automatically God's promise; a wish is not a guarantee. "
        "Do not guarantee modern wealth, health, safety, or a particular outcome from an ancient contextual promise.", 8),
    Pipeline("prayer", "Prayer, worship, and lament", "Find how people address God: praise, petition, confession, grief, and trust.",
        (("prayers", "Prayer and petition"), ("worship", "Praise and worship"), ("lament_and_trust", "Lament and trust")),
        "Identify prayers, petitions, worship, confession, lament, thanksgiving, and expressions of trust. "
        "Describe the actual speaker and request or response. Do not compose a new prayer or erase unresolved grief. "
        "Distinguish speech addressed to God from speech about God.", 9),
    Pipeline("questions", "Questions for thoughtful study", "Create chapter-specific observation and reflection questions with verse anchors.",
        (("observation", "Observe the text"), ("interpretation", "Consider its meaning"), ("reflection", "Reflect carefully")),
        "Each claim must be a question ending in a question mark. Observation questions ask what the text states; "
        "interpretation questions explore its meaning and are marked inferred; reflection questions invite consideration and are marked inferred. "
        "Avoid leading questions with unsupported premises, invented historical facts, or promises of personal outcomes. "
        "Every question needs verses that make it relevant.", 10),
    Pipeline("relationships", "Relationships and conflict", "Trace family, community, authority, conflict, reconciliation, and care.",
        (("relationships", "Relationships"), ("conflict", "Conflict and power"), ("repair_and_care", "Reconciliation and care")),
        "Describe relationships, named conflicts, power dynamics, and acts of reconciliation or care in this chapter. "
        "Do not invent kinship or diagnose people psychologically. Distinguish coercion and abuse from ordinary disagreement "
        "when the text supports that distinction; never excuse harm because a protagonist commits it.", 11),
    Pipeline("suffering", "Suffering, hope, and comfort", "Identify hardship and the chapter's own response without offering easy answers.",
        (("hardship", "Hardship and loss"), ("responses", "Responses to suffering"), ("hope", "Hope and comfort")),
        "Identify hardship, grief, persecution, loss, responses, and hope actually present. "
        "Do not infer that suffering proves personal sin or that faith guarantees relief. "
        "Preserve unresolved suffering. Attribute explanations to their speakers rather than adopting them uncritically.", 12),
    Pipeline("literary", "Literary features and repeated language", "Reveal contrasts, repetition, imagery, and patterns readers can see in the English text.",
        (("repetition", "Repeated language"), ("imagery", "Imagery"), ("structure", "Patterns and contrasts")),
        "Identify repeated words, imagery, contrasts, parallelism, dialogue, or other features visible in the supplied English chapter. "
        "Do not invent Hebrew/Greek etymologies, original-language patterns, authorship, or numerical symbolism. "
        "Mark structural interpretations inferred. A claim of repetition needs multiple verse anchors when possible.", 13),
    Pipeline("jesus", "Jesus and gospel in the chapter", "Find explicit references to Jesus and gospel teaching, with careful treatment of interpretation.",
        (("jesus", "References to Jesus"), ("gospel", "Gospel teaching"), ("interpretive_limits", "Interpretive limits")),
        "Identify Jesus, Christ, and gospel teaching only where this chapter actually mentions them. "
        "Do not retrofit Old Testament objects, people, animals, or numbers into Christological typology. "
        "Do not identify an unnamed figure as Jesus from later interpretation. Empty arrays are expected in many chapters. "
        "Any interpretive-limit finding must be supported by verses showing the ambiguity and marked inferred.", 14),
]
CATALOG = {p.id: p for p in PIPELINES}


def get_pipeline(identifier):
    if identifier not in CATALOG:
        raise ValueError("Choose a registered analysis pipeline.")
    return CATALOG[identifier]


def validate_output(pipeline, output, scripture):
    def text(value, label, maximum=800):
        if not isinstance(value, str) or not 8 <= len(value.strip()) <= maximum or "<" in value or "```" in value:
            raise ValueError(f"{label} must be plain text of 8–{maximum} characters.")
    if not isinstance(output, dict) or set(output) != {"overview", "sections"}:
        raise ValueError("Return exactly overview and sections.")
    text(output["overview"], "Overview")
    sections = output["sections"]
    if not isinstance(sections, dict) or set(sections) != {k for k, _ in pipeline.sections}:
        raise ValueError("The section keys do not match this pipeline.")
    available = set()
    for verse in scripture["verses"]:
        if not verse["text"]:
            continue
        match = re.fullmatch(r"(\d+)(?:[-–](\d+))?", str(verse["number"]))
        if match:
            available.update(range(int(match[1]), int(match[2] or match[1]) + 1))
    for key, findings in sections.items():
        if not isinstance(findings, list) or len(findings) > 4:
            raise ValueError(f"{key} must contain 0–4 findings.")
        for finding in findings:
            if not isinstance(finding, dict) or set(finding) != {"claim", "basis", "evidence"}:
                raise ValueError("Each finding needs claim, basis, and evidence.")
            text(finding["claim"], "Claim")
            if finding["basis"] not in ("explicit", "inferred"):
                raise ValueError("Basis must be explicit or inferred.")
            refs = finding["evidence"]
            if not isinstance(refs, list) or not 1 <= len(refs) <= 4:
                raise ValueError("Each finding needs 1–4 verse references.")
            for ref in refs:
                if not isinstance(ref, dict) or set(ref) != {"start", "end"}:
                    raise ValueError("Verse references need start and end.")
                start, end = ref["start"], ref["end"]
                if type(start) is not int or type(end) is not int or start > end or start not in available or end not in available:
                    raise ValueError("A cited verse range is outside the supplied chapter.")
            if pipeline.id == "questions" and not finding["claim"].rstrip().endswith("?"):
                raise ValueError("Study questions must end with a question mark.")
    return output
