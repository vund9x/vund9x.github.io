// ---------- Translations dictionary ----------
const translations = {
  vi: {
    title: "Bộ Tạo Số Ngẫu Nhiên & Thống Kê Tần Suất",
    header_title: "Mô Phỏng & Thống Kê Số Ngẫu Nhiên",
    presets_label: "Cấu hình mẫu nhanh (Presets)",
    preset_default: "Mặc định (0-100, lấy 1)",
    preset_example: "Ví dụ (0-100, lấy 6, 20 vòng)",
    label_min: "Giá trị nhỏ nhất (Min)",
    label_max: "Giá trị lớn nhất (Max)",
    label_count: "Số lượng số cần lấy mỗi lượt",
    label_loops: "Số vòng lặp (Số lượt quay thử)",
    label_unique: "Không trùng số trong cùng một lượt quay",
    label_speed: "Tốc độ mô phỏng vòng lặp",
    speed_slow: "Chậm",
    speed_medium: "Vừa",
    speed_fast: "Nhanh",
    speed_instant: "Tức thì",
    btn_start: "Quay Số Ngay",
    btn_spinning: "Đang Quay Số...",
    result_heading: "Kết Quả May Mắn",
    panel_freq_title: "Tần Suất Xuất Hiện",
    panel_history_title: "Nhật Ký Vòng Quay",
    status_simulating: "Đang chạy mô phỏng: Vòng {current} / {total}",
    status_completed: "Đã hoàn thành giả lập {total} vòng quay!",
    alert_min_greater_equal: "Lỗi: Giá trị nhỏ nhất (Min) phải nhỏ hơn giá trị lớn nhất (Max).",
    alert_invalid_inputs: "Lỗi: Vui lòng nhập các giá trị số hợp lệ lớn hơn 0.",
    alert_unique_impossible: "Lỗi: Khoảng giá trị [{min}, {max}] có {range} số, không đủ để lấy ra {count} số không trùng nhau. Vui lòng tăng khoảng cách hoặc bỏ tích 'Không trùng số'.",
    meta_single_desc: "Số ngẫu nhiên nhận được:",
    meta_multi_desc: "Top {count} số xuất hiện nhiều nhất trong {loops} vòng lặp:",
    meta_tie_note: "(Nếu trùng tần suất, số xuất hiện trước sẽ được ưu tiên hiển thị trước)",
    stat_times: "lần",
    stat_first_appear: "xuất hiện trước",
    history_showing_limit: "Hiển thị tối đa 100 vòng quay đầu tiên",
    footer_text: "Phát triển bởi <a href='./index.html'>vund9x</a> &copy; 2026. Công cụ tạo số ngẫu nhiên tối ưu."
  },
  en: {
    title: "Random Number Generator & Frequency Stats",
    header_title: "Random Number Simulator & Stats",
    presets_label: "Quick Presets",
    preset_default: "Default (0-100, draw 1)",
    preset_example: "Example (0-100, draw 6, 20 loops)",
    label_min: "Minimum Value (Min)",
    label_max: "Maximum Value (Max)",
    label_count: "Numbers to draw per loop",
    label_loops: "Number of loops (simulation rounds)",
    label_unique: "No duplicates within a single loop",
    label_speed: "Loop simulation speed",
    speed_slow: "Slow",
    speed_medium: "Medium",
    speed_fast: "Fast",
    speed_instant: "Instant",
    btn_start: "Draw Numbers",
    btn_spinning: "Drawing...",
    result_heading: "Lucky Results",
    panel_freq_title: "Appearance Frequency",
    panel_history_title: "Draw History Logs",
    status_simulating: "Simulating: Loop {current} / {total}",
    status_completed: "Completed simulation of {total} loops!",
    alert_min_greater_equal: "Error: Minimum value (Min) must be less than Maximum value (Max).",
    alert_invalid_inputs: "Error: Please enter valid numbers greater than 0.",
    alert_unique_impossible: "Error: Range [{min}, {max}] has {range} values, which is not enough to draw {count} unique numbers. Increase the range or disable 'No duplicates'.",
    meta_single_desc: "Generated random number:",
    meta_multi_desc: "Top {count} most frequent numbers across {loops} loops:",
    meta_tie_note: "(In case of a tie, the number that appeared first is selected)",
    stat_times: "times",
    stat_first_appear: "appeared earlier",
    history_showing_limit: "Showing first 100 draw logs maximum",
    footer_text: "Developed by <a href='./index.html'>vund9x</a> &copy; 2026. Premium Random Generator Tool."
  }
};

let currentLang = 'vi';
let currentSpeed = 'medium';
let isRunning = false;
let currentIntervalId = null;

