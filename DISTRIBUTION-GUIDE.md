# NENO POS — .EXE Packaging + License Lock (Customer Distribution)

Yeh guide 2 alag cheezein cover karti hai:

1. **Mobile / Tablet** — yahan .exe ki zarurat hi nahi
2. **PC / Laptop (Main Server)** — yahan .exe banega, License Key se lock hoga

---

## 1) Mobile / Tablet — Koi Install Nahi Hoti

`.exe` sirf **Windows** ke liye hota hai — Android tablet ya iPhone/iPad par `.exe`
chalti hi nahi (yeh alag operating system hain). Isi liye in par kuch install
karne ki zarurat NAHI hai:

- Tablet/Mobile sirf **browser** (Chrome/Safari) khol kar Main Server ka LAN
  address open karta hai (misal `http://192.168.1.10:3000`) — jaisa pehle
  bataya tha.
- Chahen to **"Add to Home Screen"** kar ke ek icon bana lein — wo sirf shortcut
  hai, real install nahi.
- Koi source code, koi `.exe`, koi extra file tablet/mobile ko dene ki
  zarurat nahi.

**Customer sirf itna karega:** Tablet ko WiFi se connect kare → browser khole →
address daale → login kare. Bas.

---

## 2) PC / Laptop (Main Server) — `.exe` Installer + License Lock

Yahan hum poora Node.js/Next.js source code customer ko **nahi** de rahe —
uski jagah ek **compiled `.exe` installer** banega jo:

- Customer double-click karke install karta hai (jaisi normal Windows app)
- Andar se aap ka poora POS system + Local Database connection chalata hai
- Bina License Key ke **bilkul kaam nahi karega** — har naye PC par lock hai
- Ek baar activate hone ke baad, dobara IP/URL type karne ki zarurat nahi —
  Desktop/Start Menu shortcut se seedha khulta hai

### Kaise Kaam Karta Hai (Security)

```
Customer PC install karta hai
        |
App khulti hai -> "Computer ID" show karti hai (is PC ka unique ID)
        |
Customer yeh ID aapko WhatsApp karta hai
        |
Aap "owner-tools-KEEP-PRIVATE/KeyGenerator.html" file (sirf aap ke paas)
mein wahi ID daal kar License Key generate karte hain
        |
Customer ko sirf License Key bhejte hain (source code nahi)
        |
Customer key enter karta hai -> Verify hoti hai (offline, isi PC par)
        |
✅ Match ho to POS start ho jata hai
❌ Match na ho (ya kisi doosre PC par chalane ki koshish) to LOCK rehta hai
```

**Important:** yeh key **sirf usi Computer ID ke liye kaam karti hai** jis ke
liye bani thi. Agar koi customer apni key kisi doosre PC par use karne ki
koshish kare, ID match nahi hogi aur app nahi chalegi.

> ⚠️ `owner-tools-KEEP-PRIVATE/KeyGenerator.html` file sirf aap ke paas rahe —
> customer ko yeh file kabhi na dein, warna wo khud apni keys bana sakega.

### Files Jo Add/Update Hui Hain

```
app/
  electron-src/            -> ASAL, READABLE source code (yahan hi edit karein)
    main.js                -> Electron app ka control center (server start, license check, tray)
    license.js              -> HWID + Key verify logic (KeyGenerator.html jaisi hi) — SECRET_SALT yahan hai
    license-screen.html    -> Activation screen jo customer ko dikhti hai
    preload.js               -> Secure bridge (license screen <-> main app)
    icon.ico / tray-icon.png -> App icon (apna logo laga kar replace kar sakte hain)
  electron/                -> 🔒 GENERATED/OBFUSCATED output — isay direct edit MAT karein,
                               yeh har baar "npm run dist" par khud ban jata hai
  script/
    obfuscate-electron.js  -> electron-src ko unreadable bana kar electron/ mein daalta hai
  package.json              -> Electron + electron-builder + obfuscation + build config
owner-tools-KEEP-PRIVATE/
  KeyGenerator.html         -> Aap ka original license-key generator (private rakhein)
```

**Aap ki app ki design/functionality bilkul waisi hi hai** — sirf ek Electron
"wrapper", license-lock layer, aur code-obfuscation layer upar add hui hai.

> ⚠️ **Hamesha `electron-src/` folder mein hi code edit karein.** `electron/`
> folder generated hai — `npm run dist` chalate hi purana delete ho kar naya
> (obfuscated) ban jata hai. Agar `electron/` mein direct edit karenge, wo
> agli build mein overwrite ho jayega.

### Code Security — Kya Protect Hota Hai

1. **Next.js App ka poora code (`src/` folder)** — `.exe` mein sirf **compiled/minified
   production build** (`.next` folder) jati hai, raw `src/` source ship hi nahi hota.
   Next.js ko chalne ke liye raw source ki zarurat bhi nahi hoti.
