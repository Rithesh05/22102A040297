const express = require('express');
const app = express();
const PORT = 9876;

const ACCESS_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ4MjQwODY5LCJpYXQiOjE3NDgyNDA1NjksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjNmNGEzZTljLWVkNmQtNGJhZC1iYTBmLTJlM2RkZmE1MDI0NiIsInN1YiI6InJpdGhlc2h2ZWxsYW1wYWxsaTA1QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InJpdGhlc2h2ZWxsYW1wYWxsaTA1QGdtYWlsLmNvbSIsIm5hbWUiOiJ2ZWxsYW1wYWxsaSB2ZW5rYXRhIHJpdGhlc2giLCJyb2xsTm8iOiIyMjEwMmEwNDAyOTciLCJhY2Nlc3NDb2RlIjoiZEpGdWZFIiwiY2xpZW50SUQiOiIzZjRhM2U5Yy1lZDZkLTRiYWQtYmEwZi0yZTNkZGZhNTAyNDYiLCJjbGllbnRTZWNyZXQiOiJBdXB6Y2VwdldDa1BnWHZBIn0.7hNsiy1QyT1VdmFPqclT6k-ve3e8JHhCqMzyDlDXXf4";

const SOURCES = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand'
};

const WINDOW_SIZE = 10;
let windowNumbers = [];

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  const sourceUrl = SOURCES[numberid];

  if (!sourceUrl) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);

    const response = await fetch(sourceUrl, {
      headers: {
        Authorization: ACCESS_TOKEN
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const newNumbers = data.numbers || [];
    const prevWindow = [...windowNumbers];

    for (const num of newNumbers) {
      if (!windowNumbers.includes(num)) {
        windowNumbers.push(num);
      }
    }

    if (windowNumbers.length > WINDOW_SIZE) {
      windowNumbers = windowNumbers.slice(-WINDOW_SIZE);
    }

    const avg = windowNumbers.length
      ? parseFloat((windowNumbers.reduce((a, b) => a + b, 0) / windowNumbers.length).toFixed(2))
      : 0;

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: [...windowNumbers],
      numbers: newNumbers,
      avg
    });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});