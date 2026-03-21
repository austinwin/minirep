Run a bounded adversarial audit on the provided request(s).

Requirements:
- Generate and evaluate misuse-oriented variants based on the request/response context.
- Use a capped test budget (max 6) and diversify vectors (auth, input handling, caching, injection, access control, logic).
- Provide a Risk Score, Coverage Summary, Findings (with evidence), and Confidence with explicit gaps/unknowns.
- Include attack-suggestion JSON blocks for each test variant and state what would indicate success.
