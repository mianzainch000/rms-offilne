const os = require("os");

const PORT = process.env.PORT || 9000;

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }

  return addresses;
}

const addresses = getLanAddresses();

console.log(
  "\n================ NENO POS — LOCAL NETWORK (LAN) ADDRESS ================\n",
);

if (addresses.length === 0) {
  console.log(
    "⚠  Koi LAN network interface nahi mila. Router/Switch se LAN cable ya WiFi connect karein.",
  );
} else {
  addresses.forEach(({ name, address }) => {
    console.log(`  ${name.padEnd(15)} ->  https://${address}:${PORT}`);
  });
  console.log(
    "\nBaaqi devices (Cashier PC, Waiter Tablet, Manager PC, Kitchen Display) is address ko",
  );
  console.log(
    "apne browser mein type karke POS system open kar sakte hain (Wi-Fi/LAN se connected honi chahiye).",
  );
}

console.log(
  "\n==========================================================================\n",
);
