# CampusSync — Your Campus, In Sync.

> **One platform for everyday campus discovery.**  
> Built for Round 1 of a 36-Hour Student Hackathon by a team of 4 first-semester B.Tech CSE students.

---

## 📌 Project Overview

Every university campus is a buzzing ecosystem of thousands of students moving between lecture halls, labs, libraries, and cafeterias. Despite existing portals and notice boards, students face three friction points every single day:
1. **Lost belongings** are scattered across fragmented WhatsApp groups, Telegram channels, and physical noticeboards where finders and owners rarely connect.
2. **Finding a quiet desk, study cubicle, or computer lab with power sockets** requires physically wandering around campus before exams.
3. **Upcoming hackathons, technical workshops, and club events** get buried under chat noise, leaving first-year students unaware of key opportunities.

**CampusSync** brings these three everyday campus discovery experiences into a single, unified web application designed with modern student SaaS visual polish, privacy guardrails, and zero external dependencies.

---

## 💡 Team Strategy & Design Principle

```
WORKING CORE > EXPLAINABILITY > USER EXPERIENCE > VISUAL POLISH > EXTRA FEATURES
```

We are first-semester computer science students. Rather than attempting an unstable, complex multi-tier stack that could crash during live judging, our Round 1 strategy is intentionally simple:

$$\text{HTML5} + \text{CSS3} + \text{Vanilla JavaScript} + \text{Browser localStorage}$$

- **100% Offline & Local:** Runs directly in any web browser without Node.js, Python, or database servers.
- **No Heavy Frameworks:** No React, Vue, Angular, Bootstrap, Tailwind, or complex build tools.
- **Beginner-Friendly & Explainable:** Every single line of code can be understood, explained, and defended by all four team members.
- **SaaS Glassmorphic Polish:** Dark navy theme, authentic campus backdrop (`assets/images/lpu_campus.jpg`), backdrop filters, live dashboard hero preview, and smooth responsive grids.

---

## 👥 Team Roles & Division

| Team Member | Role | Core Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | **JavaScript Lead** | JavaScript logic, DOM manipulation, form validation, localStorage layer, search/filter algorithms, and rule-based matching engine. |
| **Member 2** | **HTML / CSS Lead** | Semantic HTML5 structure, responsive layout grids, flexbox components, form styling, and cards design system. |
| **Member 3** | **CSS + UI/UX + Testing** | Responsive design verification across devices (mobile/tablet/laptop), UX polish, cross-browser testing, and bug finding. |
| **Member 4** | **Presentation & Documentation** | Hackathon report, ASCII architecture diagrams, demo script, judge Q&A preparation, and project positioning. |

---

## 🎯 Three Core Modules

### 1. 🔍 Smart Lost & Found (Flagship Feature)
- **Dual Intake Form (`report.html`):** Log lost items or report found items with item name, category, colour, location, date, description, and contact info.
- **Live Board (`lost-found.html`):** Multi-filtering by type (*All*, *Lost*, *Found*), category (*Personal*, *Electronics*, *Cards/IDs*, etc.), colour, location, and instant keyword search.
- **Smart Match Radar:** Compares active Lost reports against candidate Found items using our explainable rule-based scoring engine (+3 category, +2 colour, +2 location, +1 keywords, max 8).
- **Ethical AI Guardrail:** Strictly avoids false certainty. Pairs are labeled cautiously as *"Possible Match"* or *"Similar Item"* (NEVER *"Confirmed Match"*).
- **🔒 Student Contact Privacy Guardrail:** Registered emails are never exposed publicly on cards. Clicking the badge opens a secure privacy modal explaining mediated verification.

### 2. 🏛️ Campus Spaces Directory (`spaces.html`)
- Directory of 8 campus zones across **Study**, **Food**, **Recreation**, **Academic**, and **Quiet** categories.
- Displays capacity, location, facility tags (*WiFi*, *Power Outlets*, *AC*, *Whiteboards*), "Suitable for" tasks, and typical availability disclosures.
- Interactive bookmarking button saving spaces to the unified bookmarks modal.

### 3. 🎉 Campus Events Discovery (`events.html`)
- Curated timeline of upcoming technical workshops, hackathons, sports tourneys, and club orientations.
- Filter by categories (*Technical*, *Workshops*, *Hackathons*, *Sports*, *Cultural*, *Career*).
- Interactive **One-Click Demo RSVP Counter** and **Activity Bookmarking** persisting in `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Markup** | HTML5 (Semantic) | Standard elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`) with zero framework abstractions. |
| **Styling** | CSS3 (Modern Vanilla) | CSS Custom Properties (variables), CSS Grid, Flexbox, media queries for mobile/tablet/desktop. |
| **Logic** | Vanilla JavaScript (ES6+) | Native DOM methods, array methods (`filter()`, `map()`, `find()`), event listeners, zero npm packages. |
| **Persistence** | Browser `localStorage` | Client-side key-value string storage for data persistence across page reloads. |

---

## 📁 Project Structure

