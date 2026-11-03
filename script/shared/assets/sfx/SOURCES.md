# Original short UI sound cues

Synthesized locally by shared/tools/mix_effects.py using deterministic sine waves and filtered noise. No sampled music, voices, or third-party recordings. error: 160ms; tick: 75ms; page: 160ms. The mix uses event-specific peak dBFS, preserves narration timing, and rejects clipping.

Additional original designs in `shared/tools/sfx_designs.py` (2026-11-03):

| Sound | Duration | Character / use |
| --- | --- | --- |
| `soft_click` | 85 ms | Dry wooden tap for a control selection |
| `soft_pop` | 130 ms | Rounded descending bubble for a small reveal |
| `data_pluck` | 200 ms | Warm harmonic pluck for a key value |
| `soft_whoosh` | 320 ms | Filtered air sweep for a scene transition |
| `focus_air` | 180 ms | Short air movement for a lens entering |
| `success_pair` | 460 ms | Two ascending plucks for a completed milestone |

Each new cue has an independent fixed random seed and a zero-ended envelope.
Library WAVs use a preview peak of about -12 dBFS; mixing synthesizes at the
narration sample rate and applies each event's own quieter peak level. Existing
`error`, `tick`, and `page` synthesis is unchanged. LongCat-2.5 chapter 1 uses
eight events at -35 to -31 dBFS, leaving continuous lens movements silent.
