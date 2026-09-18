// ============================================
// Mobile Menu Toggle
// ============================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const themeStorageKey = 'tmcTheme';

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }

    return 'light';
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    const toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
        toggleButton.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        toggleButton.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

function toggleTheme() {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
}

function injectThemeToggle() {
    if (document.getElementById('themeToggle')) {
        return;
    }

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = 'themeToggle';
    toggleButton.className = 'theme-toggle';
    toggleButton.addEventListener('click', toggleTheme);

    const themeToggleItem = document.createElement('li');
    themeToggleItem.className = 'nav-item theme-toggle-item';
    themeToggleItem.appendChild(toggleButton);

    if (navMenu) {
        navMenu.appendChild(themeToggleItem);
    } else {
        document.body.appendChild(toggleButton);
    }

    applyTheme(document.body.dataset.theme || getPreferredTheme());
}

applyTheme(getPreferredTheme());
document.addEventListener('DOMContentLoaded', injectThemeToggle);

// ============================================
// PWA Custom Splash Screen
// ============================================
window.addEventListener('load', () => {
    const splash = document.getElementById('pwa-splash');
    if (!splash) return;
    
    setTimeout(() => {
        splash.classList.add('hidden');
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 400);
    }, 5000);
});

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Close menu when a link is clicked
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu && navToggle) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});

// ============================================
// Dropdown Menu Toggle (Mobile)
// ============================================
const dropdownItems = document.querySelectorAll('.dropdown');
dropdownItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    if (link) {
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                item.classList.toggle('active');
            }
        });
    }
});

// ============================================
// Photo Preview Modal
// ============================================
const photoModal = document.getElementById('photoModal');

if (photoModal) {
    const photoModalImage = document.getElementById('photoModalImage');
    const photoModalTitle = document.getElementById('photoModalTitle');
    const photoModalCaption = document.getElementById('photoModalCaption');
    const photoModalDownload = document.getElementById('photoModalDownload');
    const photoCloseTargets = photoModal.querySelectorAll('[data-photo-close]');
    const photoCards = document.querySelectorAll('body > section .media-card a[href]');
    const photoFilterButtons = Array.from(document.querySelectorAll('[data-photo-filter]'));
    let activePhotoFilter = 'all';
    let lastFocusedElement = null;

    function applyPhotoFilter() {
        document.querySelectorAll('.photo-card').forEach(card => {
            const category = card.dataset.category || 'all';
            const isVisible = activePhotoFilter === 'all' || category === activePhotoFilter;
            card.hidden = !isVisible;
        });
    }

    photoFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            activePhotoFilter = button.dataset.photoFilter || 'all';
            photoFilterButtons.forEach(item => {
                const isActive = item === button;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });
            applyPhotoFilter();
        });
    });

    applyPhotoFilter();

    const openPhotoModal = (imageUrl, imageAlt, titleText, captionText) => {
        if (!photoModal || !photoModalImage || !photoModalDownload) {
            return;
        }

        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        photoModalImage.src = imageUrl;
        photoModalImage.alt = imageAlt || titleText || 'Photo preview';
        photoModalDownload.href = imageUrl;
        photoModalDownload.setAttribute('download', '');
        photoModalTitle.textContent = titleText || 'Photo Preview';
        photoModalCaption.textContent = captionText || '';
        photoModal.hidden = false;
        photoModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('photo-modal-open');
        photoModal.querySelector('.photo-modal-close')?.focus();
    };

    const closePhotoModal = () => {
        if (!photoModal) {
            return;
        }

        photoModal.hidden = true;
        photoModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('photo-modal-open');
        if (photoModalImage) {
            photoModalImage.src = '';
        }
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    };

    photoCards.forEach((link) => {
        const card = link.closest('.media-card');
        const heading = card ? card.querySelector('h3') : null;
        const paragraph = card ? card.querySelector('p') : null;

        link.addEventListener('click', (event) => {
            event.preventDefault();
            openPhotoModal(
                link.href,
                link.querySelector('img')?.alt || heading?.textContent || 'Photo preview',
                heading?.textContent || 'Photo Preview',
                paragraph?.textContent || ''
            );
        });
    });

    photoCloseTargets.forEach((target) => {
        target.addEventListener('click', closePhotoModal);
    });

    // Download button: fetch the image as a blob and save locally without navigating away.
    photoModalDownload.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const imageUrl = photoModalDownload.href;
        if (!imageUrl) return;
        const originalText = photoModalDownload.textContent;
        try {
            photoModalDownload.textContent = 'Downloading...';
            // Fetch image as blob
            const resp = await fetch(imageUrl, { mode: 'cors' });
            if (!resp.ok) throw new Error('Network response was not ok');
            const blob = await resp.blob();
            // Derive a filename from the URL
            let filename = 'photo.jpg';
            try {
                const urlObj = new URL(imageUrl);
                const parts = urlObj.pathname.split('/');
                filename = parts.pop() || filename;
            } catch (e) {
                // ignore
            }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            // Revoke after a minute
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            photoModalDownload.textContent = originalText;
        } catch (err) {
            console.error('Download failed:', err);
            photoModalDownload.textContent = originalText;
            // Fallback: open original URL in new tab for user to download
            window.open(imageUrl, '_blank');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !photoModal.hidden) {
            closePhotoModal();
        }
    });

    
}

// ============================================
// Radio Player Controls
// ============================================
const playBtn = document.getElementById('playBtn');
const volumeControl = document.getElementById('volumeControl');

let isPlaying = false;

if (playBtn) {
    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playBtn.textContent = '⏸ Pause';
            playBtn.style.background = '#666';
        } else {
            playBtn.textContent = '▶ Play';
            playBtn.style.background = 'var(--primary-color)';
        }
    });
}

if (volumeControl) {
    volumeControl.addEventListener('input', (e) => {
        console.log('Volume: ' + e.target.value + '%');
    });
}

// ============================================
// Premium Archive.org Audio Player
// ============================================
const audioPlayer = document.querySelector('[data-audio-player]');

