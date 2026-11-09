"use strict";
// Definitions already embedded in the lesson; no network or persistent storage.
(() => {
  const terms = [...document.querySelectorAll('.lesson-text .key-term[title]')]
    .filter(term => term.title.trim() && !term.closest('a, button'));
  if (!terms.length) return;
  const popup = document.createElement('div');
  popup.id = 'term-definition';
  popup.className = 'term-definition';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-labelledby', 'term-definition-heading');
  const nativePopover = typeof popup.showPopover === 'function';
  // Handle dismissal here so a second tap on the same word closes consistently.
  if (nativePopover) popup.setAttribute('popover', 'manual');
  else popup.hidden = true;
  const header = document.createElement('div');
  header.className = 'term-definition-header';
  const heading = document.createElement('h2');
  heading.id = 'term-definition-heading';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'term-definition-close';
  closeButton.textContent = '閉じる ×';
  const definition = document.createElement('p');
  definition.id = 'term-definition-text';
  popup.setAttribute('aria-describedby', definition.id);
  header.append(heading, closeButton);
  popup.append(header, definition);
  document.body.append(popup);
  let active = null;
  const isOpen = () => nativePopover ? popup.matches(':popover-open') : !popup.hidden;
  const clearActive = restoreFocus => {
    const previous = active;
    active = null;
    if (previous) {
      previous.setAttribute('aria-expanded', 'false');
      if (restoreFocus) previous.focus({preventScroll:true});
    }
  };
  const close = (restoreFocus = false) => {
    if (isOpen()) {
      if (nativePopover) popup.hidePopover();
      else popup.hidden = true;
    }
    clearActive(restoreFocus);
  };
  const position = () => {
    if (!active || !isOpen()) return;
    const rect = active.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = viewport ? viewport.offsetLeft : 0;
    const top = viewport ? viewport.offsetTop : 0;
    const width = viewport ? viewport.width : innerWidth;
    const height = viewport ? viewport.height : innerHeight;
    popup.style.maxWidth = `${Math.max(0, width - 32)}px`;
    popup.style.maxHeight = `${Math.max(0, height - 32)}px`;
    const bounds = popup.getBoundingClientRect();
    popup.style.left = `${Math.max(left + 16, Math.min(rect.left, left + width - bounds.width - 16))}px`;
    const below = rect.bottom + 10;
    const preferred = below + bounds.height <= top + height - 16 ? below : rect.top - bounds.height - 10;
    popup.style.top = `${Math.max(top + 16, Math.min(preferred, top + height - bounds.height - 16))}px`;
  };
  for (const term of terms) {
    const label = term.title;
    const separator = label.indexOf('：');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'key-term-trigger';
    // Empty title suppresses the ancestor's mouse tooltip without losing metadata.
    button.title = '';
    button.setAttribute('aria-label', `${term.textContent}の意味を表示`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', popup.id);
    button.setAttribute('aria-expanded', 'false');
    while (term.firstChild) button.append(term.firstChild);
    term.append(button);
    button.addEventListener('click', () => {
      if (active === button && isOpen()) { close(true); return; }
      close();
      active = button;
      heading.textContent = separator >= 0 ? label.slice(0, separator) : term.textContent;
      definition.textContent = separator >= 0 ? label.slice(separator + 1) : label;
      button.setAttribute('aria-expanded', 'true');
      if (nativePopover) popup.showPopover();
      else popup.hidden = false;
      position();
      closeButton.focus({preventScroll:true});
    });
  }
  closeButton.addEventListener('click', () => close(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      close(true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (active && !popup.contains(event.target) && !active.contains(event.target)) close();
  });
  // Keyboard focus may leave this non-modal panel; do not leave it over the page.
  document.addEventListener('focusin', event => {
    if (active && !popup.contains(event.target) && !active.contains(event.target)) close();
  });
  if (nativePopover) popup.addEventListener('toggle', event => {
    if (event.newState === 'closed' && !isOpen()) clearActive(popup.contains(document.activeElement));
  });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', position);
    window.visualViewport.addEventListener('scroll', position);
  }
})();
// Collapse only on small screens; preserve the existing anchors and desktop TOC.
(() => {
  const contents = document.querySelector(".contents");
  if (!contents || !contents.querySelector("nav")) return;
  const mobile = window.matchMedia("(max-width:720px)");
  const panel = document.createElement("div");
  panel.className = "contents-panel";
  panel.id = "lesson-contents-panel";
  while (contents.firstChild) panel.append(contents.firstChild);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "contents-toggle";
  button.setAttribute("aria-controls", panel.id);
  const count = panel.querySelectorAll('a[href^="#"]').length;
  let expanded = false;
  const refresh = () => {
    button.hidden = !mobile.matches;
    if (mobile.matches && !expanded && panel.contains(document.activeElement)) button.focus();
    button.setAttribute("aria-expanded", String(!mobile.matches || expanded));
    button.textContent = `目次を${expanded ? "閉じる" : "開く"}（${count}章）`;
    panel.hidden = mobile.matches && !expanded;
  };
  contents.append(button, panel);
  button.addEventListener("click", () => { expanded = !expanded; refresh(); });
  panel.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!mobile.matches || !link) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    expanded = false;
    refresh();
    // Native anchor navigation scrolls after the panel closes. Move focus too.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({preventScroll:true});
  });
  mobile.addEventListener("change", refresh);
  refresh();
})();
(() => {
  const scriptUrl = document.currentScript ? document.currentScript.src : "";
  const dialog = document.querySelector(".lightbox");
  if (dialog && typeof dialog.showModal === "function") {
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector(".lightbox-caption");
    document.querySelectorAll(".zoom-link").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        image.src = link.href;
        image.alt = link.querySelector("img").alt;
        caption.textContent = link.closest("figure").querySelector("h3").textContent;
        dialog.showModal();
      });
    });
    dialog.querySelector("button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => image.removeAttribute("src"));
  }
  const chapters = [...document.querySelectorAll(".chapter")];
  const links = [...document.querySelectorAll(".contents a")];
  const progress = document.querySelector(".reading-progress");
  let pending = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, window.scrollY / max * 100) : 100}%`;
    let current = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= window.innerHeight * 0.32) current = chapter;
    }
    links.forEach(link => {
      if (current && link.hash === `#${current.id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    pending = false;
  }
  const schedule = () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  };
  window.addEventListener("scroll", schedule, {passive: true});
  window.addEventListener("resize", schedule);
  update();
  // Optional underlines for person, place and artwork names (tools/entity_markup.py).
  const actions = document.querySelector(".header-actions");
  if (actions && document.querySelector(".nm-person, .nm-place, .nm-work")) {
    const root = document.documentElement;
    const key = "art-history-names";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "names-toggle";
    button.innerHTML = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" x2="20" y1="20" y2="20" /></svg>';
    const param = new URLSearchParams(location.search).get("names");
    let on = param === "on";
    if (!param) {
      try { on = localStorage.getItem(key) === "on"; } catch (_) {}
    }
    const refresh = () => {
      root.dataset.names = on ? "on" : "off";
      const label = on ? "人名・地名・作品名の下線を消す" : "人名・地名・作品名に下線を引く";
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-label", label);
      button.title = label;
      // Like the theme, carry the choice on local links when storage is per file.
      if (location.protocol === "file:") {
        for (const link of document.querySelectorAll("a[href]")) {
          if (link.getAttribute("href").startsWith("#")) continue;
          const url = new URL(link.href);
          if (url.protocol === "file:" && /\.html$/i.test(url.pathname)) {
            url.searchParams.set("names", on ? "on" : "off");
            link.href = url.href;
          }
        }
      }
    };
    button.addEventListener("click", () => {
      on = !on;
      try { localStorage.setItem(key, on ? "on" : "off"); } catch (_) {}
      refresh();
    });
    actions.insertBefore(button, actions.querySelector(".theme-toggle"));
    refresh();
  }
  // Previous/next lessons and the study index, from js/lesson-catalog.js (tools/build_study_index.py).
  const lessonMatch = location.pathname.match(/\/lessons\/([A-Za-z]*\d{3})\.html$/);
  if (lessonMatch && scriptUrl) {
    const home = document.querySelector(".header-home");
    if (home && !document.querySelector(".header-index")) {
      const link = document.createElement("a");
      link.className = "header-home header-index";
      link.href = new URL("../study-index.html", scriptUrl).href;
      link.textContent = "索引";
      home.after(link);
      const glossary = document.createElement("a");
      glossary.className = "header-home header-glossary";
      glossary.href = new URL("../glossary.html", scriptUrl).href;
      glossary.textContent = "用語集";
      link.after(glossary);
    }
    const renderPager = () => {
      const allLessons = window.LESSON_CATALOG || [];
      const current = allLessons.find(item => item.lesson_id === lessonMatch[1] || String(item.number).padStart(3, "0") === lessonMatch[1]);
      const lessons = allLessons.filter(item => current && item.series_id === current.series_id);
      const footer = document.querySelector(".lesson-footer");
      const index = lessons.findIndex(item => item === current);
      if (!footer || index < 0 || document.querySelector(".lesson-pager")) return;
      const nav = document.createElement("nav");
      nav.className = "lesson-pager";
      nav.setAttribute("aria-label", "前後の教材");
      const item = (lesson, label, cls) => {
        if (!lesson) return `<span class="${cls}"></span>`;
        const href = new URL(`../${lesson.href || 'lessons/' + String(lesson.number).padStart(3, "0") + '.html'}`, scriptUrl).href;
        const title = `${lesson.lesson_id || String(lesson.number).padStart(3, "0")} ${lesson.title}`.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
        return `<a class="${cls}" href="${href}"><small>${label}</small>${title}</a>`;
      };
      nav.innerHTML = item(lessons[index - 1], "← 前の教材", "prev") + item(lessons[index + 1], "次の教材 →", "next");
      footer.before(nav);
    };
    const catalog = document.createElement("script");
    catalog.src = new URL("lesson-catalog.js", scriptUrl).href;
    catalog.addEventListener("load", renderPager);
    document.head.append(catalog);
  }
})();
// Self-test at the end of a lesson (tools/lesson_quiz.py): shuffled choices, instant feedback, score.
(() => {
  const quiz = document.querySelector(".lesson-quiz");
  if (!quiz) return;
  const items = [...quiz.querySelectorAll(".quiz-item[data-choice]")];
  const score = quiz.querySelector(".quiz-score span");
  const update = () => {
    const done = items.filter(item => item.classList.contains("answered"));
    if (score) score.textContent = `選択問題：${done.length}／${items.length}問回答・正解${done.filter(item => item.dataset.result === "ok").length}`;
  };
  const shuffle = item => {
    const box = item.querySelector(".quiz-choices");
    const buttons = [...box.children];
    for (let i = buttons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [buttons[i], buttons[j]] = [buttons[j], buttons[i]];
    }
    box.append(...buttons);
  };
  for (const item of items) {
    shuffle(item);
    const buttons = [...item.querySelectorAll(".quiz-choices button")];
    for (const button of buttons) {
      button.addEventListener("click", () => {
        const ok = button.hasAttribute("data-correct");
        for (const other of buttons) {
          other.disabled = true;
          if (other.hasAttribute("data-correct")) other.classList.add("correct");
        }
        if (!ok) button.classList.add("wrong");
        item.dataset.result = ok ? "ok" : "ng";
        const verdict = item.querySelector(".verdict");
        verdict.textContent = ok ? "正解" : "不正解";
        verdict.className = "verdict " + (ok ? "ok" : "ng");
        item.classList.add("answered");
        update();
      });
    }
  }
  const reset = quiz.querySelector(".quiz-reset");
  if (reset) reset.addEventListener("click", () => {
    for (const item of items) {
      item.classList.remove("answered");
      delete item.dataset.result;
      for (const button of item.querySelectorAll(".quiz-choices button")) {
        button.disabled = false;
        button.classList.remove("correct", "wrong");
      }
      shuffle(item);
    }
    quiz.querySelectorAll("details").forEach(details => { details.open = false; });
    update();
  });
})();

