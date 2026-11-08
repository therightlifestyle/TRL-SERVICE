const SAFE_CHANNELS = new Set(['WhatsApp Business', 'Phone calls', 'Website form', 'Email', 'Walk-in / referral']);

export function hasSensitiveText(text = '') {
  const value = String(text || '');
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)
    || /(?:\+?\d[\d\s().-]{8,}\d)/.test(value)
    || /\b(?:patient name|patient phone|medical record|date of birth|diagnos\w*|treatment\w*|symptom\w*|prescription\w*)\b/i.test(value);
}

export function makeWorkflow(data = {}) {
  const channels = Array.isArray(data.channels) ? data.channels.filter((channel) => SAFE_CHANNELS.has(channel)) : [];
  const gap = String(data.gap || 'Other / not sure');
  const owner = String(data.owner || '').trim().slice(0, 60) || 'a named clinic team member';
  const capture = channels.length ? channels.join(', ') : 'the channels the clinic currently uses';
  const followUp = gap === 'Missed follow-up' ? 'Agree a follow-up date and show overdue items clearly.'
    : gap === 'Unclear ownership' ? 'Name one owner for each open enquiry, with a clear cover rule.'
      : gap === 'Requests are hard to find' ? 'Use one enquiry log and retain the original channel and received date.'
        : gap === 'No simple monthly view' ? 'Review open enquiries, next actions and closed outcomes in a monthly summary.'
          : 'Record the next action and the person responsible for it.';
  const stages = [
    { title: 'Capture the request', body: `Record each new enquiry from ${capture} in one agreed place. Keep the channel and date visible; collect only information the clinic actually needs.` },
    { title: 'Assign an owner', body: `Assign each open item to ${owner}. Staff—not the software—confirm appointments and handle clinical questions.` },
    { title: 'Set the next action', body: followUp },
    { title: 'Review and improve', body: 'Review the process with clinic staff, agree what is still slipping, and adjust only the modules included in the written scope.' }
  ];
  const modules = ['Enquiry capture and organisation', 'Lead tracking and qualification', 'Appointment request management', 'Follow-up processes', 'Documentation and staff training'];
  if (channels.includes('Website form')) modules.splice(1, 0, 'Website enquiry workflow');
  if (channels.includes('WhatsApp Business')) modules.splice(1, 0, 'WhatsApp communication workflow');
  const uniqueModules = [...new Set(modules)];
  const current = String(data.current || '').trim().slice(0, 400);
  const markdown = `# Example enquiry workflow\n\nDEMONSTRATION — FICTIONAL DATA — NOT A CLIENT RESULT\n\n**Workflow gap selected:** ${gap}\n**Generic context entered:** ${current || 'Not provided'}\n\n${stages.map((stage, i) => `${i + 1}. **${stage.title}** — ${stage.body}`).join('\n')}\n\n## Modules to assess\n${uniqueModules.map((module) => `- ${module}`).join('\n')}\n\n## Boundaries\n- Clinic staff confirm appointments and handle every clinical question.\n- Do not place patient names, contact details, health information, or clinical notes in this demo.\n- This is a browser-only illustration. It is not an assessment, a deployed clinic workflow, or a promise of outcomes.\n- TRL’s active offer is scoped in writing for dental clinics in Islamabad and Rawalpindi.\n`;
  return { stages, modules: uniqueModules, markdown, gap, current };
}
