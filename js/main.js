/**
 * ============================================================================
 * CampusSync — Shared Core Utilities & Data Layer (js/main.js)
 * ============================================================================
 *
 * PROJECT: CampusSync — Your Campus, In Sync.
 * TECH STACK: HTML5 + CSS3 + Vanilla JavaScript + Browser localStorage
 *
 * PURPOSE:
 * 1. Global Navigation & Mobile Menu handling
 * 2. Data Persistence Layer (localStorage for reports, spaces, events, bookmarks)
 * 3. Prototype Notification Center & Saved Items Modal
 * 4. Toast Alerts & Student Privacy Modals
 *
 * ----------------------------------------------------------------------------
 * HOW LOCALSTORAGE WORKS (CONCEPTUAL GUIDE FOR JUDGES):
 * ----------------------------------------------------------------------------
 * 1. localStorage stores key-value pairs purely as strings in the browser.
 * 2. JSON.stringify(object) turns a JavaScript array/object into text before saving.
 * 3. JSON.parse(text) turns stored text back into a real JavaScript array/object.
 * 4. All UI components call getStoredReports() or saveStoredReports() rather than
 *    calling localStorage directly, keeping storage decoupled and easy to upgrade!
 * ============================================================================
 */

// Storage Keys used to identify CampusSync data inside browser localStorage
const STORAGE_KEYS = {
  REPORTS: "campussync_reports",
  SPACES: "campussync_spaces",
  EVENTS: "campussync_events",
  SAVED_EVENTS: "campussync_saved_events",
  SAVED_SPACES: "campussync_saved_spaces",
  NOTIFICATIONS: "campussync_notifications"
};

// ============================================================================
// DATA STORAGE LAYER (Functions that interact with localStorage)
// ============================================================================

/**
 * Reads all Lost & Found reports from browser localStorage.
 *
 * 1. Purpose: Retrieve the active list of lost/found reports.
 * 2. Input: None.
 * 3. Main Logic: Checks campussync_reports (and legacy campusconnect key).
 *    If empty, initializes storage with DEMO_LOST_FOUND from demo-data.js.
 * 4. Output: Array of report objects.
 */
function getStoredReports() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.REPORTS) || localStorage.getItem("campusconnect_reports");
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading reports from localStorage:", error);
  }

  // Fallback to demo seed data
  if (typeof DEMO_LOST_FOUND !== "undefined") {
    saveStoredReports(DEMO_LOST_FOUND);
    return DEMO_LOST_FOUND;
  }

  return [];
}

/**
 * Saves an updated array of Lost & Found reports to browser localStorage.
 *
 * 1. Purpose: Persist newly submitted reports.
 * 2. Input: Array of report objects.
 * 3. Output: Boolean indicating success.
 */
function saveStoredReports(reportsArray) {
  try {
    const jsonString = JSON.stringify(reportsArray);
    localStorage.setItem(STORAGE_KEYS.REPORTS, jsonString);
    return true;
  } catch (error) {
    console.error("Error saving reports to localStorage:", error);
    return false;
  }
}

/**
 * Reads Campus Spaces directory from localStorage or demo seed data.
 */
function getStoredSpaces() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.SPACES);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading spaces from localStorage:", error);
  }

  if (typeof DEMO_SPACES !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(DEMO_SPACES));
    } catch (e) {}
    return DEMO_SPACES;
  }

  return [];
}

/**
 * Reads Campus Events from localStorage or demo seed data.
 */
function getStoredEvents() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading events from localStorage:", error);
  }

  if (typeof DEMO_EVENTS !== "undefined") {
    saveStoredEvents(DEMO_EVENTS);
    return DEMO_EVENTS;
  }

  return [];
}

/**
 * Saves updated events list to localStorage.
 */
function saveStoredEvents(eventsArray) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsArray));
    return true;
  } catch (error) {
    console.error("Error saving events to localStorage:", error);
    return false;
  }
}

// ============================================================================
// SAVED / BOOKMARKED ITEMS LAYER (Events & Spaces)
// ============================================================================

/**
 * Reads the list of saved event IDs from localStorage.
 */
function getSavedEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Toggles an event's saved state.
 * Returns true if now saved, false if removed.
 */
function toggleSavedEvent(eventId) {
  let saved = getSavedEvents();
  const index = saved.indexOf(eventId);
  let isSaved = false;

  if (index > -1) {
    saved.splice(index, 1);
    isSaved = false;
  } else {
    saved.push(eventId);
    isSaved = true;
    addNotification("Event Saved", "Saved event to your bookmarked campus activities.", "bookmark");
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_EVENTS, JSON.stringify(saved));
  } catch (e) {}

  updateSavedBadgeCount();
  return isSaved;
}

/**
 * Reads saved space IDs from localStorage.
 */
