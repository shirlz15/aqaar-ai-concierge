# AQAAR Concierge Backend v1

Backend-only Aqaar AI Concierge package.

Data sources:

- `../KB-Acq`
- `../Intelligence-Layer-v2`

The backend does not modify either package. It loads KB and intelligence data at runtime and returns `unknown` for values not published in those packages.

APIs:

- `POST /chat`
- `POST /recommend`
- `POST /qualify`
- `POST /lead-score`
- `GET|POST /dashboard`
- `GET|POST /search`

Run:

```powershell
npm test
npm run validate
npm start
```
