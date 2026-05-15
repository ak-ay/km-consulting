const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-primary-nav]");
const quoteForm = document.querySelector("[data-quote-form]");
const formStatus = document.querySelector("[data-form-status]");
const navLinks = [...document.querySelectorAll(".primary-nav a")];
const header = document.querySelector(".site-header");
const heroFigure = document.querySelector(".hero-media-img");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("nav-open", !isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
const refreshScrollKey = "km-refresh-scroll-y";
let homeRefreshHandled = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const storeRefreshScroll = () => {
  sessionStorage.setItem(refreshScrollKey, String(Math.max(window.scrollY, 0)));
};

window.addEventListener("beforeunload", storeRefreshScroll);
window.addEventListener("pagehide", storeRefreshScroll);

const animateToHeroOnRefresh = () => {
  if (homeRefreshHandled || window.location.hash) return;
  homeRefreshHandled = true;

  const savedScroll = Number(sessionStorage.getItem(refreshScrollKey) || 0);
  sessionStorage.removeItem(refreshScrollKey);
  document.documentElement.classList.add("home-arrival");

  if (prefersReducedMotion || savedScroll < 80) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.setTimeout(() => document.documentElement.classList.remove("home-arrival"), 1200);
    return;
  }

  window.scrollTo({ top: savedScroll, left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 180);
  });

  window.setTimeout(() => document.documentElement.classList.remove("home-arrival"), 1800);
};

if (!window.location.hash) {
  document.documentElement.classList.add("home-arrival");
  window.addEventListener("pageshow", () => {
    window.setTimeout(animateToHeroOnRefresh, 80);
  });
  window.addEventListener("load", () => {
    window.setTimeout(animateToHeroOnRefresh, 80);
  });
  if (document.readyState !== "loading") {
    window.setTimeout(animateToHeroOnRefresh, 120);
  }
}

const revealVisibleItems = () => {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.08 && rect.bottom > -80) {
      item.classList.add("is-visible");
    }
  });
};

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => {
    const parent = item.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter((child) => child.classList.contains("reveal"));
      const indexInGroup = siblings.indexOf(item);
      if (indexInGroup >= 0) {
        item.style.transitionDelay = `${Math.min(indexInGroup * 90, 360)}ms`;
      }
    }
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

window.addEventListener("load", () => {
  window.setTimeout(revealVisibleItems, 120);
});

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-42% 0px -50% 0px" }
  );

  sections.forEach((section) => activeObserver.observe(section));
}

let ticking = false;
const updateScroll = () => {
  const y = window.scrollY;

  if (header) {
    header.classList.toggle("is-scrolled", y > 6);
  }

  if (heroFigure && !prefersReducedMotion) {
    const offset = Math.min(y * 0.18, 80);
    const scale = Math.max(1 - y / 4000, 0.94);
    heroFigure.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
  }

  ticking = false;
};

const onScroll = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScroll);
};

window.addEventListener("scroll", onScroll, { passive: true });
updateScroll();

if (quoteForm && formStatus) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(quoteForm);
    const payload = JSON.stringify(Object.fromEntries(data));
    const submitButton = quoteForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";

    formStatus.textContent = "Sending your request...";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload,
    })
      .then((response) => {
        return response.json().then((result) => {
          if (!response.ok || !result.success) throw new Error("Form submission failed");
          return result;
        });
      })
      .then(() => {
        quoteForm.reset();
        formStatus.textContent = "Your request has been sent. We'll respond soon.";
      })
      .catch(() => {
        formStatus.textContent = "We could not send the form right now. Please email reachus@kmconsulting.org.in.";
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      });
  });
}