// Placeholders for unpublished images: compact strip with a Google image search link.
(() => {
  for (const box of document.querySelectorAll(".image-placeholder")) {
    const figure = box.closest("figure");
    if (!figure || box.querySelector(".image-search")) continue;
    const h3 = figure.querySelector("figcaption h3");
    const noise = /未|確定|同定|確認|個体|保留/;
    const title = h3 ? h3.textContent
      .replace(/（[^（）]*）|\([^()]*\)/g, m => noise.test(m) ? " " : m)
      .replace(/[《》「」『』]/g, " ").trim() : "";
    let author = "";
    for (const row of figure.querySelectorAll("figcaption dl > div")) {
      const dt = row.querySelector("dt");
      if (dt && /^作者/.test(dt.textContent.trim())) {
        author = row.querySelector("dd")?.textContent.trim() || "";
        break;
      }
    }
    if (/不詳|不明|未詳|未確|未同定|確定保留/.test(author)) author = "";
    const query = [title, author].filter(Boolean).join(" ").replace(/\s+/g, " ");
    if (!query) continue;
    const reason = box.querySelector("p");
    if (reason) box.title = reason.textContent.trim();
    const link = document.createElement("a");
    link.className = "image-search";
    link.href = "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(query);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML = 'Google画像検索で見る<span aria-hidden="true"> ↗</span>';
    link.setAttribute("aria-label", query + " をGoogle画像検索で見る（新しいタブ）");
    box.append(link);
    box.classList.add("has-search");
  }
})();
