// --- script.js (Simulator) ---
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loadQuestionsInput = document.getElementById('load-questions-input'); // Added
    const questionSetSelect = document.getElementById('question-set');
    const themeToggleButton = document.getElementById('theme-toggle');
    const startRestartButton = document.getElementById('start-restart');
    const endExamButton = document.getElementById('end-exam');
    const questionNumberEl = document.getElementById('question-number');
    const questionTopicEl = document.getElementById('question-topic');
    const questionTextEl = document.getElementById('question-text');
    const questionImageDisplayEl = document.getElementById('question-image-display'); // Added
    const optionsContainerEl = document.getElementById('options-container');
    const answerExplanationEl = document.getElementById('answer-explanation');
    const answerTextEl = document.getElementById('answer-text');
    const explanationTextEl = document.getElementById('explanation-text');
    const toggleAnswerButton = document.getElementById('toggle-answer');
    const prevQuestionButton = document.getElementById('prev-question');
    const nextQuestionButton = document.getElementById('next-question');
    const statusMessageEl = document.getElementById('status-message');
    const questionCardEl = document.getElementById('question-card');
    const scoreDisplayEl = document.getElementById('score-display');
    const correctCountEl = document.getElementById('correct-count');
    const totalAttemptedEl = document.getElementById('total-attempted');

    // State
    let allLoadedQuestions = []; // ** CHANGED: Store loaded questions here **
    let currentQuestions = [];   // Questions for the current set
    let currentQuestionIndex = -1;
    let totalQuestionsInSet = 0;
    let isAnswerShown = false;
    let isExamActive = false;
    let userAnswers = {};

    // --- Utility Functions --- (Keep shuffleArray)
    function shuffleArray(array) { /* ... as before ... */ for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

    // --- Core Functions ---
    function loadQuestion(index) {
        if (!isExamActive || index < 0 || index >= currentQuestions.length) {
            updateButtonStates(); // Update button states based on current index/activity
            return;
        }

        questionCardEl.style.display = 'block';
        scoreDisplayEl.style.display = 'none';
        const q = currentQuestions[index];
        const questionId = q.id;
        isAnswerShown = false;

        questionNumberEl.textContent = `Question ${index + 1} of ${totalQuestionsInSet}`;
        questionTopicEl.textContent = q.topic ? `Topic: ${q.topic}` : 'Topic: N/A';
        questionTextEl.textContent = q.question;

        // Handle Image Display
        if (q.image && q.image.trim() !== '') {
            questionImageDisplayEl.src = q.image.trim(); // Set src to filename
            questionImageDisplayEl.alt = `Image for question ${q.id}`;
            questionImageDisplayEl.style.display = 'block'; // Show image element
        } else {
            questionImageDisplayEl.style.display = 'none'; // Hide if no image
            questionImageDisplayEl.src = ''; // Clear src
        }


        optionsContainerEl.innerHTML = '';
        const previouslySelected = userAnswers[questionId];

        for (const key in q.options) {
            const optionEl = document.createElement('div');
            optionEl.classList.add('option');
            optionEl.dataset.optionKey = key;
            optionEl.innerHTML = `<span class="option-letter">${key}</span> ${q.options[key]}`;
            if (key === previouslySelected) {
                optionEl.classList.add('selected');
            }
            optionEl.addEventListener('click', () => handleOptionSelect(questionId, key, optionEl));
            optionsContainerEl.appendChild(optionEl);
        }

        answerExplanationEl.style.display = 'none';
        explanationTextEl.textContent = '';
        answerTextEl.textContent = '';
        toggleAnswerButton.textContent = 'Show Answer';

        statusMessageEl.textContent = `Question ${index + 1} loaded.`;
        updateButtonStates();
    }

    function handleOptionSelect(questionId, selectedKey, selectedElement) {
        if (!isExamActive) return;
        userAnswers[questionId] = selectedKey;
        const options = optionsContainerEl.querySelectorAll('.option');
        options.forEach(opt => opt.classList.remove('selected'));
        selectedElement.classList.add('selected');
        // Optional: Auto-next
        // setTimeout(nextQuestion, 300);
    }

    function toggleAnswer() {
        if (!isExamActive || currentQuestionIndex < 0 || currentQuestionIndex >= currentQuestions.length) return;
        const q = currentQuestions[currentQuestionIndex];
        if (isAnswerShown) {
            answerExplanationEl.style.display = 'none';
            toggleAnswerButton.textContent = 'Show Answer';
            isAnswerShown = false;
        } else {
            answerTextEl.textContent = q.answer;
            explanationTextEl.textContent = q.explanation || 'No explanation provided.';
            answerExplanationEl.style.display = 'block';
            toggleAnswerButton.textContent = 'Hide Answer';
            isAnswerShown = true;
        }
    }

    function nextQuestion() {
        if (!isExamActive) return;
        if (currentQuestionIndex < totalQuestionsInSet - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        } else {
            statusMessageEl.textContent = "You've reached the last question of the set.";
            updateButtonStates();
        }
    }

    function prevQuestion() {
        if (!isExamActive) return;
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion(currentQuestionIndex);
        } else {
            updateButtonStates();
        }
    }

    function updateButtonStates() {
        // Enable Start/Restart and Set Select ONLY if questions are loaded
        const questionsLoaded = allLoadedQuestions.length > 0;
        questionSetSelect.disabled = !questionsLoaded;
        startRestartButton.disabled = !questionsLoaded;

        // Nav/Action buttons depend on exam activity AND question index
        prevQuestionButton.disabled = !isExamActive || currentQuestionIndex <= 0;
        nextQuestionButton.disabled = !isExamActive || currentQuestionIndex >= totalQuestionsInSet - 1;
        toggleAnswerButton.disabled = !isExamActive || currentQuestionIndex < 0;
        endExamButton.disabled = !isExamActive;
    }

    function startQuestionSet() {
        // ** CHANGED: Use allLoadedQuestions **
        if (allLoadedQuestions.length === 0) {
            statusMessageEl.textContent = "Load questions file first!";
            return;
        }

        const selectedSet = questionSetSelect.value;
        let baseQuestions = [...allLoadedQuestions]; // Use the loaded questions
        currentQuestionIndex = -1;
        userAnswers = {};
        isExamActive = true; // Start the exam
        scoreDisplayEl.style.display = 'none';
        questionCardEl.style.display = 'none'; // Hide card until question loads

        // --- Selection logic based on allLoadedQuestions ---
        const totalAvailable = allLoadedQuestions.length;
        switch (selectedSet) {
            case 'all':
                currentQuestions = shuffleArray(baseQuestions);
                break;
            case 'random-50':
                currentQuestions = shuffleArray(baseQuestions).slice(0, Math.min(50, totalAvailable));
                 break;
            case 'range-1': currentQuestions = baseQuestions.slice(0, Math.min(50, totalAvailable)); break;
            case 'range-2': currentQuestions = baseQuestions.slice(50, Math.min(100, totalAvailable)); break;
            case 'range-3': currentQuestions = baseQuestions.slice(100, Math.min(150, totalAvailable)); break;
            case 'range-4': currentQuestions = baseQuestions.slice(150, Math.min(200, totalAvailable)); break;
            case 'range-5': currentQuestions = baseQuestions.slice(200, Math.min(250, totalAvailable)); break;
            case 'range-6': currentQuestions = baseQuestions.slice(250, Math.min(300, totalAvailable)); break;
            case 'range-7': currentQuestions = baseQuestions.slice(300, Math.min(350, totalAvailable)); break;
            case 'range-8': currentQuestions = baseQuestions.slice(350, Math.min(400, totalAvailable)); break;
            case 'range-9': currentQuestions = baseQuestions.slice(400, Math.min(450, totalAvailable)); break;
            case 'range-10': currentQuestions = baseQuestions.slice(450, totalAvailable); break; // Up to the end
            default:
                currentQuestions = [];
        }

        totalQuestionsInSet = currentQuestions.length;

        if (totalQuestionsInSet > 0) {
            currentQuestionIndex = 0;
            loadQuestion(currentQuestionIndex);
            statusMessageEl.textContent = `Set '${questionSetSelect.options[questionSetSelect.selectedIndex].text}' started (${totalQuestionsInSet} questions).`;
        } else {
            isExamActive = false;
            statusMessageEl.textContent = "No questions available for this selection in the loaded file.";
            updateButtonStates();
        }
    }

    function endExam() {
        if (!isExamActive) return;
        isExamActive = false;
        let correctCount = 0;

        // Score based on the *current set* (currentQuestions)
        currentQuestions.forEach(q => {
            if (userAnswers.hasOwnProperty(q.id) && userAnswers[q.id] === q.answer) {
                correctCount++;
            }
        });

        correctCountEl.textContent = correctCount;
        totalAttemptedEl.textContent = totalQuestionsInSet;
        scoreDisplayEl.style.display = 'block';
        questionCardEl.style.display = 'none';
        statusMessageEl.textContent = `Exam Ended. Score based on ${totalQuestionsInSet} questions in the set.`;
        updateButtonStates();
    }


    // ** NEW: Load questions from JSON file **
    function handleLoadQuestionsFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (isExamActive) {
            alert("Please end the current exam before loading new questions.");
            event.target.value = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (!Array.isArray(loadedData)) throw new Error("File is not a valid JSON array.");

                // Store loaded data globally for the simulator session
                allLoadedQuestions = loadedData;
                isExamActive = false; // Ensure exam is not active
                currentQuestionIndex = -1;
                currentQuestions = []; // Clear current set
                userAnswers = {}; // Clear answers

                statusMessageEl.textContent = `Loaded ${allLoadedQuestions.length} questions. Select a set and click Start/Restart.`;
                questionCardEl.style.display = 'none'; // Hide card
                scoreDisplayEl.style.display = 'none'; // Hide score
                updateButtonStates(); // Enable Start/Restart and Set Select

                 // Update range options based on loaded count
                 updateRangeOptions(allLoadedQuestions.length);


            } catch (error) {
                console.error("Error loading/parsing questions file:", error);
                statusMessageEl.textContent = `Error loading questions: ${error.message}.`;
                allLoadedQuestions = []; // Reset questions on error
                updateButtonStates(); // Disable controls
            } finally {
                 event.target.value = null; // Reset file input
            }
        };
        reader.onerror = () => {
            console.error("File reading error:", reader.error);
            statusMessageEl.textContent = `Error reading file.`;
            event.target.value = null;
        };
        reader.readAsText(file);
    }

     // ** NEW: Update range select options based on total questions **
     function updateRangeOptions(totalQuestions) {
        const lastOption = questionSetSelect.querySelector('option[value="range-10"]');
        if (lastOption) {
            if (totalQuestions <= 450) {
                 lastOption.textContent = `${451}-${totalQuestions}`; // Or just hide if you prefer
                 lastOption.disabled = true; // Disable if no questions in this range
            } else {
                 lastOption.textContent = `${451}-${totalQuestions}`;
                 lastOption.disabled = false;
            }
        }
        // You could add logic here to disable other ranges if totalQuestions is smaller
        for (let i = 1; i <= 10; i++) {
             const rangeOption = questionSetSelect.querySelector(`option[value="range-${i}"]`);
             if (rangeOption) {
                 const rangeStart = (i - 1) * 50;
                 if (rangeStart >= totalQuestions) {
                     rangeOption.disabled = true;
                     // Optionally hide: rangeOption.style.display = 'none';
                 } else {
                     rangeOption.disabled = false;
                     // Optionally show: rangeOption.style.display = '';
                      // Update text for last applicable range if not range-10
                     if (i < 10 && totalQuestions < i * 50) {
                         rangeOption.textContent = `${rangeStart + 1}-${totalQuestions}`;
                     } else if (i < 10) {
                           rangeOption.textContent = `${rangeStart + 1}-${i * 50}`; // Reset text if totalQuestions increased
                     }
                 }
             }
        }
    }


    // --- Theme Toggle --- (Keep as before)
     function applyTheme(theme) { /* ... */ if (theme === 'dark') { document.body.classList.add('dark-theme'); document.body.classList.remove('light-theme'); themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>'; } else { document.body.classList.remove('dark-theme'); document.body.classList.add('light-theme'); themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>'; } localStorage.setItem('examTheme', theme); }
     function toggleTheme() { /* ... */ const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light'; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

    // --- Initialization ---
    function initialize() {
        const savedTheme = localStorage.getItem('examTheme') || 'light';
        applyTheme(savedTheme);

        // Initial state: prompt user to load file
        statusMessageEl.textContent = "Please load the 'questions.json' file.";
        questionCardEl.style.display = 'none';
        scoreDisplayEl.style.display = 'none';
        updateButtonStates(); // Ensure controls are initially disabled

        // Add event listeners
        loadQuestionsInput.addEventListener('change', handleLoadQuestionsFile); // ** ADDED **
        startRestartButton.addEventListener('click', startQuestionSet);
        toggleAnswerButton.addEventListener('click', toggleAnswer);
        prevQuestionButton.addEventListener('click', prevQuestion);
        nextQuestionButton.addEventListener('click', nextQuestion);
        endExamButton.addEventListener('click', endExam);
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    initialize();
});