[README.md](https://github.com/user-attachments/files/27102055/README.md)
# PolyAI — Prediction Market Intelligence

> Claude-powered analysis for Polymarket. Browse live markets, let Claude search the web for context, and get probability estimates with clear BUY / AVOID recommendations.

![Dark terminal interface showing live Polymarket data with Claude analysis](https://img.shields.io/badge/Claude-Sonnet%204-00e87a?style=flat-square) ![Polymarket](https://img.shields.io/badge/Data-Polymarket-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)

---

## How It Works

1. **Browse** — Live markets fetched from the Polymarket public API, sortable by volume, liquidity, or closing date
2. **Click** — Select any market to open the analysis panel
3. **Analyze** — Claude performs web searches for relevant news and context
4. **Edge** — Claude estimates the true probability, compares to market price, and outputs `BUY YES`, `BUY NO`, or `AVOID`
5. **Trade** — Direct link to the market on Polymarket

---

## Setup

### Option 1 — Open Directly (Simplest)

Just open `index.html` in any browser. 

> ⚠️ Some browsers block cross-origin API calls from `file://`. If Polymarket data doesn't load, use Option 2.

### Option 2 — Local Server (Recommended)

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# Then open http://localhost:8080
```

### Option 3 — GitHub Pages

1. Fork this repo
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Visit `https://<your-username>.github.io/<repo-name>`

---

## API Key

You need an [Anthropic API key](https://console.anthropic.com) to use the Claude analysis feature.

1. Click **⚡ API KEY** in the top-right
2. Paste your key (starts with `sk-ant-`)
3. Click **SAVE KEY**

Your key is stored in `localStorage` in your browser only — it is never sent to any server other than `api.anthropic.com`.

---

## Architecture

```
polyai/
├── index.html      # App shell + layout
├── style.css       # Dark terminal aesthetic
├── app.js          # All logic:
│                   #   • Polymarket gamma-api client
│                   #   • Claude API integration (with web_search tool)
│                   #   • Market card rendering
│                   #   • Filter / sort
│                   #   • Analysis panel + JSON parsing
└── README.md
```

**Data flow:**

```
Polymarket Gamma API → Market cards
User clicks market   → Analysis panel opens
                     → Claude API called with web_search tool
                     → Claude searches for news
                     → Returns JSON: { trueProbability, edge, recommendation, reasoning }
                     → Rendered as probability gauges + rec card
```

---

## Claude Prompt Design

The prompt instructs Claude to:

- Search the web for recent news and context about the specific market
- Estimate a true probability (0–100%)
- Calculate edge vs the market's implied probability
- Classify confidence as `high`, `medium`, or `low`
- Output a clean JSON object with `recommendation`, `reasoning`, and `keyFactors`

The response parser extracts JSON from Claude's output and renders it into the analysis panel UI.

---

## Customisation

| What | Where |
|------|-------|
| Number of markets loaded | `state.limit` in `app.js` |
| Edge threshold for BUY vs AVOID | Prompt instructions in `analyzeMarket()` |
| Claude model | `model` field in the API call |
| Color scheme | CSS variables at top of `style.css` |
| Analysis depth | Adjust `max_tokens` and prompt detail |

---

## Disclaimer

This tool is for **informational purposes only**. Prediction market trading involves financial risk. Claude's probability estimates are AI-generated and should not be treated as financial advice. Always do your own research.

---

## License

MIT
