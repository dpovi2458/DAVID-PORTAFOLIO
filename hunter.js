const form = document.getElementById('hunter-form');
const preview = document.getElementById('preview-url');
const openBtn = document.getElementById('open-link');
const copyBtn = document.getElementById('copy-link');
const saveBtn = document.getElementById('save-search');
const status = document.getElementById('status');
const savedList = document.getElementById('saved-list');

const STORAGE_KEY = 'hunter.savedSearches.v1';
let latestUrl = '';

const friendlyLabel = (value) => value && value.trim().length ? value.trim() : '';

const buildKeywords = (data) => {
  const parts = [
    friendlyLabel(data.get('role')),
    friendlyLabel(data.get('workplace')),
    friendlyLabel(data.get('level')),
    friendlyLabel(data.get('jobtype')),
    friendlyLabel(data.get('extras')),
    data.get('company') ? `"${friendlyLabel(data.get('company'))}"` : ''
  ].filter(Boolean);

  return parts.join(' ');
};

const buildUrl = (data) => {
  const keywords = buildKeywords(data);
  const location = friendlyLabel(data.get('location'));

  if (!keywords && !location) {
    return '';
  }

  const params = new URLSearchParams();
  if (keywords) {
    params.set('keywords', keywords);
  }
  if (location) {
    params.set('location', location);
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
};

const updatePreview = () => {
  const data = new FormData(form);
  const url = buildUrl(data);
  latestUrl = url;

  if (!url) {
    preview.textContent = 'Completa el formulario para generar la busqueda.';
    openBtn.disabled = true;
    copyBtn.disabled = true;
    status.textContent = '';
    return;
  }

  preview.textContent = url;
  openBtn.disabled = false;
  copyBtn.disabled = false;
  status.textContent = '';
};

const loadSaved = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : [];
  savedList.innerHTML = '';

  if (!saved.length) {
    const empty = document.createElement('div');
    empty.className = 'saved-item';
    empty.innerHTML = '<h4>Aun no hay busquedas guardadas</h4><p>Usa el boton "Guardar busqueda" para crear tu primer acceso rapido.</p>';
    savedList.appendChild(empty);
    return;
  }

  saved.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'saved-item';

    const title = document.createElement('h4');
    title.textContent = item.label;

    const url = document.createElement('p');
    url.textContent = item.url;

    const actions = document.createElement('div');
    actions.className = 'saved-actions';

    const open = document.createElement('button');
    open.className = 'primary';
    open.type = 'button';
    open.textContent = 'Abrir';
    open.addEventListener('click', () => window.open(item.url, '_blank', 'noopener'));

    const copy = document.createElement('button');
    copy.className = 'ghost';
    copy.type = 'button';
    copy.textContent = 'Copiar';
  copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.url);
        status.textContent = 'URL copiada desde guardados.';
      } catch (error) {
        status.textContent = 'No se pudo copiar. Copia manualmente la URL.';
      }
    });

    const remove = document.createElement('button');
    remove.className = 'ghost';
    remove.type = 'button';
    remove.textContent = 'Eliminar';
    remove.addEventListener('click', () => {
      const updated = saved.filter((_, i) => i !== index);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      loadSaved();
    });

    actions.append(open, copy, remove);
    card.append(title, url, actions);
    savedList.appendChild(card);
  });
};

form.addEventListener('input', updatePreview);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  updatePreview();
  if (latestUrl) {
    window.open(latestUrl, '_blank', 'noopener');
  }
});

openBtn.addEventListener('click', () => {
  if (latestUrl) {
    window.open(latestUrl, '_blank', 'noopener');
  }
});

copyBtn.addEventListener('click', async () => {
  if (!latestUrl) return;
  try {
    await navigator.clipboard.writeText(latestUrl);
    status.textContent = 'URL copiada al portapapeles.';
  } catch (error) {
    status.textContent = 'No se pudo copiar. Copia manualmente la URL.';
  }
});

saveBtn.addEventListener('click', () => {
  const data = new FormData(form);
  const url = buildUrl(data);
  if (!url) {
    status.textContent = 'Completa el formulario antes de guardar.';
    return;
  }

  const label = data.get('role') ? data.get('role').toString().trim() : 'Busqueda guardada';
  const raw = localStorage.getItem(STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) : [];
  const next = [{
    label,
    url,
    createdAt: new Date().toISOString()
  }, ...saved].slice(0, 8);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  status.textContent = 'Busqueda guardada.';
  loadSaved();
});

updatePreview();
loadSaved();
