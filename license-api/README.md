# License Check API

Yeh chhota si API aapki (owner ki) Atlas database credentials ko customer
ki app se door rakhti hai. Customer ki app sirf itna janti hai: "is URL ko
call karo, jawab milega revoked true ya false."

Do tareeqon se deploy kar sakte hain — **koi ek** chunein, dono ki zarurat nahi.

## Option A: Vercel (serverless, sabse asaan)

1. Yeh poora `license-api` folder GitHub par ek naye (private) repo mein push karein
2. https://vercel.com par jayein → "Add New Project" → apni repo select karein
3. Project settings mein Environment Variable add karein:
   - `LICENSE_DB_URI` = aapki apni Atlas connection string
4. Deploy karein — Vercel khud `api/check-license.js` aur `api/health.js` ko serverless functions ki tarah chala dega
5. Milne wala URL (e.g. `https://your-project.vercel.app`) copy karein

Test: `https://your-project.vercel.app/api/health` → `{"ok":true}` ana chahiye

## Option B: Render (traditional server, hamesha "on")

1. Yeh folder GitHub par push karein
2. https://render.com par "New Web Service" banayein, apni repo select karein
3. Build command: `npm install`  |  Start command: `npm start`
4. Environment tab mein `LICENSE_DB_URI` add karein
5. Deploy hone ke baad milne wala URL copy karein

Test: `https://your-app.onrender.com/api/health` → `{"ok":true}` ana chahiye

---

Dono options mein, jo bhi URL mile, wo har customer ke `app/.env.local`
mein `LICENSE_API_URL` mein daal dein (path `/api/check-license` khud
add ho jata hai code mein, sirf base URL dein, e.g.
`LICENSE_API_URL=https://your-project.vercel.app`).
