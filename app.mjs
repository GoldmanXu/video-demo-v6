function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createVideoMarkup(video) {
  return `
    <figure class="demo-video-card">
      <figcaption class="demo-video-label">${escapeHtml(video.label)}</figcaption>
      <video class="demo-video" controls muted playsinline preload="metadata">
        <source src="${escapeHtml(video.src)}" type="video/mp4">
      </video>
    </figure>
  `;
}

export function createSampleCardMarkup(item) {
  return `
    <article class="demo-card" data-row-id="${escapeHtml(item.rowId)}">
      <div class="demo-card-head">
        <p class="demo-meta">${escapeHtml(item.rowId)}</p>
        <button class="demo-row-toggle" type="button">Play row</button>
      </div>
      <p class="demo-prompt">${escapeHtml(item.prompt)}</p>
      <div class="demo-video-grid">
        ${item.videos.map(createVideoMarkup).join('')}
      </div>
    </article>
  `;
}

function createDatasetJumpMarkup(dataset) {
  return `<a class="section-jump" href="#dataset-${escapeHtml(dataset.id)}">${escapeHtml(dataset.title)}</a>`;
}

export function createDatasetSectionMarkup(dataset) {
  return `
    <section class="dataset-section" id="dataset-${escapeHtml(dataset.id)}">
      <header class="dataset-header">
        <div>
          <p class="dataset-kicker">Dataset</p>
          <h2>${escapeHtml(dataset.title)}</h2>
        </div>
        <p class="dataset-summary">${escapeHtml(dataset.description)}</p>
      </header>
      <div class="dataset-list">
        ${dataset.items.map(createSampleCardMarkup).join('')}
      </div>
    </section>
  `;
}

export function toggleRowPlayback(videos) {
  const playableVideos = videos.filter(Boolean);
  const shouldPlay = playableVideos.every((video) => video.paused);

  if (shouldPlay) {
    playableVideos.forEach((video) => {
      video.currentTime = 0;
    });

    return Promise.all(playableVideos.map((video) => video.play())).then(() => 'playing');
  }

  playableVideos.forEach((video) => {
    video.pause();
  });
  return Promise.resolve('paused');
}

function renderPageMarkup(demoData) {
  return demoData.datasets.map(createDatasetSectionMarkup).join('');
}

function renderJumpMarkup(demoData) {
  return demoData.datasets.map(createDatasetJumpMarkup).join('');
}

function wireRowControls(root) {
  root.querySelectorAll('.demo-card').forEach((card) => {
    const button = card.querySelector('.demo-row-toggle');
    const videos = Array.from(card.querySelectorAll('video'));

    button.addEventListener('click', async () => {
      const state = await toggleRowPlayback(videos);
      button.textContent = state === 'playing' ? 'Pause row' : 'Play row';
    });

    videos.forEach((video) => {
      video.addEventListener('ended', () => {
        button.textContent = 'Play row';
      });
      video.addEventListener('pause', () => {
        if (videos.every((item) => item.paused)) {
          button.textContent = 'Play row';
        }
      });
    });
  });
}

function showLoadError(message) {
  const statusRoot = document.querySelector('[data-status-root]');
  if (statusRoot) {
    statusRoot.textContent = message;
    statusRoot.hidden = false;
  }
}

export async function initDemoPage() {
  const navRoot = document.querySelector('[data-nav-root]');
  const demoRoot = document.querySelector('[data-demo-root]');

  try {
    const response = await fetch('./data/demo-data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const demoData = await response.json();
    navRoot.innerHTML = renderJumpMarkup(demoData);
    demoRoot.innerHTML = renderPageMarkup(demoData);
    wireRowControls(demoRoot);
  } catch (error) {
    showLoadError(`Failed to load demo data: ${error.message}`);
  }
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initDemoPage();
  });
}
