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
const STATE_FILE = "ledger-state.json";

/* 🎲 Rastgele seçim */
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  // 🔐 Son işlenen bağış zamanı
  let lastRunDate = null;
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE));
      if (data.lastRunDate) lastRunDate = new Date(data.lastRunDate);
    } catch {
      lastRunDate = null;
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

  // 🔹 Sadece en son bağışı bul
  const sortedLedger = res.data
    .filter(e => e.gold && e.playerUsername)
    .sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));

  const latest = sortedLedger[0]; // en son bağış
  if (!latest) {
    console.log("🔕 İşlenecek bağış yok.");
    return;
  }

  const latestDate = new Date(latest.creationTime);

  // ⛔ Daha önce işlenmişse atla
  if (lastRunDate && latestDate <= lastRunDate) {
    console.log("🔕 Yeni bağış yok.");
    return;
  }

  // 🔹 Altın miktarına göre mesaj seç
  let template;
  if (latest.gold < 250) template = randomFrom(goldMessages.small);
  else if (latest.gold < 650) template = randomFrom(goldMessages.medium);
  else if (latest.gold < 1000) template = randomFrom(goldMessages.big);
  else template = randomFrom(goldMessages.huge);

  const message = template
    .replace("{user}", latest.playerUsername)
    .replace("{amount}", latest.gold);

  // Mesaj gönder
  await axios.post(
    `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
    { message },
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  console.log("💬 Gönderildi:", message);

  // 🔹 Son işlenen bağışı kaydet
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ lastRunDate: latestDate.toISOString() }, null, 2)
  );
}

checkLedger().catch(err => {
  console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
});
