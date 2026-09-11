/**
 * ============================================================================
 * CampusConnect — Smart Lost & Found Module (js/lost-found.js)
 * ============================================================================
 *
 * TEAM ROLE: Member 1 (JavaScript Lead)
 *
 * PURPOSE:
 * 1. Form Intake & Validation (used on report.html)
 * 2. Report Cards Display & DOM Rendering (used on lost-found.html)
 * 3. Search & Multi-Filter Logic (by text, type, and category)
 * 4. Rule-Based Smart Matching Engine (evaluates Lost vs Found items)
 *
 * ----------------------------------------------------------------------------
 * 🧠 RULE-BASED MATCHING ALGORITHM EXPLANATION (FOR JUDGES)
 * ----------------------------------------------------------------------------
 *
 * QUESTION: "Is this machine learning / AI?"
 * ANSWER:
 * "No, this prototype does not use machine learning or deep neural networks.
 * Instead, we engineered a deterministic, rule-based scoring algorithm.
 *
 * In a student hackathon, rule-based matching is faster (<1ms), completely
 * offline, 100% explainable, and cannot hallucinate.
 *
 * Each attribute contributes a specific number of points:
 *
 *   1. Category Match:        +3 points (Category is the strongest signal)
 *   2. Colour Match:          +2 points (e.g. 'Black' matches 'Black Leather')
 *   3. Location Match:        +2 points (e.g. 'Central Library' matches 'Library')
 *   4. Description Keywords:  +1 point  (Overlap in significant descriptive words)
 *   --------------------------------------------------------------------------
 *   MAXIMUM POSSIBLE SCORE:   8 points
 *
 * CONFIDENCE CLASSIFICATION:
 * - Score >= 6:  'High Similarity'
 * - Score 4 – 5: 'Possible Match'
 * - Score 2 – 3: 'Potential Match'
 * - Score < 2:   Not displayed (too weak)
 *
 * ETHICAL GUARDRAIL:
 * We deliberately NEVER output 'Confirmed Match'. An algorithm cannot prove
 * true ownership. We only guide students with 'Possible Match' or 'Similar Item',
 * advising manual verification."
 * ============================================================================
 */

// Common English stopwords to ignore when analyzing description keywords
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "by", "from", "up", "about", "into", "over", "after", "is", "are", "was", "were",
  "be", "been", "have", "has", "had", "it", "its", "this", "that", "these", "those",
  "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "left", "found",
  "lost", "near", "on", "of", "some", "item", "please", "contact"
]);

// ============================================================================
// PART 1: SMART MATCHING ENGINE (services/matching logic in JS)
// ============================================================================

/**
 * Extracts normalized, stopword-filtered keywords from a text string.
 *
 * 1. Purpose: Break a sentence/description into meaningful word tokens.
 * 2. Input: String (e.g. "Black wallet with college ID card DK-2026")
 * 3. Logic: Converts to lowercase, strips punctuation, splits by whitespace,
 *    and filters out common English stopwords.
 * 4. Output: Set of keyword strings (e.g. Set {"wallet", "college", "id", "card", "dk-2026"})
 */
function extractKeywords(text) {
  if (!text) return new Set();

  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );
}

/**
 * Evaluates the similarity score between a Lost item and a Found item.
 *
 * 1. Purpose: Calculate a deterministic score from 0 to 8 points.
 * 2. Input: Two objects (lostItem, foundItem).
 * 3. Main Logic:
 *    - Check Category match (+3 pts)
 *    - Check Colour token overlap (+2 pts)
 *    - Check Location substring/token overlap (+2 pts)
 *    - Check Description keyword intersection (+1 pt)
 * 4. Output: An object with total score, confidence label, and breakdown list:
 *    { score: 8, maxScore: 8, confidence: "High Similarity", reasons: [...] }
 */
