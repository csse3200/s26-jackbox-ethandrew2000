/**
 * Majority Rules – Student client
 * Fully implemented with ngrok headers
 */

// Base URL for the API. Use this for all requests.
const API_BASE = "https://unpopulously-ungrimed-pilar.ngrok-free.dev";

// Shared headers including ngrok skip warning
const NGROK_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
let playerId = null;
let playerName = null;
let pollInterval = null;
let currentRoundId = null;

// -----------------------------------------------------------------------------
// Join game
// -----------------------------------------------------------------------------
function joinGame(name) {
  fetch(API_BASE + '/api/join', {
    method: 'POST',
    headers: NGROK_HEADERS,
    body: JSON.stringify({ name: name })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'Join failed');
        }
        return data;
      });
    })
    .then(function (data) {
      playerId = data.player_id;
      playerName = data.name;
      onJoined();
      startPolling();
    })
    .catch(function (err) {
      showJoinError(err.message);
    });
}

function onJoined() {
  document.getElementById('join-section').hidden = true;
  document.getElementById('game-section').hidden = false;
  document.getElementById('join-status').textContent = 'Joined as ' + playerName;
  document.getElementById('join-status').className = 'status';
}

function showJoinError(message) {
  const el = document.getElementById('join-status');
  el.textContent = message;
  el.className = 'status error';
}

// -----------------------------------------------------------------------------
// Poll state
// -----------------------------------------------------------------------------
function pollState() {
  fetch(API_BASE + '/api/state', {
    headers: NGROK_HEADERS
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('State request failed: ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      currentRoundId = data.round_id;

      document.getElementById('phase-display').textContent =
        'Phase: ' + data.phase + '  Round ' + data.round_id + '/' + data.round_total;

      document.getElementById('prompt-display').textContent =
        data.prompt || '—';

      document.getElementById('answer-area').hidden = data.phase !== 'ANSWER';
      document.getElementById('guess-area').hidden = data.phase !== 'GUESS';
      document.getElementById('results-area').hidden = data.phase !== 'RESULTS';
    })
    .catch(function (err) {
      console.error('Polling error:', err.message);
    });
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollState();
  pollInterval = setInterval(pollState, 2000);
}

// -----------------------------------------------------------------------------
// Submit answer
// -----------------------------------------------------------------------------
function submitAnswer() {
  const answer = document.getElementById('answer').value.trim();
  if (!answer) return;

  fetch(API_BASE + '/api/answer', {
    method: 'POST',
    headers: NGROK_HEADERS,
    body: JSON.stringify({
      player_id: playerId,
      round_id: currentRoundId,
      answer: answer
    })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'Answer submission failed');
        }
        return data;
      });
    })
    .then(function () {
      document.getElementById('answer').value = '';
      const el = document.getElementById('answer-status');
      el.textContent = 'Answer submitted';
      el.className = 'status';
    })
    .catch(function (err) {
      const el = document.getElementById('answer-status');
      el.textContent = err.message;
      el.className = 'status error';
    });
}

// -----------------------------------------------------------------------------
// Submit guess
// -----------------------------------------------------------------------------
function submitGuess() {
  const guess = document.getElementById('guess').value.trim();
  if (!guess) return;

  fetch(API_BASE + '/api/guess', {
    method: 'POST',
    headers: NGROK_HEADERS,
    body: JSON.stringify({
      player_id: playerId,
      round_id: currentRoundId,
      guess: guess
    })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'Guess submission failed');
        }
        return data;
      });
    })
    .then(function () {
      document.getElementById('guess').value = '';
      const el = document.getElementById('guess-status');
      el.textContent = 'Guess submitted';
      el.className = 'status';
    })
    .catch(function (err) {
      const el = document.getElementById('guess-status');
      el.textContent = err.message;
      el.className = 'status error';
    });
}

// -----------------------------------------------------------------------------
// Fetch results
// -----------------------------------------------------------------------------
function fetchResults() {
  fetch(API_BASE + '/api/results?round_id=' + currentRoundId, {
    headers: NGROK_HEADERS
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'Results not available yet');
        }
        return data;
      });
    })
    .then(function (data) {
      document.getElementById('results').textContent =
        JSON.stringify(data, null, 2);
    })
    .catch(function (err) {
      document.getElementById('results').textContent = err.message;
    });
}

// -----------------------------------------------------------------------------
// UI wiring
// -----------------------------------------------------------------------------
document.getElementById('btn-join').addEventListener('click', function () {
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showJoinError('Enter your name');
    return;
  }
  joinGame(name);
});

document.getElementById('btn-submit-answer').addEventListener('click', submitAnswer);
document.getElementById('btn-submit-guess').addEventListener('click', submitGuess);
document.getElementById('btn-fetch-results').addEventListener('click', fetchResults);
