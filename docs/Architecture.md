# System Architecture

# Frontend Architecture

# Backend Architecture

# Module Responsibilities

# Data Flow

# Communication Flow

# Database Design

# Design Principles

User

↓

React

↓

Express

↓

Strategy Engine

↓

Backtesting Engine

↓

MongoDB

# Phase 2 Architecture

    Browser
        │
        ▼
    GET /api/candles
    API KEY ============ 91X0nzhjiKdxIisZ6TIuoCyt2ljkWjwo62uxf1VtdhWBduG59HvX3j3Rlt3SBt2m
    SECRETKEY ========== up00Vm5aaEycxZNsaNozGRM2LbAGl1LtxL2e7rfq9J1l3TAxVXWqtsgEHvyqx0ss
        │
        ▼
    marketRoutes
        │
        ▼
    MarketController
        │
        ▼
    BinanceService
        │
        ▼
    Binance API
        │
        ▼
    Raw Data
        │
        ▼
    DataCleaner
        │
        ▼
    Clean Data
        │
        ▼
    JSON Response

# As of Phase 2

## Current Backend Architecture

Client (React)
│
▼
Express API
│
▼
Routes
│
▼
Validation Middleware
│
▼
Controllers
│
▼
Market Services
│
▼
Binance REST API

### Routes

Receive incoming requests and forward them to middleware and controllers.

### Middleware

Validates request parameters before they reach the business logic.

### Controllers

Coordinate requests, call services and prepare API responses.

### Services

Communicate with external APIs and provide market data.

### DataCleaner

Transforms raw Binance candles into the application's standard candle model.
