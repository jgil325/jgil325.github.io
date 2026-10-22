(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  let keyboard = false;

  document.addEventListener(
    "keydown",
    () => {
      keyboard = true;
      root.dataset.keyboard = "";
    },
    { capture: true },
  );
  document.addEventListener(
    "pointerdown",
    () => {
      keyboard = false;
      delete root.dataset.keyboard;
    },
    { capture: true, passive: true },
  );

  const themeButton = document.querySelector(".theme-toggle");
  function syncTheme() {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : systemDark.matches;
    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute(
        "aria-label",
        `Switch to ${dark ? "light" : "dark"} theme`,
      );
      themeButton.title = `Switch to ${dark ? "light" : "dark"} theme`;
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#15171B" : "#FAFAFC");
  }
  function toggleTheme() {
    const dark = themeButton.getAttribute("aria-pressed") === "true";
    root.dataset.theme = dark ? "light" : "dark";
    try {
      localStorage.setItem("portfolio-theme", root.dataset.theme);
    } catch {}
    syncTheme();
    // The home scene redraws inside the same frame so the reveal captures it.
    document.dispatchEvent(new Event("portfolio:themechange"));
  }
  themeButton?.addEventListener("click", () => {
    if (!document.startViewTransition || reduceMotion.matches || keyboard) {
      toggleTheme();
      return;
    }
    // The new theme grows out of the toggle as a circle.
    const box = themeButton.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);
    root.style.setProperty(
      "--reveal-r",
      `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`,
    );
    root.classList.add("theme-transition");
    document
      .startViewTransition(toggleTheme)
      .finished.finally(() => root.classList.remove("theme-transition"));
  });
  systemDark.addEventListener("change", syncTheme);
  syncTheme();

  // Progressive enhancement: all content remains visible when JavaScript is absent.
  let observer;
  function revealAll() {
    observer?.disconnect();
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.setAttribute("data-visible", "");
      element.classList.remove("reveal-ready");
    });
  }
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          target.setAttribute("data-visible", "");
          observer.unobserve(target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.setAttribute("data-visible", "");
      } else {
        element.classList.add("reveal-ready");
        observer.observe(element);
      }
    });
    // Keyboard navigation must never land on an invisible project link.
    document.addEventListener("focusin", (event) => {
      const target = event.target.closest("[data-reveal]");
      if (!target) return;
      target.setAttribute("data-visible", "");
      target.classList.remove("reveal-ready");
      observer.unobserve(target);
    });
    reduceMotion.addEventListener("change", (event) => {
      if (event.matches) revealAll();
    });
  }

  const resultGrid = document.querySelector("#project-results");
  if (resultGrid) {
    const input = document.querySelector('input[name="q"]');
    const filters = [...document.querySelectorAll("[data-filter]")];
    const sort = document.querySelector("#project-sort");
    const count = document.querySelector("#result-count");
    const empty = document.querySelector(".empty-state");
    const cards = [...resultGrid.querySelectorAll(".library-card")];
    const params = new URLSearchParams(location.search);
    let category = params.get("filter") || "all";
    if (!filters.some((button) => button.dataset.filter === category))
      category = "all";
    input.value = params.get("q") || "";
    if (["featured", "newest", "name"].includes(params.get("sort")))
      sort.value = params.get("sort");
    document.querySelectorAll("[data-library-controls]").forEach((element) => {
      element.hidden = false;
    });

    const normalize = (value) =>
      value
        .toLocaleLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    function updateResults({ animate = false } = {}) {
      const query = normalize(input.value);
      filters.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
      const ordered = [...cards].sort((a, b) => {
        if (sort.value === "newest")
          return (
            Number(b.dataset.year) - Number(a.dataset.year) ||
            Number(a.dataset.order) - Number(b.dataset.order)
          );
        if (sort.value === "name")
          return a
            .querySelector("h2")
            .textContent.localeCompare(b.querySelector("h2").textContent);
        return Number(a.dataset.order) - Number(b.dataset.order);
      });
      let visible = 0;
      ordered.forEach((card) => {
        const matches =
          (category === "all" || card.dataset.category === category) &&
          normalize(card.dataset.search).includes(query);
        card.hidden = !matches;
        resultGrid.append(card);
        if (matches) {
          visible += 1;
          if (animate && !reduceMotion.matches && !keyboard) {
            card.getAnimations().forEach((animation) => animation.cancel());
            card.animate([{ opacity: 0.4 }, { opacity: 1 }], {
              duration: 150,
              easing: "cubic-bezier(0.23, 1, 0.32, 1)",
            });
          }
        }
      });
      count.textContent = `${visible} ${visible === 1 ? "project" : "projects"}`;
      empty.hidden = visible !== 0;
      const next = new URLSearchParams();
      if (category !== "all") next.set("filter", category);
      if (input.value.trim()) next.set("q", input.value.trim());
      if (sort.value !== "featured") next.set("sort", sort.value);
      history.replaceState(
        null,
        "",
        `${location.pathname}${next.size ? `?${next}` : ""}`,
      );
    }
    filters.forEach((button) =>
      button.addEventListener("click", (event) => {
        category = button.dataset.filter;
        updateResults({ animate: event.detail !== 0 });
      }),
    );
    input.addEventListener("input", () => updateResults());
    sort.addEventListener("change", () => updateResults());
    document
      .querySelector("[data-clear-search]")
      .addEventListener("click", () => {
        category = "all";
        input.value = "";
        updateResults();
        input.focus();
      });
    updateResults();
  }

  const printButton = document.querySelector("[data-print]");
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener("click", () => window.print());
  }
  window.addEventListener("pagehide", () => observer?.disconnect(), {
    once: true,
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) revealAll();
  });
})();
