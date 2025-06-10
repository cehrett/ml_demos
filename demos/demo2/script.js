// Interactive tomato classification demo
// Supports logistic regression, k-NN and a simple decision tree

const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const margin = 40;

const xMin = 0;   // green
const xMax = 1;   // red
const yMin = 2;   // cm
const yMax = 10;  // cm
// k value for the k-NN classifier
const K_VALUE = 3;

let data = []; // {x, y, label}
let model = null;
let predictedPoint = null;
const equationOutput = document.getElementById('equation');
const tableBody = document.querySelector('#data-table tbody');

function currentMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function canvasToDataX(px) {
  return xMin + (px - margin) / (width - 2 * margin) * (xMax - xMin);
}

function canvasToDataY(py) {
  return yMax - (py - margin) / (height - 2 * margin) * (yMax - yMin);
}

function dataToCanvasX(x) {
  return margin + (x - xMin) / (xMax - xMin) * (width - 2 * margin);
}

function dataToCanvasY(y) {
  return margin + (yMax - y) / (yMax - yMin) * (height - 2 * margin);
}

function addTableRow(x, y, label) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${x.toFixed(2)}</td><td>${y.toFixed(2)}</td><td>${label}</td>`;
  tableBody.appendChild(tr);
}

function drawAxes() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.stroke();

  const numTicks = 5;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#000';

  // X-axis ticks and labels
  for (let i = 0; i <= numTicks; i++) {
    const x = xMin + (i / numTicks) * (xMax - xMin);
    const px = dataToCanvasX(x);
    ctx.beginPath();
    ctx.moveTo(px, height - margin);
    ctx.lineTo(px, height - margin + 5);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(x.toFixed(1), px, height - margin + 7);
  }

  // Y-axis ticks and labels
  for (let i = 0; i <= numTicks; i++) {
    const y = yMin + (i / numTicks) * (yMax - yMin);
    const py = dataToCanvasY(y);
    ctx.beginPath();
    ctx.moveTo(margin - 5, py);
    ctx.lineTo(margin, py);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(y.toFixed(1), margin - 7, py);
  }

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('Color (Green \u2192 Red)', width / 2, height - 5);
  ctx.save();
  ctx.translate(10, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Size (cm)', 0, 0);
  ctx.restore();
}

function drawPoints() {
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of data) {
    const px = dataToCanvasX(p.x);
    const py = dataToCanvasY(p.y);
    ctx.fillText(p.label === 'ripe' ? '🍅' : '🟢', px, py);
  }
}

function drawPrediction() {
  if (!predictedPoint) return;
  const {x, y, label} = predictedPoint;
  const px = dataToCanvasX(x);
  const py = dataToCanvasY(y);
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label === 'ripe' ? '🍅' : '🟢', px, py);
}

function drawBoundary() {
  if (!model) return;
  const step = 6;
  for (let i = margin; i < width - margin; i += step) {
    for (let j = margin; j < height - margin; j += step) {
      const x = canvasToDataX(i + step / 2);
      const y = canvasToDataY(j + step / 2);
      const pred = predictPoint(x, y);
      ctx.fillStyle = pred.label === 'ripe' ? 'rgba(255,0,0,0.08)' : 'rgba(0,255,0,0.08)';
      ctx.fillRect(i, j, step, step);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawBoundary();
  drawAxes();
  drawPoints();
  drawPrediction();
}

function predictPoint(x, y) {
  if (!model) return {label: 'unripe', prob: 0};
  const algo = document.getElementById('algorithm').value;
  if (algo === 'logistic') return predictLogistic(model, x, y);
  if (algo === 'knn') return predictKNN(model, x, y);
  return predictTree(model, x, y);
}

function updateModel() {
  const algo = document.getElementById('algorithm').value;
  if (algo === 'logistic') {
    model = trainLogistic(data);
    if (model) {
      equationOutput.textContent =
        `p = 1/(1 + exp(-(${model.w0.toFixed(2)} + ${model.w1.toFixed(2)}*x + ${model.w2.toFixed(2)}*y)))`;
    } else {
      equationOutput.textContent = '';
    }
  } else {
    equationOutput.textContent = '';
    if (algo === 'knn') model = {data};
    else model = buildTree(data, 0);
  }
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = canvasToDataX(e.clientX - rect.left);
  const y = canvasToDataY(e.clientY - rect.top);
  const mode = currentMode();
  if (mode === 'predict') {
    updateModel();
    predictedPoint = {x, y, ...predictPoint(x, y)};
    document.getElementById('prediction').textContent = `Prediction: ${predictedPoint.label} (${Math.round(predictedPoint.prob*100)}% ripe)`;
  } else {
    data.push({x, y, label: mode});
    addTableRow(x, y, mode);
    predictedPoint = null;
    document.getElementById('prediction').textContent = '';
    updateModel();
  }
  draw();
});

// Reset button
document.getElementById('reset-btn').addEventListener('click', () => {
  data = [];
  model = null;
  predictedPoint = null;
  tableBody.innerHTML = '';
  document.getElementById('prediction').textContent = '';
  equationOutput.textContent = '';
  draw();
});

document.getElementById('algorithm').addEventListener('change', () => {
  predictedPoint = null;
  document.getElementById('prediction').textContent = '';
  updateModel();
  draw();
});

updateModel();
draw();

// ----- Models ----- //
function trainLogistic(points) {
  if (points.length === 0) return null;
  let w0 = 0, w1 = 0, w2 = 0;
  const lr = 0.1;
  for (let iter = 0; iter < 200; iter++) {
    let g0 = 0, g1 = 0, g2 = 0;
    for (const p of points) {
      const t = p.label === 'ripe' ? 1 : 0;
      const z = w0 + w1 * p.x + w2 * p.y;
      const pred = 1 / (1 + Math.exp(-z));
      const err = pred - t;
      g0 += err;
      g1 += err * p.x;
      g2 += err * p.y;
    }
    w0 -= lr * g0 / points.length;
    w1 -= lr * g1 / points.length;
    w2 -= lr * g2 / points.length;
  }
  return {w0, w1, w2};
}

function predictLogistic(model, x, y) {
  const z = model.w0 + model.w1 * x + model.w2 * y;
  const prob = 1 / (1 + Math.exp(-z));
  return {label: prob >= 0.5 ? 'ripe' : 'unripe', prob};
}

function predictKNN(model, x, y) {
  if (model.data.length === 0) return {label: 'unripe', prob: 0};
  const k = Math.min(K_VALUE, model.data.length);
  const dists = model.data.map(p => {
    const dx = (p.x - x) / (xMax - xMin);
    const dy = (p.y - y) / (yMax - yMin);
    return {p, d: dx * dx + dy * dy};
  });
  dists.sort((a, b) => a.d - b.d);
  let ripeCount = 0;
  for (let i = 0; i < k; i++) if (dists[i].p.label === 'ripe') ripeCount++;
  const prob = ripeCount / k;
  return {label: prob >= 0.5 ? 'ripe' : 'unripe', prob};
}

function buildTree(points, depth) {
  if (points.length === 0) return null;
  if (depth === 2) return makeLeaf(points);
  let best = {imp: Infinity};
  for (const feature of ['x', 'y']) {
    const vals = [...new Set(points.map(p => p[feature]))].sort((a,b)=>a-b);
    for (let i = 1; i < vals.length; i++) {
      const th = (vals[i-1] + vals[i]) / 2;
      const left = points.filter(p => p[feature] <= th);
      const right = points.filter(p => p[feature] > th);
      if (!left.length || !right.length) continue;
      const imp = gini(left) * left.length + gini(right) * right.length;
      if (imp < best.imp) best = {feature, th, left, right, imp};
    }
  }
  if (!best.feature) return makeLeaf(points);
  return {
    feature: best.feature,
    th: best.th,
    left: buildTree(best.left, depth + 1),
    right: buildTree(best.right, depth + 1)
  };
}

function makeLeaf(arr) {
  const ripe = arr.filter(p => p.label === 'ripe').length;
  return {leaf: true, prob: ripe / arr.length};
}

function gini(arr) {
  const p = arr.filter(p => p.label === 'ripe').length / arr.length;
  return 1 - p * p - (1 - p) * (1 - p);
}

function predictTree(node, x, y) {
  if (!node) return {label: 'unripe', prob: 0};
  if (node.leaf) return {label: node.prob >= 0.5 ? 'ripe' : 'unripe', prob: node.prob};
  const val = node.feature === 'x' ? x : y;
  if (val <= node.th) return predictTree(node.left, x, y);
  return predictTree(node.right, x, y);
}
