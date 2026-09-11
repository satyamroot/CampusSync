/**
 * ============================================================================
 * CampusConnect — Campus Events Module (js/events.js)
 * ============================================================================
 *
 * TEAM ROLE: Member 1 (JavaScript Lead)
 *
 * PURPOSE:
 * Displays upcoming student activities, supports category filtering and
 * live search, and features an interactive one-click demo RSVP counter.
 *
 * ----------------------------------------------------------------------------
 * HOW THE INTERACTIVE RSVP COUNTER WORKS:
 * ----------------------------------------------------------------------------
 * 1. When a student clicks the "RSVP" button on an event card:
 * 2. We check getUserRsvps() from localStorage to see if the student has
 *    already registered interest for that event.
 * 3. If they haven't:
 *    - We increment the event's rsvps count by 1 (+1).
 *    - We store the event's ID in the student's RSVP list.
 *    - We update the button state to show "RSVP'd ✓".
 * 4. If they have already RSVP'd:
 *    - Clicking again cancels their RSVP and decrements the count by 1 (-1).
 * 5. Both changes are saved to browser localStorage, demonstrating reactive
 *    state persistence without an external server!
 * ============================================================================
 */

function initEventsPage() {
  const eventsGrid = document.getElementById("eventsGrid");
  if (!eventsGrid) return;

  const eventSearch = document.getElementById("eventSearch");
  const clearEventSearchBtn = document.getElementById("clearEventSearchBtn");
  const categoryFilterBtns = document.querySelectorAll("#eventCategoryFilters .filter-btn");
  const eventsCount = document.getElementById("eventsCount");
  const eventFilterMeta = document.getElementById("eventFilterMeta");
  const eventsEmptyState = document.getElementById("eventsEmptyState");
  const resetEventFiltersBtn = document.getElementById("resetEventFiltersBtn");

  // State
  let currentCategory = "all";
  let currentSearchQuery = "";

  // 1. Initial Render
  applyEventsFilters();

  // 2. Search Input Listener
  if (eventSearch) {
    eventSearch.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      if (clearEventSearchBtn) {
        clearEventSearchBtn.style.display = currentSearchQuery.length > 0 ? "block" : "none";
      }
      applyEventsFilters();
    });
  }

  if (clearEventSearchBtn) {
    clearEventSearchBtn.addEventListener("click", () => {
      eventSearch.value = "";
      currentSearchQuery = "";
      clearEventSearchBtn.style.display = "none";
      applyEventsFilters();
      eventSearch.focus();
    });
  }

  // 3. Category Filter Buttons
  categoryFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-category");
      applyEventsFilters();
    });
  });

  // 4. Reset Filters Button
  if (resetEventFiltersBtn) {
    resetEventFiltersBtn.addEventListener("click", () => {
      currentCategory = "all";
      currentSearchQuery = "";
      if (eventSearch) eventSearch.value = "";
      if (clearEventSearchBtn) clearEventSearchBtn.style.display = "none";
      categoryFilterBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-category") === "all");
      });
      applyEventsFilters();
    });
  }

  // Expose filter function globally for saved modal callbacks
  window.applyEventsFilters = applyEventsFilters;

  /**
   * Filters events by selected category and search query.
   */
  function applyEventsFilters() {
    const events = getStoredEvents();

    const filtered = events.filter((event) => {
      // Category filter
      if (currentCategory !== "all" && event.category !== currentCategory) {
        return false;
      }

      // Search keyword filter
      if (currentSearchQuery) {
        const target = `${event.name} ${event.organizer} ${event.category} ${event.location} ${event.description}`.toLowerCase();
        if (!target.includes(currentSearchQuery)) {
          return false;
        }
      }

      return true;
    });

    // Update Counts & Meta text
    if (eventsCount) eventsCount.textContent = filtered.length;

    if (eventFilterMeta) {
      let meta = `Showing ${filtered.length} of ${events.length} campus activities`;
      if (currentCategory !== "all") meta += ` • Category: ${currentCategory}`;
      if (currentSearchQuery) meta += ` • Query: "${currentSearchQuery}"`;
      eventFilterMeta.textContent = meta;
    }

    // Render Cards or Empty State
    if (filtered.length === 0) {
      eventsGrid.innerHTML = "";
      if (eventsEmptyState) eventsEmptyState.style.display = "block";
    } else {
      if (eventsEmptyState) eventsEmptyState.style.display = "none";
      renderEventsCards(filtered);
    }
  }

  /**
   * Renders the event cards with interactive RSVP and Bookmark buttons.
   */
  function renderEventsCards(events) {
    const userRsvps = new Set(getUserRsvps());
    const savedEventIds = new Set(getSavedEvents());

    eventsGrid.innerHTML = events
      .map((event) => {
        const isRsvped = userRsvps.has(event.id);
        const rsvpBtnClass = isRsvped ? "rsvp-btn rsvped" : "rsvp-btn";
        const rsvpBtnText = isRsvped ? `✓ RSVP'd (${event.rsvps})` : `RSVP (${event.rsvps})`;

        const isSaved = savedEventIds.has(event.id);
        const bookmarkClass = isSaved ? "bookmark-toggle-btn bookmarked" : "bookmark-toggle-btn";
        const bookmarkText = isSaved ? "🔖 Saved ✓" : "🔖 Bookmark";

        return `
        <article class="event-card" id="${event.id}">
          <div class="card-top-row">
            <span class="badge badge-primary">${escapeHTML(event.category)}</span>
            <span class="meta-pill">📅 ${formatDate(event.date)}</span>
          </div>

          <h3 class="event-title">${escapeHTML(event.name)}</h3>
          <div class="event-organizer">Organized by: ${escapeHTML(event.organizer)}</div>

          <div class="event-details-box">
            <div class="event-detail-item">
              <span>🕒</span>
              <span><strong>Time:</strong> ${escapeHTML(event.time)}</span>
            </div>
            <div class="event-detail-item">
              <span>📍</span>
              <span><strong>Venue:</strong> ${escapeHTML(event.location)}</span>
            </div>
          </div>

          <p class="item-desc" style="font-size: 0.88rem;">${escapeHTML(event.description)}</p>

          <div class="event-actions-row">
            <button
              class="${rsvpBtnClass}"
              data-event-id="${event.id}"
              aria-label="RSVP to ${escapeHTML(event.name)}"
            >
              ${rsvpBtnText}
            </button>
            <button
              class="${bookmarkClass}"
              data-bookmark-id="${event.id}"
              aria-label="Bookmark ${escapeHTML(event.name)}"
            >
              ${bookmarkText}
            </button>
          </div>
        </article>
      `;
      })
      .join("");

    // Attach RSVP button click handlers
    const rsvpButtons = eventsGrid.querySelectorAll(".rsvp-btn");
    rsvpButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const eventId = btn.getAttribute("data-event-id");
        toggleEventRSVP(eventId);
      });
    });

    // Attach Bookmark button click handlers
    const bookmarkButtons = eventsGrid.querySelectorAll(".bookmark-toggle-btn");
    bookmarkButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const eventId = btn.getAttribute("data-bookmark-id");
        toggleSavedEvent(eventId);
        applyEventsFilters();
      });
    });
  }

  /**
   * Toggles the RSVP state of an event in localStorage and refreshes the card.
   */
  function toggleEventRSVP(eventId) {
    const events = getStoredEvents();
    const eventItem = events.find((e) => e.id === eventId);
    if (!eventItem) return;

    let userRsvps = getUserRsvps();
    const alreadyRsvped = userRsvps.includes(eventId);

    if (alreadyRsvped) {
      // Remove from user's RSVP list and decrement count
      userRsvps = userRsvps.filter((id) => id !== eventId);
      eventItem.rsvps = Math.max(0, (eventItem.rsvps || 0) - 1);
    } else {
      // Add to user's RSVP list and increment count
      userRsvps.push(eventId);
      eventItem.rsvps = (eventItem.rsvps || 0) + 1;
      if (typeof addNotification === "function") {
        addNotification("RSVP Confirmed", `RSVP'd for ${eventItem.name}`, "event");
      }
    }

    // Persist to localStorage
    saveStoredEvents(events);
    saveUserRsvps(userRsvps);

    // Re-render to update UI immediately
    applyEventsFilters();
  }
}

document.addEventListener("DOMContentLoaded", initEventsPage);

