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