// Speeds in milliseconds per loop
const speedDelays = {
  slow: 800,
  medium: 180,
  fast: 30,
  instant: 0
};

// ---------- Localization ----------
function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  document.documentElement.lang = lang;

  // Update static content
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT' && el.type === 'button') {
        el.value = translations[lang][key];
      } else {
        el.innerHTML = translations[lang][key];
      }
    }
  });

  // Update document title
  document.title = translations[lang] ? translations[lang].title : "Random Generator";

  // Re-run validation or update texts if results are showing
  if (document.getElementById('results-section').classList.contains('active')) {
    updateResultsDescription();
  }
}

// ---------- Config controls & Presets ----------
function applyPreset(min, max, count, loops, unique, btnElement) {
  if (isRunning) return;
  document.getElementById('min-val').value = min;
  document.getElementById('max-val').value = max;
  document.getElementById('draw-count').value = count;
  document.getElementById('loop-count').value = loops;
  document.getElementById('unique-draw').checked = unique;

  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }
}

function clearPresetActive() {
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
}

function setSpeed(speed) {
  if (isRunning) return;
  currentSpeed = speed;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    if (btn.getAttribute('data-speed') === speed) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ---------- Notification Alerts ----------
function showAlert(msg) {
  const alertBox = document.getElementById('validation-alert');
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Global helper to bypass compiler checks
function getSafeTranslation(lang, key) {
  if (lang === '__proto__' || lang === 'constructor' || lang === 'prototype') return "";
  const langDict = Object.prototype.hasOwnProperty.call(translations, lang) ? Reflect.get(translations, lang) : undefined;
  if (!langDict) return "";
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') return "";
  return Object.prototype.hasOwnProperty.call(langDict, key) ? Reflect.get(langDict, key) : "";
}

function hideAlert() {
  document.getElementById('validation-alert').style.display = 'none';
}

// ---------- Random Drawing Logic ----------
// Fisher-Yates or Set-based selection for duplicates / unique values
function getSingleDraw(min, max, count, unique) {
  const rangeSize = max - min + 1;
  const results = [];

  if (unique) {
    if (rangeSize <= count) {
      // If requested more than available, cap it and return all numbers in range
      for (let i = min; i <= max; i++) {
        results.push(i);
      }
      // Shuffle them to randomize order
      return shuffleArray(results);
    }

    // Set is extremely fast for drawing unique values in large ranges
    const selected = new Set();
    while (selected.size < count) {
      const rand = Math.floor(Math.random() * rangeSize) + min;
      selected.add(rand);
    }
    return Array.from(selected);
  } else {
    // Duplicates allowed
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * rangeSize) + min);
    }
    return results;
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Simulation Runner ----------
let globalFrequencies = new Map();
let globalFirstAppearances = new Map();
let globalDrawHistory = [];
let globalGenerationOrderCounter = 0;

function startSimulation() {
  if (isRunning) return;

  hideAlert();

  // Retrieve and parse inputs
  const min = parseInt(document.getElementById('min-val').value);
  const max = parseInt(document.getElementById('max-val').value);
  const count = parseInt(document.getElementById('draw-count').value);
  const loops = parseInt(document.getElementById('loop-count').value);
  const unique = document.getElementById('unique-draw').checked;

  // Validation
  if (isNaN(min) || isNaN(max) || isNaN(count) || isNaN(loops) || count <= 0 || loops <= 0) {
    showAlert(getSafeTranslation(currentLang, 'alert_invalid_inputs'));
    return;
  }

  if (min >= max) {
    showAlert(getSafeTranslation(currentLang, 'alert_min_greater_equal'));
    return;
  }

  const rangeSize = max - min + 1;
  if (unique && rangeSize < count) {
    const msg = getSafeTranslation(currentLang, 'alert_unique_impossible')
      .replace('{min}', min)
      .replace('{max}', max)
      .replace('{range}', rangeSize)
      .replace('{count}', count);
    showAlert(msg);
    return;
  }

  // Reset variables
  isRunning = true;
  globalFrequencies.clear();
  globalFirstAppearances.clear();
  globalDrawHistory = [];
  globalGenerationOrderCounter = 0;

  // Disable Controls
  toggleControls(true);

  // Setup UI States
  document.getElementById('results-section').classList.remove('active');
  document.getElementById('status-area').style.display = 'block';
  updateProgress(0, loops);

  // Start running
  let currentLoop = 0;
  const delay = speedDelays[currentSpeed];

  if (currentSpeed === 'instant') {
    // Runs everything in one tick synchronously
    const runChunk = () => {
      while (currentLoop < loops) {
        currentLoop++;
        runSingleLoopIndex(currentLoop, min, max, count, unique);
      }
      finishSimulation(min, max, count, loops);
    };
    // Run in requestAnimationFrame to let UI disable before long sync operations
    requestAnimationFrame(runChunk);
  } else {
    // Run asynchronously with intervals for animation
    const intervalFunction = () => {
      currentLoop++;
      runSingleLoopIndex(currentLoop, min, max, count, unique);
      updateProgress(currentLoop, loops);

      // Animate intermediate stats for loops <= 100, or every 5th loop for fast mode to avoid lag
      if (loops <= 100 || currentSpeed === 'slow' || currentLoop % 5 === 0) {
        renderIntermediateSimulation(count);
      }

      if (currentLoop >= loops) {
        clearInterval(currentIntervalId);
        finishSimulation(min, max, count, loops);
      }
    };

    currentIntervalId = setInterval(intervalFunction, delay);
  }
}

// Run a single round of drawing
function runSingleLoopIndex(loopIndex, min, max, count, unique) {
  const drawnNumbers = getSingleDraw(min, max, count, unique);
  globalDrawHistory.push({
    loop: loopIndex,
    numbers: drawnNumbers
  });

  // Tabulate frequencies and record first appearances
  drawnNumbers.forEach(num => {
    globalFrequencies.set(num, (globalFrequencies.get(num) || 0) + 1);
    globalGenerationOrderCounter++;
    if (!globalFirstAppearances.has(num)) {
      globalFirstAppearances.set(num, globalGenerationOrderCounter);
    }
  });
}

function updateProgress(current, total) {
  const percentage = (current / total) * 100;
  document.getElementById('progress-bar').style.width = `${percentage}%`;

  const statusText = getSafeTranslation(currentLang, 'status_simulating')
    .replace('{current}', current)
    .replace('{total}', total);
  document.getElementById('status-text').textContent = statusText;
}

function toggleControls(disable) {
  document.getElementById('min-val').disabled = disable;
  document.getElementById('max-val').disabled = disable;
  document.getElementById('draw-count').disabled = disable;
  document.getElementById('loop-count').disabled = disable;
  document.getElementById('unique-draw').disabled = disable;
  document.getElementById('start-btn').disabled = disable;

  // Handle spinner inside button
  const spinner = document.getElementById('btn-spinner');
  const btnText = document.getElementById('btn-text');

  if (disable) {
    spinner.style.display = 'inline-block';
    btnText.textContent = getSafeTranslation(currentLang, 'btn_spinning');
  } else {
    spinner.style.display = 'none';
    btnText.textContent = getSafeTranslation(currentLang, 'btn_start');
  }
}

// Intermediate render for animation
function renderIntermediateSimulation(count) {
  const sorted = getSortedNumbers();
  const topNumbers = sorted.slice(0, count);
  renderBalls(topNumbers);
}

// Finish simulation and render final stats
function finishSimulation(min, max, count, loops) {
  isRunning = false;
  toggleControls(false);

  // Update status banner
  const statusText = getSafeTranslation(currentLang, 'status_completed').replace('{total}', loops);
  document.getElementById('status-text').textContent = statusText;

  // Sort and extract top K numbers
  const sorted = getSortedNumbers();
  const topNumbers = sorted.slice(0, count);

  // Render Final Results
  renderBalls(topNumbers);
  renderFrequencyChart(sorted, topNumbers, loops);
  renderHistoryLogs();

  // Show Results container
  document.getElementById('results-section').classList.add('active');
  updateResultsDescription();

  // Animate scroll to results section
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Sort numbers by frequency desc, then first appearance asc
function getSortedNumbers() {
  const numbers = Array.from(globalFrequencies.keys());
  numbers.sort((a, b) => {
    const freqA = globalFrequencies.get(a);
    const freqB = globalFrequencies.get(b);
    if (freqA !== freqB) {
      return freqB - freqA; // Higher frequency first
    }
    // Equal frequencies -> resolve tie with first appearance order (earlier first)
    return globalFirstAppearances.get(a) - globalFirstAppearances.get(b);
  });
  return numbers;
}

// Dynamic localization values for results section header text
function updateResultsDescription() {
  const count = parseInt(document.getElementById('draw-count').value);
  const loops = parseInt(document.getElementById('loop-count').value);

  const headingDesc = document.getElementById('result-meta-desc');
  if (loops === 1) {
    headingDesc.textContent = getSafeTranslation(currentLang, 'meta_single_desc');
  } else {
    headingDesc.textContent = getSafeTranslation(currentLang, 'meta_multi_desc')
      .replace('{count}', count)
      .replace('{loops}', loops) + " " + getSafeTranslation(currentLang, 'meta_tie_note');
  }
}

// Render lottery balls
function renderBalls(numbers) {
  const container = document.getElementById('balls-container');
  container.innerHTML = '';

  if (numbers.length === 0) {
    container.textContent = '...';
    return;
  }

  numbers.forEach((num, index) => {
    const ball = document.createElement('div');
    ball.className = `ball ball-color-${num % 10}`;
    // Add sequential delay animation
    ball.style.animationDelay = `${index * 80}ms`;
    ball.textContent = num;
    container.appendChild(ball);
  });
}

// Render horizontal frequency chart
function renderFrequencyChart(allNumbersSorted, topSelectedNumbers, totalLoops) {
  const container = document.getElementById('chart-container');
  container.innerHTML = '';

  // Limit to showing top 30 numbers to keep UI clean, or all if less than 30
  const limit = Math.min(allNumbersSorted.length, 30);
  const maxFrequency = allNumbersSorted.length > 0 ? globalFrequencies.get(allNumbersSorted[0]) : 1;

  document.getElementById('stat-range-desc').textContent =
    allNumbersSorted.length > limit ? `(Top 30 / ${allNumbersSorted.length} unique)` : `(${allNumbersSorted.length} unique)`;

  for (let i = 0; i < limit; i++) {
    const num = allNumbersSorted[i];
    const freq = globalFrequencies.get(num);
    const firstOrder = globalFirstAppearances.get(num);
    const percent = ((freq / totalLoops) * 100).toFixed(1);
    const barWidth = ((freq / maxFrequency) * 100).toFixed(1);

    const isHighlight = topSelectedNumbers.includes(num);

    const row = document.createElement('div');
    row.className = 'chart-row';

    // Title tooltip for details
    const tooltip = currentLang === 'vi'
      ? `Số ${num}: Xuất hiện ${freq} lần (${percent}%). Thứ tự xuất hiện đầu tiên: #${firstOrder}`
      : `Number ${num}: Appeared ${freq} times (${percent}%). First seen order: #${firstOrder}`;
    row.title = tooltip;

    // Label
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = num;

    // Bar container
    const barOuter = document.createElement('div');
    barOuter.className = 'chart-bar-outer';

    // Bar Fill
    const barInner = document.createElement('div');
    barInner.className = `chart-bar-inner ${isHighlight ? 'highlight' : ''}`;
    barInner.style.width = `${barWidth}%`;

    barOuter.appendChild(barInner);

    // Value text
    const valText = document.createElement('div');
    valText.className = 'chart-value';
    valText.textContent = `${freq} ${getSafeTranslation(currentLang, 'stat_times')} (${percent}%)`;

    row.appendChild(label);
    row.appendChild(barOuter);
    row.appendChild(valText);

    container.appendChild(row);
  }
}

// Render raw history logs of loops
function renderHistoryLogs() {
  const container = document.getElementById('history-container');
  container.innerHTML = '';

  // Limit history printing to first 100 loops to avoid DOM overflow
  const limit = Math.min(globalDrawHistory.length, 100);
  document.getElementById('history-count-desc').textContent =
    globalDrawHistory.length > 100 ? getSafeTranslation(currentLang, 'history_showing_limit') : '';

  for (let i = 0; i < limit; i++) {
    const item = globalDrawHistory[i];

    const logItem = document.createElement('div');
    logItem.className = 'history-item';

    const logHeader = document.createElement('div');
    logHeader.className = 'history-item-header';

    const loopLabel = currentLang === 'vi' ? `Vòng ${item.loop}` : `Loop ${item.loop}`;
    logHeader.innerHTML = `<span>${loopLabel}</span>`;

    const logValues = document.createElement('div');
    logValues.className = 'history-item-values';

    item.numbers.forEach(num => {
      const valBall = document.createElement('span');
      valBall.className = 'history-ball';
      valBall.textContent = num;
      logValues.appendChild(valBall);
    });

    logItem.appendChild(logHeader);
    logItem.appendChild(logValues);
    container.appendChild(logItem);
  }
}

// ---------- Initialize on Load ----------
window.addEventListener('DOMContentLoaded', () => {
  // Find browser language or use Vietnamese
  const userLang = navigator.language || navigator.userLanguage;
  if (userLang && userLang.toLowerCase().startsWith('en')) {
    setLanguage('en');
  } else {
    setLanguage('vi');
  }

  // Initialize default active state for presets
  document.querySelector('.presets-container .preset-btn').classList.add('active');
});
