# 🎵 Neighborhood Notes

A beginner-friendly web app to discover **local music concerts and open mic nights** in your area, powered by the [Eventbrite API](https://www.eventbrite.com/platform/api).

---

## ✨ Features

- **Location-Based Search** — Enter a city name or use your browser's GPS to find nearby events
- **Event Cards** — Clean cards showing event name, date, venue, image, and price
- **Category Filters** — Filter by Concerts, Open Mic, Live Music, Jazz, Hip-Hop
- **Event Detail Modal** — Full description, time, venue info, and a direct ticket link
- **Favorites** — Save events to localStorage with ❤️
- **Dark Mode** — Toggle between light and dark themes (respects system preference)
- **Demo Mode** — Works out-of-the-box with sample events when no API key is set
- **Responsive Design** — Mobile-first layout that looks great on all screen sizes

---

## 🗂️ Project Structure

```
Neighborhood-Notes/
├── index.html    ← App shell: header, search bar, filters, grid, modal, footer
├── styles.css    ← Mobile-first CSS with CSS variables and dark mode
├── app.js        ← API integration, DOM rendering, filtering, localStorage
└── README.md
```

---

## 🚀 Quick Start

1. **Clone or download** this repository
2. Open `index.html` in a browser — demo events load automatically
3. To search real events, add your [Eventbrite API key](#-eventbrite-api-setup)

No build step or dependencies required — it's pure HTML, CSS, and Vanilla JS.

---

## 🔑 Eventbrite API Setup

### 1. Create a Developer Account
1. Go to [eventbrite.com](https://www.eventbrite.com) and sign up or log in
2. Visit the [Eventbrite Developer Portal](https://www.eventbrite.com/platform/api)
3. Click **Create App** and fill in the app details
4. Copy your **Private Token** (OAuth token)

### 2. Add Your API Key to the App
1. Open the app in your browser
2. Click the **⚙️ Configure Eventbrite API Key** section
3. Paste your token and click **Save**
4. Your key is stored in `localStorage` — it never leaves your browser

### 3. How Authentication Works
The app sends your token as a `token` query parameter to the Eventbrite REST API:
```
GET https://www.eventbriteapi.com/v3/events/search/?token=YOUR_TOKEN&location.address=Chicago&...
```

> **Note on CORS:** Eventbrite's API does not support cross-origin browser requests directly.
> The app routes requests through [corsproxy.io](https://corsproxy.io) as a development convenience.
> For production use, replace `CORS_PROXY` in `app.js` with your own server-side proxy endpoint.

---

## 🌐 Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /v3/events/search/` | Search events by location, keyword, category |
| `GET /v3/events/{id}/` | Get details for a specific event |
| `GET /v3/venues/{id}/` | Get venue info |

### Useful Query Parameters for `/v3/events/search/`
| Parameter | Example | Description |
|---|---|---|
| `location.address` | `Chicago` | City or address |
| `location.within` | `25mi` | Search radius |
| `categories` | `103` | Eventbrite category ID (103 = Music) |
| `q` | `jazz` | Keyword search |
| `sort_by` | `date` | Sort results |
| `expand` | `venue,logo` | Include nested objects |

---

## 🧠 App Architecture

```
app.js
├── EventbriteAPI     — fetch, auth, geocoding (API concerns)
├── Favorites         — localStorage CRUD
├── UI                — DOM rendering, state management
├── normalizeEvent()  — derive category from event text
└── App               — controller: wires everything together
```

---

## 🎨 UI Components

- **Header** — sticky, with Favorites button and dark mode toggle
- **Hero/Search** — gradient banner with city input and GPS button
- **API Key Banner** — collapsible `<details>` panel for token management
- **Filter Bar** — pill-style category filters + sort dropdown
- **Events Grid** — responsive CSS Grid of event cards
- **Event Card** — image, category badge, fav button, name, date, venue, price
- **Detail Modal** — full event info with ticket link and save button
- **Toast** — brief slide-up notifications for user actions
- **Footer** — attribution and notes

---

## 🚧 Common Challenges & Solutions

| Challenge | Solution |
|---|---|
| CORS errors | Requests routed through `corsproxy.io` (swap for your own proxy in production) |
| Missing images | `onerror` fallback shows a 🎵 placeholder |
| No API key | Demo mode loads 6 sample events automatically |
| Empty API results | Empty state with "Load Demo Events" button |
| Geolocation denied | Graceful error message; user can type city manually |

---

## 🌟 Bonus Features Implemented

- [x] Save favorite events (localStorage)
- [x] Dark mode (with system preference detection)
- [x] Search by genre (Jazz, Hip-Hop filters)
- [x] Geolocation + reverse geocoding via OpenStreetMap Nominatim

### Future Ideas
- [x] Map integration (Leaflet.js + OpenStreetMap)
- [ ] Infinite scroll / pagination
- [ ] Share event via Web Share API
- [ ] Service Worker for offline support

---

## 📜 License

MIT — free to use, modify, and share.
