const countries = {
  ch: {
    name: "Schweiz",
    min: 1,
    max: 6,
    step: 0.1,
    defaultGrade: 5,
    higherIsBetter: true,
    format: value => value.toFixed(2)
  },
  de: {
    name: "Deutschland",
    min: 1,
    max: 6,
    step: 0.1,
    defaultGrade: 2,
    higherIsBetter: false,
    format: value => value.toFixed(2)
  },
  at: {
    name: "Österreich",
    min: 1,
    max: 5,
    step: 0.1,
    defaultGrade: 2,
    higherIsBetter: false,
    format: value => value.toFixed(2)
  },
  fr: {
    name: "Frankreich",
    min: 0,
    max: 20,
    step: 0.1,
    defaultGrade: 12,
    higherIsBetter: true,
    format: value => value.toFixed(2)
  },
  us: {
    name: "USA (GPA)",
    min: 0,
    max: 4,
    step: 0.01,
    defaultGrade: 3,
    higherIsBetter: true,
    format: value => value.toFixed(2)
  },
  uk: {
    name: "Grossbritannien (%)",
    min: 0,
    max: 100,
    step: 1,
    defaultGrade: 70,
    higherIsBetter: true,
    format: value => `${Math.round(value)}%`
  }
};

const countrySelect = document.getElementById("countrySelect");
const gradeList = document.getElementById("gradeList");
const average = document.getElementById("average");
const historyList = document.getElementById("historyList");
const savedCount = document.getElementById("savedCount");
const template = document.getElementById("gradeTemplate");

let currentCountry = localStorage.getItem("grade-country") || "ch";
let grades = JSON.parse(localStorage.getItem("grade-current") || "[]");
let history = JSON.parse(localStorage.getItem("grade-history") || "[]");

Object.entries(countries).forEach(([key, country]) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = country.name;
  countrySelect.appendChild(option);
});

countrySelect.value = currentCountry;

if (!grades.length) {
  grades = [{ value: "", weight: 1 }];
}

function saveCurrent() {
  localStorage.setItem("grade-current", JSON.stringify(grades));
  localStorage.setItem("grade-country", currentCountry);
}

function render() {
  const country = countries[currentCountry];
  countrySelect.value = currentCountry;
  gradeList.innerHTML = "";

  grades.forEach((grade, index) => {
    const row = template.content.firstElementChild.cloneNode(true);
    const gradeInput = row.querySelector(".grade-input");
    const weightInput = row.querySelector(".weight-input");

    gradeInput.min = country.min;
    gradeInput.max = country.max;
    gradeInput.step = country.step;
    gradeInput.value = grade.value;
    gradeInput.placeholder = `${country.min}–${country.max}`;

    weightInput.value = grade.weight;

    gradeInput.addEventListener("input", () => {
      grades[index].value = gradeInput.value;
      calculate();
      saveCurrent();
    });

    weightInput.addEventListener("input", () => {
      grades[index].weight = weightInput.value;
      calculate();
      saveCurrent();
    });

    row.querySelector(".remove-button").addEventListener("click", () => {
      grades.splice(index, 1);
      if (!grades.length) grades.push({ value: "", weight: 1 });
      saveCurrent();
      render();
    });

    gradeList.appendChild(row);
  });

  calculate();
  renderHistory();
}

function calculate() {
  const valid = grades.filter(g => {
    const value = Number(g.value);
    const weight = Number(g.weight);
    const c = countries[currentCountry];
    return Number.isFinite(value) &&
      value >= c.min &&
      value <= c.max &&
      Number.isFinite(weight) &&
      weight > 0;
  });

  if (!valid.length) {
    average.textContent = "–";
    return;
  }

  const totalWeight = valid.reduce((sum, g) => sum + Number(g.weight), 0);
  const total = valid.reduce((sum, g) => sum + Number(g.value) * Number(g.weight), 0);
  const result = total / totalWeight;

  average.textContent = countries[currentCountry].format(result);
}

function saveAverage() {
  const text = average.textContent;
  if (text === "–") return;

  const entry = {
    value: text,
    country: currentCountry,
    countryName: countries[currentCountry].name,
    date: new Date().toLocaleString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  history.unshift(entry);
  history = history.slice(0, 30);
  localStorage.setItem("grade-history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  savedCount.textContent = history.length;

  if (!history.length) {
    historyList.innerHTML = '<div class="empty">Noch keine gespeicherten Ergebnisse</div>';
    return;
  }

  historyList.innerHTML = "";

  history.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-item";

    row.innerHTML = `
      <div class="history-main">
        <span class="history-value">${escapeHtml(item.value)}</span>
        <span class="history-meta">${escapeHtml(item.countryName)} · ${escapeHtml(item.date)}</span>
      </div>
      <button class="history-delete" type="button" aria-label="Eintrag löschen">×</button>
    `;

    row.querySelector(".history-delete").addEventListener("click", () => {
      history.splice(index, 1);
      localStorage.setItem("grade-history", JSON.stringify(history));
      renderHistory();
    });

    historyList.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.getElementById("addGrade").addEventListener("click", () => {
  grades.push({ value: "", weight: 1 });
  saveCurrent();
  render();
});

document.getElementById("clearAll").addEventListener("click", () => {
  grades = [{ value: "", weight: 1 }];
  saveCurrent();
  render();
});

countrySelect.addEventListener("change", () => {
  saveAverage();
  currentCountry = countrySelect.value;
  grades = [{ value: "", weight: 1 }];
  saveCurrent();
  render();
});

render();