2. **Electron files (`main.js`, `license.js` — jahan `SECRET_SALT` hai)** — build ke
   waqt automatically **obfuscate** ho kar unreadable ban jati hain (variable names
   scramble, strings encrypt, dead-code inject) — `npm run obfuscate` ise sambhalta hai.
3. **License Key lock (HWID)** — jo pehle bataya, wo apni jagah hai — is se independent.

**Honest baat:** koi bhi client-side/desktop app **100% unhackable** nahi hoti
(determined reverse-engineer parhne ki koshish kar sakta hai), lekin yeh 3
layers milkar isay **kaafi mushkil aur time-consuming** bana dete hain ke koi
casual user ya chhota competitor aapka code chura sake.

### 🐛 Bug Fix — Deactivate Code Kaam Nahi Kar Raha Tha

Wajah mil gayi: jab "DEL-XXXX-XXXX-XXXX" code paste hota tha, us mein se "D" aur
"E" letters (jo hex digits bhi hain) ghalti se number samajh liye jate the aur
poora code corrupt ho jata tha. **Fix kar diya gaya hai** — ab paste/type dono
tarah se sahi kaam karta hai.

### Deactivation — 2 Tareeqe Ab Mojood Hain

#### Tareeqa 1: Automatic Remote Deactivation (RECOMMENDED — customer ki madad ki zarurat nahi)

Yeh wahi cheez hai jo aap chahte the: **"customer paisy na de to mai khud us ki
app band kar doon, customer ko kuch karne ki zarurat na pare."**

**Kaam Kaise Karta Hai:**
- Har customer ki app har **5 minute** mein (agar internet ho) khud-ba-khud
  aap ke Atlas cluster (`CLOUD_BACKUP_URI` — wahi jo cloud backup ke liye hai)
  ke ek "licenses" collection ko check karti hai
- Agar wahan us Computer ID ka status **"revoked"** mile, app khud lock ho kar
  restart ho jati hai — **customer ko bilkul kuch nahi karna** — na code enter
  karna, na kuch. Bas internet on hona chahiye.

**Aap Ko Kya Karna Hai (Owner):**

`owner-tools-KEEP-PRIVATE` folder mein ek naya tool hai: **`manage-license.js`**

Ek dafa setup (terminal mein):
```bash
cd owner-tools-KEEP-PRIVATE
npm install
node manage-license.js
```

Interactive menu khulega:
```
1) Customer Deactivate Karein (⛔ non-payment / masla)
2) Customer Reactivate Karein (✅ payment mil gayi)
3) Sab Customers Ki List Dekhein
4) Exit
```

Option `1` select kar ke customer ki **Computer ID** paste karein — bas, ho
gaya. 5 minute ke andar us customer ki app khud band ho jayegi (jab bhi us ke
PC par internet ho).

Payment mil jaye to option `2` se dobara **Reactivate** kar dein — customer ki
app khud dobara chalne lag jayegi, kuch nahi karna paray ga.

> ⚠️ Yeh tool sirf pehli baar chalane par Atlas connection string maangega
> (wahi jo `.env.local` mein `CLOUD_BACKUP_URI` hai) — ya `CLOUD_BACKUP_URI`
> environment variable already set ho to seedha use kar lega.

#### Tareeqa 2: Manual/Local Deactivation Code (Backup Method — internet na ho tab)

Yeh purana tareeqa hai (`KeyGenerator.html` se DEL-code generate karna, PC ke
tray icon se enter karna) — abhi bhi kaam karta hai, un halaton ke liye jab
internet available na ho ya turant, physically PC ke saamne deactivate karna ho.

### Last Backup Time — Ab Screen Par Nazar Aata Hai (Design Fix)

Main Server ki apni window (jahan `.exe` khulti hai) ke **sab se upar** ek
patli si patti (banner) hamesha dikhti hai, misal:
```
✅ Last Backup: 07:00 PM
```

**Behtar banaya gaya hai:**
- Ab yeh **sirf tab** update hoti hai jab data **waqai Atlas tak pahunch jaye**
  (kamyab backup) — fail/attempt hone par purana time hi dikhta rehta hai,
  ghalat/confusing time nahi dikhega
- Banner ab dashboard ke content ko **cover/hide nahi karti** — page content
  khud niche push ho jata hai taake dono nazar aayen
- Check ab **har 5 minute** mein hoti hai (pehle 6 ghante tha) — taake internet
  on hote hi jald az jald data Atlas mein chala jaye

> Note: yeh banner sirf **Main Server ki apni window** mein dikhti hai (jahan
> `.exe` chal rahi hai). Waiter Tablet/Cashier PC jo sirf browser se LAN address
> khol rahe hain, unke screen par yeh banner nahi aayegi.

### Local Backup Bhi Ab Tray Se Ho Sakta Hai

System Tray → **"📦 Local Backup Abhi Karein"** — turant Local Database ka
backup le kar ek popup mein confirm kar deta hai "✅ Local Backup Mukammal!"
(sirf local, Atlas ki zarurat nahi is ke liye).



