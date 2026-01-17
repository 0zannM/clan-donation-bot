const axios = require("axios");

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const goldMessages = {
  small: [
    "{user}, {amount} altın sadaka verdi, tebrik ederiz.",
    "{user} evsizlere umut olmak adına {amount} altın bağışladı",
    "{user} ekonomik durumu çok iyi olmasa da {amount} altın bağışı çok görmedi"
  ],

  medium: [
    "{user}, znciler daha iyi bir yaşamı hak ediyor diye düşünüp {amount} altın bağışladı",
    "{user}, klanı {amount} altınla güçlendirdi!",
    "{user}, {amount} altınla klana destek oldu!"
  ],

  big: [
    "{user}, hiçbir znci yoksulluk içinde olmasın diye {amount} altını hayır kurumuna bağışladı",
    "Altyapı çalışmalarına fon sağlamak isteyen {user}, {amount} altın bağışladı",
    "{amount} altın bağışlayan {user}'i tebrik ederiz"
  ],

  huge: [
    "{user} cömert gününde. Klana yaptığı bu büyük {amount} altın bağışla Zncidirenis yüzyılını başlatmış bulunuyor",
    "{user}, büyük uğraşlarla kazandığı {amount} altınını hazineye bağışlayıp çiftçimize mazot, emekliye tebessüm oldu.",
    "{user}; para benim için değersiz, asıl önemli olan zncilere destek olmaktır diyip birikimi olan {amount} altını bağışladı."
  ]
};

const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  const res = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  const donations = res.data.filter(entry =>
    entry.gold > 0 &&
    entry.playerUsername &&
    new Date(entry.date).getTime() >= oneHourAgo
  );

  if (donations.length === 0) {
    console.log("Yeni altın bağışı yok.");
    return;
  }

  // eskiden yeniye
  donations.sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const entry of donations) {
    let template;

    if (entry.gold < 50) {
      
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

    await axios.post(
      `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
      { message },
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );

    console.log("💬 Gönderildi:", message);
  }
}

checkLedger().catch(err => {
  console.error(
    "HATA:",
    err.response?.status,
    err.response?.data || err.message
  );
});