function calculateMatchScore(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  // Criterion 1: Category Match (+3 points)
  if (
    lostItem.category &&
    foundItem.category &&
    lostItem.category.toLowerCase() === foundItem.category.toLowerCase()
  ) {
    score += 3;
    reasons.push({
      label: `Same Category: ${lostItem.category}`,
      points: "+3",
      matched: true
    });
  } else {
    reasons.push({
      label: "Different Category",
      points: "+0",
      matched: false
    });
  }

  // Criterion 2: Colour Match (+2 points)
  const lostColour = (lostItem.colour || "").toLowerCase().trim();
  const foundColour = (foundItem.colour || "").toLowerCase().trim();

  const colourMatch =
    lostColour &&
    foundColour &&
    (lostColour === foundColour ||
      lostColour.includes(foundColour) ||
      foundColour.includes(lostColour));

  if (colourMatch) {
    score += 2;
    reasons.push({
      label: `Matching Colour: ${lostItem.colour}`,
      points: "+2",
      matched: true
    });
  }

  // Criterion 3: Location Match (+2 points)
  const lostLoc = (lostItem.location || "").toLowerCase().trim();
  const foundLoc = (foundItem.location || "").toLowerCase().trim();

  // Extract tokens from location
  const lostLocTokens = lostLoc.split(/\s+/).filter((t) => t.length > 2);
  const foundLocTokens = foundLoc.split(/\s+/).filter((t) => t.length > 2);

  const locationMatch =
    lostLoc &&
    foundLoc &&
    (lostLoc.includes(foundLoc) ||
      foundLoc.includes(lostLoc) ||
      lostLocTokens.some((tok) => foundLoc.includes(tok)));

  if (locationMatch) {
    score += 2;
    reasons.push({
      label: `Proximity Location: ${lostItem.location}`,
      points: "+2",
      matched: true
    });
  }

  // Criterion 4: Description Keyword Similarity (+1 point)
  const lostKeywords = extractKeywords(`${lostItem.itemName} ${lostItem.description}`);
  const foundKeywords = extractKeywords(`${foundItem.itemName} ${foundItem.description}`);

  let sharedKeywords = [];
  for (const word of lostKeywords) {
    for (const fWord of foundKeywords) {
      if (
        word === fWord ||
        (word.length > 3 && fWord.length > 3 && (word.startsWith(fWord) || fWord.startsWith(word)))
      ) {
        if (!sharedKeywords.includes(word)) {
          sharedKeywords.push(word);
        }
      }
    }
  }

  if (sharedKeywords.length > 0) {
    score += 1;
    reasons.push({
      label: `Keywords: ${sharedKeywords.slice(0, 3).join(", ")}`,
      points: "+1",
      matched: true
    });
  }

  // Determine Confidence Label (Ethical Rule: Never say "Confirmed Match")
  let confidence = "Potential Match";
  if (score >= 6) {
    confidence = "High Similarity";
  } else if (score >= 4) {
    confidence = "Possible Match";
  }

  return {
    score,
    maxScore: 8,
    confidence,
    reasons,
    isMatch: score >= 4 // Threshold to qualify as a displayed possible match
  };
}

/**
 * Finds all potential matches across active Lost and Found reports.
 *
 * 1. Purpose: Generates the list of matched pairs for the Smart Match Radar.
 * 2. Input: Array of all reports.
 * 3. Logic:
 *    - Splits reports into lostList and foundList.
 *    - Iterates each lost item against every found item.
 *    - Computes calculateMatchScore().
 *    - Filters only scores >= 4 and sorts from highest score to lowest.
 * 4. Output: Array of match pair objects.
 */
function findPotentialMatches(reports) {
  const lostList = reports.filter((r) => r.type === "lost");
  const foundList = reports.filter((r) => r.type === "found");
  const matches = [];

  for (const lost of lostList) {
    for (const found of foundList) {
      const result = calculateMatchScore(lost, found);
      if (result.isMatch) {
        matches.push({
          lostItem: lost,
          foundItem: found,
          score: result.score,
          maxScore: result.maxScore || 8,
          confidence: result.confidence,
          reasons: result.reasons
        });
      }
    }
  }

  // Sort by highest score first
  return matches.sort((a, b) => b.score - a.score);
}

