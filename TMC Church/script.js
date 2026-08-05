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
    toggleButton.className = 'theme-toggle theme-toggle-fab';
    toggleButton.addEventListener('click', toggleTheme);
    document.body.appendChild(toggleButton);
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

if (searchInput && searchBtn && messageGrid) {
    searchBtn.addEventListener('click', applyMessageFilters);

    clearSearchBtn?.addEventListener('click', () => {
        searchInput.value = '';
        applyMessageFilters();
        searchInput.focus();
    });

    searchInput.addEventListener('input', scheduleMessageSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyMessageFilters();
        }
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

// Open Listen buttons (uses data-url attribute) without causing page text-selection/highlight
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.listen-btn');
    if (!btn) return;
    const audioSrc = btn.getAttribute('data-audio-src');
    if (audioSrc) {
        const title = btn.getAttribute('data-audio-title') || 'Radio Recording';
        const description = btn.getAttribute('data-audio-description') || '';
        if (typeof window.tmcPlayAudioTrack === 'function') {
            window.tmcPlayAudioTrack(audioSrc, title, description);
        }
        btn.blur();
        return;
    }
    const url = btn.getAttribute('data-url');
    if (!url) return;
    // open in new tab safely
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    try { btn.blur(); } catch (err) {}
});

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
const believerRecordsKey = 'tmcBelieverRecords';
const adminUsername = 'adminTMC';
const adminPassword = 'TMC2026!@';

