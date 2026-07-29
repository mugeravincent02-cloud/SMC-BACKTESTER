# Architectural Decisions

The document records why each architectural decisions were made.

## ADR-001

Decision

Separate MarketController from BinanceService.

Reason

Controllers should coordinate application flow.

Services should communicate with external APIs.

Benefits

- Easier testing
- Easier maintenance
- Supports multiple data providers
