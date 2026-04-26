/* ──────────────────────────────────────────────────────────────
   PolyAI — Prediction Market Intelligence
   app.js — Main application logic
   ────────────────────────────────────────────────────────────── */

// ── STATE ────────────────────────────────────────────────────────
const state = {
  markets: [],
  filtered: [],
  offset: 0,
  limit: 20,
  selectedMarket: null,
  loading: false,
};

// ── POLYMARKET API ────────────────────────────────────────────────
const GAMMA_API = 'https://gamma-api.polymarket.com';

async function fetchMarkets(offset = 0, limit = 20) {
  const params = new URLSearchParams({
    limit,
    offset,
    active: 'true',
    closed: 'false',
    order: 'volume',
    ascending: 'false',
  });
  const res = await fetch(`${GAMMA_API}/markets?${params}`);
  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);
  return res.json();
}

// ── FORMATTING HELPERS ────────────────────────────────────────────
function formatVolume(v) {
  v = parseFloat(v) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysLeft(d) {
  if (!d) return null;
  const ms = new Date(d) - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return days;
}

function parsePrice(p) {
  const n = parseFloat(p);
  return isNaN(n) ? 0 : n;
}

function getYesNo(market) {
  // outcomePrices is ["0.65","0.35"] matching outcomes ["Yes","No"]
  const prices = market.outcomePrices || [];
  const outcomes = market.outcomes || [];
  let yesPrice = 0, noPrice = 0;

  outcomes.forEach((o, i) => {
    const p = parsePrice(prices[i]);
    if (o.toLowerCase() === 'yes') yesPrice = p;
    else if (o.toLowerCase() === 'no') noPrice = p;
  });

  // fallback for binary markets
  if (yesPrice === 0 && prices.length >= 1) yesPrice = parsePrice(prices[0]);
  if (noPrice === 0 && prices.length >= 2) noPrice = parsePrice(prices[1]);

  return { yesPrice, noPrice };
}

// ── MARKET CARD RENDERING ─────────────────────────────────────────
function createMarketCard(market, index) {
  const { yesPrice, noPrice } = getYesNo(market);
  const yesPCT = (yesPrice * 100).toFixed(0);
  const noPCT = (noPrice * 100).toFixed(0);
  const volume = formatVolume(market.volume);
  const liquidity = formatVolume(market.liquidity);
  const closes = getDaysLeft(market.endDateIso || market.endDate);
  const closesStr = closes !== null ? (closes <= 0 ? 'Closed' : `${closes}d left`) : 'N/A';

  const card = document.createElement('div');
  card.className = 'market-card';
  card.style.animationDelay = `${index * 0.04}s`;
  card.dataset.id = market.id;

  card.innerHTML = `
    <div class="card-question">${escHtml(market.question)}</div>
    <div class="card-bar">
      <div class="card-bar-fill" style="width: ${yesPrice * 100}%"></div>
    </div>
    <div class="card-prices">
      <div class="price-pill yes">
        <span class="pill-label">YES</span>
        ${yesPrice > 0 ? `${yesPrice.toFixed(2)} (${yesPCT}%)` : '—'}
      </div>
      <div class="price-pill no">
        <span class="pill-label">NO</span>
        ${noPrice > 0 ? `${noPrice.toFixed(2)} (${noPCT}%)` : '—'}
      </div>
    </div>
    <div class="card-meta">
      <div class="meta-item">VOL <span>${volume}</span></div>
      <div class="meta-item">LIQ <span>${liquidity}</span></div>
      <div class="meta-item">CLOSES <span>${closesStr}</span></div>
    </div>
    <button class="card-analyze">⚡ ANALYZE WITH CLAUDE</button>
  `;

  card.querySelector('.card-analyze').addEventListener('click', (e) => {
    e.stopPropagation();
    openAnalysis(market);
  });
  card.addEventListener('click', () => openAnalysis(market));
  return card;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ── RENDER MARKETS ────────────────────────────────────────────────
function renderMarkets(markets, append = false) {
  const grid = document.getElementById('marketGrid');
  if (!append) grid.innerHTML = '';

  if (markets.length === 0 && !append) {
    grid.innerHTML = '<div class="loading-state"><p style="color:var(--text-dim)">No markets match your filters.</p></div>';
    return;
  }

  markets.forEach((m, i) => {
    grid.appendChild(createMarketCard(m, append ? state.markets.length - markets.length + i : i));
  });
}

// ── FILTER + SORT ─────────────────────────────────────────────────
function applyFilters() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const minVol = parseFloat(document.getElementById('minVolume').value) || 0;
  const sort = document.getElementById('sortBy').value;

  let filtered = state.markets.filter(m => {
    if (minVol > 0 && (parseFloat(m.volume) || 0) < minVol) return false;
    if (query && !m.question.toLowerCase().includes(query)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sort === 'volume') return (parseFloat(b.volume) || 0) - (parseFloat(a.volume) || 0);
    if (sort === 'liquidity') return (parseFloat(b.liquidity) || 0) - (parseFloat(a.liquidity) || 0);
    if (sort === 'endDate') return new Date(a.endDateIso || a.endDate || 0) - new Date(b.endDateIso || b.endDate || 0);
    if (sort === 'price') {
      const { yesPrice: ya } = getYesNo(a);
      const { yesPrice: yb } = getYesNo(b);
      return yb - ya;
    }
    return 0;
  });

  state.filtered = filtered;
  document.getElementById('marketCount').textContent = `${filtered.length} markets`;
  renderMarkets(filtered);
}

// ── HERO STATS ────────────────────────────────────────────────────
function updateHeroStats(markets) {
  document.getElementById('statMarkets').textContent = markets.length;
  const totalVol = markets.reduce((acc, m) => acc + (parseFloat(m.volume) || 0), 0);
  document.getElementById('statVolume').textContent = formatVolume(totalVol);
  document.getElementById('tickerText').textContent =
    `${markets.length} active markets · ${formatVolume(totalVol)} volume`;
}

// ── CANVAS CHART ANIMATION ────────────────────────────────────────
function initChart() {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Generate fake price path
  const points = [];
  let price = 0.5 + (Math.random() - 0.5) * 0.2;
  for (let i = 0; i < 120; i++) {
    price += (Math.random() - 0.48) * 0.015;
    price = Math.max(0.05, Math.min(0.95, price));
    points.push(price);
  }

  const marketLine = [];
  let mp = price + (Math.random() - 0.5) * 0.15;
  for (let i = 0; i < 120; i++) {
    mp += (Math.random() - 0.5) * 0.01;
    mp = Math.max(0.05, Math.min(0.95, mp));
    marketLine.push(mp);
  }

  let frame = 0;
  const pad = { t: 20, r: 20, b: 30, l: 45 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  function toX(i, total) { return pad.l + (i / (total - 1)) * cW; }
  function toY(v) { return pad.t + (1 - v) * cH; }

  function drawLine(pts, count, color, glow = false) {
    if (count < 2) return;
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = glow ? 2 : 1;
    ctx.beginPath();
    pts.slice(0, count).forEach((v, i) => {
      const x = toX(i, count);
      const y = toY(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(30,32,40,1)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(v => {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(58,61,71,0.8)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`${(v * 100).toFixed(0)}%`, 4, y + 4);
    });
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();

    const count = Math.min(frame + 1, points.length);
    drawLine(marketLine, count, 'rgba(79,142,247,0.5)');
    drawLine(points, count, '#00e87a', true);

    // Legend
    ctx.save();
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = '#00e87a';
    ctx.fillText('● CLAUDE EST.', pad.l, H - 8);
    ctx.fillStyle = 'rgba(79,142,247,0.8)';
    ctx.fillText('● MARKET', pad.l + 110, H - 8);
    ctx.restore();

    if (frame < points.length - 1) {
      frame++;
      requestAnimationFrame(tick);
    } else {
      // Loop with new data after pause
      setTimeout(() => {
        frame = 0;
        let p2 = points[points.length - 1];
        let m2 = marketLine[marketLine.length - 1];
        for (let i = 0; i < 120; i++) {
          p2 += (Math.random() - 0.48) * 0.015;
          p2 = Math.max(0.05, Math.min(0.95, p2));
          points[i] = p2;
          m2 += (Math.random() - 0.5) * 0.01;
          m2 = Math.max(0.05, Math.min(0.95, m2));
          marketLine[i] = m2;
        }
        requestAnimationFrame(tick);
      }, 3000);
    }
  }

  tick();
}

// ── ANALYSIS PANEL ────────────────────────────────────────────────
function openAnalysis(market) {
  const apiKey = getApiKey();
  if (!apiKey) {
    openModal();
    return;
  }

  state.selectedMarket = market;
  const overlay = document.getElementById('panelOverlay');
  const apQuestion = document.getElementById('apQuestion');
  const apBody = document.getElementById('apBody');

  apQuestion.textContent = market.question;
  apBody.innerHTML = `
    <div class="analyzing-state">
      <div class="analyzing-ring"></div>
      <div>Claude is searching for context...</div>
      <div class="analyzing-log" id="analyzeLog">Initializing web search...</div>
    </div>
  `;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  const logs = [
    'Searching for recent news...',
    'Analyzing market dynamics...',
    'Estimating true probability...',
    'Calculating edge...',
    'Compiling recommendation...',
  ];
  let logIdx = 0;
  const logInterval = setInterval(() => {
    const el = document.getElementById('analyzeLog');
    if (el && logIdx < logs.length) el.textContent = logs[logIdx++];
  }, 1800);

  analyzeMarket(market, apiKey).then(result => {
    clearInterval(logInterval);
    renderAnalysis(market, result);
  }).catch(err => {
    clearInterval(logInterval);
    apBody.innerHTML = `
      <div class="error-state">
        <div style="margin-bottom:0.5rem">Analysis failed</div>
        <div style="color:var(--text-dim);font-size:0.72rem">${err.message}</div>
      </div>
    `;
  });
}

function closeAnalysis() {
  document.getElementById('panelOverlay').classList.remove('open');
  document.body.style.overflow = '';
  state.selectedMarket = null;
}

function renderAnalysis(market, result) {
  const apBody = document.getElementById('apBody');
  const { yesPrice, noPrice } = getYesNo(market);
  const marketProb = Math.round(yesPrice * 100);

  const recClass = result.recommendation === 'BUY YES' ? 'buy-yes'
    : result.recommendation === 'BUY NO' ? 'buy-no' : 'avoid';

  const edgeVal = result.edge || (result.trueProbability - marketProb);
  const edgeClass = edgeVal > 3 ? 'positive' : edgeVal < -3 ? 'negative' : 'neutral';
  const edgeSign = edgeVal > 0 ? '+' : '';

  const pmSlug = market.slug || market.conditionId || '';
  const pmUrl = `https://polymarket.com/event/${pmSlug}`;

  apBody.innerHTML = `
    <div class="panel-section-label">RECOMMENDATION</div>
    <div class="rec-card ${recClass}">
      <div>
        <div class="rec-label">CLAUDE SAYS</div>
        <div class="rec-action">${result.recommendation || 'AVOID'}</div>
      </div>
      <div style="text-align:right">
        <div class="rec-label">CONFIDENCE</div>
        <div class="rec-confidence">${result.confidence || 'medium'}</div>
      </div>
    </div>

    <div class="panel-section-label">PROBABILITY ESTIMATE</div>
    <div class="gauge-section">
      <div class="gauge-bars">
        <div class="gauge-row">
          <div class="gauge-row-label">Market implied</div>
          <div class="gauge-track">
            <div class="gauge-fill market" style="width:${marketProb}%"></div>
          </div>
          <div class="gauge-val" style="color:var(--blue)">${marketProb}%</div>
        </div>
        <div class="gauge-row">
          <div class="gauge-row-label">Claude estimate</div>
          <div class="gauge-track">
            <div class="gauge-fill claude" style="width:${result.trueProbability}%"></div>
          </div>
          <div class="gauge-val" style="color:var(--green)">${result.trueProbability}%</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem">
        <div class="gauge-label">EDGE</div>
        <div class="edge-badge ${edgeClass}">${edgeSign}${edgeVal?.toFixed?.(1) ?? edgeVal}pp</div>
      </div>
    </div>

    <div class="panel-section-label">REASONING</div>
    <div class="reasoning-box">${escHtml(result.reasoning || 'No reasoning provided.')}</div>

    ${result.keyFactors?.length ? `
    <div class="panel-section-label">KEY FACTORS</div>
    <div class="factors-list">
      ${result.keyFactors.map(f => `
        <div class="factor-item">
          <div class="factor-dot"></div>
          <span>${escHtml(f)}</span>
        </div>
      `).join('')}
    </div>` : ''}

    <a class="pm-link" href="${pmUrl}" target="_blank" rel="noopener">
      TRADE ON POLYMARKET →
    </a>
  `;
}

// ── CLAUDE API ────────────────────────────────────────────────────
async function analyzeMarket(market, apiKey) {
  const { yesPrice } = getYesNo(market);
  const impliedProb = (yesPrice * 100).toFixed(1);

  const prompt = `You are a quantitative prediction market analyst. Search for current information about this market and provide a trading recommendation.

Market: "${market.question}"
Current YES price: ${yesPrice.toFixed(3)} (market implies ${impliedProb}% probability of YES)
Volume: ${formatVolume(market.volume)}
Closes: ${formatDate(market.endDateIso || market.endDate)}
${market.description ? `Context: ${market.description.slice(0, 300)}` : ''}

Instructions:
1. Search the web for the latest news and data relevant to this specific prediction market
2. Based on what you find, estimate the true probability of YES occurring (0-100)
3. Compare your estimate to the market's implied probability (${impliedProb}%)
4. Calculate edge = your estimate - market probability (in percentage points)
5. Recommend: BUY YES (edge > +5pp), BUY NO (edge < -5pp), or AVOID (edge ±5pp or low confidence)

Respond ONLY with a valid JSON object — no markdown, no backticks, no preamble:
{
  "trueProbability": <integer 0-100>,
  "marketProbability": ${Math.round(parseFloat(impliedProb))},
  "edge": <number, positive means YES is underpriced>,
  "recommendation": "BUY YES" or "BUY NO" or "AVOID",
  "confidence": "high" or "medium" or "low",
  "reasoning": "<2-3 sentences explaining your analysis>",
  "keyFactors": ["<key factor 1>", "<key factor 2>", "<key factor 3>"]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'interleaved-thinking-2025-05-14',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();

  // Extract text blocks (web_search tool is server-side, text is final answer)
  const text = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Parse JSON from response
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returned unexpected format.');

  return JSON.parse(jsonMatch[0]);
}

// ── API KEY ───────────────────────────────────────────────────────
function getApiKey() { return localStorage.getItem('polyai_api_key') || ''; }
function saveApiKey(key) { localStorage.setItem('polyai_api_key', key); }

function openModal() {
  const overlay = document.getElementById('modalOverlay');
  const input = document.getElementById('keyInput');
  overlay.classList.add('open');
  input.value = getApiKey();
  setTimeout(() => input.focus(), 100);
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ── INIT ──────────────────────────────────────────────────────────
async function init() {
  initChart();

  // Load markets
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = '<div class="loading-state"><div class="loader-ring"></div><p>Fetching Polymarket data...</p></div>';

  try {
    const markets = await fetchMarkets(0, state.limit);
    state.markets = markets;
    state.offset = markets.length;
    updateHeroStats(markets);
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<div class="error-state">
      Could not connect to Polymarket API.<br>
      <span style="color:var(--text-dim);font-size:0.72rem">${err.message}</span><br><br>
      This may be a CORS issue in some browsers. Try deploying or running via a local server.
    </div>`;
    document.getElementById('tickerText').textContent = 'Polymarket API unavailable';
  }

  // Load more
  document.getElementById('loadMoreBtn').addEventListener('click', async () => {
    try {
      const more = await fetchMarkets(state.offset, state.limit);
      state.markets = [...state.markets, ...more];
      state.offset += more.length;
      updateHeroStats(state.markets);
      applyFilters();
    } catch (e) {
      console.error('Load more failed:', e);
    }
  });

  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    state.markets = [];
    state.offset = 0;
    grid.innerHTML = '<div class="loading-state"><div class="loader-ring"></div><p>Refreshing...</p></div>';
    try {
      const markets = await fetchMarkets(0, state.limit);
      state.markets = markets;
      state.offset = markets.length;
      updateHeroStats(markets);
      applyFilters();
    } catch (e) {
      grid.innerHTML = `<div class="error-state">${e.message}</div>`;
    }
  });

  // Filters
  ['searchInput', 'sortBy', 'minVolume'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  // Panel close
  document.getElementById('panelClose').addEventListener('click', closeAnalysis);
  document.getElementById('panelOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('panelOverlay')) closeAnalysis();
  });

  // API key modal
  document.getElementById('apiKeyBtn').addEventListener('click', openModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const key = document.getElementById('keyInput').value.trim();
    const status = document.getElementById('keyStatus');
    if (!key.startsWith('sk-ant-')) {
      status.textContent = '✗ Key should start with sk-ant-';
      status.className = 'key-status err';
      return;
    }
    saveApiKey(key);
    status.textContent = '✓ Key saved';
    status.className = 'key-status ok';
    setTimeout(closeModal, 800);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAnalysis();
      closeModal();
    }
  });

  // Show key prompt if not set
  if (!getApiKey()) {
    setTimeout(() => {
      const btn = document.getElementById('apiKeyBtn');
      btn.style.animation = 'pulse 1.5s ease 3';
    }, 1500);
  }
}

document.addEventListener('DOMContentLoaded', init);
