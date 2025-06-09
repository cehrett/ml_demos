// Interactive polynomial regression demo
// Predict house prices from square footage

const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const margin = 40;

const xMin = 600;
const xMax = 3000;
const yMin = 100;
const yMax = 600;

let points = [];
let coeffs = [];
let predictionPoint = null;

const degreeSelect = document.getElementById('degree');
const predictInput = document.getElementById('predict-input');
const predictOutput = document.getElementById('predict-output');
const equationOutput = document.getElementById('equation');
const tableBody = document.querySelector('#data-table tbody');

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = canvasToDataX(e.clientX - rect.left);
  const y = canvasToDataY(e.clientY - rect.top);
  points.push({x, y});
  addTableRow(x, y);
  updateModel();
});

degreeSelect.addEventListener('change', updateModel);

document.getElementById('predict-btn').addEventListener('click', () => {
  const val = parseFloat(predictInput.value);
  if (isNaN(val)) return;
  const pred = predict(val);
  if (!isNaN(pred)) {
    predictOutput.textContent = `Predicted Price: $${pred.toFixed(1)}k`;
    predictionPoint = {x: val, y: pred};
    draw();
  }
});

// Reset button clears all data and predictions
document.getElementById('reset-btn').addEventListener('click', () => {
  points = [];
  coeffs = [];
  predictionPoint = null;
  tableBody.innerHTML = '';
  predictOutput.textContent = '';
  draw();
});

function addTableRow(x, y) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${Math.round(x)}</td><td>${y.toFixed(1)}</td>`;
  tableBody.appendChild(tr);
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

function updateModel() {
  const degree = parseInt(degreeSelect.value, 10);
  coeffs = computeCoefficients(points, degree);
  predictionPoint = null;
  predictOutput.textContent = '';
  equationOutput.textContent = coeffs.length ? `Equation: ${formatEquation(coeffs)}` : '';
  draw();
}

function computeCoefficients(data, degree) {
  const n = degree + 1;
  if (data.length < n) return [];

  // Initialize normal equation matrices
  let A = Array.from({length: n}, () => Array(n).fill(0));
  let b = Array(n).fill(0);

  for (const {x, y} of data) {
    let powers = [1];
    for (let i = 1; i <= degree; i++) powers[i] = powers[i - 1] * x;
    for (let i = 0; i <= degree; i++) {
      b[i] += powers[i] * y;
      for (let j = 0; j <= degree; j++) {
        A[i][j] += powers[i] * powers[j];
      }
    }
  }
  return gaussianSolve(A, b);
}

function gaussianSolve(A, b) {
  const n = A.length;
  let M = A.map((row, i) => row.concat(b[i]));

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    let pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = i; j <= n; j++) M[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      let factor = M[k][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  return M.map(row => row[n]);
}

function formatEquation(coeffs) {
  return coeffs
    .map((c, i) => {
      const absVal = Math.abs(c).toFixed(2);
      if (i === 0) return c.toFixed(2);
      const sign = c >= 0 ? ' + ' : ' - ';
      const term = i === 1 ? 'x' : `x^${i}`;
      return `${sign}${absVal}${term}`;
    })
    .join('');
}

function predict(x) {
  if (!coeffs.length) return NaN;
  let y = 0;
  let pow = 1;
  for (let c of coeffs) {
    y += c * pow;
    pow *= x;
  }
  return y;
}

function drawAxes() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.stroke();

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('Square Footage', width / 2, height - 5);
  ctx.save();
  ctx.translate(10, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Price (USD $1000s)', 0, 0);
  ctx.restore();
}

function drawPoints() {
  ctx.fillStyle = '#0074D9';
  for (const {x, y} of points) {
    const px = dataToCanvasX(x);
    const py = dataToCanvasY(y);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRegression() {
  if (!coeffs.length) return;
  ctx.strokeStyle = '#FF4136';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const x = xMin + (i / 100) * (xMax - xMin);
    const y = predict(x);
    const px = dataToCanvasX(x);
    const py = dataToCanvasY(y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawPrediction() {
  if (!predictionPoint) return;
  const {x, y} = predictionPoint;
  const px = dataToCanvasX(x);
  const py = dataToCanvasY(y);
  ctx.fillStyle = '#2ECC40';
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawAxes();
  drawPoints();
  drawRegression();
  drawPrediction();
}

draw();
