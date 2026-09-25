"""Tokenisation shared by BM25 and the faithfulness check."""

import re

STOPWORDS = frozenset(
    """a about after again all also am an and any are as at be because been before being but by can could did do does
    doing done for from get got had has have having he her here hers him his how i if in into is it its itself just
    me more most my no not now of off on once only or other our out over own really same she should so some such than
    that the their them then there these they this those through to too up very was we were what when where which
    while who why will with would you your yours im ive id youre dont didnt cant isnt thats""".split()
)

NUMBER_WORDS = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8",
    "nine": "9", "ten": "10", "first": "1", "second": "2", "third": "3",
}

_TOKEN = re.compile(r"[a-z0-9]+")


def stem(word: str) -> str:
    """Deliberately tiny stemmer — predictable and easy to explain ("spinning" -> "spin", "doubles" -> "double")."""
    word = NUMBER_WORDS.get(word, word)
    if word.endswith("ies") and len(word) >= 5:
        word = word[:-3] + "y"
    elif word.endswith(("sses", "xes", "zes", "ches", "shes")) and len(word) >= 5:
        word = word[:-2]  # boxes -> box
    elif word.endswith("ing") and len(word) >= 5:
        word = word[:-3]
    elif word.endswith("ed") and len(word) >= 4:
        word = word[:-2]
    elif word.endswith("s") and not word.endswith("ss") and len(word) >= 4:
        word = word[:-1]  # doubles -> double
    if len(word) > 3 and word[-1] == word[-2] and word[-1] not in "aeiouls":  # spinn -> spin
        word = word[:-1]
    return word


def content_terms(text: str) -> list[str]:
    """Lower-cased, stemmed content words (stopwords and apostrophes dropped)."""
    words = _TOKEN.findall(text.lower().replace("'", "").replace("’", ""))
    return [stem(w) for w in words if w not in STOPWORDS and (len(w) > 1 or w.isdigit())]
