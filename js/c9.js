// =============================================
//  c9.js — CSV Mode (C9) logic
// =============================================

let csvData = [];
let csvHeaders = [];
let csvMode = 'mean';
let csvTail = 'two';

function initC9() {
  const zone    = document.getElementById('uploadZone');
  const fileInput = document.getElementById('csvFile');

  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) parseCSV(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) parseCSV(fileInput.files[0]);
  });

  // CSV mode buttons
  document.querySelectorAll('#csvModeGroup .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#csvModeGroup .mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      csvMode = btn.dataset.csvmode;
      document.getElementById('valueColGroup').style.display   = csvMode === 'mean'       ? '' : 'none';
      document.getElementById('successColGroup').style.display = csvMode === 'proportion' ? '' : 'none';
    });
  });

  // CSV tail buttons
  document.querySelectorAll('#csvTailGroup .tail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#csvTailGroup .tail-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      csvTail = btn.dataset.tail;
    });
  });

  // Alpha sync
  const sl = document.getElementById('csvAlphaSlider');
  const bx = document.getElementById('csvAlphaBox');
  sl.addEventListener('input', () => { bx.value = sl.value; });
  bx.addEventListener('input', () => { sl.value = bx.value; });

  document.getElementById('runCsvBtn').addEventListener('click', runCsvTest);
}

function parseCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const lines = text.trim().split(/\r?\n/);
    csvHeaders = lines[0].split(',').map(h => h.trim());
    csvData = lines.slice(1).map(line => {
      const vals = line.split(',');
      const row = {};
      csvHeaders.forEach((h, i) => row[h] = (vals[i] || '').trim());
      return row;
    }).filter(row => Object.values(row).some(v => v !== ''));

    populateCsvControls();
    showPreview();
  };
  reader.readAsText(file);
}

function populateCsvControls() {
  document.getElementById('csvControls').style.display = '';
  ['groupColSelect', 'valueColSelect', 'successColSelect'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = csvHeaders.map(h => `<option value="${h}">${h}</option>`).join('');
  });

  // Set value/success col defaults (second column)
  if (csvHeaders.length > 1) {
    document.getElementById('valueColSelect').value   = csvHeaders[1];
    document.getElementById('successColSelect').value = csvHeaders[1];
  }

  updateGroupOptions();
  document.getElementById('groupColSelect').addEventListener('change', updateGroupOptions);
}

function updateGroupOptions() {
  const groupCol = document.getElementById('groupColSelect').value;
  const groups   = [...new Set(csvData.map(r => r[groupCol]))].filter(Boolean);
  ['benchGroupSelect', 'testGroupSelect'].forEach((id, idx) => {
    const sel = document.getElementById(id);
    sel.innerHTML = groups.map(g => `<option value="${g}">${g}</option>`).join('');
    if (groups[idx]) sel.value = groups[idx];
  });
}

