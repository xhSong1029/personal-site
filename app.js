(() => {
  'use strict';
  const pages = window.SITE_DATA?.pages || [];
  const main = document.querySelector('main');
  if (!pages.length) { main.textContent = '暂无内容 / No content available'; return; }
  const labels = {
    zh: {site: '个人主页', index: '目录', empty: '暂无内容', back: '返回首页', fallback: '以下内容暂以原文展示。', image: '查看原图', missing: '图片暂时无法加载'},
    en: {site: 'Personal website', index: 'CONTENTS', empty: 'Nothing here yet', back: 'Back to profile', fallback: 'Some content is shown in its original language.', image: 'View full image', missing: 'Image unavailable'}
  };
  let lang = 'zh';
  try { lang = localStorage.getItem('site-language') === 'en' ? 'en' : 'zh'; } catch (_) { /* Storage is optional. */ }
  const localized = value => value[lang] || value.zh;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function name() {
    const first = pages[0].items.find(item => item.type === 'text');
    return first ? localized(first) : localized(pages[0].title);
  }
  function picture(item, portrait = false) {
    const figure = el('figure', portrait ? 'portrait' : 'figure');
    const link = el('a');
    link.href = './' + item.src;
    link.target = '_blank'; link.rel = 'noopener';
    link.setAttribute('aria-label', labels[lang].image + ': ' + item.filename);
    const img = el('img');
    img.src = './' + item.src;
    img.alt = portrait ? name() : item.filename.replace(/\.[^.]+$/, '');
    img.loading = portrait ? 'eager' : 'lazy';
    img.addEventListener('error', () => { figure.replaceChildren(el('p', 'image-error', labels[lang].missing + ': ' + item.filename)); });
    link.append(img); figure.append(link);
    return figure;
  }
  function textBlock(item, className = '') {
    const block = el('div', 'text-block ' + className);
    if (lang === 'en' && !item.translated) block.lang = 'zh-CN';
    // Use text nodes, never HTML from the workbook.
    const lines = localized(item).split(/\n+/).filter(Boolean);
    lines.forEach((line, i) => block.append(el(i === 0 ? 'h2' : 'p', '', line)));
    return block;
  }
  function contentRows(items) {
    const list = el('div', 'entries');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = el('article', 'entry');
      // Adjacent text and image cells share a row; source order is preserved.
      if (items[i + 1] && item.type !== items[i + 1].type) {
        row.classList.add('paired');
        [item, items[++i]].forEach(x => row.append(x.type === 'image' ? picture(x) : textBlock(x)));
      } else row.append(item.type === 'image' ? picture(item) : textBlock(item));
      list.append(row);
    }
    return list;
  }
  function render(focus = false) {
    const id = location.hash.slice(1);
    const page = pages.find(p => p.id === id) || pages[0];
    if (id !== page.id) history.replaceState(null, '', '#' + page.id);
    const index = pages.indexOf(page);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = `${localized(page.title)} · ${name()}`;
    document.querySelector('meta[name="description"]').content = `${name()} · ${labels[lang].site}`;
    document.querySelector('#brand-name').textContent = name();
    document.querySelector('#brand').href = '#' + pages[0].id;
    document.querySelector('#footer-name').textContent = name();
    document.querySelector('#footer-label').textContent = labels[lang].site;
    document.querySelector('#nav-label').textContent = labels[lang].index;
    document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    const nav = document.querySelector('#navigation');
    nav.setAttribute('aria-label', labels[lang].index);
    nav.replaceChildren(...pages.map((p, i) => {
      const a = el('a', p === page ? 'active' : '');
      a.href = '#' + p.id;
      a.append(el('span', 'nav-number', String(i + 1).padStart(2, '0')), el('span', '', localized(p.title)));
      if (p === page) a.setAttribute('aria-current', 'page');
      return a;
    }));
    main.replaceChildren();
    main.className = index === 0 ? 'home' : 'detail';
    const intro = el('div', 'page-heading');
    intro.append(el('span', 'eyebrow', `${String(index + 1).padStart(2, '0')} / ${labels[lang].site}`));
    if (index === 0) {
      const title = page.items.find(x => x.type === 'text');
      const photo = page.items.find(x => x.type === 'image');
      const hero = el('section', 'hero' + (photo ? '' : ' no-image'));
      const copy = el('div', 'hero-copy');
      const heading = el('h1');
      const parts = lang === 'zh' ? name().match(/^(.+?)[（(]([^）)]+)[）)]$/) : null;
      if (parts) heading.append(el('span', '', parts[1]), el('span', 'english-name', parts[2]));
      else heading.textContent = name();
      copy.append(intro, heading, el('p', 'profile-label', localized(page.title)));
      hero.append(copy);
      if (photo) hero.append(picture(photo, true));
      main.append(hero);
      const rest = page.items.filter(x => x !== title && x !== photo);
      if (lang === 'en' && page.items.some(x => x.type === 'text' && !x.translated)) main.append(el('p', 'translation-note', labels.en.fallback));
      if (rest.length) main.append(contentRows(rest));
      const explore = el('div', 'explore');
      pages.slice(1).forEach((p, i) => {
        const a = el('a'); a.href = '#' + p.id;
        a.append(el('span', 'small-number', String(i + 2).padStart(2, '0')), el('span', '', localized(p.title)), el('span', 'arrow', '↗'));
        explore.append(a);
      });
      main.append(explore);
    } else {
      intro.append(el('h1', '', localized(page.title)));
      main.append(intro);
      if (lang === 'en' && page.items.some(x => x.type === 'text' && !x.translated)) main.append(el('p', 'translation-note', labels.en.fallback));
      if (page.items.length) main.append(contentRows(page.items));
      else main.append(el('p', 'empty', labels[lang].empty));
      const back = el('a', 'back', '← ' + labels[lang].back); back.href = '#' + pages[0].id;
      main.append(back);
    }
    if (focus) { main.focus({preventScroll: true}); window.scrollTo({top: 0, behavior: 'instant'}); }
  }
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
    lang = button.dataset.lang;
    try { localStorage.setItem('site-language', lang); } catch (_) {}
    render();
  }));
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault(); main.focus();
  });
  window.addEventListener('hashchange', () => render(true));
  render();
})();