// Canonical believer list used by the admin directory and Save Contact links.
const officialBelieverRecords = [
    { name: 'Brother King Abiola', date: '', department: 'EHS', hall: 'Tedder A51', phone: '07045538433' },
    { name: 'Sister Victory Nwokocha', date: '', department: 'Economics', hall: 'Queens I25', phone: '09064292277' },
    { name: 'Brother Harel West (Davi)', date: '', department: 'Mechanical Engineering', hall: 'Indy A51', phone: '07057449947' },
    { name: 'Brother Samson', date: '', department: 'Political Science', hall: 'Kuti B47', phone: '07047482999' },
    { name: 'Sister Testimony', date: '', department: 'Geology', hall: 'Queens', phone: '07030011378' },
    { name: 'Sister Adedayo', date: '', department: 'Dentistry', hall: 'India', phone: '07016205604' },
    { name: 'Brother Peter Goodluck', date: '', department: 'Quantity Survey', hall: 'Kuti B2', phone: '07075224378' },
    { name: 'Sister Oluwafadekemi', date: '', department: 'Adult Education', hall: 'Awo D63', phone: '+234 814 012 3763' },
    { name: 'Sister Olamide', date: '', department: 'Adult Education', hall: 'Awo D63', phone: '0916 723 1827' },
    { name: 'Sister Rachael', date: '', department: 'Sociology', hall: 'Awo D64', phone: '09079157366' },
    { name: 'Sister Divine Oluebube Ojinmah', date: '', department: 'Agricultural Economics', hall: 'Awo D62', phone: '08165225125' },
    { name: 'Sister Teni Adetayo', date: '', department: 'Adult Education', hall: 'Awo D63', phone: '+234 906 505 9169' },
    { name: 'Brother Olaoluwa', date: '', department: 'Agricultural Engineering', hall: 'Kuti B47', phone: '+234 812 760 1769' },
    { name: 'Brother Asegun', date: '', department: 'MBBS', hall: 'Kuti B47', phone: '+234 705 494 9218' },
    { name: 'Brother Victor', date: '', department: 'Food Tech', hall: '', phone: '+234 704 890 7891' },
    { name: 'Brother Tega', date: '', department: '', hall: 'Kuti', phone: '+234 816 011 0146' },
    { name: 'Brother Michael', date: '', department: 'Pet Engineering', hall: 'Kuti B48', phone: '08144739800' },
    { name: 'Brother Temi Oyaromade', date: '', department: 'MBBS (400L)', hall: 'Mellanby', phone: '08102318021' },
    { name: 'Ayomide Yaya', date: '', department: 'Law', hall: 'Ojoh', phone: '09044267892' },
    { name: 'Demilade Adekoya', date: '', department: 'Petroleum Engineering', hall: 'Bello A42', phone: '09150673737' },
    { name: 'King Abuh', date: '', department: 'Electrolum Engineering', hall: 'Bello A45', phone: '09067350519' },
    { name: 'Stephen Nnachiajah', date: '', department: 'Accounting', hall: 'Bello A50', phone: '07025867569' },
    { name: 'Eliam Ilesanmi', date: '', department: 'Biochemistry', hall: 'Agbwo', phone: '09049972727' },
    { name: 'Joshua Amadi', date: '', department: 'Geography', hall: 'Kuti B4', phone: '08109662858' },
    { name: 'Bro Vincent', date: '', department: 'Biochemistry', hall: 'Zik C65', phone: '+2347049606166' },
    { name: 'Brother Seun', date: '22/03/2026', department: 'Architecture', hall: 'Kuti B4', phone: '07082981427' },
    { name: 'Brother Divine Adeleye', date: '22/03/2026', department: 'Political Science', hall: 'Kuti B8', phone: '08069155406' },
    { name: 'Sister Miracle', date: '22/03/2026', department: 'Corper (Occupation)', hall: '', phone: '07034950696' },
    { name: 'Brother Paul Abodunrin', date: '25/03/2026', department: 'Business Education', hall: 'Bello A45', phone: '09033861076' },
    { name: 'Brother Shola Alao', date: '25/03/2026', department: 'Architecture', hall: 'Bello A40', phone: '08147491723' },
    { name: 'Brother Favour Adeleke', date: '25/03/2026', department: 'Microbiology', hall: 'Bello A28', phone: '09020255198' },
    { name: 'Brother Emmanuel Akinola', date: '26/03/2026', department: 'Economics', hall: 'Kuti B8', phone: '08125006749' },
    { name: 'Brother Timothy', date: '26/03/2026', department: 'Computer Science', hall: 'Bello A45', phone: '09021947088' },
    { name: 'Ugochukwu Ezenwa', date: '29/03/2026', department: 'Accounting', hall: 'Kuti B12', phone: '08127959426' },
    { name: 'Chigozie Okorafo', date: '29/03/2026', department: 'Law', hall: 'Mellanby A35', phone: '09030021004' },
    { name: 'Sister Eniola', date: '29/03/2026', department: 'Sociology', hall: 'Awo D64', phone: '0701 916 1798' },
    { name: 'Ebrubaroghene Precious', date: '29/03/2026', department: '', hall: 'Kuti', phone: '0816 858 3164' },
    { name: 'Brother Emmanuel Abimbola', date: '06/05/2026', department: 'Science and Technology Education', hall: 'Kuti B31', phone: '08081639558' },
    { name: 'Brother Olatunde Ogunlana', date: '10/05/2026', department: 'Biochemistry', hall: 'Kuti B62', phone: '07035110484' },
    { name: 'Nathaniel', date: '15/05/2026', department: 'WPE', hall: 'Bello A15', phone: '0816 396 2359' },
    { name: 'Enoch', date: '15/05/2026', department: 'Chemistry', hall: 'Bello A15', phone: '0811 680 8563' },
    { name: 'Brother Samuel Lawal', date: '17/05/2026', department: 'Computer Science', hall: 'Bello A47', phone: '09061537601' },
    { name: 'Akinboade Shalom', date: '20/05/2026', department: 'Civil Engineering', hall: 'Bello A29', phone: '08083468446' },
    { name: 'Nwosu Godwin Emeka', date: '20/05/2026', department: 'Petroleum Engineering', hall: 'Bello A27', phone: '08136794628' },
    { name: 'Demilade Bobola', date: '24/05/2026', department: 'Pharmacy', hall: 'Kuti B61', phone: '08105307607' },
    { name: 'Isaac Oyebamiji', date: '03/06/2026', department: 'Microbiology', hall: 'Bello A27', phone: '08145947099' },
    { name: 'Irewole Akinola', date: '17/06/2026', department: 'Computer Science', hall: 'Bello', phone: '08029330806' },
    { name: 'Heritage Oladimeji', date: '15/07/2026', department: 'Accounting', hall: 'Kuti B18', phone: '07068750898' },
    { name: 'Oludara Paul Temioluwa', date: '15/07/2026', department: 'MBBS', hall: 'Tedder A30', phone: '09046911016' },
    { name: 'Adeyemo Precious Zoe', date: '15/07/2026', department: 'MBBS', hall: 'Kuti B20', phone: '09137777739' },
    { name: 'Taiwo Segun', date: '15/07/2026', department: 'Physiology', hall: 'Kuti B9', phone: '09023713197' },
    { name: 'TEC (Enoch)', date: '15/07/2026', department: 'Industrial Eng.', hall: 'Kuti', phone: '08029810748' },
    { name: 'Gabriel Sunday', date: '22/07/2026', department: 'Computer Science', hall: 'Kuti B15', phone: '08115229586' }
];

function normalizeBelieverRecord(record = {}) {
    const name = record.name || record.fullName || record.believerName || record.contactName || '';
    const hall = record.hall || record.schoolAddress || record.address || record.hallNumber || '';
    const department = record.department || record.departmentName || record.programme || record.level || '';
    const phone = record.phone || record.contact || record.phoneNumber || record.telephone || '';
    return {
        ...record,
        name,
        date: record.date || '',
        department,
        hall,
        phone,
        contact: phone,
        schoolAddress: hall
    };
}

