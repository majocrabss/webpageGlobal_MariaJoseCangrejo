// =============================================
//  c8.js — Manual Mode (C8) logic
// =============================================

let c8Mode = 'mean';    // 'mean' | 'proportion'
let c8Tail = 'two';     // 'left' | 'right' | 'two'

// Pair a slider with a number box (bidirectional sync)
function syncPair(sliderId, boxId, onUpdate) {
  const slider = document.getElementById(sliderId);
  const box    = document.getElementById(boxId);
  if (!slider || !box) return;

  slider.addEventListener('input', () => {
    box.value = slider.value;
    onUpdate();
  });
  box.addEventListener('input', () => {
    slider.value = box.value;
    onUpdate();
  });
}

function initC8() {
  // Mode buttons
  document.querySelectorAll('#modeGroup .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modeGroup .mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      c8Mode = btn.dataset.mode;
      document.getElementById('meanFields').style.display = c8Mode === 'mean'       ? '' : 'none';
      document.getElementById('propFields').style.display = c8Mode === 'proportion' ? '' : 'none';
      updateC8();
    });
  });

  // Tail buttons
  document.querySelectorAll('#tailGroup .tail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tailGroup .tail-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      c8Tail = btn.dataset.tail;
      updateC8();
    });
  });

  // Sync sliders ↔ boxes
  syncPair('alphaSlider',  'alphaBox',  updateC8);
  syncPair('mu0Slider',    'mu0Box',    updateC8);
  syncPair('xbarSlider',   'xbarBox',   updateC8);
  syncPair('sigmaSlider',  'sigmaBox',  updateC8);
  syncPair('nMeanSlider',  'nMeanBox',  updateC8);
  syncPair('p0Slider',     'p0Box',     updateC8);
  syncPair('phatSlider',   'phatBox',   updateC8);
  syncPair('nPropSlider',  'nPropBox',  updateC8);

  updateC8(); // initial render
}

function updateC8() {
  const alpha = parseFloat(document.getElementById('alphaBox').value) || 0.05;

  let zStat;
  if (c8Mode === 'mean') {
    const mu0   = parseFloat(document.getElementById('mu0Box').value)   || 100;
    const xbar  = parseFloat(document.getElementById('xbarBox').value)  || 105;
    const sigma = parseFloat(document.getElementById('sigmaBox').value) || 20;
    const n     = parseFloat(document.getElementById('nMeanBox').value) || 50;
    if (sigma <= 0 || n <= 0) return;
    zStat = zStatMean(xbar, mu0, sigma, n);
  } else {
    const p0   = parseFloat(document.getElementById('p0Box').value)   || 0.50;
    const phat = parseFloat(document.getElementById('phatBox').value) || 0.55;
    const n    = parseFloat(document.getElementById('nPropBox').value) || 100;
    if (n <= 0 || p0 <= 0 || p0 >= 1) return;
    zStat = zStatProp(phat, p0, n);
  }

  const pValue = calcPValue(zStat, c8Tail);
  const critVals = criticalValues(alpha, c8Tail);
  const reject = pValue < alpha;

  // Update canvas
  drawNormalCurve('normalCanvas', zStat, c8Tail, alpha, pValue);

  // Update legend
  document.getElementById('canvasLegend').innerHTML = `
    <span><span class="legend-dot" style="background:#e05c5c;"></span>Test statistic z = ${fmt(zStat,3)}</span>
    <span><span class="legend-dot" style="background:rgba(224,92,92,0.55);"></span>P-value region</span>
    <span><span class="legend-dot" style="background:rgba(232,197,71,0.55);"></span>Critical region</span>
  `;

  // Update results
  document.getElementById('zVal').textContent    = fmt(zStat, 4);
  document.getElementById('pVal').textContent    = fmtP(pValue);
  document.getElementById('critVal').textContent = critVals.map(v => fmt(v,4)).join(' / ');
  document.getElementById('alphaVal').textContent = fmt(alpha, 2);

  // Decision
  const decisionBox   = document.getElementById('decisionBox');
  const decisionTitle = document.getElementById('decisionTitle');
  const decisionText  = document.getElementById('decisionText');

  if (reject) {
    decisionBox.className   = 'decision-box reject';
    decisionTitle.textContent = '✗  Reject H₀';
    decisionTitle.style.color = 'var(--reject)';
    decisionText.textContent  = `Since p-value (${fmtP(pValue)}) < α (${fmt(alpha,2)}), we have sufficient statistical evidence to reject the null hypothesis. The sample data support the alternative hypothesis.`;
  } else {
    decisionBox.className   = 'decision-box fail';
    decisionTitle.textContent = '✓  Fail to Reject H₀';
    decisionTitle.style.color = 'var(--accent2)';
    decisionText.textContent  = `Since p-value (${fmtP(pValue)}) ≥ α (${fmt(alpha,2)}), we do not have sufficient statistical evidence to reject the null hypothesis.`;
  }
}