---

## 3) Cloud Backup (Safety Net) — Data Kabhi Zaya Nahi Hoga

App ab **local database** ko hi primary rakhti hai (offline, fast, reliable) —
lekin sath mein ek **automatic cloud backup** bhi hai jo har **6 ghante** mein
(agar internet available ho) data ko **MongoDB Atlas (free cloud)** par mirror
kar deta hai. Isay POS system ki zarurat nahi — sirf insurance hai.

### Setup (Ek Dafa, 5 Minute):

1. https://www.mongodb.com/cloud/atlas/register par free account banayen
2. Free **M0 Cluster** create karein
3. Database Access mein user/password banayen
4. Network Access mein "Allow Access from Anywhere" (`0.0.0.0/0`) add karein
5. "Connect" → "Drivers" se connection string copy karein
6. `.env.local` file mein `CLOUD_BACKUP_URI=` ke aage paste kar dein

### Zaroori: MongoDB Database Tools install karein

Yeh feature `mongodump`/`mongorestore` use karta hai — Main Server PC par
install honi chahiye (ek dafa):
👉 https://www.mongodb.com/try/download/database-tools

### Kaam Kaise Karta Hai

- App khulte hi ek dafa, phir **har 6 ghante** mein khud-ba-khud try karta hai
- Internet na ho to koi error nahi aata — POS normal chalta rehta hai, agli
  dafa dobara try hoga
- System Tray icon → **"Cloud Backup Status"** se pata chal jata hai last sync
  kab aur kaisi hui
- System Tray icon → **"Cloud Backup Abhi Karein"** se manually turant sync
  karwa sakte hain

### Agar Kabhi Laptop Crash / MongoDB Delete Ho Jaye

Atlas Dashboard se latest backup collections dekh kar `mongorestore` command se
naye laptop ki Local Database mein wapis daal sakte hain (chahiye to yeh step
bhi guide kar dete hain jab zarurat pare).

---

## 4) `.exe` Kaise Banayen (Build Steps)

⚠️ Windows `.exe` sirf **Windows PC** par (ya Windows build machine/CI par) ban
sakti hai — is chat/sandbox environment mein nahi (yeh Linux hai). Neeche steps
apne Windows development PC par follow karein:

1. **Node.js (LTS)** install karein → https://nodejs.org
2. Project folder (`app/`) mein terminal khol kar:
   ```bash
   npm install
   ```
3. `.env.local` check karein (MongoDB local URI already sahi hai).
4. **License salt confirm karein** — `electron-src/license.js` ke andar
   `SECRET_SALT` aur `owner-tools-KEEP-PRIVATE/KeyGenerator.html` ke andar
   `SECRET_SALT` **hubahu (exactly) same** hone chahiye. Filhal dono mein
   `INV-ZAIN-2026-SECRET-XK9P` set hai — agar isay change karein to DONO
   jagah karein.
5. Apna logo lagana ho to `electron-src/icon.ico` (app icon) aur
   `electron-src/tray-icon.png` (system tray icon) apni image se replace kar dein.
6. `.exe` installer banayein:
   ```bash
   npm run dist
   ```
   Yeh khud-ba-khud yeh steps karega: Next.js build → `electron-src` ko
   obfuscate/unreadable bana kar `electron/` folder banana → phir installer pack karna.
7. Installer yahan milega:
   ```
   dist/restaurant-management-system-Setup-1.0.0.exe
   ```
   — yehi file customer ko dete hain (source code kahin visible nahi).

### Customer Installation (unke PC par)

1. `NENO POS Setup.exe` chalayen → Next → Install (2-3 minute)
2. Desktop par "NENO POS" icon ban jayega
3. Pehli dafa kholne par **Activation screen** aayegi (Computer ID dikhegi)
4. Customer ID aapko bhejega → aap Key denge → wo enter karega → POS chal jayega
5. Agli dafa se seedha POS khulega, dobara activate nahi karna paray ga

### Prerequisite: MongoDB (Customer ke Main Server PC par)

`.exe` sirf app + license-lock package karta hai — **MongoDB alag se install
honi chahiye** customer ke Main Server PC par (ek dafa):
→ https://www.mongodb.com/try/download/community

(Chahen to installer mein MongoDB installer bhi bundle kiya ja sakta hai —
yeh advanced step hai, bata dein to woh bhi add kar dete hain.)

---

## Summary

| Device | Kya Karna Hai |
|---|---|
| Tablet / Mobile | Kuch install nahi — sirf browser se LAN address open karein |
| Main Server PC | `.exe` install karein → Computer ID bhejein → License Key se activate karein |
| Aap (Owner) | `KeyGenerator.html` apne paas rakhein, customer ki ID se key banayein |

Is tarah customer ko **kabhi source code nahi milta**, sirf ek installed,
license-locked application milti hai — jaisa commercial POS software mein
hota hai.
