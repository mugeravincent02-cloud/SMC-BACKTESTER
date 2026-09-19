# Strategy

## Stage 03 market-structure contract

- A swing high/low is a strict three-candle comparison. Equal values are not swings.
- A swing at index `i` is available only at `confirmationIndex: i + 1`; its source candle is retained by reference.
- Structure compares a confirmed swing with the preceding confirmed swing of the same type: `HH`, `LH`, `HL`, or `LL`. Equal highs/lows retain the existing `LH`/`LL` classification.
- Bullish structure requires both `HH` and `HL`; bearish structure requires both `LH` and `LL`.
- BOS is a close beyond the latest confirmed swing in the established trend direction. Wick-only and equal-close moves are not BOS.
- CHoCH is a close through the protected opposing swing: the latest `HL` in bullish structure or latest `LH` in bearish structure. It is emitted separately from BOS.
- Detectors process only candles and swings available at each event index and return events in chronological order.

## Current implementation status

Completed:

- Market data acquisition and candle standardization
- Deterministic swing detection
- Same-type structure classification
- Close-based BOS detection
- Protected-swing CHoCH detection
- Equal-level liquidity detection

Planned in later approved stages:

- Order blocks, fair value gaps, mitigation, entries, exits, and risk management
