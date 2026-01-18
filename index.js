const axios = require("axios");
const fs = require("fs");

const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;
const STATE_FILE = "ledger-state.json";

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  // 1️⃣ State oku
  let lastRunDate = null;
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (state.lastRunDate) {
      lastRunDate = new Date(state.lastRunDate);
    }
  }

  // 2️⃣ Ledger çek
  const res = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  // 3️⃣ Sadece geçerli bağışları al
  const validDonations = res.data
    .filter(e =>
      e.gold >= 50 &&
      e.playerUsername &&
      e.creationTime &&
      (!lastRunDate || new Date(e.creationTime) > lastRunDate)
    )
    .sort((a, b) =>
      new Date(a.creationTime) - new Date(b.creationTime)
    );

  // 4️⃣ Yeni bağış yoksa çık
  if (validDonations.length === 0) {
    console.log("🔕 Yeni bağış yok.");
    return;
  }

  // 5️⃣ SADECE EN SON BAĞIŞ
  const donation = validDonations[validDonations.length - 1];

  let template;
  if (donation.gold < 250) template = randomFrom(goldMessages.small);
  else if (donation.gold < 650) template = randomFrom(goldMessages.medium);
  else if (donation.gold < 1000) template = randomFrom(goldMessages.big);
  else template = randomFrom(goldMessages.huge);

  const message = template
    .replace("{user}", donation.playerUsername)
    .replace("{amount}", donation.gold);

  // 6️⃣ Mesaj gönder
  await axios.post(
    `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
    { message },
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  console.log("💬 Gönderildi:", message);

  // 7️⃣ State güncelle (EN SON BAĞIŞIN ZAMANI)
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      { lastRunDate: donation.creationTime },
      null,
      2
    )
  );

  console.log("🕒 State güncellendi:", donation.creationTime);
}

checkLedger().catch(err => {
  console.error(
    "❌ HATA:",
    err.response?.status,
    err.response?.data || err.message
  );
});
