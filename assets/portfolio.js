function panoptoVideo(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const id = url.searchParams.get('id');
    const hasVideoId = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id ?? '');
    const isVideoPage = /^\/Panopto\/Pages\/(Viewer|Embed)\.aspx$/i.test(url.pathname);

    if (url.origin === 'https://northeastern.hosted.panopto.com' && isVideoPage && hasVideoId) {
      return {
        viewer: new URL(`/Panopto/Pages/Viewer.aspx?id=${id}`, url.origin),
        embed: new URL(`/Panopto/Pages/Embed.aspx?id=${id}&autoplay=false&showtitle=false`, url.origin),
      };
    }
  } catch {
    // Until there is a valid share link, keep the recording's written script available.
  }
  return null;
}

const recordings = document.querySelectorAll('[data-panopto]');

for (const assignment of recordings) {
  const video = panoptoVideo(assignment.dataset.panopto);
  if (!video) continue;

  const toggle = assignment.querySelector('[data-video-toggle]');
  const link = assignment.querySelector('[data-video-link]');
  const player = assignment.querySelector('[data-video-player]');
  assignment.querySelector('.video-status').hidden = true;
  link.href = video.viewer.href;
  link.hidden = false;
  toggle.hidden = false;

  toggle.addEventListener('click', () => {
    const opening = player.hidden;
    toggle.setAttribute('aria-expanded', String(opening));
    player.hidden = !opening;

    if (opening) {
      const frame = document.createElement('iframe');
      frame.src = video.embed.href;
      frame.allowFullscreen = true;
      player.append(frame);
    } else {
      player.replaceChildren();
    }
    updateVideoControls(assignment);
  });
}

function updateVideoControls(assignment) {
  const toggle = assignment.querySelector('[data-video-toggle]');
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  const labels = document.documentElement.lang === 'zh-CN'
    ? { play: '播放视频', hide: '收起视频' }
    : { play: 'Play video', hide: 'Hide video' };
  toggle.textContent = expanded ? labels.hide : labels.play;

  const frame = assignment.querySelector('iframe');
  if (frame) frame.title = assignment.querySelector('h3').textContent;
}

const languageSwitch = document.getElementById('language-switch');
const languagePreference = 'tianyu-portfolio-language';
const translatedText = Array.from(document.querySelectorAll('[data-zh]'), element => ({
  element,
  english: element.textContent,
  chinese: element.dataset.zh,
}));
const translatedAttributes = ['alt', 'aria-label', 'content', 'href', 'hreflang'].flatMap(attribute =>
  Array.from(document.querySelectorAll(`[data-zh-${attribute}]`), element => ({
    element,
    attribute,
    english: element.getAttribute(attribute),
    chinese: element.getAttribute(`data-zh-${attribute}`),
  })),
);

function showLanguage(language) {
  const isChinese = language === 'zh-CN';
  document.documentElement.lang = language;
  for (const { element, english, chinese } of translatedText) {
    element.textContent = isChinese ? chinese : english;
  }
  for (const { element, attribute, english, chinese } of translatedAttributes) {
    element.setAttribute(attribute, isChinese ? chinese : english);
  }
  for (const assignment of recordings) updateVideoControls(assignment);

  languageSwitch.lang = isChinese ? 'en' : 'zh-CN';
  languageSwitch.textContent = isChinese ? 'English' : '简体中文';
}

let savedLanguage = 'en';
try {
  if (localStorage.getItem(languagePreference) === 'zh-CN') savedLanguage = 'zh-CN';
} catch {
  // File URLs and privacy settings can block storage.
}

showLanguage(savedLanguage);
languageSwitch.hidden = false;
languageSwitch.addEventListener('click', () => {
  const nextLanguage = languageSwitch.lang;
  showLanguage(nextLanguage);
  languageSwitch.scrollIntoView({ block: 'nearest' });

  try {
    localStorage.setItem(languagePreference, nextLanguage);
  } catch {
    // Language switching still works for the current page.
  }
});
