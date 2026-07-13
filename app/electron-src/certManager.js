const fs = require("fs");
const path = require("path");
const os = require("os");
const selfsigned = require("selfsigned");

function getCertPaths() {
  const userDataDir = global.__ELECTRON_USER_DATA__ || os.tmpdir();
  const dir = path.join(userDataDir, "tls");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return {
    dir,
    keyPath: path.join(dir, "key.pem"),
    certPath: path.join(dir, "cert.pem"),
  };
}

function getLanIPv4Addresses() {
  const addresses = ["127.0.0.1"];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

function generateCert() {
  const altNames = [
    { type: 2, value: "localhost" },
    ...getLanIPv4Addresses().map((ip) => ({ type: 7, ip })),
  ];
  const pems = selfsigned.generate(
    [{ name: "commonName", value: "localhost" }],
    {
      days: 3650,
      keySize: 2048,
      extensions: [{ name: "subjectAltName", altNames }],
    },
  );
  return { key: pems.private, cert: pems.cert };
}

function getOrCreateCert() {
  const { keyPath, certPath } = getCertPaths();

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      const cert = fs.readFileSync(certPath, "utf8");
      const key = fs.readFileSync(keyPath, "utf8");
      return { key, cert };
    } catch {}
  }

  const { key, cert } = generateCert();
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  fs.writeFileSync(certPath, cert, { mode: 0o600 });
  return { key, cert };
}

module.exports = { getOrCreateCert };