function showPreview() {
  const card = document.getElementById('csvPreviewCard');
  const wrap = document.getElementById('csvPreview');
  card.style.display = '';

  const cols = csvHeaders;
  const rows = csvData.slice(0, 8);

  let html = `<table class="csv-table"><thead><tr>${cols.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>${cols.map(h => `<td>${row[h]}</td>`).join('')}</tr>`;
  });
  if (csvData.length > 8) html += `<tr><td colspan="${cols.length}" style="color:var(--text-dim);text-align:center;">… ${csvData.length - 8} more rows</td></tr>`;
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function runCsvTest() {
  const groupCol    = document.getElementById('groupColSelect').value;
  const benchGroup  = document.getElementById('benchGroupSelect').value;
  const testGroup   = document.getElementById('testGroupSelect').value;
  const alpha       = parseFloat(document.getElementById('csvAlphaBox').value) || 0.05;

  const benchRows = csvData.filter(r => r[groupCol] === benchGroup);
  const testRows  = csvData.filter(r => r[groupCol] === testGroup);

  if (!benchRows.length || !testRows.length) {
    alert('Could not find rows for selected groups. Check your column selections.');
    return;
  }

  let zStat, pValue, summaryHtml, resultsHtml;

  if (csvMode === 'mean') {
    const valCol  = document.getElementById('valueColSelect').value;
    const benchVals = benchRows.map(r => parseFloat(r[valCol])).filter(v => !isNaN(v));
    const testVals  = testRows.map(r => parseFloat(r[valCol])).filter(v => !isNaN(v));

    if (!benchVals.length || !testVals.length) {
      alert('No valid numeric values found in selected value column.');
      return;
    }

    const bStats = summaryStats(benchVals);
    const tStats = summaryStats(testVals);

    // Use benchmark mean as mu0, test group as sample
    zStat  = zStatMean(tStats.mean, bStats.mean, bStats.sd, tStats.n);
    pValue = calcPValue(zStat, csvTail);

    summaryHtml = buildSummaryHtml(benchGroup, bStats, testGroup, tStats, 'mean');
    resultsHtml = buildResultsHtml(zStat, pValue, alpha);

  } else {
    const sucCol      = document.getElementById('successColSelect').value;
    const benchBin    = benchRows.map(r => r[sucCol]);
    const testBin     = testRows.map(r => r[sucCol]);

    const bStats = proportionStats(benchBin);
    const tStats = proportionStats(testBin);

    zStat  = zStatProp(tStats.phat, bStats.phat, tStats.n);
    pValue = calcPValue(zStat, csvTail);

    summaryHtml = buildSummaryHtml(benchGroup, bStats, testGroup, tStats, 'proportion');
    resultsHtml = buildResultsHtml(zStat, pValue, alpha);
  }

  // Render results
  document.getElementById('summaryGrid').innerHTML    = summaryHtml;
  document.getElementById('csvResultsGrid').innerHTML = resultsHtml;
  document.getElementById('csvGraphCard').style.display   = '';
  document.getElementById('csvResultsCard').style.display = '';

  drawNormalCurve('csvCanvas', zStat, csvTail, alpha, pValue);

  // Decision
  const reject = pValue < alpha;
  const decisionBox   = document.getElementById('csvDecisionBox');
  const decisionTitle = document.getElementById('csvDecisionTitle');
  const decisionText  = document.getElementById('csvDecisionText');

  if (reject) {
    decisionBox.className     = 'decision-box reject';
    decisionTitle.textContent = '✗  Reject H₀';
    decisionTitle.style.color = 'var(--reject)';
    decisionText.textContent  = `Since p-value (${fmtP(pValue)}) < α (${fmt(alpha,2)}), we reject the null hypothesis. The data provide sufficient evidence that "${testGroup}" differs significantly from "${benchGroup}".`;
  } else {
    decisionBox.className     = 'decision-box fail';
    decisionTitle.textContent = '✓  Fail to Reject H₀';
    decisionTitle.style.color = 'var(--accent2)';
    decisionText.textContent  = `Since p-value (${fmtP(pValue)}) ≥ α (${fmt(alpha,2)}), we do not have enough evidence to conclude that "${testGroup}" differs significantly from "${benchGroup}".`;
  }
}

function buildSummaryHtml(bName, bS, tName, tS, type) {
  if (type === 'mean') {
    const statRow = (label, val) => `<div class="summary-stat"><span>${label}</span><strong>${fmt(val,3)}</strong></div>`;
    return `
      <div class="summary-group">
        <div class="summary-group-title">Benchmark: ${bName}</div>
        ${statRow('n', bS.n)}${statRow('Mean', bS.mean)}${statRow('SD', bS.sd)}${statRow('Median', bS.median)}
      </div>
      <div class="summary-group">
        <div class="summary-group-title">Test: ${tName}</div>
        ${statRow('n', tS.n)}${statRow('Mean', tS.mean)}${statRow('SD', tS.sd)}${statRow('Median', tS.median)}
      </div>`;
  } else {
    const pRow = (label, val) => `<div class="summary-stat"><span>${label}</span><strong>${val}</strong></div>`;
    return `
      <div class="summary-group">
        <div class="summary-group-title">Benchmark: ${bName}</div>
        ${pRow('n', bS.n)}${pRow('Successes', bS.successes)}${pRow('p̂', fmt(bS.phat,4))}
      </div>
      <div class="summary-group">
        <div class="summary-group-title">Test: ${tName}</div>
        ${pRow('n', tS.n)}${pRow('Successes', tS.successes)}${pRow('p̂', fmt(tS.phat,4))}
      </div>`;
  }
}

function buildResultsHtml(zStat, pValue, alpha) {
  const critVals = criticalValues(alpha, csvTail);
  return `
    <div class="result-item"><span class="result-label">Test Statistic (z)</span><span class="result-value">${fmt(zStat,4)}</span></div>
    <div class="result-item"><span class="result-label">P-value</span><span class="result-value">${fmtP(pValue)}</span></div>
    <div class="result-item"><span class="result-label">Critical Value(s)</span><span class="result-value" style="font-size:1rem;">${critVals.map(v=>fmt(v,3)).join(' / ')}</span></div>
    <div class="result-item"><span class="result-label">Alpha (α)</span><span class="result-value">${fmt(alpha,2)}</span></div>
  `;
}
