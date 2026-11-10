(function () {
    const params = new URLSearchParams(window.location.search);
    const seriesId = params.get('id');
    const skeleton = document.getElementById('seriesSkeleton');
    const errorBox = document.getElementById('seriesError');
    const errorMessage = document.getElementById('seriesErrorMessage');
    const content = document.getElementById('seriesContent');
    const coverEl = document.getElementById('seriesCover');
    const titleEl = document.getElementById('seriesTitle');
    const metaEl = document.getElementById('seriesMeta');
    const trackListEl = document.getElementById('seriesTrackList');
    const playBtn = document.getElementById('seriesPlayBtn');
    const shuffleBtn = document.getElementById('seriesShuffleBtn');

    const base = 'https://atuthngpymhohxhdajwq.supabase.co/rest/v1/';
    const key = 'sb_publishable_oei8MssgvyCd3OySXA6JwA_pNxjGq2G';

    let volumes = [];
    let queue = [];
    let currentQueueIndex = -1;

    function showError(message) {
        if (skeleton) skeleton.hidden = true;
        if (content) content.hidden = true;
        if (errorBox) errorBox.hidden = false;
        if (errorMessage) errorMessage.textContent = message || 'Unable to load this series.';
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getValidImageUrl(value) {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        return '';
    }

    function getTrackTitle(volume, index) {
        const title = volume && volume.title ? String(volume.title).trim() : '';
        return title || `Track ${index + 1}`;
    }

    function shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function setPlayingHighlight(url) {
        document.querySelectorAll('.series-track-row').forEach((row) => {
            const isPlaying = row.dataset.trackUrl === url;
            row.classList.toggle('is-playing', isPlaying);
            row.setAttribute('aria-current', isPlaying ? 'true' : 'false');
        });
    }

    function playQueueIndex(index) {
        if (index < 0 || index >= queue.length) return;
        currentQueueIndex = index;
        const track = queue[currentQueueIndex];
        setPlayingHighlight(track.audio_url);
        if (typeof window.playInPageAudio === 'function') {
            window.playInPageAudio(track.audio_url, track.displayTitle);
        }
    }

    function startQueue(fromIndex, shuffled) {
        if (!volumes.length) return;
        const indexed = volumes.map((v, i) => ({ ...v, originalIndex: i, displayTitle: getTrackTitle(v, i) }));
        if (shuffled) {
            const start = indexed[fromIndex];
            const rest = indexed.filter((_, i) => i !== fromIndex);
            queue = [start, ...shuffleArray(rest)];
            playQueueIndex(0);
            return;
        }
        queue = indexed;
        playQueueIndex(fromIndex);
    }

    function autoAdvance() {
        if (!queue.length || currentQueueIndex < 0) return;
        const next = currentQueueIndex + 1;
        if (next < queue.length) {
            playQueueIndex(next);
        }
    }

    function renderTracks() {
        trackListEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        volumes.forEach((volume, index) => {
            const title = getTrackTitle(volume, index);
            const duration = volume && volume.duration ? String(volume.duration) : '';
            const audioUrl = volume && volume.audio_url ? String(volume.audio_url) : '';
            const row = document.createElement('div');
            row.className = 'series-track-row';
            row.setAttribute('role', 'listitem');
            row.dataset.trackUrl = audioUrl;
            row.tabIndex = 0;

            const num = document.createElement('span');
            num.className = 'series-track-number';
            num.textContent = String(index + 1);

            const info = document.createElement('div');
            info.className = 'series-track-info';
            const t = document.createElement('div');
            t.className = 'series-track-title';
            t.textContent = title;
            const d = document.createElement('div');
            d.className = 'series-track-duration';
            d.textContent = duration || '';
            info.appendChild(t);
            info.appendChild(d);

            const dl = document.createElement('button');
            dl.type = 'button';
            dl.className = 'download-btn series-track-download';
            dl.dataset.downloadAction = 'download';
            dl.dataset.downloadUrl = audioUrl;
            dl.dataset.downloadTitle = title;
            dl.setAttribute('aria-label', `Download ${title}`);
            dl.innerHTML = `
                <span class="download-progress-label" aria-hidden="true"></span>
                <svg class="download-icon download-icon--arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="download-icon download-icon--check" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;

            row.appendChild(num);
            row.appendChild(info);
            row.appendChild(dl);

            const playFromRow = () => startQueue(index, false);
            row.addEventListener('click', (e) => {
                if (e.target.closest('.download-btn') || e.target.closest('.download-cancel-btn')) return;
                playFromRow();
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    if (e.target.closest('.download-btn')) return;
                    e.preventDefault();
                    playFromRow();
                }
            });

            fragment.appendChild(row);
        });
        trackListEl.appendChild(fragment);
        if (typeof window.updateDownloadButtonsState === 'function') {
            window.updateDownloadButtonsState();
        }
    }

    function applySeriesData(series) {
        console.log('[Series] cover fields:', series ? Object.keys(series) : []);
        const title = series && series.title ? String(series.title) : 'Untitled Series';
        const imageUrl = getValidImageUrl(series && series.image_url);
        const vols = Array.isArray(series && series.series_volumes) ? series.series_volumes.slice() : [];
        volumes = vols.sort((a, b) => {
            const va = parseInt(a.volume_number, 10);
            const vb = parseInt(b.volume_number, 10);
            return (isNaN(va) ? 0 : va) - (isNaN(vb) ? 0 : vb);
        });

        document.title = `${title} | The Metropolitan Church, Ibadan`;
        if (titleEl) titleEl.textContent = title;
        if (metaEl) metaEl.textContent = `${volumes.length} ${volumes.length === 1 ? 'volume' : 'volumes'}`;

        if (coverEl) {
            console.log('[Series] cover url:', imageUrl);
            if (imageUrl) {
                const safeUrl = imageUrl.replace(/"/g, '%22').replace(/\s/g, '%20');
                const preload = new Image();
                preload.onload = () => {
                    coverEl.classList.remove('series-cover--placeholder');
                    coverEl.style.backgroundImage = `url("${safeUrl}")`;
                };
                preload.onerror = () => {
                    console.warn('[Series] cover failed to load:', imageUrl);
                    coverEl.classList.add('series-cover--placeholder');
                };
                preload.src = imageUrl;
            } else {
                console.warn('[Series] missing image_url for series:', series);
                coverEl.classList.add('series-cover--placeholder');
            }
        }

        renderTracks();

        if (playBtn) {
            playBtn.addEventListener('click', () => startQueue(0, false));
            playBtn.disabled = volumes.length === 0;
        }
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => {
                if (!volumes.length) return;
                const start = Math.floor(Math.random() * volumes.length);
                startQueue(start, true);
            });
            shuffleBtn.disabled = volumes.length === 0;
        }

        if (skeleton) skeleton.hidden = true;
        if (errorBox) errorBox.hidden = true;
        if (content) content.hidden = false;
    }

    async function loadSeries() {
        if (!seriesId) {
            showError('No series selected. Please choose a series from messages.');
            return;
        }

        if (typeof window.protectedSeriesAccess !== 'undefined' && window.protectedSeriesAccess[seriesId]) {
            const allowed = sessionStorage.getItem(`tmcSeriesAccess:${seriesId}`) === 'true';
            if (!allowed) {
                window.location.replace('index.html');
                return;
            }
        }

        const url = `${base}series?id=eq.${encodeURIComponent(seriesId)}&select=*,series_volumes(*)`;
        try {
            const resp = await fetch(url, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });
            const payload = await resp.json();
            if (!resp.ok) {
                console.error('[Series] Fetch failed:', payload);
                showError('Unable to load this series right now.');
                return;
            }
            const series = Array.isArray(payload) ? payload[0] : payload;
            if (!series || !series.id) {
                showError('Series not found. It may have been removed or the link is invalid.');
                return;
            }
            applySeriesData(series);
        } catch (err) {
            console.error('[Series] Error:', err);
            showError('Unable to load this series. Check your connection and try again.');
        }
    }

    const pageAudio = document.getElementById('pageAudio');
    if (pageAudio) {
        pageAudio.addEventListener('playing', () => {
            if (pageAudio.currentSrc) setPlayingHighlight(pageAudio.src);
        });
    }
    window.addEventListener('tmc-audio-ended', autoAdvance);

    document.addEventListener('DOMContentLoaded', loadSeries);
})();
