document.addEventListener('DOMContentLoaded', function () {
    // UI Elements
    const blockerToggle = document.getElementById('blockerToggle');
    const keywordInput = document.getElementById('keywordInput');
    const addKeywordBtn = document.getElementById('addKeyword');
    const keywordsList = document.getElementById('keywordsList');
    const clearKeywordsBtn = document.getElementById('clearKeywords');
    const restoreDefaultsBtn = document.getElementById('restoreDefaults');
    const searchKeywords = document.getElementById('searchKeywords');
    const keywordCount = document.getElementById('keywordCount');
    const categorySelect = document.getElementById('categorySelect');
    const addCategoryBtn = document.getElementById('addCategory');
    const bulkImport = document.getElementById('bulkImport');
    const importKeywordsBtn = document.getElementById('importKeywords');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate selected tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Category keyword sets
    const keywordCategories = {
        conservative: [
            'MAGA', 'make america great again', 'america first', 'patriot', 'deep state',
            'freedom caucus', 'culture war', 'silent majority', 'traditional values',
            'family values', 'christian conservative', 'evangelical', 'second amendment',
            'gun rights', '2A', 'pro-life', 'anti-abortion', 'constitutional conservative',
            'small government', 'fiscal conservative', 'liberty', 'constitutional rights',
            'border security', 'illegal immigration', 'law and order', 'back the blue',
            'woke', 'anti-woke', 'cancel culture', 'tucker carlson', 'ben shapiro'
        ],
        progressive: [
            'progressive', 'liberal', 'leftist', 'democratic socialist', 'green new deal',
            'universal healthcare', 'medicare for all', 'social justice', 'climate justice',
            'BLM', 'black lives matter', 'LGBTQ+', 'reproductive rights', 'pro-choice',
            'wealth tax', 'income inequality', 'union', 'labor rights', 'living wage',
            'universal basic income', 'student debt', 'loan forgiveness', 'defund',
            'police reform', 'systemic racism', 'privilege', 'equity', 'inclusion',
            'gender equality', 'identity politics'
        ],
        politicians: [
            'trump', 'biden', 'harris', 'obama', 'clinton', 'desantis', 'sanders',
            'aoc', 'ocasio-cortez', 'warren', 'pelosi', 'mcconnell', 'cruz', 'rubio',
            'hawley', 'vance', 'scott', 'newsom', 'whitmer', 'abrams', 'buttigieg',
            'greene', 'boebert', 'jordan', 'cheney', 'gaetz', 'omar', 'tlaib',
            'pressley', 'bush', 'johnson', 'schumer', 'graham'
        ],
        media: [
            'fox news', 'cnn', 'msnbc', 'newsmax', 'oann', 'breitbart', 'huffpost',
            'mother jones', 'daily wire', 'daily caller', 'new york times', 'washington post',
            'wall street journal', 'politico', 'the hill', 'axios', 'vox', 'salon',
            'slate', 'buzzfeed', 'npr', 'pbs', 'abc news', 'cbs news', 'nbc news',
            'hannity', 'carlson', 'ingraham', 'maddow', 'lemon', 'shapiro'
        ],
        issues: [
            'abortion', 'gun control', 'immigration', 'climate change', 'healthcare',
            'taxes', 'inflation', 'economy', 'national debt', 'supreme court',
            'foreign policy', 'china', 'russia', 'ukraine', 'israel', 'palestine',
            'trade', 'tariffs', 'education', 'critical race theory', 'transgender',
            'voting rights', 'election integrity', 'January 6', 'infrastructure',
            'regulation', 'big tech', 'censorship', 'free speech', 'military'
        ]
    };

    // Default keywords list
    const defaultKeywords = [
        // General political terms
        'politics', 'election', 'democrat', 'republican', 'liberal', 'conservative',
        'congress', 'senate', 'president', 'government', 'policy', 'vote', 'campaign',
        'trump', 'biden', 'harris', 'political', 'politician', 'legislation'
    ];

    // Load saved settings
    chrome.storage.sync.get(['enabled', 'keywords'
    ], function (data) {
        if (data.enabled !== undefined) {
            blockerToggle.checked = data.enabled;
        }

        if (data.keywords && data.keywords.length > 0) {
            displayKeywords(data.keywords);
            updateKeywordCount(data.keywords);
        } else {
            // Initialize with default keywords + conservative terms
            const initialKeywords = [...defaultKeywords, ...keywordCategories.conservative
            ];
            chrome.storage.sync.set({
                keywords: initialKeywords
            });
            displayKeywords(initialKeywords);
            updateKeywordCount(initialKeywords);
        }
    });

    // Toggle blocker on/off
    blockerToggle.addEventListener('change', function () {
        chrome.storage.sync.set({
            enabled: blockerToggle.checked
        });
    });

    // Add keyword button
    addKeywordBtn.addEventListener('click', function () {
        addKeyword();
    });

    // Add keyword on Enter
    keywordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addKeyword();
        }
    });

    // Clear all keywords button
    clearKeywordsBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to remove all keywords?')) {
            chrome.storage.sync.set({
                keywords: []
            });
            displayKeywords([]);
            updateKeywordCount([]);
        }
    });

    // Restore default keywords button
    restoreDefaultsBtn.addEventListener('click', function () {
        if (confirm('Restore the default keyword list?')) {
            const initialKeywords = [...defaultKeywords, ...keywordCategories.conservative
            ];
            chrome.storage.sync.set({
                keywords: initialKeywords
            });
            displayKeywords(initialKeywords);
            updateKeywordCount(initialKeywords);
        }
    });

    // Search keywords
    searchKeywords.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        chrome.storage.sync.get('keywords', function (data) {
            const keywords = data.keywords || [];
            if (query) {
                const filtered = keywords.filter(keyword =>
                    keyword.toLowerCase().includes(query)
                );
                displayKeywords(filtered);
            } else {
                displayKeywords(keywords);
            }
        });
    });

    // Add category
    addCategoryBtn.addEventListener('click', function () {
        const category = categorySelect.value;
        if (category) {
            chrome.storage.sync.get('keywords', function (data) {
                let keywords = data.keywords || [];
                const categoryKeywords = keywordCategories[category
                ] || [];

                // Only add keywords that don't already exist
                const newKeywords = categoryKeywords.filter(keyword =>
                    !keywords.includes(keyword)
                );

                if (newKeywords.length > 0) {
                    keywords = [...keywords, ...newKeywords
                    ];
                    chrome.storage.sync.set({
                        keywords: keywords
                    });
                    displayKeywords(keywords);
                    updateKeywordCount(keywords);

                    alert(`Added ${newKeywords.length
                        } keywords from the ${category
                        } category.`);
                } else {
                    alert('All keywords from this category are already in your list.');
                }
            });
        } else {
            alert('Please select a category first.');
        }
    });

    // Import keywords
    importKeywordsBtn.addEventListener('click', function () {
        const text = bulkImport.value.trim();
        if (text) {
            // Split by commas or newlines
            const newKeywords = text.split(/[\n,]+/)
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (newKeywords.length > 0) {
                chrome.storage.sync.get('keywords', function (data) {
                    let keywords = data.keywords || [];

                    // Only add keywords that don't already exist
                    const uniqueNewKeywords = newKeywords.filter(keyword =>
                        !keywords.includes(keyword)
                    );

                    if (uniqueNewKeywords.length > 0) {
                        keywords = [...keywords, ...uniqueNewKeywords
                        ];
                        chrome.storage.sync.set({
                            keywords: keywords
                        });
                        displayKeywords(keywords);
                        updateKeywordCount(keywords);

                        alert(`Added ${uniqueNewKeywords.length
                            } new keywords.`);
                        bulkImport.value = '';
                    } else {
                        alert('All keywords you entered are already in your list.');
                    }
                });
            }
        } else {
            alert('Please enter some keywords first.');
        }
    });

    function addKeyword() {
        const keyword = keywordInput.value.trim();
        if (keyword) {
            chrome.storage.sync.get('keywords', function (data) {
                const keywords = data.keywords || [];
                if (!keywords.includes(keyword)) {
                    keywords.push(keyword);
                    chrome.storage.sync.set({
                        keywords: keywords
                    });
                    displayKeywords(keywords);
                    updateKeywordCount(keywords);
                    keywordInput.value = '';
                } else {
                    alert('This keyword is already in your list.');
                }
            });
        }
    }

    function displayKeywords(keywords) {
        keywordsList.innerHTML = '';
        keywords.forEach(function (keyword) {
            const item = document.createElement('div');
            item.className = 'keyword-item';

            const text = document.createElement('span');
            text.textContent = keyword;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', function () {
                removeKeyword(keyword);
            });

            item.appendChild(text);
            item.appendChild(removeBtn);
            keywordsList.appendChild(item);
        });
    }

    function removeKeyword(keyword) {
        chrome.storage.sync.get('keywords', function (data) {
            const keywords = data.keywords || [];
            const index = keywords.indexOf(keyword);
            if (index !== -1) {
                keywords.splice(index,
                    1);
                chrome.storage.sync.set({
                    keywords: keywords
                });
                displayKeywords(keywords);
                updateKeywordCount(keywords);
            }
        });
    }

    function updateKeywordCount(keywords) {
        keywordCount.textContent = `${keywords.length
            } keywords`;
    }
});
