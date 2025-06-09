// Simple demo script
// When the button is clicked, update the prediction text

document.getElementById('predict-btn').addEventListener('click', () => {
    const prediction = 'Hello AI world!';
    document.getElementById('prediction').textContent = `Prediction: ${prediction}`;
});