if (audioPlayer) {
    const audio = audioPlayer.querySelector('[data-audio-element]');
    const toggleButton = audioPlayer.querySelector('[data-audio-toggle]');
    const retryButton = audioPlayer.querySelector('[data-audio-retry]');
    const seekBar = audioPlayer.querySelector('[data-audio-seek]');
    const currentTimeEl = audioPlayer.querySelector('[data-current-time]');
    const durationEl = audioPlayer.querySelector('[data-duration]');
    const statusTextEl = audioPlayer.querySelector('[data-status-text]');
    const errorBox = audioPlayer.querySelector('[data-audio-error]');
    const playIcon = audioPlayer.querySelector('[data-play-icon]');
    const trackTitleEl = audioPlayer.querySelector('[data-track-title]');
    const trackDescriptionEl = audioPlayer.querySelector('[data-track-description]');

    const audioSource = audio ? audio.currentSrc || audio.getAttribute('src') || '' : '';
    const loadTimeoutMs = 15000;
    let loadTimeoutId = null;
    let userHasPlayed = false;

    const setPlayerState = (state) => {
        audioPlayer.classList.remove('is-loading', 'is-ready', 'is-playing', 'is-paused', 'is-error');
        audioPlayer.classList.add(`is-${state}`);
    };

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return '0:00';
        }

        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const clearLoadTimeout = () => {
        if (loadTimeoutId) {
            window.clearTimeout(loadTimeoutId);
            loadTimeoutId = null;
        }
    };

    const setLoading = (message) => {
        setPlayerState('loading');
        if (statusTextEl) {
            statusTextEl.textContent = message || 'Loading audio from Archive.org...';
        }
        if (toggleButton) {
            toggleButton.disabled = false;
            toggleButton.setAttribute('aria-pressed', 'false');
        }
    };

    const setReady = (message) => {
        clearLoadTimeout();
        setPlayerState('ready');
        if (statusTextEl) {
            statusTextEl.textContent = message || 'Audio ready.';
        }
        if (errorBox) {
            errorBox.hidden = true;
            errorBox.textContent = '';
        }
        if (toggleButton) {
            toggleButton.disabled = false;
        }
        if (seekBar) {
            seekBar.disabled = false;
        }
    };

    const setError = (error) => {
        clearLoadTimeout();
        const message = error instanceof Error ? error.message : 'Audio playback failed.';
        console.error('Archive.org audio player error:', error);
        setPlayerState('error');
        if (statusTextEl) {
            statusTextEl.textContent = 'Playback unavailable.';
        }
        if (errorBox) {
            errorBox.textContent = `We could not load the Sunday service recording. ${message}`;
            errorBox.hidden = false;
        }
        if (toggleButton) {
            toggleButton.disabled = true;
        }
        if (seekBar) {
            seekBar.disabled = true;
        }
        if (playIcon) {
            playIcon.textContent = '!';
        }
    };

    const syncSeekBar = () => {
        if (!audio || !seekBar || !durationEl || !currentTimeEl) {
            return;
        }

        const duration = audio.duration;
        if (Number.isFinite(duration) && duration > 0) {
            const progress = Math.min(1000, Math.max(0, (audio.currentTime / duration) * 1000));
            seekBar.value = String(progress);
            durationEl.textContent = formatTime(duration);
        }
        currentTimeEl.textContent = formatTime(audio.currentTime);
    };

    const resetSource = () => {
        if (!audio || !audioSource) {
            return;
        }

        audio.pause();
        audio.src = audioSource;
        audio.load();
        if (playIcon) {
            playIcon.textContent = '▶';
        }
        setLoading('Loading audio from Archive.org...');
    };

    const loadTrack = async (source, title, description) => {
        if (!source) {
            setError(new Error('No direct audio link has been set for this recording.'));
            return;
        }

        try {
            clearLoadTimeout();
            userHasPlayed = true;
            if (trackTitleEl && title) {
                trackTitleEl.textContent = title;
            }
            if (trackDescriptionEl && description) {
                trackDescriptionEl.textContent = description;
            }
            if (toggleButton) {
                toggleButton.disabled = false;
            }
            if (seekBar) {
                seekBar.disabled = false;
            }
            audio.pause();
            audio.src = source;
            audio.load();
            setLoading(`Loading ${title || 'audio'}...`);
            await audio.play();
        } catch (error) {
            setError(error);
        }
    };

    window.tmcPlayAudioTrack = loadTrack;

    if (audio && toggleButton) {
        setLoading('Loading audio from Archive.org...');

        audio.addEventListener('loadstart', () => {
            setLoading('Buffering the recording...');
            clearLoadTimeout();
            loadTimeoutId = window.setTimeout(() => {
                if (audio.readyState < 2) {
                    setError(new Error('The recording timed out while loading.'));
                }
            }, loadTimeoutMs);
        });

        audio.addEventListener('loadedmetadata', () => {
            if (durationEl) {
                durationEl.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('canplay', () => {
            setReady('Ready to play.');
            if (audio.paused && !userHasPlayed && playIcon) {
                playIcon.textContent = '▶';
            }
        });

        audio.addEventListener('play', () => {
            userHasPlayed = true;
            clearLoadTimeout();
            setPlayerState('playing');
            if (statusTextEl) {
                statusTextEl.textContent = 'Now playing.';
            }
            if (toggleButton) {
                toggleButton.setAttribute('aria-pressed', 'true');
            }
            if (playIcon) {
                playIcon.textContent = '❚❚';
            }
        });

        audio.addEventListener('pause', () => {
            if (audioPlayer.classList.contains('is-error')) {
                return;
            }
            setPlayerState('paused');
            if (statusTextEl) {
                statusTextEl.textContent = 'Paused.';
            }
            if (toggleButton) {
                toggleButton.setAttribute('aria-pressed', 'false');
            }
            if (playIcon) {
                playIcon.textContent = '▶';
            }
        });

        audio.addEventListener('waiting', () => {
            setLoading('Buffering the recording...');
        });

        audio.addEventListener('playing', () => {
            setReady('Now playing.');
            setPlayerState('playing');
            if (playIcon) {
                playIcon.textContent = '❚❚';
            }
        });

        audio.addEventListener('timeupdate', syncSeekBar);
        audio.addEventListener('durationchange', syncSeekBar);

        audio.addEventListener('ended', () => {
            setPlayerState('ready');
            if (statusTextEl) {
                statusTextEl.textContent = 'Recording finished.';
            }
            if (toggleButton) {
                toggleButton.setAttribute('aria-pressed', 'false');
            }
            if (playIcon) {
                playIcon.textContent = '▶';
            }
            if (seekBar) {
                seekBar.value = '1000';
            }
        });

        audio.addEventListener('error', () => {
            const mediaError = audio.error;
            const errorMessage = mediaError && mediaError.message ? mediaError.message : 'The Archive.org recording could not be loaded.';
            setError(new Error(errorMessage));
        });

        toggleButton.addEventListener('click', async () => {
            try {
                if (audio.paused) {
                    setLoading('Starting playback...');
                    await audio.play();
                } else {
                    audio.pause();
                }
            } catch (error) {
                setError(error);
            }
        });

        if (retryButton) {
            retryButton.addEventListener('click', () => {
                userHasPlayed = false;
                resetSource();
                if (errorBox) {
                    errorBox.hidden = true;
                    errorBox.textContent = '';
                }
                if (seekBar) {
                    seekBar.value = '0';
                }
                if (currentTimeEl) {
                    currentTimeEl.textContent = '0:00';
                }
                if (playIcon) {
                    playIcon.textContent = '▶';
                }
            });
        }

        if (seekBar) {
            seekBar.addEventListener('input', () => {
                if (!audio.duration || !Number.isFinite(audio.duration)) {
                    return;
                }
                const seekTime = (Number(seekBar.value) / 1000) * audio.duration;
                currentTimeEl.textContent = formatTime(seekTime);
            });

            seekBar.addEventListener('change', () => {
                if (!audio.duration || !Number.isFinite(audio.duration)) {
                    return;
                }
                audio.currentTime = (Number(seekBar.value) / 1000) * audio.duration;
            });
        }

        audio.load();
    }
}

// ============================================
// Smooth Scrolling for Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Only handle same-page fragment links that are valid selectors and not the noop '#'
        if (!href || href === '#' || !href.startsWith('#')) return;
        try {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (err) {
            // Invalid selector (e.g. href was changed to a full URL) — ignore.
            // Do not block the click in this case.
        }
    });
});

// ============================================
// Contact Form Submission
// ============================================
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        // Simple validation
        if (name && email && message) {
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        } else {
            alert('Please fill in all fields.');
        }
    });
}

// ============================================
// Responsive Navigation Adjustments
// ============================================
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu && navToggle) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// ============================================
// Scroll Animations (Optional - for future enhancement)
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe media cards for fade-in effect
document.querySelectorAll('.media-card, .video-card, .ebook-card, .song-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ============================================
// Search Functionality
// ============================================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchResultCount = document.getElementById('searchResultCount');
const messagesEmptyState = document.getElementById('messagesEmptyState');
const messageSearchResults = document.getElementById('messageSearchResults');
const filterChips = Array.from(document.querySelectorAll('.filter-chip'));
const messageGrid = document.getElementById('mediaGrid');
const messageSortSelect = document.getElementById('messageSortSelect');

let activeFilter = 'all';
let searchTimer = null;

function getMessageCards() {
    return Array.from(document.querySelectorAll('#mediaGrid .media-card'));
}

function getCardCategories(card) {
    return (card.dataset.category || 'all').toLowerCase().split(/\s+/);
}

function hideMessageSuggestions() {
    if (!messageSearchResults) return;
    messageSearchResults.hidden = true;
    messageSearchResults.replaceChildren();
}

function updateMessageSuggestions() {
    if (!messageSearchResults || !searchInput) return;

    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        hideMessageSuggestions();
        return;
    }

    const matches = getMessageCards()
        .map((card) => {
            const title = card.querySelector('h3')?.textContent.trim() || 'Untitled message';
            const searchableText = card.textContent.toLowerCase();
            const titleText = title.toLowerCase();
            const score = titleText.startsWith(query) ? 0 : titleText.includes(query) ? 1 : 2;
            return { card, title, searchableText, score };
        })
        .filter((result) => result.searchableText.includes(query))
        .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
        .slice(0, 8);

    messageSearchResults.replaceChildren();
    matches.forEach(({ card, title }) => {
        const result = document.createElement('button');
        result.type = 'button';
        result.className = 'message-search-result';
        result.setAttribute('role', 'option');
        result.dataset.messageTarget = card.id;
        result.innerHTML = `<strong></strong><span>Open message card</span>`;
        result.querySelector('strong').textContent = title;
        messageSearchResults.appendChild(result);
    });

    messageSearchResults.hidden = matches.length === 0;
}

function openMessageSearchResult(cardId) {
    const card = cardId ? document.getElementById(cardId) : null;
    if (!card) return;

    searchInput.value = card.querySelector('h3')?.textContent.trim() || searchInput.value;
    applyMessageFilters();
    hideMessageSuggestions();
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('search-result-focus');
    window.requestAnimationFrame(() => card.classList.add('search-result-focus'));
    window.setTimeout(() => card.classList.remove('search-result-focus'), 1400);
}

function sortMessageCards(mode = messageSortSelect?.value || 'featured') {
    if (!messageGrid) return;

    const cards = getMessageCards();
    if (cards.length <= 1) return;

    const sortedCards = [...cards];
    if (mode === 'az') {
        sortedCards.sort((a, b) => {
            const titleA = a.querySelector('h3')?.textContent.trim().toLowerCase() || '';
            const titleB = b.querySelector('h3')?.textContent.trim().toLowerCase() || '';
            return titleA.localeCompare(titleB);
        });
    } else if (mode === 'latest') {
        sortedCards.reverse();
    }

    sortedCards.forEach((card) => messageGrid.appendChild(card));
}

