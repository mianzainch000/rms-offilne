# NENO OFFICIAL CLOUD POS — OFFLINE (LAN) SETUP

Yeh project **Restaurant POS System** hai jo ab **Local Area Network (LAN)** par
**bina Internet ke** chalne ke liye taiyar hai — bilkul us diagram ke mutabiq jo
aap ne diya. App ka design aur functionality change nahi hui, sirf deployment
Local Network / Offline mode ke liye configure ki gayi hai.

---

## 1. Offline System Setup — Kya Kya Chahiye

1. Main Server / POS Computer (jisme software & database hoga)
2. Local Network (LAN) — Router / Switch
3. Client Devices (Tablets / PCs)
4. Printer (Bill Printer / KOT Printer)
5. UPS (Power Backup)
6. Cables (LAN Cables)
7. POS Software (Offline Mode) — yeh isi project mein hai
8. Database (Local System mein installed — MongoDB)
9. Sab devices Same Local Network mein connect hon

## 2. Hardware Setup

| Device                                 | Kaam                                                      |
| -------------------------------------- | --------------------------------------------------------- |
| Main Server / POS System (1 PC/Laptop) | Software + Database chalata hai                           |
| Router / Switch                        | Local Network ke liye                                     |
| Client Devices                         | Waiter Tablet / Cashier PC / Manager PC / Kitchen Display |
| Printers                               | Bill Printer / KOT Printer                                |
| UPS / Power Backup                     | Minimum 30–60 minute backup                               |
| LAN Cables                             | Devices ko connect karne ke liye                          |

## 3. System Design — Offline Working

```
                MAIN SERVER / POS SYSTEM
              (POS Software + Local Database)
                          |
                 ROUTER / SWITCH (LAN)
                          |
   -----------------------------------------------------
   |         |            |             |               |
CASHIER   WAITER       MANAGER      KITCHEN          PRINTERS
  PC       TABLET         PC        DISPLAY      (Bill/KOT Printer)
(Billing) (Orders)     (Reports)   (KOT/Status)
```

Main Server par:

- POS Software (yeh Next.js project)
- Local Database (MongoDB) — sab data yahin save hota hai
- Sab reports isi server se generate hote hain
- Server 24x7 ON rehna chahiye

## 4. Offline Workflow

1. **Waiter Order** — Waiter Tablet se order create hota hai (Local Network)
2. **Send to Kitchen** — Order Kitchen Display par chala jata hai (Local Network)
3. **Kitchen Prepare** — Kitchen order prepare karke status update karta hai
4. **Billing** — Cashier PC par bill generate hota hai (Local Database)
5. **Payment** — Payment complete hone par bill print hota hai
6. **Data Save** — Sab data Local Database mein save hota hai (Offline)

## 5. Important Notes

- Internet ki bilkul zarurat nahi
- Sab kuch Local Network (LAN) par chalta hai
- Agar Main Server band ho to system kaam nahi karega
- Regular Database Backup zarur lein (Daily) — `npm run backup`
- UPS zarur use karein

## 6. Database (Offline)

Local Database: **MongoDB** (Main Server ke andar hi install hoti hai)

- Orders
- Items
- Tables
- Payments
- Reports
- Users
- Settings

---

# Software Installation — Step by Step

### A) Main Server / POS Computer par (sirf ek dafa)

1. **Node.js (LTS)** install karein → https://nodejs.org
2. **MongoDB Community Server** install karein aur service start karein → https://www.mongodb.com/try/download/community
   - Windows par install ke baad "MongoDB Server" service khud start ho jati hai.
   - Confirm karne ke liye: `mongosh` chala kar check kar lein connect ho raha hai.
3. Is project ko Main Server Computer par copy/extract karein.
4. Terminal / Command Prompt project folder mein khol kar:
   ```bash
   npm install
   ```
5. `.env.local` file check karein — offline setup ke liye already sahi values hain
   (Local MongoDB + `localhost:3000`). Cloud/Atlas wali lines ko chhu'ain mat.
6. Production build banayein:
   ```bash
   npm run build
   ```
7. Server ko Local Network par start karein (0.0.0.0 par bind hoga, taake baaqi
   devices bhi connect ho saken):
   ```bash
   npm run start:lan
   ```
8. Apna LAN IP address maloom karne ke liye (dusra terminal khol kar):
   ```bash
   npm run lan:ip
   ```
   Yeh kuch is tarha output dega:
   ```
   Wi-Fi / Ethernet   ->  http://192.168.1.10:3000
   ```
   Yehi address (`http://192.168.1.10:3000`) baaqi sab devices ko dena hai.

### B) Client Devices par (Cashier PC / Waiter Tablet / Manager PC / Kitchen Display)

Koi installation ki zarurat nahi — sirf:

1. Device ko usi Router/Switch ke Local Network (Wi-Fi ya LAN cable) se connect karein.
2. Browser (Chrome/Edge) khol kar Main Server ka address open karein, misal:
   ```
   http://192.168.1.10:3000
   ```
3. Login karke role ke mutabiq (Waiter / Cashier / Manager / Kitchen) POS use karein.
4. Tablet/PC par is address ko **Home Screen / Desktop Shortcut** bana lein taake
   roz manually type na karna pare.

### C) Printers (Bill Printer / KOT Printer)

- Printer ko Main Server ya kisi bhi Windows PC se **USB/Network Share** kar dein,
  ya seedha Wi-Fi/Network Printer istemal karein.
- Har device apne OS ke print dialog (Ctrl+P / Browser Print) se print karega —
  app ke andar "Print Bill" bar sirf print dialog open karta hai, isay change nahi kiya gaya.

### D) Firewall / Port Khulwana

- Windows Firewall mein Node.js ko **Private Network** ke liye allow karein, ya
  port **3000** (TCP) allow karein taake baaqi devices connect ho saken.
- Router mein koi port-forwarding ki zarurat NAHI — yeh sirf Local Network ke andar chalega.

### E) Daily Database Backup

```bash
npm run backup
```

Yeh Local MongoDB database ka backup `backups/<date>` folder mein bana dega
(requires MongoDB Database Tools — `mongodump`).

---

## Summary

Sabhi devices Local Network (LAN) ke through Main Server se connect honge.
Internet ke bina bhi pura POS System Offline chalega.

> Design aur functionality bilkul waisi hi rakhi gayi hai — sirf deployment ko
> Cloud se **Local Area Network (Offline)** mode ke liye configure kiya gaya hai.

npm run electron:dev
npm run license-admin
