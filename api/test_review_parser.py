import re

SAMPLE_REVIEWS = [
    "Went to Tony at Main Street Barber — he did an amazing fade. Highly recommend Jason too.",
    "Shoutout to Maria for the perfect cut! Booked with her after seeing her work.",
    "I always go to the shop but today Sam was on duty and gave me a great trim.",
    "The barber (not sure of his name) did fine, but ask for Chris if you want a fade.",
    "Fantastic service by the crew at Downtown Barbershop. Special mention: Luis!"
]

def extract_candidate_names(text):
    # Simple heuristic pipeline combining patterns and capitalization heuristics
    candidates = set()

    # Pattern: 'to NAME at' or 'to NAME' or 'by NAME' or 'ask for NAME' or 'mention: NAME'
    patterns = [r"to\s+([A-Z][a-z]{1,20})\s+at",
                r"to\s+([A-Z][a-z]{1,20})[\.!]",
                r"by\s+([A-Z][a-z]{1,20})",
                r"ask for\s+([A-Z][a-z]{1,20})",
                r"mention[:\s]+([A-Z][a-z]{1,20})",
                r"shoutout to\s+([A-Z][a-z]{1,20})",
                r"special mention[:\s]*([A-Z][a-z]{1,20})",
                r"today\s+([A-Z][a-z]{1,20})\s+was",
                r"with\s+([A-Z][a-z]{1,20})\s+after"]

    for pat in patterns:
        for m in re.finditer(pat, text, flags=re.IGNORECASE):
            name = m.group(1).strip()
            # Normalize capitalization
            name = name.capitalize()
            candidates.add(name)

    # Fallback: find capitalized single-word tokens that are not sentence start words
    words = re.findall(r"\b([A-Z][a-z]{1,20})\b", text)
    for w in words:
        if w.lower() not in ('i', 'the', 'a', 'an'):
            candidates.add(w)

    # Remove false positives like common shop words
    stopwords = {'Main', 'Street', 'Barbershop', 'Downtown', 'Barber', 'Shop'}
    candidates = {c for c in candidates if c not in stopwords}

    return list(candidates)


def main():
    for i, r in enumerate(SAMPLE_REVIEWS, 1):
        names = extract_candidate_names(r)
        hairs = extract_hairstyles(r)
        print(f"Review {i}:")
        print("", r)
        print("Candidates:", names)
        print("Hairstyles:", hairs)
        print()


def extract_hairstyles(text):
    if not text or not isinstance(text, str):
        return []
    t = text.lower()
    mapping = {
        'fade': ['fade', 'faded', 'skin fade', 'low fade', 'high fade', 'taper fade'],
        'pompadour': ['pompadour'],
        'undercut': ['undercut'],
        'buzz cut': ['buzz cut', 'buzz'],
        'crew cut': ['crew cut'],
        'mohawk': ['mohawk', 'mohican'],
        'afro': ['afro'],
        'braids': ['braid', 'braids', 'cornrows'],
        'ponytail': ['ponytail'],
        'dreadlocks': ['dread', 'dreadlocks', 'locs', 'locks'],
        'man bun': ['man bun', 'top knot'],
        'taper': ['taper', 'tapered'],
        'slicked back': ['slicked back', 'slick back']
    }
    found = set()
    for canon, variants in mapping.items():
        for v in variants:
            if re.search(r'\b' + re.escape(v) + r'\b', text, flags=re.IGNORECASE):
                found.add(canon)
                break
    return list(found)

if __name__ == '__main__':
    main()