function updateMessageSearchUI(visibleCount, totalCount, query) {
    const filterLabel = activeFilter === 'all' ? 'all categories' : activeFilter;
    const queryLabel = query ? ` matching "${query}"` : '';

    if (searchResultCount) {
        searchResultCount.textContent = `Showing ${visibleCount} of ${totalCount} messages in ${filterLabel}${queryLabel}`;
    }

    if (messagesEmptyState) {
        messagesEmptyState.hidden = visibleCount !== 0;
    }
}

function applyMessageFilters() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const cards = getMessageCards();
    let visibleCount = 0;

    sortMessageCards(messageSortSelect?.value || 'featured');

    cards.forEach(card => {
        const categories = getCardCategories(card);
        const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
        const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
        const isVisible = matchesFilter && matchesSearch;

        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
    });

    updateMessageSearchUI(visibleCount, cards.length, query);
}

function scheduleMessageSearch() {
    window.clearTimeout(searchTimer);
    updateMessageSuggestions();
    searchTimer = window.setTimeout(applyMessageFilters, 180);
}

function setActiveFilter(filter) {
    activeFilter = filter;
    filterChips.forEach(chip => {
        const isActive = chip.dataset.filter === filter;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
    });
    applyMessageFilters();
}

if (searchInput && messageGrid) {
    searchBtn?.addEventListener('click', applyMessageFilters);

    clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        applyMessageFilters();
        hideMessageSuggestions();
        searchInput.focus();
    });

    searchInput.addEventListener('input', scheduleMessageSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyMessageFilters();
            hideMessageSuggestions();
        } else if (event.key === 'Escape') {
            hideMessageSuggestions();
        }
    });

    messageSearchResults?.addEventListener('click', (event) => {
        const result = event.target.closest('[data-message-target]');
        if (result) openMessageSearchResult(result.dataset.messageTarget);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-panel')) hideMessageSuggestions();
    });
}

filterChips.forEach(chip => {
    chip.addEventListener('click', () => setActiveFilter(chip.dataset.filter || 'all'));
});

messageSortSelect?.addEventListener('change', applyMessageFilters);

if (messageGrid) {
    applyMessageFilters();
}

console.log('Church website loaded successfully!');

// Toggle a series' volume list
const protectedSeriesAccess = {
    'volunteers-meeting': { username: 'adminTMC', password: 'TMC2026!@' },
    'workers-meeting': { username: 'adminTMC', password: 'TMC2026!@' }
};

const seriesAccessModal = document.getElementById('seriesAccessModal');
const seriesAccessForm = document.getElementById('seriesAccessForm');
const accessModalUsername = document.getElementById('accessModalUsername');
const accessModalPassword = document.getElementById('accessModalPassword');
const accessModalError = document.getElementById('accessModalError');
let pendingSeriesId = null;

function openSeriesAccessModal(seriesId) {
    if (!seriesAccessModal) return;
    pendingSeriesId = seriesId;
    accessModalError.textContent = '';
    seriesAccessModal.hidden = false;
    document.body.classList.add('access-modal-open');
    accessModalUsername?.focus();
}

function closeSeriesAccessModal() {
    if (!seriesAccessModal) return;
    seriesAccessModal.hidden = true;
    document.body.classList.remove('access-modal-open');
    if (seriesAccessForm) seriesAccessForm.reset();
    accessModalError.textContent = '';
}

function requireSeriesAccess(seriesId) {
    const credentials = protectedSeriesAccess[seriesId];
    if (!credentials) return true;

    openSeriesAccessModal(seriesId);
    return false;
}

function toggleSeries(seriesId, bypassAccessCheck = false) {
    const list = document.getElementById(seriesId + '-volumes');
    const button = document.querySelector(`[data-series-toggle="${seriesId}"]`);
    if (!list) return;

    if (!bypassAccessCheck && protectedSeriesAccess[seriesId]) {
        const requiredAccess = requireSeriesAccess(seriesId);
        if (!requiredAccess) {
            return;
        }
    }

    const willOpen = !list.classList.contains('is-open');
    list.hidden = !willOpen;
    list.classList.toggle('is-open', willOpen);
    button?.setAttribute('aria-expanded', String(willOpen));

    if (willOpen) {
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

document.querySelectorAll('[data-series-toggle]').forEach(button => {
    button.addEventListener('click', () => toggleSeries(button.dataset.seriesToggle));
});

document.querySelectorAll('[data-access-modal-close]').forEach((trigger) => {
    trigger.addEventListener('click', closeSeriesAccessModal);
});

seriesAccessForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const credentials = protectedSeriesAccess[pendingSeriesId];
    if (!credentials) {
        closeSeriesAccessModal();
        return;
    }

    const enteredUsername = accessModalUsername?.value.trim() || '';
    const enteredPassword = accessModalPassword?.value || '';

    if (enteredUsername === credentials.username && enteredPassword === credentials.password) {
        closeSeriesAccessModal();
        toggleSeries(pendingSeriesId, true);
        return;
    }

    if (accessModalError) {
        accessModalError.textContent = 'That username or password is not correct.';
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && seriesAccessModal && !seriesAccessModal.hidden) {
        closeSeriesAccessModal();
    }
});

// ============================================
// Downloads Manager
// ============================================
const DOWNLOADS_DB_NAME = 'tmc-downloads';
const DOWNLOADS_STORE = 'messages';
const MEDIA_ASSETS_STORE = 'media-assets';
const RECENT_AUDIO_LIMIT = 3;
const CONTINUE_LISTENING_KEY = 'tmcContinueListening';
let downloadsDb = null;

function getContinueListeningEntries() {
    try {
        const value = JSON.parse(localStorage.getItem(CONTINUE_LISTENING_KEY) || '{}');
        if (value && value.url) return { [value.url]: value };
        return value && typeof value === 'object' ? value : {};
    } catch (error) {
        return {};
    }
}

function saveContinueListening(entry) {
    if (!entry?.url || !Number.isFinite(entry.currentTime) || entry.currentTime <= 0) return;
    const entries = getContinueListeningEntries();
    entries[entry.url] = {
        url: entry.url,
        title: entry.title || 'Untitled message',
        currentTime: entry.currentTime,
        duration: Number.isFinite(entry.duration) ? entry.duration : 0,
        updatedAt: Date.now()
    };
    localStorage.setItem(CONTINUE_LISTENING_KEY, JSON.stringify(entries));
    renderContinueListening();
}

function clearContinueListening(url) {
    const entries = getContinueListeningEntries();
    if (!url || !entries[url]) return;
    delete entries[url];
    localStorage.setItem(CONTINUE_LISTENING_KEY, JSON.stringify(entries));
    renderContinueListening();
}

function renderContinueListening() {
    const section = document.getElementById('continueListeningSection');
    const card = document.getElementById('continueListeningCard');
    if (!section || !card) return;

    const entry = Object.values(getContinueListeningEntries())
        .filter((item) => item && item.url && item.currentTime > 0)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    if (!entry) {
        section.hidden = true;
        card.replaceChildren();
        return;
    }

    const progress = entry.duration > 0 ? Math.min(100, Math.round((entry.currentTime / entry.duration) * 100)) : 0;
    card.innerHTML = `
        <div class="continue-listening-copy">
            <strong>${escapeHtml(entry.title)}</strong>
            <span>${formatPlayerTime(entry.currentTime)}${entry.duration > 0 ? ` of ${formatPlayerTime(entry.duration)}` : ''}</span>
            <div class="continue-listening-progress" aria-hidden="true"><span style="display:block;width:${progress}%"></span></div>
        </div>
        <button type="button" class="btn btn-primary listen-btn" data-audio-src="${escapeHtml(entry.url)}" data-audio-title="${escapeHtml(entry.title)}" data-audio-resume-time="${entry.currentTime}">Resume</button>`;
    section.hidden = false;
}

function openDownloadsDb() {
    return new Promise((resolve, reject) => {
        if (downloadsDb) return resolve(downloadsDb);
        const request = indexedDB.open(DOWNLOADS_DB_NAME, 2);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DOWNLOADS_STORE)) {
                const store = db.createObjectStore(DOWNLOADS_STORE, { keyPath: 'url' });
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
            }
            if (!db.objectStoreNames.contains(MEDIA_ASSETS_STORE)) {
                const store = db.createObjectStore(MEDIA_ASSETS_STORE, { keyPath: 'url' });
                store.createIndex('cachedAt', 'cachedAt', { unique: false });
            }
        };
        request.onsuccess = (event) => {
            downloadsDb = event.target.result;
            resolve(downloadsDb);
        };
        request.onerror = () => reject(request.error);
    });
}

