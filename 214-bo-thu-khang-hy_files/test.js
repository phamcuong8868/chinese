const RadicalTest = (() => 
{
    const root = document.getElementById("test");

    if (!root) return { init() {} };

    const STORAGE = 
    {
        history: "radical_test_history",
        progress: "radical_test_progress"
    };

    const TOTAL_QUESTIONS = 30;
    const LEVEL_QUESTIONS = Math.floor(TOTAL_QUESTIONS * 0.9);
    const TOTAL_TIME = 30 * 60;

    let bank = [];
    let questions = [];
    let answers = [];
    let current = 0;
    let remaining = TOTAL_TIME;
    let timer = null;
    let started = false;

    // =========================
    // 1. TIỆN ÍCH
    // =========================

    function esc(value) 
    {
        return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
        })[c]);
    }

    function formatSubtitle(value)
    {
        return String(value ?? "").split("<br>").map(esc).join("<br>");
    }

    function addSupplementaryInfo(subtitle, radical, type)
    {
        const askedField = {
            hanviet: "hanviet",
            pinyin: "pinyin",
            meaning: "meaning",
            strokes: "strokes",
            id: "id"
        }[type];
        const info = [];

        const readings = [];
        if (askedField !== "hanviet" && radical.hanviet) readings.push(radical.hanviet);
        if (askedField !== "pinyin" && radical.pinyin) readings.push(radical.pinyin);
        if (readings.length) {
            const reading = readings.length === 2
                ? `${readings[0]} (${readings[1]})`
                : readings[0];
            info.push(reading);
        }
        if (askedField !== "meaning" && radical.meaning) info.push(radical.meaning);
        if (askedField !== "id") info.push(`${radical.id}/214`);

        return `${subtitle}<br>${info.join(" - ")}`;
    }

    
    function read(key, fallback) 
    {
        try 
        {
            return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } 
        catch 
        {
            return fallback;
        }
    }

    function save(key, value) 
    {
        try {
        localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
        console.warn("Không lưu được dữ liệu test:", error);
        }
    }


    function shuffle(array) 
    {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

    function formatTime(seconds) 
    {
            seconds = Math.max(0, seconds);
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    // =========================
    // 2. TẠO CÂU HỎI
    // =========================
    function makeQuestion(radical, type, title, subtitle, field) 
    {
        const correct = radical[field];
        if (correct === undefined || correct === null || correct === "") 
        {
            return null;
        }

        // Tạo tập đáp án sai, không trùng đáp án đúng.
        const wrong = 
        [...new Set(
            radicals
            .filter(r => r.id !== radical.id)
            .map(r => String(r[field] ?? ""))
            .filter(value =>
                value !== "" &&
                value !== String(correct)
            )
        )];

        if (wrong.length < 3) return null;
        
        const options = shuffle([
            String(correct),
            ...shuffle(wrong).slice(0, 3)
        ]);

        return {
            radicalId: radical.id,
            radicalChar: radical.char,
            type,
            title,
            subtitle: addSupplementaryInfo(subtitle, radical, type),
            answer: String(correct),
            options
        };
    }

    // Câu hỏi mở rộng dựa trên ví dụ trong dữ liệu.
    function makeExampleQuestion(radical, example, index) 
    {
        const [chars, pinyin, meaning] = example;
        if (!chars || !pinyin || !meaning) return [];
        const result = [];

        const pinyinOptions = [
        ...new Set(
            radicals.map(r => r.pinyin).filter(
            value => value && value !== pinyin
            )
        )
        ];

        if (pinyinOptions.length >= 3) {
        result.push({
            radicalId: radical.id,
            radicalChar: radical.char,
            type: "examplePinyin",
            title: `Phiên âm của chữ "${chars}" là gì?`,
            subtitle: addSupplementaryInfo(`这个字“${chars}”的拼音是什么？`, radical, "example"),
            answer: pinyin,
            options: shuffle([
            pinyin,
            ...shuffle(pinyinOptions).slice(0, 3)
            ])
        });
        }

        const meaningOptions = [
        ...new Set(
            radicals.map(r => r.meaning).filter(
            value => value && value !== meaning
            )
        )
        ];

        if (meaningOptions.length >= 3) 
        {
            result.push({
                radicalId: radical.id,
                radicalChar: radical.char,
                type: "exampleMeaning",
                title: `Chữ "${chars}" có nghĩa là gì?`,
                subtitle: addSupplementaryInfo(`“${chars}”是什么意思？`, radical, "example"),
                answer: meaning,
                options: shuffle([
                meaning,
                ...shuffle(meaningOptions).slice(0, 3)
                ])
            });
        }
        return result;
    }

    function buildBank() 
    {
        const result = [];
        radicals.forEach(r => 
        {
            const add = q => {
                if (q) result.push(q);
            };

            add(makeQuestion(
                r,
                "hanviet",
                `Âm Hán Việt của bộ thủ "${r.char}" là gì?`,
                `部首“${r.char}”的汉越音是什么？`,
                "hanviet"
            ));

            add(makeQuestion(
                r,
                "pinyin",
                `Phiên âm Pinyin của bộ thủ "${r.char}" là gì?`,
                `部首“${r.char}”的拼音是什么？`,
                "pinyin"
            ));

            add(makeQuestion(
                r,
                "meaning",
                `Bộ thủ "${r.char}" có nghĩa là gì?`,
                `部首“${r.char}”是什么意思？`,
                "meaning"
            ));

            add(makeQuestion(
                r,
                "strokes",
                `Số nét của bộ thủ "${r.char}" là bao nhiêu?`,
                `部首“${r.char}”有几画？`,
                "strokes"
            ));

            add(makeQuestion(
                r,
                "id",
                `Vị trí của bộ thủ "${r.char}" trong bảng Khang Hy là số mấy?`,
                `“${r.char}”在康熙部首表中排第几？`,
                "id"
            ));

            // Thêm câu hỏi về chữ ví dụ đã có.
            const examples = details[r.char]?.examples || exactExamples[r.char] || [];

            examples.forEach(example => 
            {
                result.push(...makeExampleQuestion(r, example));
            });
        });
        return result;
    }


    function getMasteredCount(progress) {
        return radicals.filter(r => {
        const p = progress[String(r.id)];

        return p &&
            p.attempts >= 3 &&
            p.correct >= 3 &&
            p.correct / p.attempts >= 0.8;
        }).length;
    }

    function getLevel(mastered) {
        const percent = mastered / radicals.length * 100;
        return percent > 75 ? 4
            : percent > 50 ? 3
            : percent > 25 ? 2
            : 1;
    }

  // =========================
  // 3. CHỌN 30 CÂU
  // =========================

  function buildTest() {
    bank = buildBank();

    if (bank.length < TOTAL_QUESTIONS) {
      alert("Kho câu hỏi chưa đủ 30 câu.");
      return false;
    }

    const mastered = getMasteredCount(read(STORAGE.progress, {}));
    const level = getLevel(mastered);
    const maxRadicalId = Math.ceil(radicals.length * level / 4);
    const levelBank = bank.filter(q => q.radicalId <= maxRadicalId);

    const selectQuestions = (pool, count, excluded = new Set()) => {
      const groups = new Map();

      pool.filter(q => !excluded.has(q)).forEach(q => {
        if (!groups.has(q.radicalId)) {
          groups.set(q.radicalId, []);
        }

        groups.get(q.radicalId).push(q);
      });

      const selected = [];

      shuffle([...groups.values()]).forEach(group => {
        if (selected.length < count) {
          selected.push(shuffle(group)[0]);
        }
      });

      if (selected.length < count) {
        const used = new Set([...excluded, ...selected]);
        selected.push(
          ...shuffle(pool.filter(q => !used.has(q)))
            .slice(0, count - selected.length)
        );
      }

      return selected;
    };

    const selected = selectQuestions(levelBank, LEVEL_QUESTIONS);
    selected.push(
      ...selectQuestions(
        bank,
        TOTAL_QUESTIONS - LEVEL_QUESTIONS,
        new Set(selected)
      )
    );

    questions = shuffle(
      selected.slice(0, TOTAL_QUESTIONS)
    );

    answers = Array(TOTAL_QUESTIONS).fill(null);
    current = 0;
    remaining = TOTAL_TIME;

    return true;
  }

  // =========================
  // 4. MÀN HÌNH LÀM BÀI
  // =========================

  function start() {
    if (!buildTest()) return;

    started = true;
    renderQuestion();

    clearInterval(timer);

    timer = setInterval(() => {
      remaining--;

      const clock = root.querySelector("[data-clock]");

      if (clock) {
        clock.textContent = formatTime(remaining);

        if (remaining <= 60) {
          clock.style.color = "#dc2626";
        }
      }

      if (remaining <= 0) {
        finish(true);
      }
    }, 1000);
  }

  function saveAnswer() {
    const selected = root.querySelector(
      'input[name="radical-answer"]:checked'
    );

    answers[current] = selected
      ? Number(selected.value)
      : null;
  }

  function renderQuestion() {
    const q = questions[current];

    root.innerHTML = `        
      <div class="test-card">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:12px
        ">
          <strong>Câu ${current + 1}/${TOTAL_QUESTIONS}</strong>
          <strong data-clock>${formatTime(remaining)}</strong>
        </div>

        <div class="test-progress">
          <div style="
            width:${(current + 1) / TOTAL_QUESTIONS * 100}%
          "></div>
        </div>

        <div class="test-question">
          ${esc(q.title)}
          <div class="test-chinese">${formatSubtitle(q.subtitle)}</div>
        </div>

        <div class="test-options">
          ${q.options.map((option, i) => `
            <label class="test-option">
              <input
                type="radio"
                name="radical-answer"
                value="${i}"
                ${answers[current] === i ? "checked" : ""}
              >
              <span>
                ${String.fromCharCode(65 + i)}. ${esc(option)}
              </span>
            </label>
          `).join("")}
        </div>

        <div style="display:flex;gap:8px;margin-top:18px">

          <button
            class="test-btn test-btn-secondary"
            id="test-prev"
            ${current === 0 ? "disabled" : ""}
          >
            ← Lùi
          </button>

          <button
            class="test-btn"
            id="test-next"
            style="flex:1"
          >
            ${current === TOTAL_QUESTIONS - 1
              ? "Nộp bài"
              : "Tiếp →"}
          </button>
            <button
                class="test-btn" id="testing-boQua"
                style="width:28%; background: #999"
                >
                Bỏ qua
            </button>

        </div>

      </div>
    `;

    root.querySelector("#test-prev").onclick = () => {
      saveAnswer();

      if (current > 0) {
        current--;
        renderQuestion();
      }
    };

    root.querySelector("#test-next").onclick = () => {
      saveAnswer();

      if (current < TOTAL_QUESTIONS - 1) {
        current++;
        renderQuestion();
      } else {
        finish(false);
      }
    };

    root.querySelector("#testing-boQua").onclick = () => {
        renderHome(); // Dừng timer và đưa nội dung bài test về giao diện home
        document.getElementById("menuScreen").style.display = "block";
        root.style.display = "none";
    };
  }

  // =========================
  // 5. CHẤM ĐIỂM
  // =========================

  function finish(timeUp = false) {
    if (!started) return;

    started = false;
    clearInterval(timer);

    saveAnswer();

    let score = 0;

    questions.forEach((q, i) => {
      if (
        answers[i] !== null &&
        q.options[answers[i]] === q.answer
      ) {
        score++;
      }
    });

    const result = {
      date: new Date().toISOString(),
      score,
      total: TOTAL_QUESTIONS,
      percent: Math.round(score / TOTAL_QUESTIONS * 100),
      timeUsed: TOTAL_TIME - remaining,
      timeUp
    };

    const history = read(STORAGE.history, []);
    history.unshift(result);
    save(STORAGE.history, history.slice(0, 100));
    updateProgress();

    root.innerHTML = `
      <div class="test-card">

        <div class="test-title">Kết quả bài test</div>

        <div class="test-stats">
          <div class="test-stat">
            <strong>${score}/${TOTAL_QUESTIONS}</strong>
            <span class="test-muted">Câu đúng</span>
          </div>

          <div class="test-stat">
            <strong>${result.percent}%</strong>
            <span class="test-muted">Điểm số</span>
          </div>

          <div class="test-stat">
            <strong>${formatTime(result.timeUsed)}</strong>
            <span class="test-muted">Thời gian</span>
          </div>
        </div>

        <p>
          ${timeUp
            ? "Đã hết giờ làm bài."
            : "Bạn đã hoàn thành bài test."}
        </p>

        <button class="test-btn" id="test-review">
          Xem lại đáp án
        </button>

        <button
          class="test-btn test-btn-secondary"
          id="test-home"
        >
          Về màn hình chính
        </button>

      </div>
    `;

    root.querySelector("#test-review").onclick = showReview;
    root.querySelector("#test-home").onclick = renderHome;
  }

  // =========================
  // 6. THEO DÕI TỪNG BỘ THỦ
  // =========================

  function updateProgress() {
    const progress = read(STORAGE.progress, {});

    questions.forEach((q, i) => {
      const key = String(q.radicalId);

      if (!progress[key]) {
        progress[key] = {
          attempts: 0,
          correct: 0
        };
      }

      progress[key].attempts++;

      if (
        answers[i] !== null &&
        q.options[answers[i]] === q.answer
      ) {
        progress[key].correct++;
      }
    });

    save(STORAGE.progress, progress);
  }

  // =========================
  // 7. XEM LẠI ĐÁP ÁN
  // =========================

  function showReview() {
    root.innerHTML = `
      <div class="test-card" style="height: 100%; display: grid; grid-template-rows: 60px 1fr 60px;">
            <div class="test-title">Xem lại đáp án</div>
            <div style="overflow: scroll;">
                ${questions.map((q, i) => {
                const selected = answers[i];
                const correct = selected !== null && q.options[selected] === q.answer;

                return `
                    <div style="
                        padding:12px 0;
                        border-bottom:1px solid #e5e7eb;
                    ">
                        <strong>${i + 1}. ${esc(q.title)}</strong>
                        <div class="test-muted">
                            ${formatSubtitle(q.subtitle)}
                        </div>
                        <p class="${correct ? "test-correct" : "test-wrong"}">
                            ${correct ? "✓ Chính xác" : "✗ Chưa chính xác"}
                        </p>
                        <p>
                            Bạn chọn:
                            <strong>
                            ${selected === null
                                ? "Chưa trả lời"
                                : esc(q.options[selected])}
                            </strong>
                        </p>
                        <p>
                            Đáp án đúng:
                            <strong>${esc(q.answer)}</strong>
                        </p>
                        <p class="test-muted">
                            Bộ thủ ${esc(q.radicalChar)} ·
                            ${q.radicalId}/214
                        </p>
                    </div>
                `;
                }).join("")}
            </div>

            <button class="test-btn" id="test-home">
                Về màn hình chính
            </button>
      </div>
    `;

    root.querySelector("#test-home").onclick = renderHome;
    root.querySelector("#review_back").onclick = renderHome;    
  }

  // =========================
  // 8. MÀN HÌNH CHUẨN BỊ
  // =========================

  function renderHome() {
    started = false;
    clearInterval(timer);

    const history = read(STORAGE.history, []);
    const progress = read(STORAGE.progress, {});

    const mastered = getMasteredCount(progress);

    const percent = Math.round(mastered / 214 * 100);
    const level = getLevel(mastered);
    const maxRadicalId = Math.ceil(214 * level / 4);

    root.innerHTML = `
        <div class="test-card">
            <div style="font-size:26px;font-weight:bold">
                📊 ${mastered}/214 bộ thủ
            </div>

            <div class="test-progress">
                <div style="width:${percent}%"></div>
            </div>

            <p class="test-muted">
                Bạn đã nắm vững khoảng ${percent}% số bộ thủ.
            </p>
        </div>

        <div class="test-card">            

            <button
                class="test-btn"
                id="test-start"
                style="width:70%;"
            >
                Bắt đầu kiểm tra<br>开始测试<br>(kāishǐ cèshì)
            </button>
            <button
                class="test-btn"
                style="width:28%; background: white; border: 1px solid #999; color: #000;"
                onclick="document.getElementById('menuScreen').style.display='block';document.getElementById('test').style.display='none';"
            >
                Bỏ qua<br>跳过<br>(tiàoguò)
            </button>
      </div>

      

      <div class="test-card">
        <div class="test-title">📚 Lịch sử làm bài 答题历史 (dá tí lìshǐ)</div>
        ${history.length ? `
          <div class="test-history" style="overflow:scroll;max-height: 50vh;">

            ${history.slice(0, 10).map(item => `
              <div class="test-history-row">

                <div>
                  <strong>
                    ${item.score}/${item.total} câu đúng
                  </strong>

                  <div class="test-muted">
                    ${new Date(item.date).toLocaleString("vi-VN")}
                  </div>
                </div>

                <strong>${item.percent}%</strong>

              </div>
            `).join("")}

          </div>
        ` : `
          <p class="test-muted">
            Bạn chưa hoàn thành bài test nào.
          </p>
        `}

      </div>
    `;

    root.querySelector("#test-start").onclick = start;
  }

  // =========================
  // 9. KHỞI TẠO
  // =========================

  function init() {
    if (!Array.isArray(radicals) || radicals.length === 0) {
      root.innerHTML = `
        <div class="test-card">
          Chưa có dữ liệu bộ thủ.
        </div>
      `;

      return;
    }

    renderHome();
  }

  return {
    init,
    renderHome,
    buildBank
  };
})();

RadicalTest.init();
