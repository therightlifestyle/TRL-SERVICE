/*
 * Stand-in for https://challenges.cloudflare.com/turnstile/v0/api.js, served
 * by tests/e2e/contact-form.spec.ts through Playwright's request interception.
 *
 * It reproduces the one thing the suite depends on: the real widget injects a
 * HIDDEN input named `cf-turnstile-response` into the surrounding form and
 * fills it with a token. Everything else about the real widget (the iframe,
 * the risk engine, the visual badge) is irrelevant to what these tests assert.
 *
 * The token value is arbitrary on purpose. The e2e environment's
 * TURNSTILE_SECRET is Cloudflare's published dummy key, whose siteverify
 * response does not depend on the token's contents, so the server-side check
 * still runs against the real endpoint and still passes — the pipeline under
 * test stays the real one.
 *
 * Injection must not depend on when this script happens to execute relative to
 * parsing: it is served through an intercepted `async` request, so it can land
 * before or after DOMContentLoaded. It therefore injects immediately when it
 * can, and otherwise keeps retrying for a few seconds.
 */
(function () {
  var TOKEN = 'e2e-stub-turnstile-token';
  var deadline = Date.now() + 10_000;
  var timer = null;

  function inject() {
    var rendered = 0;

    document.querySelectorAll('.cf-turnstile').forEach(function (element) {
      var form = element.closest('form');
      if (form === null) return;
      if (form.querySelector('input[name="cf-turnstile-response"]') !== null) {
        rendered += 1;
        return;
      }

      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      input.value = TOKEN;
      form.appendChild(input);

      element.setAttribute('data-e2e-stub', 'rendered');
      rendered += 1;
    });

    return rendered;
  }

  function retry() {
    if (inject() > 0) {
      if (timer !== null) clearInterval(timer);
      return;
    }
    if (Date.now() > deadline && timer !== null) clearInterval(timer);
  }

  retry();
  timer = setInterval(retry, 50);
  document.addEventListener('DOMContentLoaded', retry);
  window.addEventListener('load', retry);
})();
