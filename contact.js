const form = document.querySelector('#contact-form');
const status = document.querySelector('#contact-status');
const sendWhatsApp = document.querySelector('#send-whatsapp');
const sendEmail = document.querySelector('#send-email');

function makeMessage(values) {
  return [
    'Assalam-o-Alaikum Rashid, I would like to discuss the TRL Business Growth & Enquiry System.',
    '',
    `Name: ${values.name}`,
    `Clinic: ${values.clinic || 'Not provided'}`,
    `Reply to: ${values.contact}`,
    `Timeline: ${values.timeline || 'No fixed date'}`,
    '',
    'Administrative workflow I would like to discuss:',
    values.workflow,
    '',
    'I understand the next step is a conversation and a written scope; no public price is shown.'
  ].join('\n');
}

function getValues() {
  if (!form.reportValidity()) return null;
  const values = Object.fromEntries(new FormData(form).entries());
  if (!values.consent) return null;
  if (/\bpatient name|patient phone|medical record|date of birth|diagnos|treatment|symptom|prescription\b/i.test(values.workflow)) {
    status.textContent = 'Please remove patient or health information and describe only the generic admin process.';
    status.className = 'form-message error';
    return null;
  }
  return values;
}

sendWhatsApp?.addEventListener('click', (event) => {
  event.preventDefault();
  const values = getValues();
  if (!values) return;
  const url = `https://wa.me/923190091457?text=${encodeURIComponent(makeMessage(values))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  status.textContent = 'WhatsApp opened with your draft. It is sent only if you press Send in WhatsApp.';
  status.className = 'form-message';
});

sendEmail?.addEventListener('click', (event) => {
  event.preventDefault();
  const values = getValues();
  if (!values) return;
  const subject = encodeURIComponent('TRL enquiry system — workflow discussion');
  const body = encodeURIComponent(makeMessage(values));
  window.location.href = `mailto:officialtrlservice@gmail.com?subject=${subject}&body=${body}`;
  status.textContent = 'Your email app should open with the draft. It is sent only if you press Send there.';
  status.className = 'form-message';
});
