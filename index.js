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

  let sentCount = 0;
  let newestDate = lastRunDate;

  for (const entry of res.data) {
    if (!entry.gold || !entry.playerUsername) continue;

    const entryDate = new Date(entry.creationTime);

    // Daha önce işlenmişse atla
    if (lastRunDate && entryDate <= lastRunDate) continue;

    // Altın miktarına göre mesaj seç
    let template;
    if (entry.gold < 250) template = randomFrom(goldMessages.small);
    else if (entry.gold < 650) template = randomFrom(goldMessages.medium);
    else if (entry.gold < 1000) template = randomFrom(goldMessages.big);
    else template = randomFrom(goldMessages.huge);

    const message = template
      .replace("{user}", entry.playerUsername)
      .replace("{amount}", entry.gold);

    // Mesaj gönder
    await axios.post(
      `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
      { message },
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );

    console.log("💬 Gönderildi:", message);
    sentCount++;

    // Son işlenen bağışı kaydet
    if (!newestDate || entryDate > newestDate) newestDate = entryDate;
  }

  // State dosyasını güncelle
  if (newestDate) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastRunDate: newestDate.toISOString() }, null, 2)
    );
  }

  if (sentCount === 0) {
    console.log("🔕 Yeni bağış yok.");
  } else {
    console.log(`✅ ${sentCount} yeni bağış işlendi.`);
  }
}

// Tek çağrı burada yeterli
checkLedger().catch(err => {
  console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
});
