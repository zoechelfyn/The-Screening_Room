# Chain: spaceship

The first derivation chain, and the template for all others. A chain is run
against one species' canon. Stage 1: paste this whole file plus the trait
vector into the big model by hand. Stage 2+: the orchestrator does the
pasting and validates the output against the schema at the bottom.

**reads**: `world`, `substrate`, `lineage`, `convergence`, `sensorium`,
`age`, `society`, `technology`, `values`, `aesthetic`, `wound`

---

## Prompt

You are a hard-SF spacecraft designer and xenotechnologist. You will design
the characteristic spacecraft of the species described by the TRAIT VECTOR
below. Work through the questions IN ORDER, showing your reasoning at each
step; every later answer must be consistent with every earlier one. Derive,
don't decorate: each design feature must trace back to a trait or to an
earlier conclusion. Where physics makes something implausible for them,
say so and design around it — the workaround is usually the most
interesting part.

1. **The gravity well.** Given the homeworld, how hard is it to reach
   orbit at all? (Surface gravity, atmosphere depth, whether there is even
   a surface.) What did their FIRST launch look like, and how mythologised
   is it now?
2. **Launch economics.** Given (1) and their technology character, what
   launch method dominates today — chemical rockets, mass drivers, buoyant
   atmospheric platforms, grown organic lifters, beamed power, something
   stranger? Rank the two or three plausible options and pick one, with
   reasons.
3. **Propulsion in space.** Given substrate, technology, and civilizational
   age, rank the likelihood of: chemical, fission/fusion thermal, ion/plasma,
   solar or magnetic sail, antimatter, exotic (justify heavily if chosen).
   Choose a mainline drive and state its practical consequences: travel
   times, fuel logistics, what a "long voyage" means to them.
4. **Life support as biography.** What does the crewed interior have to
   provide — pressure, medium (gas? liquid? cold?), gravity or its absence,
   sensory environment (a species that hears through stone needs a ship
   that carries vibration; a swarm needs no corridors)? What would kill
   them that wouldn't kill a human, and vice versa?
5. **Hull form follows body and society.** Given body plan, social
   organisation, and crew structure (castes? clans? symbiotic pairs? a
   single distributed individual?), derive the ship's shape and internal
   topology. Who is the ship FOR?
6. **The aesthetic layer.** Apply their material culture and values to the
   design: what does a warship vs. a pilgrim ship vs. a freighter look
   like? What on the hull is ornament, and what only looks like ornament?
7. **The wound aboard.** How does their defining historical wound show up
   in shipbuilding doctrine? (A species that lost its homeworld builds
   arks; one that was livestock builds nothing it cannot steer alone.)
8. **One named ship.** Invent one specific, famous vessel of this class —
   name (translated), one paragraph of history, one visible scar.

## Output

After the reasoning, emit ONLY this JSON object:

```json
{
  "chain": "spaceship",
  "species_code": "",
  "launch_method": "",
  "mainline_drive": "",
  "propulsion_ranking": [{"method": "", "likelihood": "high|medium|low|implausible", "reason": ""}],
  "hull_form": "",
  "interior_environment": "",
  "design_doctrine": "",
  "aesthetic_signature": "",
  "famous_vessel": {"name": "", "history": "", "scar": ""},
  "flow_prompts": {
    "exterior": "<full Flow prompt: the ship in space or at launch, ending with the species style anchor>",
    "interior": "<full Flow prompt: crewed interior scene, ending with the species style anchor>"
  },
  "canon_facts": ["<5-10 single-sentence facts, each usable verbatim as future canon>"]
}
```

`canon_facts` is the load-bearing field: those sentences get appended to the
species canon file and constrain every later chain and every critic pass.
