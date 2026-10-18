"""Small talk ("hi bea", "thanks!", "who are you?") gets a friendly reply instead of a search. Only messages made
entirely of small talk count, so "hi bea, how do I spot turns?" still goes to the hive."""

import re

# Checked in this order when a message mixes several ("hey, who are you?" -> identity)
INTENTS = {
    "identity": r"who (?:are|r) (?:you|u)|what (?:are|r) (?:you|u)|what can (?:you|u) do|what do (?:you|u) do|how do (?:you|u) work"
    r"|how does this work|what is this|introduce yourself|tell me about yourself|help",
    "how_are_you": r"how (?:are|r) (?:you|u|ya)(?: doing| today)?|how (?:you|u) doing|hows it going|how is it going|how have you been"
    r"|(?:you|u) good|whats up|wh?at?s+up|wassup|whats good",
    "thanks": r"thanks?(?: a lot| so much| you(?: so much| very much)?)?|thank u|thx|tysm|ty|cheers|much appreciated|appreciate (?:it|that)",
    "bye": r"bye+|goodbye|good ?night|see (?:you|ya|u)(?: later| soon)?|cya|take care|ttyl",
    "greeting": r"h+i+|h+e+y+a*|hel+o+|hiya|howdy|yo+|sup|hola|namaste|greetings|(?:good )?(?:morning|afternoon|evening)",
    "ack": r"ok(?:ay)?|kk?|cool|nice|great|awesome|perfect|got it|gotcha|sure|alright|sounds good|lol|ha(?:ha)+|yes|yeah|yep|no|nope",
}
FILLER = r"bea|there|everyone|all|again|and|oh|well|um+|so|please|pls"

_PART = re.compile(r"(?:" + "|".join(f"(?P<{k}>{v})" for k, v in INTENTS.items()) + rf"|(?:{FILLER}))\b ?")


def intents(message: str) -> list[str] | None:
    """The small-talk intents in the message, or None if any of it is a real question."""
    text = re.sub(r"[^a-z0-9 ]+", "", message.lower().replace("’", "'").replace("'", ""))
    text = " ".join(text.split())
    found: list[str] = []
    while text:
        m = _PART.match(text)
        if not m or not m.group(0):
            return None
        found += [k for k, v in m.groupdict().items() if v]
        text = text[m.end():]
    return [k for k in INTENTS if k in found] or None


def reply(found: list[str], hive_name: str | None) -> str:
    topic = hive_name or "your hobbies"
    where = f"the {hive_name} hive" if hive_name else "your hives"
    hello = "Hi! " if "greeting" in found else ""
    main = found[0]
    if main == "identity":
        return (
            f"{hello}I'm Bea. Ask me anything about {topic} and I'll answer from what people in {where} have posted, "
            "showing whose post each bit came from. If nobody's covered it yet, I'll say so rather than guess."
        )
    if main == "how_are_you":
        return f"{hello}I'm doing well, thanks for asking! What would you like to know about {topic}?"
    if main == "thanks":
        return "Anytime! Ask me whenever something comes up."
    if main == "bye":
        return "Bye for now! Come back whenever you're stuck on something."
    if main == "greeting":
        return f"Hi! What would you like to know about {topic}? I'll look through what {where} has shared."
    return f"Anything else you'd like to know about {topic}?"


def unclear(hive_name: str | None) -> str:
    topic = hive_name or "your hobbies"
    return f"I'm not sure what you're asking. Try something specific about {topic}, like a technique you're stuck on or a tip you're after."