function getSavedSpaces() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SPACES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Toggles a space's saved state.
 */
function toggleSavedSpace(spaceId) {
  let saved = getSavedSpaces();
  const index = saved.indexOf(spaceId);
  let isSaved = false;

  if (index > -1) {
    saved.splice(index, 1);
    isSaved = false;
  } else {
    saved.push(spaceId);
    isSaved = true;
    addNotification("Space Saved", "Saved study space to your bookmarked campus spots.", "bookmark");
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_SPACES, JSON.stringify(saved));
  } catch (e) {}

  updateSavedBadgeCount();
  return isSaved;
}

// ============================================================================
// PROTOTYPE NOTIFICATION CENTER LAYER
// ============================================================================

/**
 * Reads prototype notifications from localStorage.
 */
function getNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Default seed notifications for demonstration
  const defaults = [
    {
      id: "notif-1",
      title: "Possible Match Detected",
      message: "Casio Scientific Calculator has an 8/8 rule match with a recent Found report.",
      type: "match",
      time: "10 mins ago"
    },
    {
      id: "notif-2",
      title: "Event Bookmarked",
      message: "Campus HackFest 2026 is saved to your activities calendar.",
      type: "event",
      time: "1 hour ago"
    },
    {
      id: "notif-3",
      title: "Welcome to CampusSync",
      message: "Your campus discovery hub is active. Try reporting an item or exploring spaces.",
      type: "info",
      time: "Today"
    }
  ];

  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaults));
  } catch (e) {}

  return defaults;
}

/**
 * Adds a new notification to the prototype notification center.
 */
function addNotification(title, message, type = "info") {
  const notifs = getNotifications();
  const newNotif = {
    id: "notif-" + Date.now(),
    title: title,
    message: message,
    type: type,
    time: "Just now"
  };

  notifs.unshift(newNotif);
  if (notifs.length > 10) notifs.pop(); // Keep maximum 10

  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {}

  updateNotificationBadge();
}

/**
 * Updates the notification bell badge count in the navbar.
 */
function updateNotificationBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;
  const notifs = getNotifications();
  badge.textContent = notifs.length;
  badge.style.display = notifs.length > 0 ? "inline-flex" : "none";
}

/**
 * Updates the Saved Items badge count in the navbar.
 */
function updateSavedBadgeCount() {
  const badge = document.getElementById("savedCountBadge");
  if (!badge) return;
  const count = getSavedEvents().length + getSavedSpaces().length;
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

// ============================================================================
// GLOBAL UI COMPONENTS: MODALS, NOTIFICATION DRAWER & TOASTS
// ============================================================================

/**
 * Initializes the notification dropdown toggle.
 */
function initNotificationCenter() {
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const clearNotifsBtn = document.getElementById("clearNotifsBtn");

  if (!notifBtn || !notifDropdown) return;

  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = notifDropdown.classList.contains("open");
    if (!isOpen) {
      renderNotificationsList();
      notifDropdown.classList.add("open");
    } else {
      notifDropdown.classList.remove("open");
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove("open");
    }
  });

  if (clearNotifsBtn) {
    clearNotifsBtn.addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      renderNotificationsList();
      updateNotificationBadge();
    });
  }

  function renderNotificationsList() {
    if (!notifList) return;
    const notifs = getNotifications();

    if (notifs.length === 0) {
      notifList.innerHTML = `
        <div class="notif-empty">
          <p>No new notifications</p>
          <small>Prototype alerts will appear here as you interact.</small>
        </div>
      `;
      return;
    }

    notifList.innerHTML = notifs
      .map((n) => {
        let icon = "🔔";
        if (n.type === "match") icon = "⚡";
        else if (n.type === "bookmark" || n.type === "event") icon = "📌";
        else if (n.type === "success") icon = "✅";

        return `
        <div class="notif-item">
          <span class="notif-item-icon">${icon}</span>
          <div class="notif-item-body">
            <strong>${escapeHTML(n.title)}</strong>
            <p>${escapeHTML(n.message)}</p>
            <span class="notif-item-time">${escapeHTML(n.time)}</span>
          </div>
        </div>
      `;
      })
      .join("");
  }
}

/**
 * Initializes the Saved Items Modal.
 */
