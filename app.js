/**
 * Neighborhood Notes — app.js
 *
 * Architecture:
 *  - api.js logic (EventbriteAPI class) — handles all fetch/auth concerns
 *  - ui.js logic (UI object) — handles DOM rendering & state
 *  - app init — wires everything together
 *
 * Eventbrite API docs: https://www.eventbrite.com/platform/api
 *
 * NOTE ON CORS: Eventbrite's /v3/events/search/ endpoint does NOT support
 * browser-side CORS requests without a server-side proxy. When a user provides
 * their API token, requests are routed through a public CORS proxy (cors-anywhere
 * or equivalent). For production deployments, replace CORS_PROXY with your own
 * backend endpoint that forwards requests to Eventbrite.
 */

'use strict';

/* ============================================================
   Constants
   ============================================================ */
const STORAGE_KEYS = {
  FAVORITES: 'nn_favorites',
  API_KEY: 'nn_api_key',
  DARK_MODE: 'nn_dark_mode',
};

/** Public CORS proxy — only used when an API key is configured */
const CORS_PROXY = 'https://corsproxy.io/?';
const EVENTBRITE_BASE = 'https://www.eventbriteapi.com/v3';

/** Category ID map for Eventbrite (Music = 103) */
const EVENTBRITE_CATEGORY_ID = '103';

/** Filter → keyword mapping for Eventbrite search query */
const FILTER_KEYWORDS = {
  all: '',
  concert: 'concert',
  'open-mic': 'open mic',
  'live-music': 'live music',
  jazz: 'jazz',
  'hip-hop': 'hip-hop',
};

/** Labels for categories */
const CATEGORY_LABELS = {
  concert: 'Concert',
  'open-mic': 'Open Mic',
  'live-music': 'Live Music',
  jazz: 'Jazz',
  'hip-hop': 'Hip-Hop',
  music: 'Music',
};

/* ============================================================
   Demo / Mock Data
   Used when no API key is configured or the API is unavailable
   ============================================================ */