```
CampusSync/
├── index.html              # Homepage: Split hero, SaaS dashboard preview, impact stats
├── lost-found.html         # Smart Lost & Found board with radar, category/colour/loc filters
├── report.html             # Dual intake form (Report Lost / Report Found) with instant validation
├── spaces.html             # Campus Spaces directory (Study, Food, Recreation, Academic, Quiet)
├── events.html             # Campus Events feed with category filters, RSVP & bookmarks
│
├── css/
│   └── style.css           # Glassmorphic SaaS design system, responsive down to 320px
│
├── js/
│   ├── main.js             # Shared navigation, notification center, bookmarks modal, storage
│   ├── lost-found.js       # Intake validation, rule-based matching engine, private contact modal
│   ├── spaces.js           # Spaces filtering, facilities rendering, bookmarking
│   └── events.js           # Events filtering, RSVP counter, activity bookmarking
│
├── data/
│   └── demo-data.js        # Seed demo records (10 Lost/Found pairs, 8 Spaces, 8 Events)
│
├── assets/
│   ├── images/             # SVG logo and authentic campus background (lpu_campus.jpg)
│   └── favicon/            # SVG and PNG cross-platform favicons
│
├── docs/
│   └── PROJECT_REPORT.md   # Comprehensive internal report, diagrams, pitch & judge Q&A
│
└── README.md               # Hackathon public documentation
```

---

## 💾 How `localStorage` Works

Browser `localStorage` stores data purely as text **strings** mapped to specific keys. To store structured JavaScript objects or arrays, we use the JSON serialization pattern:

```
JavaScript Object / Array
           │
           ▼ JSON.stringify()
    JSON Text String
           │
           ▼ localStorage.setItem("campussync_reports", text)
   [ Browser Storage ]
           │
           ▼ localStorage.getItem("campussync_reports")
    JSON Text String
           │
           ▼ JSON.parse()
JavaScript Object / Array
```

### Storage Functions in `js/main.js`:
- `getStoredReports()`: Reads and parses reports from `localStorage` (`campussync_reports`).
- `getStoredSpaces()` / `getStoredEvents()`: Manages spaces and activities.
- `getSavedEvents()` / `getSavedSpaces()`: Manages bookmarked items with badge count updates.
- `getNotifications()` / `addNotification()`: Powers the in-session prototype notification bell.

---

## 🧠 Rule-Based Matching Algorithm

Rather than using complex machine learning models that require cloud API keys, network connectivity, and can hallucinate during judging, CampusConnect implements a **transparent rule-based scoring engine** (`js/lost-found.js`):

| Matching Attribute | Score | Evaluation Logic |
| :--- | :---: | :--- |
| **Category Match** | `+3` | Exact match on item type (`Personal`, `Electronics`, etc.) |
| **Colour Match** | `+2` | Exact or substring token match (e.g., *"Black"* vs. *"Black Leather"*) |
| **Location Match** | `+2` | Location substring or token overlap (e.g., *"Central Library"* vs. *"Library"*) |
| **Description Keywords** | `+1` | Stopword-filtered keyword overlap between descriptions |
| **Total Maximum** | **`8`** | **Max potential score** |

### Confidence Tiers:
- **Score $\ge$ 6:** `High Similarity`
- **Score 4 – 5:** `Possible Match`
- **Score 2 – 3:** `Potential Match` (Not displayed on radar to avoid noise)
- **Score < 2:** Filtered out

### Ethical AI Guardrail:
CampusConnect **strictly never** states that an item is a *"Confirmed Match"*. It only identifies *"Possible Matches"* to guide students toward manual verification (checking student IDs, lockscreen PINs, or secret markings).

---

## 🏗️ Technical Architecture (Current vs Future)

### Current Round 1 Architecture (Frontend Only)

```
             STUDENT / USER
                   │
                   ▼
            HTML5 STRUCTURE
                   │
                   ▼
              CSS3 DESIGN
                   │
                   ▼
          VANILLA JAVASCRIPT
             /            \
            ▼              ▼
       DOM UPDATES    localStorage
                           │
                           ▼
                    Saved JSON Data
                           │
                           ▼
                    Matching Engine
```

### Future Round 2 Architecture (Full-Stack Upgrade)

If our team qualifies for Round 2, the decoupled data layer allows us to seamlessly upgrade to a centralized backend:

```
ROUND 1 (Current)
HTML/CSS/JS ──► localStorage

           ▼ QUALIFICATION (Round 2 Upgrade)

ROUND 2 (Future)
HTML/CSS/JS ──► fetch() API ──► Python (Flask) ──► SQLite DB ──► Optional AI/NLP
```

---

## ⚠️ Current Prototype Limitations

1. **Browser-Local Storage:** Data is stored locally on the device running the browser; it is not yet synchronized across multiple devices or users.
2. **Demo Space Availability:** Space busyness and noise levels are simulated for demonstration; they are not connected to real-time IoT occupancy sensors.
3. **Demo Event Feed:** Events and RSVPs illustrate user interaction; they are not yet integrated with university club management portals.
4. **No User Authentication:** No login or student credentials are required in Round 1 to maximize judging accessibility and speed.

---

## 🚀 How to Run the Project

No installation, build tools, or servers are needed!

1. Clone or download this repository.
2. Open `index.html` directly in any web browser (Google Chrome, Edge, Firefox, Safari).
3. Alternatively, use a local server:
   ```bash
   # Optional Python one-line server
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000` in your browser.