function initSavedItemsModal() {
  const savedBtn = document.getElementById("savedItemsBtn");
  const modal = document.getElementById("savedItemsModal");
  const closeBtn = document.getElementById("closeSavedModal");
  const tabEvents = document.getElementById("savedTabEvents");
  const tabSpaces = document.getElementById("savedTabSpaces");
  const listContainer = document.getElementById("savedItemsList");

  if (!savedBtn || !modal) return;

  let activeTab = "events";

  savedBtn.addEventListener("click", () => {
    renderSavedList();
    modal.classList.add("open");
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });

  if (tabEvents && tabSpaces) {
    tabEvents.addEventListener("click", () => {
      activeTab = "events";
      tabEvents.classList.add("active");
      tabSpaces.classList.remove("active");
      renderSavedList();
    });

    tabSpaces.addEventListener("click", () => {
      activeTab = "spaces";
      tabSpaces.classList.add("active");
      tabEvents.classList.remove("active");
      renderSavedList();
    });
  }

  function renderSavedList() {
    if (!listContainer) return;

    if (activeTab === "events") {
      const savedIds = new Set(getSavedEvents());
      const allEvents = getStoredEvents();
      const savedEvents = allEvents.filter((e) => savedIds.has(e.id));

      if (savedEvents.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state-mini">
            <p>No saved events yet.</p>
            <small>Click "Save Event" on any event card to bookmark it.</small>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = savedEvents
        .map(
          (ev) => `
        <div class="saved-item-row">
          <div>
            <span class="badge badge-primary">${escapeHTML(ev.category)}</span>
            <h4 style="margin: 0.3rem 0; color: #fff;">${escapeHTML(ev.name)}</h4>
            <small style="color: var(--text-muted);">📅 ${formatDate(ev.date)} • 📍 ${escapeHTML(ev.location)}</small>
          </div>
          <button class="btn btn-outline btn-sm" onclick="handleUnsaveEvent('${ev.id}')">Remove</button>
        </div>
      `
        )
        .join("");
    } else {
      const savedIds = new Set(getSavedSpaces());
      const allSpaces = getStoredSpaces();
      const savedSpaces = allSpaces.filter((s) => savedIds.has(s.id));

      if (savedSpaces.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state-mini">
            <p>No saved spaces yet.</p>
            <small>Bookmark study cubicles and labs from the Spaces page.</small>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = savedSpaces
        .map(
          (sp) => `
        <div class="saved-item-row">
          <div>
            <span class="badge badge-primary">${escapeHTML(sp.category)}</span>
            <h4 style="margin: 0.3rem 0; color: #fff;">${escapeHTML(sp.name)}</h4>
            <small style="color: var(--text-muted);">📍 ${escapeHTML(sp.location)}</small>
          </div>
          <button class="btn btn-outline btn-sm" onclick="handleUnsaveSpace('${sp.id}')">Remove</button>
        </div>
      `
        )
        .join("");
    }
  }

  // Global unsave hooks
  window.handleUnsaveEvent = (id) => {
    toggleSavedEvent(id);
    renderSavedList();
    if (typeof applyEventsFilters === "function") applyEventsFilters();
  };

  window.handleUnsaveSpace = (id) => {
    toggleSavedSpace(id);
    renderSavedList();
    if (typeof applySpacesFilters === "function") applySpacesFilters();
  };
}

/**
 * Displays a friendly Privacy Modal when a user clicks on private contact info.
 */
function showPrivateContactNotice(item) {
  let modal = document.getElementById("privacyModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "privacyModal";
    modal.className = "custom-modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 style="color: #fff; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔒</span> Private Student Contact Information
        </h3>
        <button class="modal-close" onclick="closePrivacyModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
          To protect student privacy, registered email addresses are <strong>never displayed publicly</strong> on item cards.
        </p>
        <div class="notice-box-private">
          <strong>Item:</strong> ${escapeHTML(item.itemName)}<br>
          <strong>Reporter Status:</strong> Registered Student (Verified in session)<br>
          <strong>Reported On:</strong> ${formatDate(item.date)} at ${escapeHTML(item.location)}
        </div>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 1rem;">
          <em>Prototype Note:</em> When this item scores 4+ on our multi-criteria matching engine,
          both students are alerted. In the future full-stack iteration, a secure backend email service will mediate communication.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="closePrivacyModal()">Understood</button>
      </div>
    </div>
  `;

  modal.classList.add("open");
  window.closePrivacyModal = () => modal.classList.remove("open");
}

/**
 * Displays a non-blocking toast message at the bottom-right.
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✅" : type === "warn" ? "⚡" : "ℹ️"}</span>
    <span class="toast-text">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// MOBILE NAVIGATION & HELPERS
// ============================================================================

function initMobileNavigation() {
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      siteNav.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
      if (!navToggle.contains(event.target) && !siteNav.contains(event.target)) {
        siteNav.classList.remove("open");
      }
    });
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    const dateObj = new Date(dateString + "T00:00:00");
    return dateObj.toLocaleDateString("en-US", options);
  } catch (e) {
    return dateString;
  }
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// DOM CONTENT LOADED ENTRY POINT
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initMobileNavigation();
  initNotificationCenter();
  initSavedItemsModal();

  // Initialize data storage
  getStoredReports();
  getStoredSpaces();
  getStoredEvents();
  getNotifications();

  // Update badge counters
  updateNotificationBadge();
  updateSavedBadgeCount();
});
