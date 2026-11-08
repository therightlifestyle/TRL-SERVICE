import test from 'node:test';
import assert from 'node:assert/strict';
import { hasSensitiveText, makeWorkflow } from '../workflow-engine.mjs';

test('builds a four-stage illustration without claims of real results', () => {
  const result = makeWorkflow({
    gap: 'Missed follow-up',
    channels: ['WhatsApp Business', 'Website form'],
    owner: 'front-desk staff',
    current: 'Messages arrive in two channels and follow-up is hard to see.'
  });
  assert.equal(result.stages.length, 4);
  assert.match(result.stages[0].body, /WhatsApp Business, Website form/);
  assert.match(result.stages[1].body, /front-desk staff/);
  assert.match(result.stages[2].body, /follow-up date/);
  assert.ok(result.modules.includes('Website enquiry workflow'));
  assert.ok(result.modules.includes('WhatsApp communication workflow'));
  assert.match(result.markdown, /DEMONSTRATION — FICTIONAL DATA — NOT A CLIENT RESULT/);
  assert.match(result.markdown, /Do not place patient names/);
  assert.match(result.markdown, /Messages arrive in two channels/);
  assert.doesNotMatch(result.markdown, /PKR\s?\d/);
});

test('uses a safe generic owner and handles unknown gap values', () => {
  const result = makeWorkflow({ gap: 'Other / not sure', channels: [], owner: '' });
  assert.match(result.stages[1].body, /named clinic team member/);
  assert.match(result.stages[2].body, /next action/);
  assert.match(result.stages[0].body, /channels the clinic currently uses/);
});

test('ignores unknown channels and caps the user context', () => {
  const result = makeWorkflow({
    gap: 'Requests are hard to find',
    channels: ['WhatsApp Business', 'Unapproved channel'],
    owner: 'front-desk',
    current: 'x'.repeat(800)
  });
  assert.doesNotMatch(result.stages[0].body, /Unapproved channel/);
  assert.equal(result.current.length, 400);
});

test('sensitive text check catches common contact and health details', () => {
  assert.equal(hasSensitiveText('Message me at rashid@example.com'), true);
  assert.equal(hasSensitiveText('Clinic phone +92 300 1234567'), true);
  assert.equal(hasSensitiveText('Patient diagnosis is in the note'), true);
  assert.equal(hasSensitiveText('Requests arrive from the website form and WhatsApp.'), false);
});
