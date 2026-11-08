import { hasSensitiveText, makeWorkflow } from './workflow-engine.mjs';

const form = document.querySelector('#workflow-form');
const output = document.querySelector('#workflow-output');
const status = document.querySelector('#builder-status');
const copyButton = document.querySelector('#copy-map');
const downloadButton = document.querySelector('#download-map');
let currentMarkdown = '';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderResult(result) {
  const context = result.current ? `<br><b>Generic context:</b> ${escapeHtml(result.current)}` : '';
  output.innerHTML = `<div class="result-head"><span class="result-badge">Fictional workflow</span><h2>Your example system map</h2><p>Generated in this browser from the choices above. This is a discussion aid, not a client result.</p><p><b>Selected gap:</b> ${escapeHtml(result.gap)}${context}</p></div><ol class="result-steps">${result.stages.map((stage, index) => `<li><span class="module-no">0${index + 1}</span><div><b>${escapeHtml(stage.title)}</b>${escapeHtml(stage.body)}</div></li>`).join('')}</ol><h3 class="mini-heading">Modules to assess—not a fixed scope</h3><div class="pill-row">${result.modules.map((module) => `<span class="pill">${escapeHtml(module)}</span>`).join('')}</div><p class="disclaimer">Clinical questions stay with qualified clinic staff. No patient data has been collected or sent.</p>`;
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const channels = [...form.querySelectorAll('input[name="channels"]:checked')].map((item) => item.value);
  if (hasSensitiveText(data.current || '') || hasSensitiveText(data.owner || '')) {
    status.textContent = 'Please remove contact details, patient identifiers and health information. Use generic workflow descriptions only.';
    status.className = 'form-message error';
    return;
  }
  const result = makeWorkflow({ ...data, channels });
  currentMarkdown = result.markdown;
  copyButton.disabled = false;
  downloadButton.disabled = false;
  renderResult(result);
  status.textContent = 'Example map ready. It stays in this browser tab and is not sent or stored.';
  status.className = 'form-message';
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelector('#sample-flow')?.addEventListener('click', () => {
  document.querySelector('#flow-current').value = 'Appointment requests arrive through WhatsApp and the website. Staff reply when available; follow-up is not always visible.';
  document.querySelector('#flow-owner').value = 'front-desk staff';
  document.querySelector('#gap').value = 'Missed follow-up';
  document.querySelector('#channel-whatsapp').checked = true;
  document.querySelector('#channel-website').checked = true;
  status.textContent = 'Fictional sample loaded. Click Build my example map.';
  status.className = 'form-message';
});

copyButton?.addEventListener('click', async () => {
  if (!currentMarkdown) return;
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    status.textContent = 'Example map copied.';
  } catch {
    status.textContent = 'Copy was blocked by the browser. Use Download Markdown instead.';
  }
});

downloadButton?.addEventListener('click', () => {
  if (!currentMarkdown) return;
  const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trl-fictional-workflow-demonstration.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
});