async function saveDownloadedMessage(entry) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DOWNLOADS_STORE, 'readwrite');
        tx.objectStore(DOWNLOADS_STORE).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getDownloadedMessages() {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
        const request = tx.objectStore(DOWNLOADS_STORE).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function removeDownloadedMessage(url) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DOWNLOADS_STORE, 'readwrite');
        tx.objectStore(DOWNLOADS_STORE).delete(url);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function saveMediaAsset(entry) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_ASSETS_STORE, 'readwrite');
        tx.objectStore(MEDIA_ASSETS_STORE).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getMediaAsset(url) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_ASSETS_STORE, 'readonly');
        const request = tx.objectStore(MEDIA_ASSETS_STORE).get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

async function getOfflineStorageUsage() {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([DOWNLOADS_STORE, MEDIA_ASSETS_STORE], 'readonly');
        let bytes = 0;
        let audioCount = 0;
        let mediaCount = 0;
        const addStoreSize = (storeName, onEntry) => {
            const request = tx.objectStore(storeName).openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;
                onEntry(cursor.value);
                cursor.continue();
            };
        };
        addStoreSize(DOWNLOADS_STORE, (entry) => {
            bytes += entry.blob?.size || 0;
            audioCount += 1;
        });
        addStoreSize(MEDIA_ASSETS_STORE, (entry) => {
            bytes += entry.blob?.size || 0;
            mediaCount += 1;
        });
        tx.oncomplete = () => resolve({ bytes, audioCount, mediaCount });
        tx.onerror = () => reject(tx.error);
    });
}

function formatStorageSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
}

async function updateOfflineStorageUI() {
    const summary = document.getElementById('offlineStorageSummary');
    const fill = document.getElementById('offlineStorageFill');
    if (!summary && !fill) return;

    try {
        const usage = await getOfflineStorageUsage();
        const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {};
        const quota = estimate.quota || Math.max(usage.bytes, 1);
        const percent = Math.min(100, Math.max(0, (usage.bytes / quota) * 100));
        if (summary) summary.textContent = `${formatStorageSize(usage.bytes)} used · ${usage.audioCount} audio · ${usage.mediaCount} image${usage.mediaCount === 1 ? '' : 's'}`;
        if (fill) fill.style.width = `${percent}%`;
    } catch (error) {
        if (summary) summary.textContent = 'Offline storage is ready.';
    }
}

async function downloadAudio(url, title, onProgress, signal, options = {}) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Download failed: ' + response.status);
    if (!response.body) throw new Error('Download stream unavailable');

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;
    const chunks = [];
    const reader = response.body.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signal && signal.aborted) {
            throw new Error('Download cancelled');
        }
        chunks.push(value);
        loaded += value.length;
        if (total > 0 && onProgress) {
            const percent = Math.round((loaded / total) * 100);
            onProgress(percent, loaded, total);
        }
    }

    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    const entry = {
        url: url,
        title: title || 'Untitled',
        blob: blob,
        downloadedAt: Date.now(),
        autoCached: options.autoCached === true
    };
    await saveDownloadedMessage(entry);
    return entry;
}

async function getDownloadedBlob(url) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
        const request = tx.objectStore(DOWNLOADS_STORE).get(url);
        request.onsuccess = () => resolve(request.result ? request.result.blob : null);
        request.onerror = () => reject(request.error);
    });
}

const recentAudioCacheInFlight = new Map();

async function pruneRecentAudio() {
    const entries = await getDownloadedMessages();
    const automaticEntries = entries
        .filter((entry) => entry.autoCached)
        .sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
    await Promise.all(automaticEntries.slice(RECENT_AUDIO_LIMIT).map((entry) => removeDownloadedMessage(entry.url)));
}

async function cacheRecentAudio(url, title) {
    if (!url || url.startsWith('blob:') || recentAudioCacheInFlight.has(url)) return;
    recentAudioCacheInFlight.set(url, true);
    try {
        if (!await isDownloaded(url)) {
            const status = document.getElementById('offlineCacheStatus');
            await downloadAudio(url, title, (percent) => {
                if (status) status.textContent = `Saving recent audio for offline use... ${percent}%`;
            }, undefined, { autoCached: true });
            await pruneRecentAudio();
            if (status) status.textContent = 'Recently played audio is available offline.';
            updateOfflineStorageUI();
        }
    } catch (error) {
        console.warn('Recent audio cache failed:', error);
    } finally {
        recentAudioCacheInFlight.delete(url);
    }
}

async function cacheThumbnail(url) {
    if (!url) return null;
    const existing = await getMediaAsset(url);
    if (existing) return existing;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Thumbnail request failed: ' + response.status);
    const entry = { url, blob: await response.blob(), cachedAt: Date.now(), kind: 'thumbnail' };
    await saveMediaAsset(entry);
    updateOfflineStorageUI();
    return entry;
}

async function applyCachedThumbnail(element, url) {
    if (!element || !url) return;
    try {
        const entry = await cacheThumbnail(url);
        if (!entry?.blob) return;
        const objectUrl = URL.createObjectURL(entry.blob);
        element.style.backgroundImage = `url("${objectUrl}")`;
    } catch (error) {
        const cached = await getMediaAsset(url).catch(() => null);
        if (cached?.blob) {
            const objectUrl = URL.createObjectURL(cached.blob);
            element.style.backgroundImage = `url("${objectUrl}")`;
        }
    }
}

async function isDownloaded(url) {
    const db = await openDownloadsDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
        const request = tx.objectStore(DOWNLOADS_STORE).get(url);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateDownloadButtonsState() {
    document.querySelectorAll('[data-download-url]').forEach(btn => {
        const url = btn.getAttribute('data-download-url');
        isDownloaded(url).then(downloaded => {
            if (downloaded) {
                btn.textContent = 'Downloaded';
                btn.disabled = true;
                btn.classList.add('is-downloaded');
            } else {
                btn.textContent = 'Download';
                btn.disabled = false;
                btn.classList.remove('is-downloaded');
            }
        }).catch(() => {
            btn.textContent = 'Download';
            btn.disabled = false;
        });
    });
}

// ============================================
// Downloads Page
// ============================================
function renderDownloadsPage() {
    const downloadGrid = document.getElementById('downloadGrid');
    const downloadsEmptyState = document.getElementById('downloadsEmptyState');
    const downloadsLoadingState = document.getElementById('downloadsLoadingState');
    const downloadSearchInput = document.getElementById('downloadSearchInput');
    const downloadSearchBtn = document.getElementById('downloadSearchBtn');
    const downloadClearSearchBtn = document.getElementById('downloadClearSearchBtn');
    const downloadResultCount = document.getElementById('downloadResultCount');

    if (!downloadGrid) return;

    if (downloadsLoadingState) downloadsLoadingState.hidden = false;
    if (downloadsEmptyState) downloadsEmptyState.hidden = true;

    getDownloadedMessages().then(items => {
        if (downloadsLoadingState) downloadsLoadingState.hidden = true;

        downloadGrid.querySelectorAll('.download-card').forEach(el => el.remove());

        if (!items || items.length === 0) {
            if (downloadsEmptyState) downloadsEmptyState.hidden = false;
            if (downloadResultCount) downloadResultCount.textContent = 'No downloads yet';
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach((entry) => {
            const card = document.createElement('div');
            card.className = 'media-card download-card';
            card.setAttribute('data-download-card', entry.url);

            const titleEl = document.createElement('h3');
            titleEl.textContent = entry.title || 'Untitled';
            card.appendChild(titleEl);

            const dateEl = document.createElement('p');
            const date = new Date(entry.downloadedAt);
            dateEl.textContent = 'Downloaded: ' + date.toLocaleString();
            card.appendChild(dateEl);

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'btn btn-primary listen-btn';
            playBtn.setAttribute('data-audio-src', entry.url);
            playBtn.setAttribute('data-audio-title', entry.title || 'Downloaded Message');
            playBtn.textContent = 'Play';
            actions.appendChild(playBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-secondary';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
                await removeDownloadedMessage(entry.url);
                updateOfflineStorageUI();
                card.remove();
                renderDownloadsPage();
            });
            actions.appendChild(deleteBtn);

            card.appendChild(actions);
            fragment.appendChild(card);
        });

        downloadGrid.insertBefore(fragment, downloadGrid.firstChild);

        const total = items.length;
        if (downloadResultCount) downloadResultCount.textContent = `Showing ${total} download${total !== 1 ? 's' : ''}`;
    }).catch(err => {
        console.error('Failed to load downloads:', err);
        if (downloadsLoadingState) downloadsLoadingState.hidden = true;
    });
}

function initDownloadsPage() {
    const downloadSearchInput = document.getElementById('downloadSearchInput');
    const downloadSearchBtn = document.getElementById('downloadSearchBtn');
    const downloadClearSearchBtn = document.getElementById('downloadClearSearchBtn');
    const downloadGrid = document.getElementById('downloadGrid');

    if (!downloadGrid) return;

    renderDownloadsPage();

    if (downloadSearchBtn && downloadSearchInput) {
        downloadSearchBtn.addEventListener('click', () => {
            const query = (downloadSearchInput.value || '').toLowerCase().trim();
            const cards = Array.from(document.querySelectorAll('[data-download-card]'));
            let visible = 0;
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const match = !query || text.includes(query);
                card.hidden = !match;
                if (match) visible++;
            });
            const total = cards.length;
            const downloadResultCount = document.getElementById('downloadResultCount');
            if (downloadResultCount) {
                downloadResultCount.textContent = query
                    ? `Showing ${visible} of ${total} downloads matching "${query}"`
                    : `Showing ${total} downloads`;
            }
        });
    }

    if (downloadClearSearchBtn && downloadSearchInput) {
        downloadClearSearchBtn.addEventListener('click', () => {
            downloadSearchInput.value = '';
            const cards = Array.from(document.querySelectorAll('[data-download-card]'));
            cards.forEach(card => card.hidden = false);
            const downloadResultCount = document.getElementById('downloadResultCount');
            if (downloadResultCount) downloadResultCount.textContent = `Showing ${cards.length} downloads`;
            downloadSearchInput.focus();
        });
    }
}

