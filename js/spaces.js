/**
 * ============================================================================
 * CampusConnect — Campus Spaces Module (js/spaces.js)
 * ============================================================================
 *
 * TEAM ROLE: Member 1 (JavaScript Lead)
 *
 * PURPOSE:
 * Displays and filters university study cubicles, coding labs, discussion
 * rooms, and relaxation zones.
 *
 * ----------------------------------------------------------------------------
 * IMPORTANT AVAILABILITY LIMITATION (FOR JUDGES)
 * ----------------------------------------------------------------------------
 * "Is space availability real-time?"
 * ANSWER:
 * "No. In this Round 1 frontend prototype, space availability is simulated
 * using demonstration data. The application is not yet connected to live
 * IoT occupancy sensors or university room reservation servers.
 * A future version could connect to sensor APIs or room scheduling databases."
 * ============================================================================
 */

function initSpacesPage() {
  const spacesGrid = document.getElementById("spacesGrid");
  if (!spacesGrid) return;

  const spaceSearch = document.getElementById("spaceSearch");
  const clearSpaceSearchBtn = document.getElementById("clearSpaceSearchBtn");
  const spaceCategoryFilterBtns = document.querySelectorAll("#spaceCategoryFilters .filter-btn");
  const availabilityFilter = document.getElementById("availabilityFilter");
  const spacesCount = document.getElementById("spacesCount");
  const spaceFilterMeta = document.getElementById("spaceFilterMeta");
  const spacesEmptyState = document.getElementById("spacesEmptyState");
  const resetSpaceFiltersBtn = document.getElementById("resetSpaceFiltersBtn");

  // State
  let currentCategoryFilter = "all";
  let currentAvailabilityFilter = "all";
  let currentSearchQuery = "";

  // Expose filter function globally for saved modal callbacks
  window.applySpacesFilters = applySpacesFilters;

  // 1. Initial Render
  applySpacesFilters();

  // 2. Search Input Listener
  if (spaceSearch) {
    spaceSearch.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      if (clearSpaceSearchBtn) {
        clearSpaceSearchBtn.style.display = currentSearchQuery.length > 0 ? "block" : "none";
      }
      applySpacesFilters();
    });
  }

  if (clearSpaceSearchBtn) {
    clearSpaceSearchBtn.addEventListener("click", () => {
      spaceSearch.value = "";
      currentSearchQuery = "";
      clearSpaceSearchBtn.style.display = "none";
      applySpacesFilters();
      spaceSearch.focus();
    });
  }

  // 3. Space Category Filter Buttons (Study, Food, Recreation, Academic, Quiet)
  spaceCategoryFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      spaceCategoryFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategoryFilter = btn.getAttribute("data-category");
      applySpacesFilters();
    });
  });

  // 4. Availability Select Filter
  if (availabilityFilter) {
    availabilityFilter.addEventListener("change", (e) => {
      currentAvailabilityFilter = e.target.value;
      applySpacesFilters();
    });
  }

  // 5. Reset Space Filters Button
  if (resetSpaceFiltersBtn) {
    resetSpaceFiltersBtn.addEventListener("click", () => {
      currentCategoryFilter = "all";
      currentAvailabilityFilter = "all";
      currentSearchQuery = "";
      if (spaceSearch) spaceSearch.value = "";
      if (clearSpaceSearchBtn) clearSpaceSearchBtn.style.display = "none";
      if (availabilityFilter) availabilityFilter.value = "all";
      spaceCategoryFilterBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-category") === "all");
      });
      applySpacesFilters();
    });
  }

  /**
   * Filters spaces based on search text, category, and typical availability.
   */
  function applySpacesFilters() {
    const spaces = getStoredSpaces();

    const filtered = spaces.filter((space) => {
      // Category filter (Study, Quiet, Academic, Food, Recreation)
      if (currentCategoryFilter !== "all" && space.category !== currentCategoryFilter) {
        return false;
      }

      // Availability filter
      if (currentAvailabilityFilter !== "all") {
        const badge = (space.availabilityBadge || "").toLowerCase();
        const filterVal = currentAvailabilityFilter.toLowerCase();
        if (!badge.includes(filterVal)) {
          return false;
        }
      }

      // Search keyword filter across title, facilities, suitableFor, and location
      if (currentSearchQuery) {
        const facilitiesText = (space.facilities || []).join(" ");
        const target = `${space.name} ${space.category} ${space.location} ${facilitiesText} ${space.suitableFor || ""} ${space.shortDescription || space.description || ""}`.toLowerCase();
        if (!target.includes(currentSearchQuery)) {
          return false;
        }
      }

      return true;
    });

    // Update Counts & Meta Text
    if (spacesCount) spacesCount.textContent = filtered.length;

    if (spaceFilterMeta) {
      let meta = `Showing ${filtered.length} of ${spaces.length} campus zones`;
      if (currentCategoryFilter !== "all") meta += ` • Category: ${currentCategoryFilter}`;
      if (currentAvailabilityFilter !== "all") meta += ` • Availability: ${currentAvailabilityFilter}`;
      if (currentSearchQuery) meta += ` • Query: "${currentSearchQuery}"`;
      spaceFilterMeta.textContent = meta;
    }

    // Render Cards or Empty State
    if (filtered.length === 0) {
      spacesGrid.innerHTML = "";
      if (spacesEmptyState) spacesEmptyState.style.display = "block";
    } else {
      if (spacesEmptyState) spacesEmptyState.style.display = "none";
      renderSpacesCards(filtered);
    }
  }

  /**
   * Renders space cards dynamically into the grid with bookmarking.
   */
  function renderSpacesCards(spaces) {
    const savedSpaceIds = new Set(getSavedSpaces());

    spacesGrid.innerHTML = spaces
      .map((space) => {
        const facilitiesHTML = (space.facilities || [])
          .map((f) => `<span class="amenity-tag">✓ ${escapeHTML(f)}</span>`)
          .join("");

        const statusDotClass = space.availabilityClass || "green";
        const availabilityLabel = space.availabilityBadge || space.availabilityStatus || "Available";
        const desc = space.shortDescription || space.description || "";

        const isSaved = savedSpaceIds.has(space.id);
        const bookmarkClass = isSaved ? "bookmark-toggle-btn bookmarked" : "bookmark-toggle-btn";
        const bookmarkText = isSaved ? "🔖 Saved ✓" : "🔖 Bookmark";

        return `
        <article class="space-card" id="${space.id}">
          <div class="card-top-row">
            <span class="badge badge-primary">${escapeHTML(space.category)}</span>
            <span class="meta-pill">👥 Cap: ${space.capacity}</span>
          </div>

          <h3 class="space-title">${escapeHTML(space.name)}</h3>
          <div class="space-location">📍 ${escapeHTML(space.location)}</div>

          <div class="space-status-row">
            <div class="status-indicator">
              <span class="status-dot ${statusDotClass}"></span>
              <span>${escapeHTML(availabilityLabel)}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-dim); font-style: italic;">
              Demo Availability
            </span>
          </div>

          <div class="typical-avail-badge">
            🕒 ${escapeHTML(space.typicalAvailability || "Typical availability: High")}
          </div>

          ${
            space.suitableFor
              ? `<div class="suitable-for-box">
                   <strong>Suitable for:</strong> ${escapeHTML(space.suitableFor)}
                 </div>`
              : ""
          }

          <div class="amenities-tags">
            ${facilitiesHTML}
          </div>

          <p class="card-desc" style="font-size: 0.88rem;">${escapeHTML(desc)}</p>

          <div class="space-actions-row">
            <button
              class="${bookmarkClass}"
              data-bookmark-id="${space.id}"
              aria-label="Bookmark ${escapeHTML(space.name)}"
            >
              ${bookmarkText}
            </button>
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              Zone: ${escapeHTML(space.category)}
            </span>
          </div>
        </article>
      `;
      })
      .join("");

    // Attach Bookmark button click handlers
    const bookmarkButtons = spacesGrid.querySelectorAll(".bookmark-toggle-btn");
    bookmarkButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const spaceId = btn.getAttribute("data-bookmark-id");
        toggleSavedSpace(spaceId);
        applySpacesFilters();
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", initSpacesPage);

