document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const mergeButton = document.getElementById('merge-button');
    const mergeFileInput = document.getElementById('merge-file-input');
    const saveButton = document.getElementById('save-button');
    const addVerseButton = document.getElementById('add-verse-button');
    const verseListContainer = document.getElementById('verse-list-container');
    const openButton = document.getElementById('open-button');
    const openFileInput = document.getElementById('open-file-input');
    const viewListButton = document.getElementById('view-list-button');
    const viewTileButton = document.getElementById('view-tile-button');
    const randomVerseButton = document.getElementById('random-verse-button');
    const randomVerseModal = document.getElementById('random-verse-modal');
    const randomVerseDisplay = document.getElementById('random-verse-display');
    const modalCloseButton = randomVerseModal.querySelector('.modal-close-btn');
    const showAnotherRandomButton = document.getElementById('show-another-random');
    const resetDataButton = document.getElementById('reset-data-button'); // New Reset Button

    // --- State Variables ---
    let versesData = []; // Holds the array of verse objects
    let currentView = 'list'; // Track current view ('list' or 'tile')
    const THEME_KEY = 'bibleViewerTheme';
    const LOCAL_STORAGE_KEY = 'bibleVersesData'; // Key for localStorage

    // --- Theme Handling ---
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
        const text = theme === 'dark' ? ' Light Mode' : ' Dark Mode';
        themeToggleButton.innerHTML = `<i class="fas ${icon}"></i>${text}`;
        localStorage.setItem(THEME_KEY, theme);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };

    const loadThemePreference = () => {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(savedTheme);
    };

    // --- Sanitization Helper ---
    const sanitize = (str) => {
        if (str === null || str === undefined) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        // Convert newlines to <br> for multi-line display in HTML
        return temp.innerHTML.replace(/\n/g, '<br>');
    };

    // --- Verse Rendering ---
    const renderVerses = () => {
        verseListContainer.innerHTML = '';
        verseListContainer.className = ''; // Clear existing classes first
        verseListContainer.classList.add(`view-${currentView}`);

        if (versesData.length === 0) {
            verseListContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">No verses loaded. Add a new verse, open, or merge a JSON file.</p>';
            return;
        }

        versesData.forEach((verse, index) => {
            if (!verse || typeof verse !== 'object') {
                console.warn(`Skipping invalid verse data at index ${index}:`, verse);
                return;
            }
            const verseElement = document.createElement('div');
            verseElement.classList.add('verse-item');
            verse.id = verse.id || `generated_${Date.now()}_${index}`;
            verseElement.setAttribute('data-id', verse.id);

            verseElement.innerHTML = `
                <p class="verse-ref">${sanitize(verse.reference || 'No Reference')}</p>
                <p class="verse-text">${sanitize(verse.text || 'No Text')}</p>
                <p class="verse-notes">${sanitize(verse.notes || '')}</p>
                <div class="verse-actions">
                    <button class="edit-btn" data-index="${index}" title="Edit Verse"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-index="${index}" title="Delete Verse"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            verseListContainer.appendChild(verseElement);
        });
    };

     // --- Helper function to save data to localStorage ---
     const saveDataToLocalStorage = () => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(versesData));
             // console.log("Data saved to localStorage"); // Optional feedback
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
            alert("Could not save data automatically. Local storage might be full or disabled.");
        }
    };

    // --- Editing Verses (Save to localStorage on save) ---
     const handleEdit = (index) => {
        const verse = versesData[index];
        if (!verse) return;
        const verseElement = verseListContainer.querySelector(`.verse-item[data-id="${verse.id}"]`);
        if (!verseElement || verseElement.classList.contains('editing')) return;

        verseElement.classList.add('editing');
        verseElement.dataset.originalRef = verse.reference;
        verseElement.dataset.originalText = verse.text;
        verseElement.dataset.originalNotes = verse.notes;

        const refValue = verse.reference || '';
        const textValue = verse.text || '';
        const notesValue = verse.notes || '';

        verseElement.innerHTML = `
            <label>Reference:</label>
            <input type="text" class="edit-input ref-input" placeholder="Reference (e.g., John 3:16)">
            <label>Verse Text:</label>
            <textarea class="edit-textarea text-input" placeholder="Verse text"></textarea>
            <label>Notes:</label>
            <textarea class="edit-textarea notes-input" placeholder="Notes"></textarea>
            <div class="verse-actions">
                <button class="save-edit-btn" data-index="${index}"><i class="fas fa-save"></i> Save</button>
                <button class="cancel-edit-btn" data-index="${index}"><i class="fas fa-times"></i> Cancel</button>
            </div>
        `;
         verseElement.querySelector('.ref-input').value = refValue;
         verseElement.querySelector('.text-input').value = textValue;
         verseElement.querySelector('.notes-input').value = notesValue;
         verseElement.querySelector('.ref-input').focus();
    };

    const handleSaveEdit = (index) => {
        const verse = versesData[index];
        if (!verse) return;
        const verseElement = verseListContainer.querySelector(`.verse-item[data-id="${verse.id}"]`);
        if (!verseElement || !verseElement.classList.contains('editing')) return;

        const refInput = verseElement.querySelector('.ref-input');
        const textInput = verseElement.querySelector('.text-input');
        const notesInput = verseElement.querySelector('.notes-input');

        versesData[index] = {
            ...verse,
            reference: refInput.value.trim(),
            text: textInput.value.trim(),
            notes: notesInput.value.trim()
        };
        saveDataToLocalStorage(); // <-- SAVE CHANGES
        renderVerses();
    };

    const handleCancelEdit = (index) => {
        renderVerses(); // Re-render discards changes
    };

     const handleDelete = (index) => {
        const verse = versesData[index];
        if (!verse) return;
        if (confirm(`Are you sure you want to delete "${verse.reference || 'this verse'}"? This action will be saved.`)) {
            versesData.splice(index, 1);
            saveDataToLocalStorage(); // <-- SAVE CHANGES
            renderVerses();
        }
    };

    // --- Add New Verse (Save to localStorage) ---
     const handleAddVerse = () => {
        const newId = `new_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const newVerse = { id: newId, reference: "", text: "", notes: "" };
        versesData.unshift(newVerse);
        saveDataToLocalStorage(); // <-- SAVE CHANGES
        renderVerses();

        setTimeout(() => {
            const newVerseIndex = versesData.findIndex(v => v.id === newId);
            if (newVerseIndex !== -1) {
                 handleEdit(newVerseIndex);
                 const newItemElement = verseListContainer.querySelector(`.verse-item[data-id="${newId}"]`);
                 if (newItemElement) {
                     newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
            }
        }, 100);
    };

    // --- File Reader Helper ---
    const readFileAsJson = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No file selected."));
            if (file.type !== 'application/json') return reject(new Error("Invalid file type. Please select a .json file."));

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!Array.isArray(data)) throw new Error("JSON file must contain an array.");

                    const validData = data.filter((item, index) => {
                         const isValid = typeof item === 'object' && item !== null && 'reference' in item && 'text' in item;
                         if (!isValid) console.warn(`Skipping invalid item at index ${index} in loaded file:`, item);
                         item.reference = item.reference || '';
                         item.text = item.text || '';
                         item.notes = item.notes || '';
                         item.id = item.id || `loaded_${Date.now()}_${index}`;
                         return isValid;
                    });
                    resolve(validData);
                } catch (error) {
                    reject(new Error(`Error parsing JSON: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error("Error reading file."));
            reader.readAsText(file);
        });
    };


    // --- Open File Logic (Saves opened data to localStorage) ---
    const handleOpenFile = async (event) => {
        const file = event.target.files[0];
        try {
            const newVerses = await readFileAsJson(file);
            versesData = newVerses; // Replace current data
            saveDataToLocalStorage(); // <-- SAVE LOADED DATA
            renderVerses();
            alert(`Successfully opened ${newVerses.length} verses. Data saved.`);
        } catch (error) {
            alert(`Error opening file: ${error.message}`);
        } finally {
            openFileInput.value = '';
        }
    };

    // --- Merge File Logic (Saves merged data to localStorage) ---
    const handleMergeFile = async (event) => {
        const file = event.target.files[0];
         try {
            const newVerses = await readFileAsJson(file);
            versesData = versesData.concat(newVerses); // Append new data
            saveDataToLocalStorage(); // <-- SAVE MERGED DATA
            renderVerses();
            alert(`Merged ${newVerses.length} verses. Total verses: ${versesData.length}. Data saved.`);
        } catch (error) {
             alert(`Error merging file: ${error.message}`);
        } finally {
            mergeFileInput.value = '';
        }
    };

    // --- Save to JSON File Logic (Reads from memory, doesn't affect localStorage) ---
    const handleSaveToFile = () => {
        if (versesData.length === 0) {
            alert("No verses to save."); return;
        }
        try {
            const dataToSave = versesData; // Save current state
            const jsonData = JSON.stringify(dataToSave, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_bible_verses.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error saving verses:", error);
            alert("An error occurred while saving the file.");
        }
    };

    // --- View Switching Logic ---
    const setActiveViewButton = () => {
        viewListButton.classList.toggle('active', currentView === 'list');
        viewTileButton.classList.toggle('active', currentView === 'tile');
    };

    const switchToView = (viewType) => {
        if (viewType !== currentView) {
            currentView = viewType;
            verseListContainer.className = '';
            verseListContainer.classList.add(`view-${currentView}`);
            setActiveViewButton();
        }
    };

    // --- Random Verse Logic ---
    const displayRandomVerseInModal = () => {
        if (versesData.length === 0) {
            randomVerseDisplay.innerHTML = "<p>No verses available to display.</p>"; return;
        }
        const randomIndex = Math.floor(Math.random() * versesData.length);
        const verse = versesData[randomIndex];

        const refElement = randomVerseDisplay.querySelector('.verse-ref');
        const textElement = randomVerseDisplay.querySelector('.verse-text');
        const notesElement = randomVerseDisplay.querySelector('.verse-notes');

        if (refElement) refElement.innerHTML = sanitize(verse.reference || 'No Reference');
        if (textElement) textElement.innerHTML = sanitize(verse.text || 'No Text');
        if (notesElement) {
            notesElement.innerHTML = sanitize(verse.notes || '');
            notesElement.style.display = verse.notes ? 'block' : 'none';
        }
    };

    const showRandomVerseModal = () => {
        displayRandomVerseInModal();
        randomVerseModal.classList.add('visible');
    };

    const hideRandomVerseModal = () => {
        randomVerseModal.classList.remove('visible');
    };

    // --- UPDATED: Initial Load Logic (Prioritize localStorage) ---
    const loadInitialData = async () => {
        // Set default view class before loading
        verseListContainer.classList.add(`view-${currentView}`);
        setActiveViewButton();

        let loadedFromStorage = false;
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if (Array.isArray(parsedData)) {
                    versesData = parsedData;
                    console.log(`Loaded ${versesData.length} verses from localStorage.`);
                    loadedFromStorage = true;
                } else {
                    console.warn("Invalid data format in localStorage. Clearing it.");
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                }
            } catch (error) {
                console.error("Error parsing data from localStorage:", error);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            }
        }

        // Fallback to verses.json ONLY if localStorage is empty/invalid
        if (!loadedFromStorage) {
            console.log("No valid data in localStorage, attempting to load default verses.json...");
            try {
                // *** Make sure you have a 'verses.json' file in the same directory ***
                // *** This file acts as the initial default data ***
                const response = await fetch('verses.json'); // Default filename
                 if (!response.ok) {
                     if (response.status === 404) {
                         console.warn("Default verses.json not found. Starting with an empty list.");
                         versesData = []; // Start empty if default JSON is missing
                     } else {
                         throw new Error(`HTTP error loading default verses! status: ${response.status}`);
                     }
                } else {
                    const data = await response.json();
                     if (Array.isArray(data)) {
                         versesData = data.map((item, index) => ({ // Ensure IDs
                            id: item.id || `initial_${Date.now()}_${index}`,
                            reference: item.reference || '',
                            text: item.text || '',
                            notes: item.notes || ''
                         }));
                         saveDataToLocalStorage(); // *** Save the loaded default data ***
                         console.log(`Loaded ${versesData.length} default verses from verses.json and saved to localStorage.`);
                     } else {
                         console.error("Invalid JSON structure in default verses.json.");
                         versesData = [];
                     }
                }
            } catch (error) {
                console.error("Could not load or parse default verses.json:", error);
                versesData = []; // Start empty on error
                 if (!error.message.includes('404')) {
                     verseListContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--accent-primary);">Could not load default verses. Check console.</p>';
                }
            }
        }

        // Render whatever data we ended up with
        renderVerses();
    };

    // --- NEW: Reset Data Logic ---
    const handleResetData = () => {
         if (confirm("⚠️ Are you sure you want to clear all saved verses and reload the default list from verses.json? This cannot be undone.")) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            versesData = []; // Clear memory immediately
            console.log("Local storage cleared. Reloading default data...");
            // Re-run the initial load logic, which will now fetch verses.json
            loadInitialData();
            alert("Data has been reset to default.");
        }
    }

    // --- Event Listeners ---
    themeToggleButton.addEventListener('click', toggleTheme);
    openButton.addEventListener('click', () => openFileInput.click());
    openFileInput.addEventListener('change', handleOpenFile);
    mergeButton.addEventListener('click', () => mergeFileInput.click());
    mergeFileInput.addEventListener('change', handleMergeFile);
    saveButton.addEventListener('click', handleSaveToFile);
    addVerseButton.addEventListener('click', handleAddVerse);
    viewListButton.addEventListener('click', () => switchToView('list'));
    viewTileButton.addEventListener('click', () => switchToView('tile'));
    randomVerseButton.addEventListener('click', showRandomVerseModal);
    modalCloseButton.addEventListener('click', hideRandomVerseModal);
    showAnotherRandomButton.addEventListener('click', displayRandomVerseInModal);
    resetDataButton.addEventListener('click', handleResetData); // Listener for Reset
    randomVerseModal.addEventListener('click', (event) => {
        if (event.target === randomVerseModal) hideRandomVerseModal();
    });

    // Event delegation for list items
    verseListContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;
        const verseItem = target.closest('.verse-item');
        if (!verseItem) return;
        const verseId = verseItem.dataset.id;
        const index = versesData.findIndex(verse => verse && verse.id === verseId);

        if (index === -1) { console.error("Verse index not found for ID:", verseId); return; }

        if (target.classList.contains('edit-btn')) handleEdit(index);
        else if (target.classList.contains('delete-btn')) handleDelete(index);
        else if (target.classList.contains('save-edit-btn')) handleSaveEdit(index);
        else if (target.classList.contains('cancel-edit-btn')) handleCancelEdit(index);
    });

    // --- Initial Load ---
    loadThemePreference();
    loadInitialData(); // Load data from localStorage or fallback to JSON

});