// Listen button click handler with download support
document.addEventListener('click', async (e) => {
    const btn = e.target.closest && (e.target.closest('.listen-btn') || e.target.closest('.download-btn'));
    if (!btn) return;

    if (btn.hasAttribute('data-download-action')) {
        e.preventDefault();
        e.stopPropagation();
        const url = btn.getAttribute('data-download-url');
        const title = btn.getAttribute('data-download-title') || 'Untitled';
        if (!url) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="download-progress-label">0%</span><span class="download-progress-track"><span class="download-progress-fill" style="width:0%"></span></span><button type="button" class="download-cancel-btn" aria-label="Cancel download">Cancel</button>';
        const cancelBtn = btn.querySelector('.download-cancel-btn');
        const controller = new AbortController();
        const signal = controller.signal;
        let cancelled = false;

        const cancelDownload = () => {
            cancelled = true;
            controller.abort();
            btn.innerHTML = '<span class="download-progress-label">Cancelled</span>';
            btn.classList.add('is-cancelled');
            btn.disabled = false;
        };

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                cancelDownload();
            });
        }

        try {
            await downloadAudio(url, title, (percent) => {
                if (cancelled) return;
                const label = btn.querySelector('.download-progress-label');
                const fill = btn.querySelector('.download-progress-fill');
                if (label) label.textContent = percent + '%';
                if (fill) fill.style.width = percent + '%';
            }, signal);
            if (cancelled) return;
            btn.textContent = 'Downloaded';
            btn.classList.add('is-downloaded');
            btn.disabled = true;
            updateOfflineStorageUI();
        } catch (err) {
            if (cancelled) return;
            console.error('Download failed:', err);
            btn.textContent = 'Retry Download';
            btn.disabled = false;
            alert('Download failed. Please try again.');
        }
        return;
    }
});

// ============================================
// In-page bottom audio player
// ============================================
let activeAudioSource = '';
let activeAudioTitle = '';
let activeAudioDescription = '';
let lastResumeSaveAt = 0;
const lovedMessagesStorageKey = 'tmcLovedMessages';

const pageAudio = document.getElementById('pageAudio');
const audioPlayerBar = document.getElementById('audioPlayerBar');
const audioPlayerTitle = document.getElementById('audioPlayerTitle');
const audioPlayerStatus = document.getElementById('audioPlayerStatus');
const audioPlayerClose = document.getElementById('audioPlayerClose');
const audioPlayerExpand = document.getElementById('audioPlayerExpand');
const audioPlayerCollapse = document.getElementById('audioPlayerCollapse');
const audioPlayerFullscreenClose = document.getElementById('audioPlayerFullscreenClose');
const audioPlayerFullscreen = document.querySelector('.audio-player-fullscreen');
const audioFullscreenTitle = document.getElementById('audioFullscreenTitle');
const audioFullscreenPlay = document.getElementById('audioFullscreenPlay');
const audioFullscreenSeek = document.getElementById('audioFullscreenSeek');
const audioFullscreenCurrent = document.getElementById('audioFullscreenCurrent');
const audioFullscreenDuration = document.getElementById('audioFullscreenDuration');
const audioFavorite = document.querySelector('.audio-favorite');

function getLovedMessages() {
    try {
        const stored = JSON.parse(localStorage.getItem(lovedMessagesStorageKey) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        console.warn('Loved messages could not be loaded.', error);
        return [];
    }
}

function saveLovedMessages(messages) {
    localStorage.setItem(lovedMessagesStorageKey, JSON.stringify(messages));
}

function isMessageLoved(source = activeAudioSource) {
    return Boolean(source) && getLovedMessages().some(message => message.url === source);
}

function syncFavoriteButton() {
    if (!audioFavorite) return;
    const loved = isMessageLoved();
    audioFavorite.textContent = loved ? '♥' : '♡';
    audioFavorite.classList.toggle('is-loved', loved);
    audioFavorite.setAttribute('aria-pressed', String(loved));
    audioFavorite.setAttribute('aria-label', loved ? 'Remove from loved messages' : 'Love this message');
    audioFavorite.title = loved ? 'Remove from loved messages' : 'Love this message';
}

function syncMediaSession() {
    if (!('mediaSession' in navigator) || !activeAudioSource) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: activeAudioTitle || 'Untitled message',
        artist: 'The Metropolitan Church',
        album: 'Loved and saved teachings'
    });
}

function registerMediaSessionAction(action, handler) {
    if (!('mediaSession' in navigator)) return;
    try {
        navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
        // Some browsers expose Media Session without supporting every action.
    }
}

if ('mediaSession' in navigator) {
    registerMediaSessionAction('seekbackward', () => {
        if (!pageAudio) return;
        pageAudio.currentTime = Math.max(0, pageAudio.currentTime - 10);
        syncFullscreenAudio();
    });
    registerMediaSessionAction('seekforward', () => {
        if (!pageAudio) return;
        pageAudio.currentTime = Math.min(pageAudio.duration || Infinity, pageAudio.currentTime + 10);
        syncFullscreenAudio();
    });
    registerMediaSessionAction('play', () => pageAudio?.play());
    registerMediaSessionAction('pause', () => pageAudio?.pause());
}

function toggleLovedMessage() {
    if (!activeAudioSource) return;
    const messages = getLovedMessages();
    const existingIndex = messages.findIndex(message => message.url === activeAudioSource);
    if (existingIndex >= 0) {
        messages.splice(existingIndex, 1);
    } else {
        messages.unshift({
            url: activeAudioSource,
            title: activeAudioTitle || 'Untitled message',
            description: activeAudioDescription,
            savedAt: new Date().toISOString()
        });
    }
    saveLovedMessages(messages);
    syncFavoriteButton();
    renderLovedMessages();
}

const formatPlayerTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

function setAudioPlayerExpanded(expanded) {
    if (!audioPlayerBar) return;
    audioPlayerBar.classList.toggle('is-expanded', expanded);
    document.body.classList.toggle('audio-player-open', expanded);
    if (audioPlayerFullscreen) audioPlayerFullscreen.setAttribute('aria-hidden', String(!expanded));
    if (audioPlayerExpand) audioPlayerExpand.setAttribute('aria-expanded', String(expanded));
    if (audioPlayerFullscreenClose) audioPlayerFullscreenClose.setAttribute('aria-hidden', String(!expanded));
    if (expanded) syncFullscreenAudio();
}

function syncFullscreenAudio() {
    if (!pageAudio) return;
    const isPlaying = !pageAudio.paused && !pageAudio.ended;
    if (audioFullscreenPlay) {
        audioFullscreenPlay.textContent = isPlaying ? 'Ⅱ' : '▶';
        audioFullscreenPlay.setAttribute('aria-label', isPlaying ? 'Pause audio' : 'Play audio');
    }
    if (audioFullscreenSeek) {
        audioFullscreenSeek.max = Number.isFinite(pageAudio.duration) ? pageAudio.duration : 0;
        audioFullscreenSeek.value = pageAudio.currentTime || 0;
    }
    if (audioFullscreenCurrent) audioFullscreenCurrent.textContent = formatPlayerTime(pageAudio.currentTime);
    if (audioFullscreenDuration) audioFullscreenDuration.textContent = formatPlayerTime(pageAudio.duration);
}

