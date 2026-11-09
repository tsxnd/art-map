"use strict";
(() => {
  const form = document.querySelector('#fulltext-form');
  const query = document.querySelector('#fulltext-query');
  const series = document.querySelector('#fulltext-series');
  const era = document.querySelector('#fulltext-era');
  const status = document.querySelector('#fulltext-status');
  const empty = document.querySelector('#fulltext-empty');
  const results = document.querySelector('#fulltext-results');
  const more = document.querySelector('#fulltext-more');
  const data = window.LESSON_SEARCH_DATA;
  if (!data || data.schema_version !== 1) {
    status.textContent = '検索データを読み込めませんでした。ページを再読み込みしてください。';
    form.hidden = true;
    empty.hidden = true;
    return;
  }
  // Searches stay in memory: no storage, cookies, URL changes or requests.
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase('ja').replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0)-0x60));
  const entries = data.entries.map((entry, order) => {
    const lesson = data.lessons[entry.lesson];
    return {...entry, order, source:lesson,
      body:normalize(entry.text), chapterText:normalize(entry.chapter),
      context:normalize([lesson.lesson_id,lesson.title,entry.chapter,entry.text].join(' '))};
  });
  for (const [select, key, label] of [[series,'series_id','series'],[era,'era','era_label']]) {
    const seen = new Set();
    for (const lesson of data.lessons) {
      if (!lesson[key] || seen.has(lesson[key])) continue;
      seen.add(lesson[key]);
      const option = document.createElement('option');
      option.value = lesson[key];
      option.textContent = lesson[label];
      select.append(option);
    }
  }
  // Keep original character offsets when NFKC joins half-width voiced kana.
  function mappedText(text) {
    const clusters = [];
    let offset = 0;
    for (const char of text) {
      if (clusters.length && /[\p{M}\uFF9E\uFF9F]/u.test(char)) {
        clusters[clusters.length-1].text += char;
        clusters[clusters.length-1].end += char.length;
      } else clusters.push({text:char,start:offset,end:offset+char.length});
      offset += char.length;
    }
    let normalized = '';
    const starts = [], ends = [];
    for (const cluster of clusters) {
      const part = normalize(cluster.text);
      normalized += part;
      for (let i=0;i<part.length;i++) {starts.push(cluster.start);ends.push(cluster.end);}
    }
    return {normalized,starts,ends};
  }
  function highlighted(text, terms, snippet=false) {
    const mapped = mappedText(text);
    const spans = [];
    for (const term of terms) {
      let from = 0, at;
      while ((at = mapped.normalized.indexOf(term,from)) >= 0) {
        spans.push([mapped.starts[at],mapped.ends[at+term.length-1]]);
        from = at+term.length;
      }
    }
    spans.sort((a,b) => a[0]-b[0] || b[1]-a[1]);
    const merged = [];
    for (const span of spans) {
      const last = merged[merged.length-1];
      if (last && span[0] <= last[1]) last[1] = Math.max(last[1],span[1]);
      else merged.push([...span]);
    }
    let start = snippet ? Math.max(0,(merged[0]?.[0] || 0)-50) : 0;
    let end = snippet ? Math.min(text.length,start+190) : text.length;
    for (const [a,b] of merged) {if(a<end && b>end) end=b;}
    if (start>0 && /[\uDC00-\uDFFF]/.test(text[start])) start--;
    if (end<text.length && /[\uDC00-\uDFFF]/.test(text[end])) end++;
    const fragment = document.createDocumentFragment();
    if (start) fragment.append('…');
    let cursor = start;
    for (const [a,b] of merged) {
      if (b<=start || a>=end) continue;
      fragment.append(text.slice(cursor,Math.max(start,a)));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(Math.max(start,a),Math.min(end,b));
      fragment.append(mark);
      cursor = Math.min(end,b);
    }
    fragment.append(text.slice(cursor,end));
    if (end<text.length) fragment.append('…');
    return fragment;
  }
  let matches = [], shown = 0, terms = [], timer, composing = false;
  const pageSize = 20;
  function carryTheme(link) {
    if (location.protocol !== 'file:') return;
    const target = new URL(link.href);
    target.searchParams.set('theme',document.documentElement.dataset.theme || 'light');
    link.href = target.href;
  }
  if (location.protocol === 'file:') new MutationObserver(() => {
    results.querySelectorAll('a').forEach(carryTheme);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  function appendPage() {
    const fragment = document.createDocumentFragment();
    for (const entry of matches.slice(shown,shown+pageSize)) {
      const lesson = entry.source;
      const item = document.createElement('li');
      item.className = 'fulltext-result';
      const meta = document.createElement('p');
      meta.className = 'fulltext-result-meta';
      meta.textContent = [lesson.lesson_id,lesson.series,lesson.era_label,entry.kind === 'artwork' ? '作品情報' : '本文'].filter(Boolean).join(' ／ ');
      const heading = document.createElement('h2');
      const link = document.createElement('a');
      link.href = lesson.href+'#'+encodeURIComponent(entry.anchor);
      carryTheme(link);
      link.append(highlighted(lesson.title+(entry.chapter ? ' — '+entry.chapter : ''),terms));
      heading.append(link);
      const text = document.createElement('p');
      text.className = 'fulltext-result-text';
      text.append(highlighted(entry.text,terms,true));
      item.append(meta,heading,text);
      fragment.append(item);
    }
    results.append(fragment);
    shown = Math.min(shown+pageSize,matches.length);
    more.hidden = shown>=matches.length;
    more.textContent = `次の${Math.min(pageSize,matches.length-shown)}件を表示`;
    const lessonCount = new Set(matches.map(item => item.lesson)).size;
    status.textContent = `${lessonCount}教材・${matches.length}箇所が見つかりました${matches.length ? `（${shown}件表示）` : ''}。`;
  }
  function search() {
    clearTimeout(timer);
    terms = [...new Set(normalize(query.value).trim().split(/\s+/).filter(Boolean))];
    matches = [];
    shown = 0;
    results.replaceChildren();
    more.hidden = true;
    empty.hidden = false;
    if (!terms.length) {
      status.textContent = `${data.lessons.length}教材の本文・作品情報を検索できます。`;
      empty.textContent = '調べたい言葉を入力してください。';
      return;
    }
    matches = entries.filter(entry => (!series.value || entry.source.series_id===series.value)
      && (!era.value || entry.source.era===era.value)
      && terms.every(term => entry.context.includes(term)));
    const score = entry => terms.reduce((sum,term) => sum+(entry.body.includes(term)?4:0)+(entry.chapterText.includes(term)?2:0),0);
    matches.sort((a,b) => score(b)-score(a) || a.order-b.order);
    empty.hidden = matches.length>0;
    empty.textContent = '該当する箇所はありません。言葉を短くするか、絞り込み条件を変えてください。';
    appendPage();
  }
  form.addEventListener('submit',event => {
    event.preventDefault();search();
    query.blur();status.focus({preventScroll:true});
    status.scrollIntoView({block:'start'});
  });
  query.addEventListener('compositionstart',() => {composing=true;clearTimeout(timer);});
  query.addEventListener('compositionend',() => {composing=false;search();});
  query.addEventListener('input',() => {if(!composing){clearTimeout(timer);timer=setTimeout(search,180);}});
  series.addEventListener('change',search);
  era.addEventListener('change',search);
  form.addEventListener('reset',() => {
    clearTimeout(timer);
    query.value='';series.value='';era.value='';
    search();query.focus();
  });
  more.addEventListener('click',() => {
    const previous=shown;
    appendPage();
    results.children[previous]?.querySelector('a')?.focus({preventScroll:true});
  });
  search();
})();
