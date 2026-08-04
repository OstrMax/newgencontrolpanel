# Control Panel

Static single-page admin console (Sangoma "SCP - Phase One").

Reuses the NetOps design system (spacing, typography, iconography, colors, dark mode) with content from the SCP Figma designs.

## Pages
- Dashboard
- Sangoma UC: Chat, Meet, SMS, Voice
- CPaaS
- Account Settings: Billing, Company Profile, Inventory & Usage, Security (+ change password), Users (app access)
- Productivity Apps, Analytics

## Run locally
```
python3 -m http.server 5510
```
Then open http://localhost:5510

## Deploy (GitHub Pages)
Push to a GitHub repo and enable Pages → Deploy from branch → `main` / root.