const DEMO_EVENTS = [
  {
    id: 'demo-1',
    name: { text: 'Summer Jazz Under the Stars' },
    description: { text: 'Join us for an unforgettable evening of smooth jazz in the open air. Featuring local and regional jazz artists performing classic and contemporary pieces. Bring a blanket and enjoy the music under the night sky.' },
    start: { local: '2026-07-12T20:00:00', utc: '2026-07-13T00:00:00Z' },
    end: { local: '2026-07-12T23:00:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80' },
    venue: { name: 'Riverside Amphitheater', address: { localized_address_display: '100 Riverside Dr, Chicago, IL' } },
    is_free: false,
    ticket_availability: { minimum_ticket_price: { major_value: '25.00', currency: 'USD' } },
    _category: 'jazz',
    _demo: true,
    _lat: 41.8781,
    _lon: -87.6298,
  },
  {
    id: 'demo-2',
    name: { text: 'Open Mic Night at The Rusty Nail' },
    description: { text: 'Every Thursday night, The Rusty Nail opens its stage to local talent! All genres welcome — singer-songwriters, comedians, poets, and more. Sign-ups begin at 6 PM. Come share your art or just enjoy the show.' },
    start: { local: '2026-07-17T19:00:00', utc: '2026-07-17T23:00:00Z' },
    end: { local: '2026-07-17T22:00:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80' },
    venue: { name: 'The Rusty Nail Bar', address: { localized_address_display: '42 Main St, Brooklyn, NY' } },
    is_free: true,
    _category: 'open-mic',
    _demo: true,
    _lat: 40.6782,
    _lon: -73.9442,
  },
  {
    id: 'demo-3',
    name: { text: 'Hip-Hop Showcase: New Voices' },
    description: { text: 'Discover the next generation of hip-hop artists at this exciting showcase. Six emerging MCs and producers will take the stage in a battle-style format. Hosted by DJ Spinmaster. 21+ event. Doors open at 8 PM.' },
    start: { local: '2026-07-20T20:00:00', utc: '2026-07-21T00:00:00Z' },
    end: { local: '2026-07-20T23:59:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1571266752235-29c39b2cffff?w=600&q=80' },
    venue: { name: 'The Underground Club', address: { localized_address_display: '808 Beat Ave, Atlanta, GA' } },
    is_free: false,
    ticket_availability: { minimum_ticket_price: { major_value: '15.00', currency: 'USD' } },
    _category: 'hip-hop',
    _demo: true,
    _lat: 33.7490,
    _lon: -84.3880,
  },
  {
    id: 'demo-4',
    name: { text: 'Indie Rock Concert — Echoes of Tomorrow' },
    description: { text: 'Three indie rock bands, one incredible night. Echoes of Tomorrow headlines alongside support acts The Wired Chorus and Signal & Noise. Get your tickets before they sell out!' },
    start: { local: '2026-07-25T19:30:00', utc: '2026-07-25T23:30:00Z' },
    end: { local: '2026-07-25T23:00:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1540039155733-5bb30b4203eb?w=600&q=80' },
    venue: { name: 'The Fillmore', address: { localized_address_display: '1805 Geary Blvd, San Francisco, CA' } },
    is_free: false,
    ticket_availability: { minimum_ticket_price: { major_value: '35.00', currency: 'USD' } },
    _category: 'concert',
    _demo: true,
    _lat: 37.7749,
    _lon: -122.4194,
  },
  {
    id: 'demo-5',
    name: { text: 'Acoustic Live Music Brunch' },
    description: { text: 'Start your Sunday right with a live acoustic set from local musicians. Enjoy mimosas, brunch favorites, and the warm sounds of acoustic guitar, violin, and piano. Family friendly. Reservations recommended.' },
    start: { local: '2026-07-26T11:00:00', utc: '2026-07-26T15:00:00Z' },
    end: { local: '2026-07-26T14:00:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80' },
    venue: { name: 'Garden Café', address: { localized_address_display: '22 Oak Street, Austin, TX' } },
    is_free: false,
    ticket_availability: { minimum_ticket_price: { major_value: '12.00', currency: 'USD' } },
    _category: 'live-music',
    _demo: true,
    _lat: 30.2672,
    _lon: -97.7431,
  },
  {
    id: 'demo-6',
    name: { text: 'Amapiano Night: Groove the Neighborhood' },
    description: { text: 'Experience the infectious rhythms of Amapiano right in your neighborhood. DJs and live performers bring the South African sound stateside. Dance, connect, and celebrate music without borders.' },
    start: { local: '2026-08-02T21:00:00', utc: '2026-08-03T01:00:00Z' },
    end: { local: '2026-08-03T02:00:00' },
    url: 'https://www.eventbrite.com',
    logo: { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80' },
    venue: { name: 'Vibez Lounge', address: { localized_address_display: '99 Culture Blvd, Houston, TX' } },
    is_free: false,
    ticket_availability: { minimum_ticket_price: { major_value: '20.00', currency: 'USD' } },
    _category: 'live-music',
    _demo: true,
    _lat: 29.7604,
    _lon: -95.3698,
  },
];

/* ============================================================
   EventbriteAPI — all API interaction
   ============================================================ */
const EventbriteAPI = {
  /** Retrieve stored API token from localStorage */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  /** Save API token */
  setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  },

  /**
   * Search for events using the Eventbrite REST API.
   * @param {string} location - City name or "lat,lon"
   * @param {string} keyword  - Search keyword (e.g., "jazz", "open mic")
   * @returns {Promise<Array>} - Array of event objects
   */
  async searchEvents(location, keyword = '') {
    const token = this.getToken();
    if (!token) throw new Error('NO_API_KEY');

    const params = new URLSearchParams({
      token,
      'location.address': location,
      'location.within': '25mi',
      categories: EVENTBRITE_CATEGORY_ID,
      expand: 'venue,ticket_availability,logo',
      sort_by: 'date',
      page_size: 24,
    });

    if (keyword) {
      params.set('q', keyword);
    }

    const url = `${CORS_PROXY}${encodeURIComponent(`${EVENTBRITE_BASE}/events/search/?${params.toString()}`)}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error_description || errorData.error || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    return data.events || [];
  },

  /**
   * Reverse geocode coordinates to a city name using the browser's
   * Geolocation API + a free geocoding service.
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<string>} city name
   */
  async reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'en' },
    });
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      `${lat},${lon}`
    );
  },
};

/* ============================================================
   Favorites — localStorage persistence
   ============================================================ */
const Favorites = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;
    try {
      this._cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || {};
    } catch {
      this._cache = {};
    }
    return this._cache;
  },

  save() {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(this._cache));
  },

  toggle(event) {
    const favs = this.load();
    if (favs[event.id]) {
      delete favs[event.id];
    } else {
      favs[event.id] = event;
    }
    this.save();
    return !!favs[event.id];
  },

  isSaved(id) {
    return !!this.load()[id];
  },

  getAll() {
    return Object.values(this.load());
  },

  count() {
    return Object.keys(this.load()).length;
  },
};

/* ============================================================
   Helpers
   ============================================================ */

/** Return [lat, lon] for an event, or null if unavailable */
function getEventCoords(event) {
  // Demo events carry explicit coords
  if (event._lat != null && event._lon != null) {
    return [event._lat, event._lon];
  }
  // Real Eventbrite events include venue lat/lon when expanded
  const lat = parseFloat(event.venue?.latitude);
  const lon = parseFloat(event.venue?.longitude);
  if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
  return null;
}

/** Format a date string from Eventbrite (local ISO) */
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format a time string */
function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Format price display */
function formatPrice(event) {
  if (event.is_free) return 'Free';
  const tp = event.ticket_availability?.minimum_ticket_price;
  if (tp) return `From $${parseFloat(tp.major_value).toFixed(2)}`;
  return 'See tickets';
}

/** Extract the best image URL from an event object */
function getImageUrl(event) {
  return event.logo?.url || event.logo?.original?.url || '';
}

/** Strip HTML tags from a string */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Show a brief toast message */
let toastTimer = null;
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
}

/* ============================================================
   UI — DOM rendering & state management
   ============================================================ */
const UI = {
  currentFilter: 'all',
  currentSort: 'date',
  allEvents: [],
  currentLocation: '',

  /** Show a specific state panel and hide others */
  setState(state) {
    const panels = ['loading', 'empty-state', 'error-state', 'events-grid'];
    panels.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(state);
    if (target) target.classList.remove('hidden');
  },

  /** Show the loading spinner */
  showLoading() {
    this.setState('loading');
    document.getElementById('favorites-panel').classList.add('hidden');
  },

  /** Render events to the grid */
  renderEvents(events) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (events.length === 0) {
      this.setState('empty-state');
      document.getElementById('results-count').textContent = '';
      return;
    }

    this.setState('events-grid');
    document.getElementById('results-count').textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found`;

    grid.innerHTML = events.map((event) => this.buildEventCard(event)).join('');

    // Attach event listeners to cards
    grid.querySelectorAll('[data-event-id]').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't open modal if the fav button was clicked
        if (e.target.closest('.event-fav-btn')) return;
        const id = card.dataset.eventId;
        const event = this.allEvents.find((ev) => ev.id === id);
        if (event) this.openModal(event);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    grid.querySelectorAll('.event-fav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.favId;
        const event = this.allEvents.find((ev) => ev.id === id);
        if (!event) return;
        const saved = Favorites.toggle(event);
        btn.classList.toggle('active', saved);
        btn.setAttribute('aria-label', saved ? 'Remove from favorites' : 'Save to favorites');
        btn.innerHTML = `<iconify-icon icon="${saved ? 'ph:heart-fill' : 'ph:heart'}" aria-hidden="true"></iconify-icon>`;
        this.updateFavCount();
        showToast(saved ? 'Event saved!' : 'Event removed from favorites');
      });
    });
  },

  /** Build an event card HTML string */
  buildEventCard(event) {
    const imageUrl = getImageUrl(event);
    const saved = Favorites.isSaved(event.id);
    const categoryLabel = CATEGORY_LABELS[event._category] || CATEGORY_LABELS.music;
    const price = formatPrice(event);
    const venueName = event.venue?.name || 'Venue TBA';
    const dateStr = formatDate(event.start?.local);
    const name = event.name?.text || 'Unnamed Event';

    return `
      <article
        class="event-card"
        data-event-id="${event.id}"
        tabindex="0"
        role="button"
        aria-label="View details for ${name.replace(/"/g, '&quot;')}"
      >
        <div class="event-image-wrap">
          ${imageUrl
            ? `<img class="event-image" src="${imageUrl}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="event-image-placeholder" style="display:none"><iconify-icon icon="ph:music-notes-fill" aria-hidden="true"></iconify-icon></div>`
            : `<div class="event-image-placeholder"><iconify-icon icon="ph:music-notes-fill" aria-hidden="true"></iconify-icon></div>`
          }
          <span class="event-category-badge">${categoryLabel}</span>
          <button
            class="event-fav-btn ${saved ? 'active' : ''}"
            data-fav-id="${event.id}"
            aria-label="${saved ? 'Remove from favorites' : 'Save to favorites'}"
          ><iconify-icon icon="${saved ? 'ph:heart-fill' : 'ph:heart'}" aria-hidden="true"></iconify-icon></button>
        </div>
        <div class="event-body">
          <h3 class="event-name">${name}</h3>
          <p class="event-date"><iconify-icon icon="ph:calendar-dots-fill" aria-hidden="true"></iconify-icon> ${dateStr}</p>
          <p class="event-venue"><iconify-icon icon="ph:map-pin-fill" aria-hidden="true"></iconify-icon> ${venueName}</p>
        </div>
        <div class="event-footer">
          <span class="event-price">${price}</span>
          <button class="event-details-btn">View Details →</button>
        </div>
      </article>
    `;
  },

  /** Open the event detail modal */
  openModal(event) {
    const imageUrl = getImageUrl(event);
    const saved = Favorites.isSaved(event.id);
    const categoryLabel = CATEGORY_LABELS[event._category] || CATEGORY_LABELS.music;
    const name = event.name?.text || 'Unnamed Event';
    const description = stripHtml(event.description?.text || event.description?.html || 'No description available.');
    const dateStr = formatDate(event.start?.local);
    const timeStr = formatTime(event.start?.local);
    const venue = event.venue;
    const venueText = venue
      ? `${venue.name}${venue.address?.localized_address_display ? ', ' + venue.address.localized_address_display : ''}`
      : 'Venue TBA';
    const ticketUrl = event.url || '#';

    // Populate modal
    document.getElementById('modal-title').textContent = name;
    document.getElementById('modal-description').textContent = description;
    document.getElementById('modal-date').innerHTML = `<iconify-icon icon="ph:calendar-dots-fill" aria-hidden="true"></iconify-icon> ${dateStr}`;
    document.getElementById('modal-time').innerHTML = `<iconify-icon icon="ph:clock-fill" aria-hidden="true"></iconify-icon> ${timeStr}`;
    document.getElementById('modal-venue').innerHTML = `<iconify-icon icon="ph:map-pin-fill" aria-hidden="true"></iconify-icon> ${venueText}`;

    const tagEl = document.getElementById('modal-tags');
    tagEl.innerHTML = `<span class="modal-tag">${categoryLabel}</span>`;

    const ticketLink = document.getElementById('modal-ticket-link');
    ticketLink.href = ticketUrl;
    ticketLink.style.display = ticketUrl === '#' ? 'none' : '';

    const favBtn = document.getElementById('modal-fav-btn');
    favBtn.innerHTML = saved
      ? '<iconify-icon icon="ph:heart-fill" aria-hidden="true"></iconify-icon> Saved'
      : '<iconify-icon icon="ph:heart" aria-hidden="true"></iconify-icon> Save Event';
    favBtn.dataset.modalEventId = event.id;

    const imgEl = document.getElementById('modal-image');
    const imgPlaceholder = document.querySelector('.modal-image-placeholder');
    if (imageUrl) {
      imgEl.src = imageUrl;
      imgEl.alt = name;
      imgEl.classList.remove('hidden');
      imgEl.style.display = '';
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        imgPlaceholder.classList.remove('hidden');
      };
      imgPlaceholder.classList.add('hidden');
    } else {
      imgEl.style.display = 'none';
      imgPlaceholder.classList.remove('hidden');
    }

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-close-btn').focus();
    document.body.style.overflow = 'hidden';

    // Store event reference for the fav btn
    favBtn.onclick = () => {
      const isNowSaved = Favorites.toggle(event);
      favBtn.innerHTML = isNowSaved
        ? '<iconify-icon icon="ph:heart-fill" aria-hidden="true"></iconify-icon> Saved'
        : '<iconify-icon icon="ph:heart" aria-hidden="true"></iconify-icon> Save Event';
      // Update the card too
      const cardFavBtn = document.querySelector(`.event-fav-btn[data-fav-id="${event.id}"]`);
      if (cardFavBtn) {
        cardFavBtn.classList.toggle('active', isNowSaved);
        cardFavBtn.innerHTML = `<iconify-icon icon="${isNowSaved ? 'ph:heart-fill' : 'ph:heart'}" aria-hidden="true"></iconify-icon>`;
      }
      this.updateFavCount();
      showToast(isNowSaved ? 'Event saved!' : 'Event removed');
    };
  },

  /** Close the modal */
  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  },

  /** Apply current filter and sort to allEvents, then render */
  applyFilterAndRender() {
    let filtered = [...this.allEvents];

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((ev) => ev._category === this.currentFilter);
    }

    // Sort
    if (this.currentSort === 'date') {
      filtered.sort((a, b) => new Date(a.start?.utc || 0) - new Date(b.start?.utc || 0));
    } else if (this.currentSort === 'name') {
      filtered.sort((a, b) => (a.name?.text || '').localeCompare(b.name?.text || ''));
    }

    if (MapView.active) {
      // Update results count and refresh map markers
      document.getElementById('results-count').textContent =
        filtered.length ? `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found` : '';
      MapView.show(filtered);
    } else {
      this.renderEvents(filtered);
    }
  },

  /** Update the favorite count badge in the header */
  updateFavCount() {
    const count = Favorites.count();
    const badge = document.getElementById('fav-count');
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  },

  /** Show the favorites panel */
  showFavorites() {
    const panel = document.getElementById('favorites-panel');
    const grid = document.getElementById('favorites-grid');
    const emptyEl = document.getElementById('favorites-empty');
    const favs = Favorites.getAll();

    panel.classList.remove('hidden');

    if (favs.length === 0) {
      grid.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      // Temporarily set allEvents so buildEventCard can work
      const prevAll = this.allEvents;
      this.allEvents = [...this.allEvents, ...favs.filter((f) => !this.allEvents.find((e) => e.id === f.id))];
      grid.innerHTML = favs.map((event) => this.buildEventCard(event)).join('');
      this.allEvents = prevAll;

      grid.querySelectorAll('[data-event-id]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.event-fav-btn')) return;
          const id = card.dataset.eventId;
          const event = Favorites.getAll().find((ev) => ev.id === id);
          if (event) this.openModal(event);
        });
      });

      grid.querySelectorAll('.event-fav-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.favId;
          const event = Favorites.getAll().find((ev) => ev.id === id);
          if (!event) return;
          Favorites.toggle(event);
          this.updateFavCount();
          this.showFavorites(); // refresh panel
          showToast('Event removed from favorites');
        });
      });
    }

    // scroll to panel
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};

/* ============================================================
   MapView — Leaflet map integration
   ============================================================ */
const MapView = {
  _map: null,
  _markers: null,
  active: false,

  /** Initialise the Leaflet map (idempotent) */
  _init() {
    if (this._map) return;
    this._map = L.map('map-view', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this._map);
    this._markers = L.layerGroup().addTo(this._map);
  },

  /** Show the map and render markers for the given events */
  show(events) {
    const mapEl = document.getElementById('map-view');
    const gridEl = document.getElementById('events-grid');
    mapEl.classList.remove('hidden');
    gridEl.classList.add('hidden');

    this._init();

    // Trigger Leaflet resize after the container becomes visible
    setTimeout(() => this._map.invalidateSize(), 50);

    this._markers.clearLayers();

    const bounds = [];
    events.forEach((event) => {
      const coords = getEventCoords(event);
      if (!coords) return;

      bounds.push(coords);

      const name = event.name?.text || 'Event';
      const venueName = event.venue?.name || 'Venue TBA';
      const dateStr = formatDate(event.start?.local);
      const price = formatPrice(event);
      const categoryLabel = CATEGORY_LABELS[event._category] || CATEGORY_LABELS.music;

      const marker = L.marker(coords);
      marker.bindPopup(
        `<div class="map-popup">
          <span class="map-popup-category">${categoryLabel}</span>
          <strong class="map-popup-name">${name}</strong>
          <span class="map-popup-venue">📍 ${venueName}</span>
          <span class="map-popup-date">📅 ${dateStr}</span>
          <span class="map-popup-price">${price}</span>
          <button class="map-popup-details btn btn-primary" data-map-event-id="${event.id}">View Details →</button>
        </div>`,
        { maxWidth: 260 }
      );
      marker.on('popupopen', () => {
        // Attach click handler after popup is inserted into DOM
        setTimeout(() => {
          const btn = document.querySelector(`.map-popup-details[data-map-event-id="${event.id}"]`);
          if (btn) {
            btn.addEventListener('click', () => {
              marker.closePopup();
              UI.openModal(event);
            });
          }
        }, 0);
      });
      this._markers.addLayer(marker);
    });

    if (bounds.length > 0) {
      this._map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  },

  /** Hide the map and show the events grid */
  hide() {
    document.getElementById('map-view').classList.add('hidden');
    document.getElementById('events-grid').classList.remove('hidden');
  },
};

/* ============================================================
   normalizeEvent — add derived fields for consistent rendering
   ============================================================ */
function normalizeEvent(event, filterKeyword) {
  if (!event._category) {
    const name = (event.name?.text || '').toLowerCase();
    const desc = (event.description?.text || '').toLowerCase();
    const text = name + ' ' + desc;

    if (text.includes('jazz')) event._category = 'jazz';
    else if (text.includes('hip-hop') || text.includes('hiphop') || text.includes('rap')) event._category = 'hip-hop';
    else if (text.includes('open mic')) event._category = 'open-mic';
    else if (text.includes('concert')) event._category = 'concert';
    else if (text.includes('live music') || text.includes('live band')) event._category = 'live-music';
    else event._category = filterKeyword || 'music';
  }
  return event;
}

/* ============================================================
   App Controller — wires UI and API together
   ============================================================ */
const App = {
  lastSearchLocation: '',
  lastSearchKeyword: '',

  /** Initial setup */
  init() {
    this.bindEvents();
    this.restoreTheme();
    UI.updateFavCount();

    // Auto-load demo data on first visit
    const hasKey = !!EventbriteAPI.getToken();
    this.updateApiKeyUI();

    if (!hasKey) {
      this.loadDemoData();
    }
  },

  /** Bind all DOM event listeners */
  bindEvents() {
    // View toggle (list / map)
    document.getElementById('list-view-btn').addEventListener('click', () => {
      if (!MapView.active) return;
      MapView.active = false;
      MapView.hide();
      document.getElementById('list-view-btn').classList.add('active');
      document.getElementById('list-view-btn').setAttribute('aria-pressed', 'true');
      document.getElementById('map-view-btn').classList.remove('active');
      document.getElementById('map-view-btn').setAttribute('aria-pressed', 'false');
      UI.applyFilterAndRender();
    });

    document.getElementById('map-view-btn').addEventListener('click', () => {
      if (MapView.active) return;
      MapView.active = true;
      document.getElementById('map-view-btn').classList.add('active');
      document.getElementById('map-view-btn').setAttribute('aria-pressed', 'true');
      document.getElementById('list-view-btn').classList.remove('active');
      document.getElementById('list-view-btn').setAttribute('aria-pressed', 'false');
      UI.applyFilterAndRender();
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', () => this.search());
    document.getElementById('location-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.search();
    });

    // Geolocation
    document.getElementById('use-location-btn').addEventListener('click', () => this.useMyLocation());

    // Filters
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        UI.currentFilter = btn.dataset.filter;
        UI.applyFilterAndRender();
      });
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', (e) => {
      UI.currentSort = e.target.value;
      UI.applyFilterAndRender();
    });

    // Favorites
    document.getElementById('favorites-btn').addEventListener('click', () => {
      // Switch back to list view if map is active
      if (MapView.active) {
        MapView.active = false;
        MapView.hide();
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('list-view-btn').setAttribute('aria-pressed', 'true');
        document.getElementById('map-view-btn').classList.remove('active');
        document.getElementById('map-view-btn').setAttribute('aria-pressed', 'false');
      }
      UI.showFavorites();
    });
    document.getElementById('close-favorites-btn').addEventListener('click', () => {
      document.getElementById('favorites-panel').classList.add('hidden');
    });

    // Modal
    document.getElementById('modal-close-btn').addEventListener('click', () => UI.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) UI.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.closeModal();
    });

    // Dark mode
    document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());

    // API Key
    document.getElementById('save-api-key-btn').addEventListener('click', () => this.saveApiKey());
    document.getElementById('clear-api-key-btn').addEventListener('click', () => this.clearApiKey());

    // Empty state demo loader
    document.getElementById('load-demo-btn').addEventListener('click', () => this.loadDemoData());

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => this.search());
  },

  /** Run a search — uses API if key is set, otherwise loads demo data */
  async search() {
    const location = document.getElementById('location-input').value.trim();
    if (!location) {
      showToast('Please enter a city name first');
      document.getElementById('location-input').focus();
      return;
    }

    const hasKey = !!EventbriteAPI.getToken();
    if (!hasKey) {
      showToast('No API key configured — showing demo data');
      this.loadDemoData();
      return;
    }

    UI.showLoading();
    this.lastSearchLocation = location;

    const keyword = FILTER_KEYWORDS[UI.currentFilter] || '';
    this.lastSearchKeyword = keyword;

    try {
      const events = await EventbriteAPI.searchEvents(location, keyword);
      const normalized = events.map((ev) => normalizeEvent(ev, UI.currentFilter));
      UI.allEvents = normalized;
      UI.applyFilterAndRender();
      if (events.length === 0) {
        UI.setState('empty-state');
      }
    } catch (err) {
      console.error('Search failed:', err);
      if (err.message === 'NO_API_KEY') {
        showToast('Please add your Eventbrite API key');
        this.loadDemoData();
      } else {
        UI.setState('error-state');
        document.getElementById('error-message').textContent = err.message || 'Unable to fetch events. Please try again.';
      }
    }
  },

  /** Use the browser's Geolocation API */
  useMyLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }

    const btn = document.getElementById('use-location-btn');
    btn.innerHTML = '<iconify-icon icon="ph:circle-notch" class="icon-spin" aria-hidden="true"></iconify-icon> Detecting…';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        btn.innerHTML = '<iconify-icon icon="ph:navigation-arrow-fill" aria-hidden="true"></iconify-icon> Use My Location';
        btn.disabled = false;

        try {
          const { latitude, longitude } = position.coords;
          const city = await EventbriteAPI.reverseGeocode(latitude, longitude);
          document.getElementById('location-input').value = city;
          showToast(`Location detected: ${city}`);
          this.search();
        } catch {
          showToast('Could not determine city from coordinates');
          document.getElementById('location-input').value = `${position.coords.latitude},${position.coords.longitude}`;
        }
      },
      (error) => {
        btn.innerHTML = '<iconify-icon icon="ph:navigation-arrow-fill" aria-hidden="true"></iconify-icon> Use My Location';
        btn.disabled = false;
        const msgs = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        showToast(`${msgs[error.code] || 'Could not get your location'}`);
      }
    );
  },

  /** Load the built-in demo events */
  loadDemoData() {
    UI.allEvents = DEMO_EVENTS.map((ev) => normalizeEvent({ ...ev }, ev._category));
    UI.applyFilterAndRender();
    showToast('Showing demo events — add your API key to search real events!');
  },

  /** Toggle dark mode */
  toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, next);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.setAttribute('icon', next === 'dark' ? 'ph:sun-fill' : 'ph:moon-fill');
  },

  /** Restore saved theme on load */
  restoreTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.setAttribute('icon', theme === 'dark' ? 'ph:sun-fill' : 'ph:moon-fill');
  },

  /** Save the API key from the input field */
  saveApiKey() {
    const input = document.getElementById('api-key-input');
    const token = input.value.trim();
    if (!token) {
      document.getElementById('api-key-status').textContent = 'Please enter a token.';
      return;
    }
    EventbriteAPI.setToken(token);
    input.value = '';
    document.getElementById('api-key-status').textContent = 'API key saved! Try searching for events.';
    this.updateApiKeyUI();
    showToast('API key saved!');
  },

  /** Clear the stored API key */
  clearApiKey() {
    EventbriteAPI.setToken('');
    document.getElementById('api-key-status').textContent = 'API key cleared. Demo mode active.';
    this.updateApiKeyUI();
    showToast('API key removed');
    this.loadDemoData();
  },

  /** Update the API key UI indicator */
  updateApiKeyUI() {
    const hasKey = !!EventbriteAPI.getToken();
    const statusEl = document.getElementById('api-key-status');
    if (hasKey) {
      statusEl.textContent = 'API key is configured.';
    }
  },
};

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => App.init());
