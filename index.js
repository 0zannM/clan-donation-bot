const axios = require("axios");
const fs = require("fs");

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

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
    "{user}; para benim için değersiz diyerek {amount} altını klana bağışladı."
  ]
};

/* 🔐 ENV */
const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;

/* 💾 STATE */
const STATE_FILE = "ledger-state.json";

/* 🚀 ANA FONKSİYON */
async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  /* --- STATE OKU --- */
  let lastDate = null;
  if (fs.existsSync(STATE_FILE)) {
    lastDate = JSON.parse(fs.readFileSync(STATE_FILE)).lastDate;
  }

  /* --- LEDGER ÇAĞRISI --- */
  const url = lastDate
    ? `https://api.wolvesville.com/clans/${CLAN_ID}/ledger?oldest=${lastDate}`
    : `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bot ${API_TOKEN}` }
  });

  let newestDate = lastDate;
  let sentCount = 0;

  /* --- KAYITLARI İŞLE --- */
  for (const entry of res.data) {
    // SADECE ALTIN BAĞIŞI
    if (entry.type !== "DONATION_GOLD") continue;
    if (!entry.playerUsername || !entry.gold) continue;

    let template;

    if (entry.gold < 50) {
      template = randomFrom(goldMessages.small);
    } else if (entry.gold < 250) {
      template = randomFrom(goldMessages.small);
    } else if (entry.gold < 650) {
      template = randomFrom(goldMessages.medium);
    } else if (entry.gold < 1000) {
      template = randomFrom(goldMessages.big);
    } else {
      template = randomFrom(goldMessages.huge);
    }

    const message = template
      .replace("{user}", entry.playerUsername)
      .replace("{amount}", entry.gold);

    /* --- CHAT MESAJI --- */
    await axios.post(
      `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
      { message },
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );

    console.log("💬 Gönderildi:", message);
    sentCount++;

    if (!newestDate || entry.date > newestDate) {
      newestDate = entry.date;
    }
  }

  /* --- STATE GÜNCELLE --- */
  if (newestDate) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastDate: newestDate }, null, 2)
    );
  }

  if (sentCount === 0) {
    console.log("🔕 Yeni altın bağışı yok.");
  } else {
    console.log(`✅ ${sentCount} bağış mesajı gönderildi.`);
  }
}

/* ▶️ ÇALIŞTIR */
checkLedger().catch(err => {
  console.error(
    "❌ HATA:",
    err.response?.status,
    err.response?.data || err.message
  );
});
