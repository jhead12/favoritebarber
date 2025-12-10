# Review name extraction prompt

Instruction: Extract candidate barber names from a review text. Prefer short name phrases likely to refer to a barber (e.g., "Jason", "Tony at Main Street Barber"). Output a JSON array of candidate names and optional confidence. Also, include barber nicknames.

Example prompt content (for LLM):

```
You are given a single Yelp review text. Return a JSON array of candidate barber names mentioned in the review. If none, return an empty array.

Review: "Went to Tony at Main Street Barber — he did an amazing fade. Highly recommend Jason too." 

Output: ["Tony", "Jason"]
```

Store this file in `api/ai/prompts/` and call LLM with this template as part of the `review_parser` pipeline.
