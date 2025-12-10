# Canonical Hairstyle Vocabulary

Purpose
- Provide a small, maintainable list of hairstyles with synonyms to map model/vision labels into consistent profile tags.

Usage
- The image processor should map detected labels/OCR text to these canonical names.
- Unknown labels should be logged for review; add only if they are common, non-ambiguous, and relevant to barbershop services.

Canonical styles with common synonyms
- Fade: fade, low fade, mid fade, high fade, skin fade, temple fade, bald fade, drop fade
- Taper: taper, taper fade, temple taper
- Buzz Cut: buzz cut, buzzcut, induction cut
- Crew Cut: crew cut
- Caesar: caesar cut
- Ivy League: ivy league, harvard clip
- Undercut: undercut, disconnected undercut
- Pompadour: pompadour
- Quiff: quiff
- Slick Back: slick back, slicked back
- Comb Over: comb over, combover, side part
- Side Part: side part, hard part
- French Crop: french crop, crop
- Textured Crop: textured crop
- Curly Top: curly top, curls, coily top
- Afro: afro
- Twist/Coils: twists, coils, two-strand twists
- Mohawk: mohawk, frohawk
- Mullet: mullet
- Long Layered: long hair, layered hair, layers
- Shag: shag cut
- Bowl Cut: bowl cut
- Wolf Cut: wolf cut
- Man Bun / Top Knot: man bun, top knot
- Fringe / Bangs: fringe, bangs
- Scissor Cut: scissor cut, scissors
- Beard Trim: beard trim, beard, facial hair

Guidelines for adding new terms
- Keep names concise and user-facing.
- Prefer one canonical per family; keep synonyms in the mapping, not as new canonicals.
- Avoid ambiguous fashion terms that aren’t haircut-specific.
- Periodically review logged “unknown” labels from the vision pipeline and promote if clearly valuable.

Next steps
- Wire this list into the mapping table in `workers/image_processor.js` (expand the keyword map).
- Add unit tests to ensure labels map to the right canonicals.
- Log unmapped labels during processing for human review.
