(function () {
    let enabled = true;
    let keywords = [];
    let observer = null;

    // Load settings
    chrome.storage.sync.get(['enabled', 'keywords'
    ], function (data) {
        enabled = data.enabled !== undefined ? data.enabled : true;
        keywords = data.keywords || [];

        if (enabled) {
            startBlocking();
        }
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.enabled) {
            enabled = changes.enabled.newValue;
            if (enabled) {
                startBlocking();
            } else {
                stopBlocking();
            }
        }

        if (changes.keywords) {
            keywords = changes.keywords.newValue;
            if (enabled) {
                // Recheck all visible posts with new keywords
                checkExistingPosts();
            }
        }
    });

    function startBlocking() {
        if (observer) return;

        checkExistingPosts();

        // Set up observer to detect new posts as they're loaded
        observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i
                        ];
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            checkNode(node);
                        }
                    }
                }
            });
        });

        // Start observing the timeline
        observer.observe(document.body,
            {
                childList: true,
                subtree: true
            });
    }

    function stopBlocking() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        // Unhide any posts that were hidden
        const hiddenPosts = document.querySelectorAll('[data-politics-hidden="true"]');
        hiddenPosts.forEach(post => {
            post.style.display = '';
            post.removeAttribute('data-politics-hidden');
        });
    }

    function checkExistingPosts() {
        // Check tweets/posts in timeline
        // For X.com structure as of 2025 (this may need updating if X changes its DOM structure)
        const posts = document.querySelectorAll('article');
        posts.forEach(checkNode);
    }

    function checkNode(node) {
        // Skip if the blocker is disabled
        if (!enabled) return;

        // For X.com, we're looking for article elements which contain tweets
        if (node.tagName === 'ARTICLE' || node.querySelectorAll('article').length > 0) {
            const articles = node.tagName === 'ARTICLE' ? [node
            ] : node.querySelectorAll('article');

            articles.forEach(article => {
                const text = article.textContent.toLowerCase();

                // Check if post contains any political keywords
                if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
                    // Hide the political post
                    article.style.display = 'none';
                    article.setAttribute('data-politics-hidden', 'true');
                }
            });
        }
    }
})();