// ============================================================================
// PART 2: REPORT INTAKE FORM (report.html)
// ============================================================================

/**
 * Initializes the report submission form on report.html.
 */
function initReportForm() {
  const form = document.getElementById("reportForm");
  if (!form) return;

  const tabLost = document.getElementById("tabLost");
  const tabFound = document.getElementById("tabFound");
  const itemTypeInput = document.getElementById("itemType");
  const submitBtn = document.getElementById("submitBtn");
  const dateInput = document.getElementById("date");
  const alertBox = document.getElementById("formAlert");
  const alertTitle = document.getElementById("alertTitle");
  const alertMessage = document.getElementById("alertMessage");
  const alertIcon = document.getElementById("alertIcon");

  // 1. Set today's date as default in the date picker
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  // 2. Check URL parameters (e.g. report.html?type=found)
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");
  if (typeParam === "found") {
    setReportType("found");
  } else {
    setReportType("lost");
  }

  // 3. Tab Toggle Event Listeners
  if (tabLost && tabFound) {
    tabLost.addEventListener("click", () => setReportType("lost"));
    tabFound.addEventListener("click", () => setReportType("found"));
  }

  function setReportType(type) {
    if (type === "found") {
      itemTypeInput.value = "found";
      tabFound.classList.add("active");
      tabFound.setAttribute("aria-selected", "true");
      tabLost.classList.remove("active");
      tabLost.setAttribute("aria-selected", "false");
      submitBtn.textContent = "Report Found Item";
      submitBtn.className = "btn btn-found btn-large";
    } else {
      itemTypeInput.value = "lost";
      tabLost.classList.add("active");
      tabLost.setAttribute("aria-selected", "true");
      tabFound.classList.remove("active");
      tabFound.setAttribute("aria-selected", "false");
      submitBtn.textContent = "Report Lost Item";
      submitBtn.className = "btn btn-primary btn-large";
    }
  }

  // 4. Form Reset Handler to clear errors
  form.addEventListener("reset", () => {
    if (alertBox) alertBox.style.display = "none";
    const errorSpans = form.querySelectorAll(".form-hint[id$='Error']");
    errorSpans.forEach((span) => { span.style.display = "none"; });
  });

  // 5. Form Submit Handler
  form.addEventListener("submit", (event) => {
    // 1. Prevent normal browser page reload
    event.preventDefault();

    // 2. Safely read values from inputs
    const type = itemTypeInput ? itemTypeInput.value : "lost";
    const itemNameEl = document.getElementById("itemName");
    const categoryEl = document.getElementById("category");
    const colourEl = document.getElementById("colour");
    const locationEl = document.getElementById("location");
    const dateEl = document.getElementById("date");
    const descriptionEl = document.getElementById("description");
    const contactEl = document.getElementById("contactEmail") || document.getElementById("contact");

    const itemName = itemNameEl ? itemNameEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value : "";
    const colour = colourEl ? colourEl.value.trim() : "";
    const location = locationEl ? locationEl.value.trim() : "";
    const date = dateEl ? dateEl.value : "";
    const description = descriptionEl ? descriptionEl.value.trim() : "";
    const contact = contactEl ? contactEl.value.trim() : "";

    // 3. Field-level error validation helper
    function setFieldError(spanId, isInvalid) {
      const span = document.getElementById(spanId);
      if (span) {
        span.style.display = isInvalid ? "block" : "none";
      }
    }

    let hasError = false;
    if (!itemName) { setFieldError("itemNameError", true); hasError = true; } else { setFieldError("itemNameError", false); }
    if (!category) { setFieldError("categoryError", true); hasError = true; } else { setFieldError("categoryError", false); }
    if (!colour) { setFieldError("colourError", true); hasError = true; } else { setFieldError("colourError", false); }
    if (!location) { setFieldError("locationError", true); hasError = true; } else { setFieldError("locationError", false); }
    if (!date) { setFieldError("dateError", true); hasError = true; } else { setFieldError("dateError", false); }
    if (!description) { setFieldError("descriptionError", true); hasError = true; } else { setFieldError("descriptionError", false); }
    if (!contact) { setFieldError("contactError", true); hasError = true; } else { setFieldError("contactError", false); }

    // 4. Check for validation errors
    if (hasError) {
      showAlert(
        "error",
        "Please fill in all required fields",
        "All form fields marked with an asterisk (*) must be provided."
      );
      return;
    }

    // 5. Build new JavaScript Report Object
    const newReport = {
      id: Date.now(), // Generate unique numeric ID based on timestamp
      type: type, // "lost" or "found"
      itemName: itemName,
      category: category,
      colour: colour,
      location: location,
      date: date,
      description: description,
      contact: contact,
      contactEmail: contact,
      status: "active"
    };

    // 6. Save to localStorage using our data layer function
    const existingReports = getStoredReports();
    existingReports.unshift(newReport); // Add to beginning of array
    const savedSuccess = saveStoredReports(existingReports);

    if (savedSuccess) {
      if (typeof addNotification === "function") {
        addNotification(
          `New ${type === "lost" ? "Lost" : "Found"} Report`,
          `"${itemName}" was logged at ${location}.`,
          "info"
        );
      }

      if (typeof showToast === "function") {
        showToast(`Report for "${itemName}" created successfully!`, "success");
      }

      showAlert(
        "success",
        `Report Saved Successfully!`,
        `Your ${type.toUpperCase()} report for "${itemName}" has been added to the board. Redirecting to Lost & Found...`
      );

      // Disable submit button while redirecting
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saved! Redirecting...";
      }

      // Reset form
      form.reset();

      // Redirect after 1.2 seconds so user can see their report
      setTimeout(() => {
        window.location.href = "lost-found.html";
      }, 1200);
    } else {
      showAlert(
        "error",
        "Could Not Save Report",
        "An unexpected error occurred while writing to browser localStorage."
      );
    }
  });

  function showAlert(type, title, message) {
    if (!alertBox) return;
    alertBox.style.display = "flex";
    alertBox.className = type === "success" ? "alert-box alert-success" : "alert-box alert-error";
    alertIcon.textContent = type === "success" ? "✅" : "⚠️";
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ============================================================================
// PART 3: LISTING, SEARCH & FILTERING (lost-found.html)
// ============================================================================

/**
 * Initializes the Lost & Found listing page:
 * - Reads all reports
 * - Runs the match radar
 * - Handles search and type/category filters
 */
function initLostFoundPage() {
  const reportsGrid = document.getElementById("reportsGrid");
  if (!reportsGrid) return;

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const filterBtns = document.querySelectorAll(".filter-btn[data-type]");
  const categoryFilter = document.getElementById("categoryFilter");
  const colourFilter = document.getElementById("colourFilter");
  const locationFilter = document.getElementById("locationFilter");
  const reportsCount = document.getElementById("reportsCount");
  const emptyState = document.getElementById("emptyState");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const matchRadarSection = document.getElementById("matchRadarSection");
  const matchesContainer = document.getElementById("matchesContainer");
  const matchCountBadge = document.getElementById("matchCountBadge");
  const filterStatusText = document.getElementById("filterStatusText");

  // State
  let currentTypeFilter = "all";
  let currentCategoryFilter = "all";
  let currentColourFilter = "all";
  let currentLocationFilter = "all";
  let currentSearchQuery = "";

  // 1. Initial Render (populates radar & campus reports grid)
  applyFiltersAndRender();

  // 2. Search Input Listener
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearchQuery.length > 0 ? "block" : "none";
      }
      applyFiltersAndRender();
    });
  }

  // Clear search button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentSearchQuery = "";
      clearSearchBtn.style.display = "none";
      applyFiltersAndRender();
      searchInput.focus();
    });
  }

  // 3. Type Filter Buttons (All / Lost / Found)
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTypeFilter = btn.getAttribute("data-type");
      applyFiltersAndRender();
    });
  });

  // 4. Category Dropdown Filter
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      currentCategoryFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // 5. Colour Dropdown Filter
  if (colourFilter) {
    colourFilter.addEventListener("change", (e) => {
      currentColourFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // 6. Location Dropdown Filter
  if (locationFilter) {
    locationFilter.addEventListener("change", (e) => {
      currentLocationFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // 7. Reset All Filters Button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      currentTypeFilter = "all";
      currentCategoryFilter = "all";
      currentColourFilter = "all";
      currentLocationFilter = "all";
      currentSearchQuery = "";
      if (searchInput) searchInput.value = "";
      if (clearSearchBtn) clearSearchBtn.style.display = "none";
      if (categoryFilter) categoryFilter.value = "all";
      if (colourFilter) colourFilter.value = "all";
      if (locationFilter) locationFilter.value = "all";
      filterBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-type") === "all");
      });
      applyFiltersAndRender();
    });
  }

  /**
   * Filters the reports list and Smart Radar according to active user controls.
   */
  function applyFiltersAndRender() {
    const reports = getStoredReports();

    // 1. Calculate all global match pairs
    const allMatches = findPotentialMatches(reports);
    const matchedLostIds = new Set(allMatches.map((m) => m.lostItem.id));
    const matchedFoundIds = new Set(allMatches.map((m) => m.foundItem.id));

    // 2. Check if specific attribute filters are active
    const hasActiveFilters =
      currentCategoryFilter !== "all" ||
      currentColourFilter !== "all" ||
      currentLocationFilter !== "all" ||
      Boolean(currentSearchQuery);

    // 3. Filter radar pairings to show those matching user criteria
    let activeRadarMatches = allMatches;
    if (hasActiveFilters) {
      activeRadarMatches = allMatches.filter((match) => {
        const pairItems = [match.lostItem, match.foundItem];

        // Category filter
        if (currentCategoryFilter !== "all") {
          const catMatches = pairItems.some(
            (it) => it.category && it.category.toLowerCase() === currentCategoryFilter.toLowerCase()
          );
          if (!catMatches) return false;
        }

        // Colour filter
        if (currentColourFilter !== "all") {
          const colMatches = pairItems.some((it) =>
            (it.colour || "").toLowerCase().includes(currentColourFilter.toLowerCase())
          );
          if (!colMatches) return false;
        }

        // Location filter
        if (currentLocationFilter !== "all") {
          const locMatches = pairItems.some((it) =>
            (it.location || "").toLowerCase().includes(currentLocationFilter.toLowerCase())
          );
          if (!locMatches) return false;
        }

        // Search text
        if (currentSearchQuery) {
          const textMatches = pairItems.some((it) => {
            const combined = `${it.itemName} ${it.category} ${it.colour} ${it.location} ${it.description}`.toLowerCase();
            return combined.includes(currentSearchQuery);
          });
          if (!textMatches) return false;
        }

        return true;
      });
    }

    // Render the Smart Match Radar reactively
    renderMatchesRadar(activeRadarMatches, allMatches.length, hasActiveFilters);

    // 4. Filter individual campus reports for the grid
    const filtered = reports.filter((item) => {
      // Type match
      if (currentTypeFilter !== "all" && item.type !== currentTypeFilter) {
        return false;
      }

      // Category match
      if (currentCategoryFilter !== "all" && item.category !== currentCategoryFilter) {
        return false;
      }

      // Colour match
      if (currentColourFilter !== "all") {
        const itemColour = (item.colour || "").toLowerCase();
        const filterColour = currentColourFilter.toLowerCase();
        if (!itemColour.includes(filterColour)) return false;
      }

      // Location match
      if (currentLocationFilter !== "all") {
        const itemLoc = (item.location || "").toLowerCase();
        const filterLoc = currentLocationFilter.toLowerCase();
        if (!itemLoc.includes(filterLoc)) return false;
      }

      // Search text match across multiple attributes
      if (currentSearchQuery) {
        const targetString = `${item.itemName} ${item.category} ${item.colour} ${item.location} ${item.description}`.toLowerCase();
        if (!targetString.includes(currentSearchQuery)) {
          return false;
        }
      }

      return true;
    });

    // Update Counts & Meta text
    if (reportsCount) {
      reportsCount.textContent = filtered.length;
    }

    if (filterStatusText) {
      let status = `Showing ${filtered.length} of ${reports.length} records`;
      if (currentTypeFilter !== "all") status += ` • Type: ${currentTypeFilter.toUpperCase()}`;
      if (currentCategoryFilter !== "all") status += ` • Category: ${currentCategoryFilter}`;
      if (currentColourFilter !== "all") status += ` • Colour: ${currentColourFilter}`;
      if (currentLocationFilter !== "all") status += ` • Location: ${currentLocationFilter}`;
      if (currentSearchQuery) status += ` • Query: "${currentSearchQuery}"`;
      filterStatusText.textContent = status;
    }

    // Toggle Empty State vs Grid
    if (filtered.length === 0) {
      reportsGrid.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
    } else {
      if (emptyState) emptyState.style.display = "none";
      renderReportsCards(filtered, matchedLostIds, matchedFoundIds);
    }
  }

  /**
   * Renders the individual report cards in the grid.
   * Privacy Rule: Never display public emails. Uses a private contact trigger.
   */
  function renderReportsCards(items, matchedLostIds, matchedFoundIds) {
    const allReports = getStoredReports();

    reportsGrid.innerHTML = items
      .map((item) => {
        const isLost = item.type === "lost";
        const badgeClass = isLost ? "badge-lost" : "badge-found";
        const badgeText = isLost ? "LOST ITEM" : "FOUND ITEM";
        const cardBorderClass = isLost ? "card-lost" : "card-found";

        // Check if this card has an active match in the opposite pool
        const hasPossibleMatch =
          (isLost && matchedLostIds.has(item.id)) ||
          (!isLost && matchedFoundIds.has(item.id));

        return `
        <article class="report-card ${cardBorderClass}" id="report-${item.id}">
          <div class="card-top-row">
            <span class="badge ${badgeClass}">${badgeText}</span>
            <span class="item-date">📅 ${formatDate(item.date)}</span>
          </div>

          <h3 class="card-item-title">${escapeHTML(item.itemName)}</h3>

          <div class="card-meta-pills">
            <span class="meta-pill">📂 ${escapeHTML(item.category)}</span>
            <span class="meta-pill">🎨 ${escapeHTML(item.colour)}</span>
            <span class="meta-pill">📍 ${escapeHTML(item.location)}</span>
          </div>

          <p class="card-desc">${escapeHTML(item.description)}</p>

          ${
            hasPossibleMatch
              ? `<div style="margin-bottom: 0.75rem;">
                   <a href="#matchRadarSection" class="match-indicator" title="Click to view candidate pair in Smart Radar">
                     ⚡ Possible Match Available (See Radar ↑)
                   </a>
                 </div>`
              : ""
          }

          <div class="card-footer-row">
            <button class="private-contact-badge" data-item-id="${item.id}" aria-label="Private student contact notice">
              <span>🔒</span> Private Student Contact
            </button>
            <span class="item-status">Status: Active</span>
          </div>
        </article>
      `;
      })
      .join("");

    // Attach click listeners to private contact badges
    const contactBadges = reportsGrid.querySelectorAll(".private-contact-badge");
    contactBadges.forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-item-id");
        const found = allReports.find((r) => String(r.id) === String(itemId));
        if (found && typeof showPrivateContactNotice === "function") {
          showPrivateContactNotice(found);
        }
      });
    });
  }

  /**
   * Renders the Smart Match Radar section showing paired candidates.
   */
  function renderMatchesRadar(matches, totalGlobalCount, isFiltered) {
    if (!matchesContainer || !matchRadarSection) return;

    if (matchCountBadge) {
      if (isFiltered) {
        matchCountBadge.textContent = `${matches.length} ${matches.length === 1 ? "Pair" : "Pairs"} (Filtered)`;
      } else {
        matchCountBadge.textContent = `${matches.length} Potential ${matches.length === 1 ? "Pair" : "Pairs"}`;
      }
    }

    if (matches.length === 0) {
      matchesContainer.innerHTML = `
        <div class="radar-empty-state" style="padding: 1.5rem; text-align: center; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px dashed rgba(251, 191, 36, 0.35); grid-column: 1 / -1;">
          <p style="color: #fde68a; font-size: 0.95rem; margin-bottom: 0.4rem; font-weight: 600;">
            ${isFiltered ? "No potential matches found for active filter settings." : "No potential matches currently detected."}
          </p>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;">
            ${isFiltered ? `There are ${totalGlobalCount} total campus pairings in the database. Reset filters to see all matches.` : "As students report items with matching category, colour, or location, candidate pairings appear here."}
          </p>
          ${
            isFiltered
              ? `<button class="btn btn-secondary btn-sm" id="radarResetFilterBtn" style="font-size: 0.8rem; padding: 0.35rem 0.85rem;">Clear Filters &amp; View All Radar Matches</button>`
              : ""
          }
        </div>
      `;

      const radarReset = document.getElementById("radarResetFilterBtn");
      if (radarReset && resetFiltersBtn) {
        radarReset.addEventListener("click", () => resetFiltersBtn.click());
      }
      return;
    }

    matchesContainer.innerHTML = matches
      .map((match) => {
        const { lostItem, foundItem, score, maxScore, confidence, reasons } = match;

        // Render matched reason tags
        const reasonsHTML = reasons
          .filter((r) => r.matched)
          .map((r) => `<li class="reason-tag matched">${escapeHTML(r.label)} (${r.points})</li>`)
          .join("");

        return `
        <div class="match-card">
          <div class="match-card-top">
            <span class="badge badge-amber">${escapeHTML(confidence)}</span>
            <span class="match-score-pill">${score}/${maxScore || 8} Points</span>
          </div>

          <div class="match-pairing-label">
            Potential Pairing Detected
          </div>

          <div class="match-versus">
            <div class="match-side lost-side">
              <div class="match-side-tag"><span class="badge badge-lost">LOST</span></div>
              <div class="match-side-name" title="${escapeHTML(lostItem.itemName)}">${escapeHTML(lostItem.itemName)}</div>
              <div class="match-side-meta">📍 ${escapeHTML(lostItem.location)}</div>
              <button class="private-contact-badge-mini" data-contact-item="${lostItem.id}" title="Contact reporter privately">🔒 Contact Reporter</button>
            </div>

            <div class="match-divider-icon" aria-hidden="true">⇄</div>

            <div class="match-side found-side">
              <div class="match-side-tag"><span class="badge badge-found">FOUND</span></div>
              <div class="match-side-name" title="${escapeHTML(foundItem.itemName)}">${escapeHTML(foundItem.itemName)}</div>
              <div class="match-side-meta">📍 ${escapeHTML(foundItem.location)}</div>
              <button class="private-contact-badge-mini" data-contact-item="${foundItem.id}" title="Contact finder privately">🔒 Contact Finder</button>
            </div>
          </div>

          <div class="match-signals-container">
            <span style="font-size: 0.8rem; font-weight: 600; color: #fde68a; display: block; margin-bottom: 0.35rem;">
              Matching Signals Breakdown:
            </span>
            <ul class="match-reasons-list">
              ${reasonsHTML}
            </ul>
          </div>
        </div>
      `;
      })
      .join("");

    // Attach click listeners to radar private contact mini badges
    const miniBadges = matchesContainer.querySelectorAll(".private-contact-badge-mini");
    const allStored = getStoredReports();
    miniBadges.forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-contact-item");
        const found = allStored.find((r) => String(r.id) === String(itemId));
        if (found && typeof showPrivateContactNotice === "function") {
          showPrivateContactNotice(found);
        }
      });
    });
  }
}

// ============================================================================
// PAGE INITIALIZATION ROUTER
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // If we are on report.html
  initReportForm();

  // If we are on lost-found.html
  initLostFoundPage();
});

