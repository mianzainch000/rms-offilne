# ENV & Deployment Cheat Sheet (License System)

Yeh file sirf reference ke liye hai — git par push karna safe hai, isme
koi asal password/secret nahi hai, sirf placeholders aur instructions hain.

## Kul 4 env files hain

| #   | File                                                                | Variable           | Kya dalna hai                                                                                  |
| --- | ------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | `app/.env.local`                                                    | `CLOUD_BACKUP_URI` | **Customer** ki apni Atlas connection string (unke backup ke liye)                             |
| 2   | `app/.env.local`                                                    | `LICENSE_API_URL`  | Vercel se mila hua URL, e.g. `https://your-project.vercel.app`                                 |
| 3   | `app/.env.admin`                                                    | `LICENSE_DB_URI`   | **Aapki apni (owner ki)** Atlas connection string — kabhi customer ki nahi, kabhi nahi badalti |
| 4   | `license-api` (Vercel Dashboard → Settings → Environment Variables) | `LICENSE_DB_URI`   | Wahi value jo `app/.env.admin` mein hai (match honi chahiye)                                   |

`app/.env.admin.example` aur `license-api/.env.example` — dono sirf
placeholder templates hain, inme kabhi asal value na dalein.

## Deploy karne ke steps (Vercel)

1. `license-api` folder GitHub par (private repo) push karein
2. Vercel → "Add New Project" → wahi repo import karein
3. Environment Variables mein sirf yeh ek add karein: `LICENSE_DB_URI`
   (value = aapki apni Atlas string)
4. Deploy karein, milne wala URL copy karein
5. Wo URL `app/.env.local` ke `LICENSE_API_URL` mein daal dein

## Naya customer onboard karte waqt (checklist)

- [ ] `app/.env.local` → `CLOUD_BACKUP_URI` = customer ki apni Atlas string
- [ ] `app/.env.local` → `LICENSE_API_URL` = same rahega (Vercel URL, kabhi nahi badalta)
- [ ] `SECRET_KEY` → naya random generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `OWNER_EMAIL` / `OWNER_PASS` → customer ka apna Gmail app password (ya blank)
- [ ] `app/.env.admin` → kuch change nahi karna, hamesha same rehta hai
- [ ] `npm run dist` chalayein
- [ ] Build hone ke baad `app/.env.local` ko wapas apni dev/testing values par reset kar dein

## Deactivate karna ho to

1. `app/.env.admin` mein aapki apni `LICENSE_DB_URI` already set honi chahiye
2. `npm run license-admin` chalayein (ya `owner-tools-KEEP-PRIVATE/manage-license.js`)
3. Customer ka `computerId` dhoondh kar deactivate karein
4. Customer ki app agli baar internet check karte hi lock ho jayegi
