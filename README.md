Smart Money Backtester
An application for analysing, backtesting and visualizing Smart Money Concept Strategy

Current Milestone:
✅Project Setup

# Smart Money Concept (SMC) Backtesting Platform

Version: 0.1.0

Project Status: Planning

Author: Mugera Vincent

---

# 1. Project Vision

## Mission

Build a professional web application that automatically analyzes financial markets using the Smart Money Concept (SMC), performs historical backtesting, identifies buy and sell opportunities, and presents performance statistics through an interactive dashboard.

The application will eventually support:

- Multiple markets
- Multiple brokers
- Multiple strategies
- AI-assisted market analysis
- Real-time alerts
- Historical backtesting

---

# 2. Long-Term Goals

The finished application should be able to:

✓ Download historical market data

✓ Detect market structure

✓ Detect liquidity

✓ Detect Order Blocks

✓ Detect Fair Value Gaps

✓ Detect BOS

✓ Detect CHoCH

✓ Validate trade entries

✓ Execute simulated trades

✓ Measure performance

✓ Display results visually

✓ Generate trading reports

---

# 3. Development Philosophy

Project Principles

- Keep each module responsible for one task.
- Build small, test often.
- Never mix UI with trading logic.
- Write readable code before optimized code.
- Every sprint must produce a working feature.
- Every feature must be testable.

---

# 4. Technology Stack

Frontend

- React
- Vite
- JavaScript
- CSS
- Lightweight Charts

Backend

- Node.js
- Express

Database

- MongoDB

Version Control

- Git
- GitHub

Future Technologies

- Python
- FastAPI
- TensorFlow
- Docker

---

# 5. System Architecture

React Frontend

↓

Express API

↓

Market Engine

↓

Strategy Engine

↓

Backtesting Engine

↓

Statistics Engine

↓

MongoDB

---

# 6. Folder Responsibilities

client/

Responsible for:

- User Interface
- Charts
- Dashboard
- User interaction

---

server/

Responsible for:

- Business logic
- APIs
- Market data
- Strategy execution

---

market/

Responsible for:

- Downloading candles
- Cleaning market data
- Timeframe conversion

---

strategy/

Responsible for:

- Swing detection
- BOS
- CHoCH
- Liquidity
- Order Blocks
- FVG
- Entry validation

---

backtesting/

Responsible for:

- Simulating trades
- Managing positions
- Risk management
- Performance calculation

---

charts/

Responsible for:

- Candlestick rendering
- Zones
- Lines
- Markers

---

services/

Responsible for:

- Communication with backend

---

docs/

Project documentation

---

tests/

Unit tests

---

# 7. Sprint Roadmap

**Sprint 1**

Goal

Create the project foundation.

Tasks

- React setup
- Express setup
- Git repository
- Folder structure
- README
- ROADMAP

Deliverable

Application starts successfully.

Status

☐ Not Started

---

**Sprint 2**

Goal

Market Data Engine

Tasks

- Connect to Binance API
- Fetch candles
- Clean data
- Return JSON

Deliverable

Receive clean OHLC data.

Status

☐

---

**Sprint 3**

Goal

React Dashboard

Tasks

- Connect frontend
- Display candles
- Error handling
- Loading states

Deliverable

Dashboard displays market data.

Status

☐

---

**Sprint 4**

Goal

Chart Rendering

Tasks

- Install Lightweight Charts
- Draw candlesticks
- Resize chart

Deliverable

Interactive chart.

Status

☐

---

**Sprint 5**

Goal

Swing Detection

Tasks

- Swing highs
- Swing lows

Deliverable

Swing points displayed.

Status

☐

---

**Sprint 6**

Goal

Structure Detection

Tasks

- BOS
- Trend direction

Deliverable

Market structure displayed.

Status

☐

---

Sprint 7

Goal

CHoCH

Tasks

- Detect reversals

Deliverable

CHoCH markers.

Status

☐

---

**Sprint 8**

Goal

Liquidity Detection

Tasks

- Equal Highs
- Equal Lows
- Session highs
- Session lows

Deliverable

Liquidity zones.

Status

☐

---

Sprint 9

Goal

Order Blocks

Tasks

- Detect OB
- Draw OB

Deliverable

Order Block rectangles.

Status

☐

---

Sprint 10

Goal

Fair Value Gaps

Tasks

- Detect imbalance
- Draw FVG

Deliverable

FVG zones.

Status

☐

---

Sprint 11

Goal

Trade Engine

Tasks

- Entries
- Stop Loss
- Take Profit

Deliverable

Trades executed automatically.

Status

☐

---

Sprint 12

Goal

Risk Manager

Tasks

- Position sizing
- Risk %
- Breakeven

Deliverable

Risk managed automatically.

Status

☐

---

Sprint 13

Goal

Backtesting

Tasks

- Simulate strategy
- Store trades

Deliverable

Completed backtest.

Status

☐

---

Sprint 14

Goal

Statistics

Tasks

- Win Rate
- RR
- Drawdown
- Profit Factor

Deliverable

Performance dashboard.

Status

☐

---

Sprint 15

Goal

Application Polish

Tasks

- Settings
- Strategy builder
- Reports
- Export

Deliverable

Version 1.0

Status

☐

---

# 8. Coding Standards

Naming

Files

PascalCase for React components

Example

Chart.jsx

CamelCase for functions

Example

detectSwingHigh()

Folders

lowercase

---

Comments

Every function should include:

Purpose

Input

Output

Example

/**
 * Detects swing highs.
 *
 * Input:
 * candles[]
 *
 * Output:
 * swingHigh[]
 */

---

# 9. Git Workflow

Every sprint ends with:

git add .

git commit -m "Sprint X completed"

git push

Never push broken code.

---

# 10. Future Features

AI Strategy Builder

Trade Journal

Broker Integration

TradingView Webhooks

News Filter

Economic Calendar

Machine Learning Predictions

Multi-user Accounts

Cloud Deployment

Mobile App

---

# 11. Project Rules

Do not skip sprints.

Do not build future features early.

Keep functions short.

One function = one responsibility.

Commit after every working feature.

Test before every commit.

Document every completed sprint.

---

# 12. Current Sprint

Sprint

1

Current Goal

Build project foundation.

Progress

0%

Status

Planning