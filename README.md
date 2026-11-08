# TRL — The Right Lifestyle

**Official public website and reference implementation** for The Right Lifestyle (TRL), aligned to the current O-020 offer. This repository contains a complete, responsive static website and a browser-only fictional workflow demonstration.

- **Live site:** <https://therightlifestyle.github.io/TRL-SERVICE/>
- **GitHub repository:** <https://github.com/therightlifestyle/TRL-SERVICE>
- **Delivery model:** static HTML, CSS and JavaScript; publish directly with GitHub Pages.

## Project principles

- One current offer: **TRL Business Growth & Enquiry System (O-020)** for dental clinics in Islamabad and Rawalpindi.
- No fabricated client outcomes, testimonials, case studies, public prices, or performance promises.
- Administrative workflow support only. Clinic staff retain all clinical responsibility.
- No AI API, backend, analytics, tracking pixels, third-party runtime scripts, or server-side lead storage.
- The demo is rules-based, runs locally in the visitor's browser, and uses explicitly fictional data.
- Contact links prepare an email or WhatsApp message; the visitor reviews it and chooses whether to send it in that external app.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | TRL positioning and offer overview |
| `system.html` | O-020 delivery sequence, modules, exclusions and boundaries |
| `demo.html` | Interactive browser-only workflow map builder |
| `about.html` | Company and delivery principles, without invented proof |
| `contact.html` | WhatsApp and email handoff |
| `privacy.html` | Website and demo data practices |
| `terms.html` | Website and service boundaries |
| `404.html` | Friendly not-found page |

## Run locally

No install or build step is needed to preview the site. From the repository root, run one of:

```bash
python -m http.server 8080
```

On some Windows installations, use:

```bash
py -m http.server 8080
```

Then open <http://localhost:8080/>. Keep the repository root as the server root so `index.html` and `assets/` resolve correctly.

## Git Bash: publish this bundle

The intended repository is named `TRL-SERVICE`. This is a GitHub Pages **project site**, so the public address includes the repository path: `https://therightlifestyle.github.io/TRL-SERVICE/`. The ZIP is arranged so its **contents** go directly into the repository root, with `index.html` beside this README.

1. Create a public repository under the `therightlifestyle` account named exactly `TRL-SERVICE`. For GitHub Free, the Pages repository must be public. Leave the initial README, `.gitignore`, and license unchecked because this bundle contains them.
2. Clone the empty repository from Git Bash:

   ```bash
   git clone https://github.com/therightlifestyle/TRL-SERVICE.git
   cd TRL-SERVICE
   ```

3. Extract/copy the contents of this ZIP into that folder. Do not place them inside an extra `trl-final-site/` subfolder. `index.html` must be at the repository root.
4. Commit and push the site:

   ```bash
   git switch -c main
   git add .
   git commit -m "Launch TRL public website"
   git push -u origin main
   ```

5. On GitHub, open **Settings → Pages**. Select **Deploy from a branch**, choose `main` and `/(root)`, then save. GitHub Pages will publish the site at <https://therightlifestyle.github.io/TRL-SERVICE/>.

The repository page (`github.com/...`) displays the source and this README. The website is the separate `github.io/TRL-SERVICE/` address above. This deployment is separate from the existing `TheRightLifestyle` repository and will not overwrite it.

## Checks

Node.js 20 or later is needed only for the lightweight tests; there are no npm dependencies to install.

```bash
npm test
npm run check:js
```

The workflow-engine tests cover the fictional output, selected channels and gaps, input limits, and common sensitive-text warnings. The static site itself does not need Node.js to run.

## Accessibility and responsive behaviour

The site includes responsive layouts, a skip link, semantic page structure, labeled form controls, keyboard-operable controls, live status messaging for the demo, and reduced-motion handling. This is an implementation checklist—not a claim of formal WCAG certification; review with assistive technology before making a compliance claim.

## Privacy and healthcare boundary

The workflow demo is an illustration, not a clinic system, assessment, or client result. It does not send or persist entries. Its text checks are best-effort warnings, **not a security or privacy guarantee**. Never enter patient names, contact details, health information, clinical notes, or records. Clinic staff handle appointment confirmation and every clinical question.

The contact page does not automatically transmit or store enquiries. A visitor must choose WhatsApp or email and send the prepared message from that service. Those services process the message under their own terms and privacy policies.

## Site maintenance

- The canonical links, Open Graph URLs, `sitemap.xml`, and `robots.txt` are set for `https://therightlifestyle.github.io/TRL-SERVICE/`.
- Keep `index.html` at the publishing root and preserve the relative `assets/` paths.
- Update the sitemap and canonical/social metadata if the domain or publication path changes.
- Review the privacy notice before adding any analytics, hosted forms, CRM, AI, or other external service.
- No deployment, live edits, or third-party service integrations are performed by this static bundle itself.