function isAdminAuthenticated() {
    return sessionStorage.getItem(adminAuthKey) === 'true';
}

function getBelieverRecords() {
    try {
        const storedRecords = localStorage.getItem(believerRecordsKey);
        return storedRecords ? JSON.parse(storedRecords).map(normalizeBelieverRecord) : [];
    } catch (error) {
        return [];
    }
}

function saveBelieverRecords(records) {
    localStorage.setItem(believerRecordsKey, JSON.stringify(records.map(normalizeBelieverRecord)));
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

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeVCardValue(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function generateVCardUrl(contact) {
    const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCardValue(contact.name)}`,
        `TEL;TYPE=CELL:${escapeVCardValue(contact.phone)}`,
        `NOTE:Department: ${escapeVCardValue(contact.department)} | Hall: ${escapeVCardValue(contact.hall)}`,
        'END:VCARD'
    ].join('\r\n');

    return URL.createObjectURL(new Blob([vCard], { type: 'text/vcard;charset=utf-8' }));
}

function renderBelieverRecords() {
    const tableBody = document.getElementById('believerTableBody');
    if (!tableBody) return;

    const records = getBelieverRecords();

    tableBody.innerHTML = '';

    if (records.length === 0) {
        tableBody.innerHTML = '<tr class="empty-state-row"><td colspan="7">No believer records have been added yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = records.map((record, idx) => {
        const normalizedRecord = normalizeBelieverRecord(record);
        const vCardUrl = generateVCardUrl({
            name: normalizedRecord.name || normalizedRecord.phone || 'Contact',
            phone: normalizedRecord.phone,
            department: normalizedRecord.department,
            hall: normalizedRecord.hall
        });

        return `
        <tr>
            <td style="padding:8px; border:1px solid #e0e0e0;">${idx + 1}</td>
            <td style="padding:8px; border:1px solid #e0e0e0;">${escapeHtml(normalizedRecord.date || '—')}</td>
            <td style="padding:8px; border:1px solid #e0e0e0;">${escapeHtml(normalizedRecord.name || '—')}</td>
            <td style="padding:8px; border:1px solid #e0e0e0;">${escapeHtml(normalizedRecord.hall || '—')}</td>
            <td style="padding:8px; border:1px solid #e0e0e0;">${escapeHtml(normalizedRecord.department || '—')}</td>
            <td style="padding:8px; border:1px solid #e0e0e0;">${escapeHtml(normalizedRecord.phone || '—')}</td>
            <td style="padding:8px; border:1px solid #e0e0e0; white-space:nowrap;">
                <a href="${vCardUrl}" download="${escapeHtml(normalizedRecord.name || normalizedRecord.phone || 'contact')}.vcf" class="btn btn-primary save-contact-link">Save Contact</a>
            </td>
        </tr>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');

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

        // Replace stored records with the official provided list
        saveBelieverRecords(officialBelieverRecords);

        const detailsForm = document.getElementById('believerForm');
        const logoutButton = document.getElementById('logoutBtn');

        renderBelieverRecords();

        if (detailsForm) {
            detailsForm.addEventListener('submit', (event) => {
                event.preventDefault();

                const newRecord = {
                    name: document.getElementById('believerName')?.value.trim(),
                    contact: document.getElementById('believerContact')?.value.trim(),
                    email: document.getElementById('believerEmail')?.value.trim(),
                    department: document.getElementById('believerDepartment')?.value.trim(),
                    level: document.getElementById('believerLevel')?.value.trim(),
                    schoolName: document.getElementById('schoolName')?.value.trim(),
                    schoolAddress: document.getElementById('schoolAddress')?.value.trim(),
                    homeAddress: document.getElementById('homeAddress')?.value.trim()
                };

                if (!newRecord.name || !newRecord.contact) {
                    return;
                }

                const records = getBelieverRecords();
                records.unshift(newRecord);
                saveBelieverRecords(records);
                detailsForm.reset();
                renderBelieverRecords();
            });
        }

        // Migration: move department-like values from `level` into `department` when department is empty
        (function migrateLevelToDepartment() {
            const records = getBelieverRecords();
            let changed = false;
            for (let i = 0; i < records.length; i++) {
                const r = records[i];
                if ((!r.department || r.department === '') && r.level && r.level.trim() !== '') {
                    // Move the level content into department and clear level
                    r.department = r.level;
                    r.level = '';
                    changed = true;
                }
            }
            if (changed) {
                saveBelieverRecords(records);
                renderBelieverRecords();
            }
        })();

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