function playInPageAudio(source, title, resumeTime = 0) {
    if (!source || !pageAudio) return;

    const playerLabel = title || 'Untitled message';
    activeAudioSource = source;
    activeAudioTitle = playerLabel;
    activeAudioDescription = '';
    cacheRecentAudio(source, playerLabel);
    pageAudio.hidden = false;
    if (audioPlayerBar) audioPlayerBar.hidden = false;
    if (audioPlayerTitle) audioPlayerTitle.textContent = playerLabel;
    if (audioFullscreenTitle) audioFullscreenTitle.textContent = playerLabel;
    if (audioPlayerStatus) audioPlayerStatus.textContent = 'Loading offline audio...';
    syncFavoriteButton();
    syncMediaSession();

    const applyResumePosition = () => {
        const position = Number(resumeTime);
        if (position > 0 && Number.isFinite(pageAudio.duration)) {
            pageAudio.currentTime = Math.min(position, Math.max(0, pageAudio.duration - 2));
        }
    };
    const setAudioSource = (audioSource) => {
        pageAudio.src = audioSource;
        pageAudio.addEventListener('loadedmetadata', applyResumePosition, { once: true });
        pageAudio.load();
    };

    getDownloadedBlob(source).then(blob => {
        if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            setAudioSource(objectUrl);
            pageAudio.play().catch(err => {
                console.error('Offline audio play failed:', err);
                if (audioPlayerStatus) audioPlayerStatus.textContent = 'Playback unavailable.';
            });
            pageAudio.addEventListener('error', () => {
                if (audioPlayerStatus) audioPlayerStatus.textContent = 'Playback failed.';
            }, { once: true });
        } else {
            if (audioPlayerTitle) audioPlayerTitle.textContent = playerLabel;
            if (audioFullscreenTitle) audioFullscreenTitle.textContent = playerLabel;
            if (audioPlayerStatus) audioPlayerStatus.textContent = 'Loading...';
            setAudioSource(source);
            pageAudio.play().catch(err => {
                console.error('Audio play failed:', err);
                if (audioPlayerStatus) audioPlayerStatus.textContent = 'Playback unavailable.';
            });
        }
    }).catch(err => {
        console.error('Offline lookup failed:', err);
        if (audioPlayerTitle) audioPlayerTitle.textContent = playerLabel;
        if (audioFullscreenTitle) audioFullscreenTitle.textContent = playerLabel;
        if (audioPlayerStatus) audioPlayerStatus.textContent = 'Loading...';
        setAudioSource(source);
        pageAudio.play().catch(err => {
            console.error('Audio play failed:', err);
            if (audioPlayerStatus) audioPlayerStatus.textContent = 'Playback unavailable.';
        });
    });
}

if (pageAudio) {
    pageAudio.addEventListener('playing', () => {
        if (audioPlayerStatus) audioPlayerStatus.textContent = 'Now playing.';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });
    pageAudio.addEventListener('pause', () => {
        if (audioPlayerStatus) audioPlayerStatus.textContent = 'Paused.';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });
    pageAudio.addEventListener('ended', () => {
        if (audioPlayerStatus) audioPlayerStatus.textContent = 'Finished.';
        clearContinueListening(activeAudioSource);
    });
    pageAudio.addEventListener('error', () => {
        if (audioPlayerStatus) audioPlayerStatus.textContent = 'Playback failed.';
    });
    pageAudio.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastResumeSaveAt >= 2000) {
            lastResumeSaveAt = now;
            saveContinueListening({
                url: activeAudioSource,
                title: activeAudioTitle,
                currentTime: pageAudio.currentTime,
                duration: pageAudio.duration
            });
        }
    });
    ['playing', 'pause', 'ended', 'loadedmetadata', 'durationchange'].forEach(eventName => pageAudio.addEventListener(eventName, syncFullscreenAudio));
}

if (audioFavorite) audioFavorite.addEventListener('click', toggleLovedMessage);

if (audioPlayerExpand) audioPlayerExpand.addEventListener('click', () => setAudioPlayerExpanded(true));
if (audioPlayerCollapse) audioPlayerCollapse.addEventListener('click', () => setAudioPlayerExpanded(false));
if (audioPlayerFullscreenClose) audioPlayerFullscreenClose.addEventListener('click', () => audioPlayerClose?.click());
if (audioFullscreenPlay && pageAudio) {
    audioFullscreenPlay.addEventListener('click', () => pageAudio.paused ? pageAudio.play().catch(() => {}) : pageAudio.pause());
}
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && audioPlayerBar?.classList.contains('is-expanded')) {
        setAudioPlayerExpanded(false);
    }
});
if (audioFullscreenSeek && pageAudio) {
    audioFullscreenSeek.addEventListener('input', () => { pageAudio.currentTime = Number(audioFullscreenSeek.value); syncFullscreenAudio(); });
}
document.addEventListener('click', (event) => {
    const skipButton = event.target.closest('[data-audio-skip]');
    if (!skipButton || !pageAudio) return;
    pageAudio.currentTime = Math.max(0, Math.min(pageAudio.duration || Infinity, pageAudio.currentTime + Number(skipButton.dataset.audioSkip)));
    syncFullscreenAudio();
});

if (audioPlayerClose && pageAudio) {
    audioPlayerClose.addEventListener('click', () => {
        pageAudio.pause();
        pageAudio.src = '';
        pageAudio.hidden = true;
        setAudioPlayerExpanded(false);
        if (audioPlayerBar) audioPlayerBar.hidden = true;
        if (audioPlayerStatus) audioPlayerStatus.textContent = '';
        if (audioPlayerTitle) audioPlayerTitle.textContent = 'Now Playing';
        if (audioFullscreenTitle) audioFullscreenTitle.textContent = 'Now Playing';
        activeAudioSource = '';
        activeAudioTitle = '';
    });
}

