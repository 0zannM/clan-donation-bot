const axios = require("axios");
const fs = require("fs");

/* 🔔 MESAJ HAVUZLARI */
const goldMessages = {
  small: [
    "{user}, {amount} altın sadaka verdi, tebrik ederiz.",
    "{user} evsizlere umut olmak adına {amount} altın bağışladı.",
    "{user} ekonomik durumu çok iyi olmasa da {amount} altın bağışı çok görmedi."
  ],
  medium: [
    "{user}, znciler daha iyi bir yaşamı hak ediyor diye düşünüp {amount} altın bağışladı.",
    "{user}, klanı {amount} altınla güçlendirdi!",
    "{user}, {amount} altınla klana destek oldu!"
  ],
  big: [
    "{user}, hiçbir znci yoksulluk içinde olmasın diye {amount} altını hayır kurumuna bağışladı.",
    "Altyapı çalışmalarına fon sağlamak isteyen {user}, {amount} altın bağışladı.",
    "{amount} altın bağışlayan {user}'i tebrik ederiz."
  ],
  huge: [
    "{user} cömert gününde. Klana yaptığı {amount} altın bağışla tarih yazdı!",
    "{user}, büyük emeklerle kazandığı {amount} altını klan hazinesine bağışladı.",
    "{user}; para benim için değersiz diyerek {amount} altını znci halkına feda olsun diyerek klana bağışladı."
  ]
};

/* 🔐 ENV */
const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;
const path = require("path"); // bu satırı ekle
const STATE_FILE = path.join(__dirname, "ledger-state.json"); // eski STATE_FILE'ı değiştir

/* 🎲 Rastgele seçim */
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  // 🔐 Son işlenen bağış zamanı
  let lastRunDate = new Date("2026-01-18T02:00:00.000Z"); // başlangıç tarihi
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE));
      if (data.lastRunDate) lastRunDate = new Date(data.lastRunDate);
    } catch {
      // okunamazsa başlangıç tarihi kullanılacak
    }
  }

  // Ledger verisini çek
  const res = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  if (!res.data.length) {
    console.log("Ledger boş.");
    return;
  }

  // 🔹 Sadece son bağışı bul
  const newEntries = res.data
    .filter(e => e.gold && e.playerUsername)
    .filter(e => new Date(e.creationTime) > lastRunDate);

  if (newEntries.length === 0) {
    console.log("🔕 Yeni bağış yok.");
    return;
  }

  // En son bağışı al
  const lastEntry = newEntries.reduce((a, b) =>
    new Date(a.creationTime) > new Date(b.creationTime) ? a : b
  );

  // 🔹 Altın miktarına göre mesaj seç
  let template;
  if (lastEntry.gold < 250) template = randomFrom(goldMessages.small);
  else if (lastEntry.gold < 650) template = randomFrom(goldMessages.medium);
  else if (lastEntry.gold < 1000) template = randomFrom(goldMessages.big);
  else template = randomFrom(goldMessages.huge);

  const message = template
    .replace("{user}", lastEntry.playerUsername)
    .replace("{amount}", lastEntry.gold);

  // Mesaj gönder
  await axios.post(
    `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
    { message },
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  console.log("💬 Gönderildi:", message);

  // 🔹 Son bağışı kaydet
  try {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ lastRunDate: new Date(lastEntry.creationTime).toISOString() }, null, 2)
  );
  console.log("✅ Son bağış işlendi ve state güncellendi.");
} catch (err) {
  console.error("❌ State dosyası yazılamadı:", err.message);
  }
checkLedger().catch(err => {
  console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
});