// Open Listen buttons (uses data-url attribute) without causing page text-selection/highlight
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.listen-btn');
    if (!btn) return;

    const audioSrc = btn.getAttribute('data-audio-src');
    if (audioSrc) {
        const nearbyTitle = btn.closest('.volume-list li')?.querySelector('.volume-title')?.textContent?.trim()
            || btn.closest('.media-card')?.querySelector('h3')?.textContent?.trim();
        const title = btn.getAttribute('data-audio-title') || nearbyTitle || 'Untitled message';
        const description = btn.getAttribute('data-audio-description') || '';
        playInPageAudio(audioSrc, title, Number(btn.getAttribute('data-audio-resume-time') || 0));
        activeAudioDescription = description;
        syncFavoriteButton();
        btn.blur();
        return;
    }

    const url = btn.getAttribute('data-url');
    if (!url) return;

    const archiveDetailsMatch = url.match(/archive\.org\/details\/([^/?#]+)/);
    if (archiveDetailsMatch) {
        const identifier = archiveDetailsMatch[1];
        const streamUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(identifier)}.mp3`;
        playInPageAudio(streamUrl, identifier.replace(/[_-]/g, ' '));
        btn.blur();
        return;
    }

    playInPageAudio(url, '');
    btn.blur();
});

function renderLovedMessages() {
    const grid = document.getElementById('lovedMessagesGrid');
    if (!grid) return;
    const emptyState = document.getElementById('lovedMessagesEmptyState');
    const query = (document.getElementById('lovedSearchInput')?.value || '').trim().toLowerCase();
    const messages = getLovedMessages().filter(message => `${message.title} ${message.description}`.toLowerCase().includes(query));
    grid.innerHTML = '';
    messages.forEach(message => {
        const card = document.createElement('article');
        card.className = 'loved-message-card';
        card.innerHTML = `<div class="loved-message-icon" aria-hidden="true">♥</div><div class="loved-message-copy"><h3></h3><p></p></div><div class="loved-message-actions"><button type="button" class="btn btn-primary listen-btn" data-audio-src="" data-audio-title="">Listen</button><button type="button" class="btn loved-remove-btn" data-loved-remove="">Remove</button></div>`;
        card.querySelector('h3').textContent = message.title;
        card.querySelector('p').textContent = message.description || 'Loved message';
        card.querySelector('[data-audio-src]').setAttribute('data-audio-src', message.url);
        card.querySelector('[data-audio-src]').setAttribute('data-audio-title', message.title);
        card.querySelector('[data-loved-remove]').setAttribute('data-loved-remove', message.url);
        grid.appendChild(card);
    });
    if (emptyState) emptyState.hidden = messages.length > 0;
}

document.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-loved-remove]');
    if (!removeButton) return;
    const messages = getLovedMessages().filter(message => message.url !== removeButton.dataset.lovedRemove);
    saveLovedMessages(messages);
    renderLovedMessages();
    syncFavoriteButton();
});

document.getElementById('lovedSearchInput')?.addEventListener('input', renderLovedMessages);
renderLovedMessages();

// ============================================
// Contacts Table Search
// ============================================
const contactsSearchInput = document.getElementById('contactsSearchInput');
const contactsSearchBtn = document.getElementById('contactsSearchBtn');
const contactsClearBtn = document.getElementById('contactsClearBtn');
const contactsSortSelect = document.getElementById('contactsSortSelect');
const contactsSummary = document.getElementById('contactsSummary');

function sortContactsRows() {
    const table = document.querySelector('.contact-table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const mode = contactsSortSelect?.value || 'name';

    const sortedRows = [...rows].sort((a, b) => {
        const getCellText = (row, index) => row.children[index]?.textContent.trim().toLowerCase() || '';

        if (mode === 'hall') {
            return getCellText(a, 3).localeCompare(getCellText(b, 3));
        }
        if (mode === 'department') {
            return getCellText(a, 4).localeCompare(getCellText(b, 4));
        }
        if (mode === 'phone') {
            return getCellText(a, 5).localeCompare(getCellText(b, 5));
        }
        return getCellText(a, 2).localeCompare(getCellText(b, 2));
    });

    sortedRows.forEach((row) => tbody.appendChild(row));
}

function performContactsSearch() {
    const query = contactsSearchInput ? contactsSearchInput.value.toLowerCase().trim() : '';
    const table = document.querySelector('.contact-table');
    if (!table) return;

    sortContactsRows();

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let anyVisible = false;
    let visibleCount = 0;

    rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        const matches = query === '' || text.includes(query);
        row.style.display = matches ? '' : 'none';
        if (matches) {
            anyVisible = true;
            visibleCount += 1;
        }
    });

    if (contactsSummary) {
        contactsSummary.textContent = query ? `Showing ${visibleCount} matching contacts` : `Showing ${visibleCount} contacts`;
    }

    let noResults = document.getElementById('contacts-no-results');
    if (!noResults) {
        noResults = document.createElement('div');
        noResults.id = 'contacts-no-results';
        noResults.style.marginTop = '8px';
        noResults.style.color = '#666';
        const contactList = document.querySelector('.contact-list');
        if (contactList) contactList.appendChild(noResults);
    }
    noResults.textContent = anyVisible ? '' : (query === '' ? '' : `No contacts match "${query}"`);
}

if (contactsSearchBtn && contactsSearchInput) {
    contactsSearchBtn.addEventListener('click', performContactsSearch);
    contactsSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performContactsSearch();
    });
    contactsSearchInput.addEventListener('input', performContactsSearch);
}

if (contactsClearBtn && contactsSearchInput) {
    contactsClearBtn.addEventListener('click', () => {
        contactsSearchInput.value = '';
        performContactsSearch();
        contactsSearchInput.focus();
    });
}

contactsSortSelect?.addEventListener('change', performContactsSearch);

// Mobile messages reveal: show 5 first, then reveal 10 more per tap
document.addEventListener('DOMContentLoaded', () => {
    const mediaGrid = document.getElementById('mediaGrid');
    const seeMoreBtn = document.getElementById('seeMoreBtn');
    if (!mediaGrid || !seeMoreBtn) return;

    const initialVisibleCount = 5;
    const revealStep = 10;
    let visibleCount = initialVisibleCount;
    let isMobileLayout = null;

    function getCards() {
        return Array.from(mediaGrid.querySelectorAll('.media-card'));
    }

    function scrollCardIntoView(cardIndex) {
        const cards = getCards();
        const card = cards[cardIndex];

        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    }

    function updateVisibleCards() {
        const cards = getCards();
        const totalCards = cards.length;

        cards.forEach((card, index) => {
            card.classList.toggle('hidden', index >= visibleCount);
        });

        mediaGrid.classList.toggle('collapsed', visibleCount <= initialVisibleCount);

        if (totalCards <= initialVisibleCount) {
            seeMoreBtn.style.display = 'none';
            return;
        }

        seeMoreBtn.style.display = '';
        seeMoreBtn.textContent = visibleCount < totalCards ? 'See more' : 'See less';
        seeMoreBtn.setAttribute('aria-expanded', visibleCount < totalCards ? 'false' : 'true');
    }

    function applyLayoutState() {
        const nextIsMobileLayout = window.innerWidth <= 768;
        const cards = getCards();

        if (nextIsMobileLayout) {
            if (isMobileLayout !== true) {
                visibleCount = initialVisibleCount;
            }

            isMobileLayout = true;
            updateVisibleCards();

            if (visibleCount > initialVisibleCount && cards[visibleCount - 1]) {
                scrollCardIntoView(visibleCount - 1);
            } else {
                scrollCardIntoView(0);
            }

            return;
        }

        isMobileLayout = false;
        visibleCount = cards.length;
        cards.forEach((card) => card.classList.remove('hidden'));
        seeMoreBtn.style.display = 'none';
        seeMoreBtn.setAttribute('aria-expanded', 'true');
    }

    seeMoreBtn.addEventListener('click', () => {
        if (window.innerWidth > 768) return;

        const cards = getCards();
        const totalCards = cards.length;

        if (visibleCount >= totalCards) {
            visibleCount = initialVisibleCount;
            updateVisibleCards();
            scrollCardIntoView(0);
            return;
        }

        const nextVisibleCount = Math.min(visibleCount + revealStep, totalCards);
        const nextFirstNewCardIndex = visibleCount;

        visibleCount = nextVisibleCount;
        updateVisibleCards();
        scrollCardIntoView(nextFirstNewCardIndex);
    });

    applyLayoutState();
    window.addEventListener('resize', applyLayoutState);
});

// ============================================
// Admin Login / Believer Details
// ============================================
const adminAuthKey = 'tmcBelieversAdminAuth';
const adminUsername = 'adminTMC';
const adminPassword = 'TMC2026!@';

function isAdminAuthenticated() {
    return sessionStorage.getItem(adminAuthKey) === 'true';
}

async function clearAppData() {
    localStorage.clear();
    sessionStorage.clear();

    if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
        try {
            const databases = await indexedDB.databases();
            await Promise.all(databases
                .filter((database) => database && database.name)
                .map((database) => new Promise((resolve) => {
                    const request = indexedDB.deleteDatabase(database.name);
                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                    request.onblocked = () => resolve();
                })));
        } catch (error) {
            // Ignore IndexedDB cleanup failures.
        }
    }

    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        } catch (error) {
            // Ignore cache cleanup failures.
        }
    }

    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        } catch (error) {
            // Ignore service worker cleanup failures.
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const passwordInput = document.getElementById('adminPassword');
    const passwordToggle = document.getElementById('togglePassword');

    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const isVisible = passwordInput.type === 'text';
            passwordInput.type = isVisible ? 'password' : 'text';
            passwordToggle.textContent = isVisible ? 'Show' : 'Hide';
            passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
            passwordToggle.setAttribute('aria-pressed', String(!isVisible));
        });
    }

    if (loginForm) {
        if (isAdminAuthenticated()) {
            window.location.replace('believer-details.html');
            return;
        }

        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const username = document.getElementById('adminUsername')?.value.trim();
            const password = document.getElementById('adminPassword')?.value;

            if (username === adminUsername && password === adminPassword) {
                sessionStorage.setItem(adminAuthKey, 'true');
                window.location.href = 'believer-details.html';
                return;
            }

            if (loginError) {
                loginError.textContent = 'Invalid admin username or password.';
            }
        });
    }

    const believerDetailsPage = document.getElementById('believerDetailsPage');
    if (believerDetailsPage) {
        if (!isAdminAuthenticated()) {
            window.location.replace('believer-login.html');
            return;
        }

        const logoutButton = document.getElementById('logoutBtn');

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                sessionStorage.removeItem(adminAuthKey);
                window.location.href = 'believer-login.html';
            });
        }
    }

    const clearAppDataButton = document.getElementById('clearAppDataBtn');
    if (clearAppDataButton) {
        clearAppDataButton.addEventListener('click', async () => {
            const confirmed = window.confirm('This will reset this app on this device. Continue?');
            if (!confirmed) return;

            clearAppDataButton.disabled = true;
            clearAppDataButton.textContent = 'Clearing...';

            try {
                await clearAppData();
                window.location.href = 'index.html';
            } catch (error) {
                clearAppDataButton.disabled = false;
                clearAppDataButton.textContent = 'Reset App';
                window.alert('Could not reset the app. Please try again.');
            }
        });
    }
});

    // ============================================
    // PWA: Service Worker registration & Install prompt handling
    // ============================================
    let deferredInstallPrompt = null;

    function isAppInstalled() {
        return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    function setInstallLinkState() {
        const installLink = document.getElementById('installAppLink');
        if (!installLink) return;

        const installed = isAppInstalled();
        installLink.textContent = installed ? 'Installed' : 'Install App';
        installLink.classList.toggle('is-installed', installed);
        installLink.setAttribute('aria-disabled', installed ? 'true' : 'false');
        installLink.setAttribute('tabindex', installed ? '-1' : '0');
    }

    window.addEventListener('DOMContentLoaded', setInstallLinkState);
    window.addEventListener('load', setInstallLinkState);

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        setInstallLinkState();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        setInstallLinkState();
    });

    document.addEventListener('click', async (event) => {
        const installLink = event.target.closest && event.target.closest('#installAppLink');
        if (!installLink) return;

        event.preventDefault();

        if (isAppInstalled()) {
            setInstallLinkState();
            return;
        }

        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') {
                setInstallLinkState();
            }
            deferredInstallPrompt = null;
            return;
        }

        alert('To install this app, use your browser menu and choose Add to Home Screen or Install App.');
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => console.log('Service worker registered.', registration))
                .catch((error) => console.warn('Service worker registration failed:', error));
        });
    }

// ============================================
// Supabase: fetch series with nested volumes
// ============================================
async function fetchSermonsFromSupabase() {
    const base = 'https://atuthngpymhohxhdajwq.supabase.co/rest/v1/';
    const url = `${base}series?select=*,series_volumes(*)`;
    const key = 'sb_publishable_oei8MssgvyCd3OySXA6JwA_pNxjGq2G';

    const messagesLoadingState = document.getElementById('messagesLoadingState');
    if (messagesLoadingState) messagesLoadingState.hidden = false;

    console.log('[Supabase] Fetching series from:', url);

    try {
        const resp = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        const payload = await resp.json();
        console.log('[Supabase] Response status:', resp.status, resp.statusText);
        console.log('[Supabase] Payload:', payload);

        if (!resp.ok) {
            console.error('[Supabase] Request failed:', payload);
            showDatabaseError(payload);
            if (messagesLoadingState) messagesLoadingState.hidden = true;
            return;
        }

        renderFetchedSermons(payload || []);
    } catch (error) {
        console.error('[Supabase] Fetch error:', error);
        showDatabaseError(error);
    } finally {
        if (messagesLoadingState) messagesLoadingState.hidden = true;
        if (typeof applyMessageFilters === 'function') applyMessageFilters();
        window.dispatchEvent(new Event('resize'));
    }
}

function showDatabaseError(err) {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;
    let errEl = document.getElementById('dbError');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'dbError';
        errEl.style.color = 'red';
        errEl.style.margin = '8px 0';
        errEl.style.fontWeight = 'bold';
        mediaGrid.insertBefore(errEl, mediaGrid.firstChild);
    }
    try {
        const message = typeof err === 'string' ? err : (err && err.message) ? err.message : 'Unable to load sermons from database.';
        errEl.textContent = `Database error: ${message}`;
        console.error('DATABASE_ERROR_DETAILS:', err);
    } catch (e) {
        errEl.textContent = 'Unable to load sermons from database.';
    }
}

/**
 * @typedef {Object} Volume
 * @property {string} [id]
 * @property {number} [volume_number]
 * @property {string} [title]
 * @property {string} [audio_url]
 * @property {string} [duration]
 */

/**
 * @typedef {Object} Series
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [cover_image_url]
 * @property {string} [description]
 * @property {Volume[]} [series_volumes]
 */

/**
 * @param {Series[]} items
 */
function renderFetchedSermons(items) {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;

    mediaGrid.querySelectorAll('.db-fetched-card').forEach(el => el.remove());

    const dbErr = document.getElementById('dbError');
    if (dbErr) dbErr.remove();

    if (!Array.isArray(items) || items.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'db-sermons-list db-fetched-card';
        emptyMsg.textContent = 'No series found in the database.';
        emptyMsg.style.marginBottom = '18px';
        mediaGrid.insertBefore(emptyMsg, mediaGrid.firstChild);
        console.warn('[Supabase] No series returned from database.', items);
        return;
    }

    console.log(`[Supabase] Rendering ${items.length} series.`, items[0] ? Object.keys(items[0]) : []);

    const fragment = document.createDocumentFragment();

    items.forEach((series) => {
        const seriesId = (series && series.id) ? String(series.id) : ('series-' + Math.random().toString(36).slice(2, 9));
        const titleText = (series && series.title) ? String(series.title) : 'Untitled Series';
        const descriptionText = (series && series.description) ? String(series.description) : '';
        const imageUrl = (series && series.cover_image_url) ? String(series.cover_image_url) : '';

        let volumes = [];
        if (Array.isArray(series.series_volumes)) {
            volumes = [...series.series_volumes].sort((a, b) => {
                const va = parseInt(a.volume_number, 10);
                const vb = parseInt(b.volume_number, 10);
                return (isNaN(va) ? 0 : va) - (isNaN(vb) ? 0 : vb);
            });
        }

        const card = document.createElement('div');
        card.className = 'media-card series-card db-fetched-card';
        card.id = `message-card-${seriesId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        card.setAttribute('data-category', 'all');

        if (imageUrl) {
            const mediaImage = document.createElement('div');
            mediaImage.className = 'media-image';
            mediaImage.style.background = `#f6faf2 url('${imageUrl}') center center / contain no-repeat`;
            mediaImage.dataset.thumbnailUrl = imageUrl;
            applyCachedThumbnail(mediaImage, imageUrl);
            card.appendChild(mediaImage);
        }

        const titleEl = document.createElement('h3');
        titleEl.textContent = titleText;
        card.appendChild(titleEl);

        if (descriptionText) {
            const descEl = document.createElement('p');
            descEl.textContent = descriptionText;
            card.appendChild(descEl);
        }

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-primary';
        toggleBtn.setAttribute('data-series-toggle', seriesId);
        toggleBtn.textContent = volumes.length ? 'Open Series' : 'No Volumes';
        if (!volumes.length) toggleBtn.disabled = true;
        actions.appendChild(toggleBtn);

        card.appendChild(actions);

        const volumeListId = seriesId + '-volumes';
        const volumeList = document.createElement('div');
        volumeList.className = 'volume-list';
        volumeList.id = volumeListId;
        volumeList.hidden = true;

        if (volumes.length > 0) {
            const ul = document.createElement('ul');
            volumes.forEach((vol) => {
                const li = document.createElement('li');

                const main = document.createElement('div');
                main.className = 'volume-main';

                const numBadge = document.createElement('span');
                numBadge.className = 'volume-num';
                const volNum = (vol.volume_number !== undefined && vol.volume_number !== null) ? String(vol.volume_number) : '-';
                numBadge.textContent = volNum;
                main.appendChild(numBadge);

                const titleSpan = document.createElement('span');
                titleSpan.className = 'volume-title';
                const volTitle = (vol.title || '').trim();
                titleSpan.textContent = volTitle ? volTitle : 'Untitled';
                main.appendChild(titleSpan);

                const durationSpan = document.createElement('span');
                durationSpan.className = 'volume-duration';
                durationSpan.textContent = (vol.duration || '').trim();
                main.appendChild(durationSpan);

                li.appendChild(main);

                const actions = document.createElement('div');
                actions.className = 'volume-actions';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn listen-btn';
                const audioUrl = (vol.audio_url) ? String(vol.audio_url) : '';
                if (audioUrl) {
                    btn.setAttribute('data-audio-src', audioUrl);
                    btn.setAttribute('data-audio-title', volTitle || titleText || 'Untitled message');
                    btn.textContent = 'Listen';
                } else {
                    btn.textContent = 'No audio';
                    btn.disabled = true;
                }
                actions.appendChild(btn);

                const downloadBtn = document.createElement('button');
                downloadBtn.type = 'button';
                downloadBtn.className = 'btn download-btn';
                downloadBtn.setAttribute('data-download-url', audioUrl);
                downloadBtn.setAttribute('data-download-title', titleText + ' - ' + (volTitle || 'Volume ' + volNum));
                downloadBtn.setAttribute('data-download-action', 'true');
                downloadBtn.textContent = 'Download';
                actions.appendChild(downloadBtn);

                li.appendChild(actions);
                ul.appendChild(li);
            });
            volumeList.appendChild(ul);
        } else {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'volume-empty';
            emptyDiv.textContent = 'No volumes uploaded yet.';
            volumeList.appendChild(emptyDiv);
        }

        card.appendChild(volumeList);
        fragment.appendChild(card);
    });

    mediaGrid.insertBefore(fragment, mediaGrid.firstChild);
    console.log(`[Supabase] Inserted ${items.length} series card(s) into #mediaGrid`);

    // Apply the current search to cards loaded after the initial page setup.
    if (typeof applyMessageFilters === 'function') applyMessageFilters();
    updateMessageSuggestions();

    document.querySelectorAll('[data-series-toggle]').forEach(button => {
        button.addEventListener('click', () => toggleSeries(button.dataset.seriesToggle));
    });

    updateDownloadButtonsState();
}

// Kick off on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    fetchSermonsFromSupabase();
    updateOfflineStorageUI();
    renderContinueListening();

    if (document.getElementById('downloadGrid')) {
        initDownloadsPage();
    }

    updateDownloadButtonsState();
});
