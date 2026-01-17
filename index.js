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
    "{user} cömert gününde. Klana yaptığı bu büyük {amount} dinar bağışla Zncidirenis yüzyılını başlatmış bulunuyor",
    "{user}, büyük uğraşlarla kazandığı {amount} altınını hazineye bağışlayıp çiftçimize mazot, emekliye tebessüm oldu.",
    "{user}; para benim için değersiz, asıl önemli olan zncilere destek olmaktır diyip birikimi olan {amount} altını bağışladı."
  ]
};

const axios = require("axios");
const fs = require("fs");

const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;

const STATE_FILE = "ledger-state.json";

async function checkLedger() {
  let lastDate = null;

  if (fs.existsSync(STATE_FILE)) {
    lastDate = JSON.parse(fs.readFileSync(STATE_FILE)).lastDate;
  }

  const url = lastDate
    ? `https://api.wolvesville.com/clans/${CLAN_ID}/ledger?oldest=${lastDate}`
    : `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bot ${API_TOKEN}` }
  });

  let newestDate = lastDate;

  for (const entry of res.data) {
    // SADECE ALTIN BAĞIŞI
    if (entry.type !== "DONATION_GOLD") continue;

    let template;

    if (entry.amount < 50) {

    } else if (entry.amount < 250) {
      template = randomFrom(goldMessages.small);
    } else if (entry.amount < 650) {
      template = randomFrom(goldMessages.medium);
    } else if (entry.amount < 1000) {
      template = randomFrom(goldMessages.big);
    } else {
      template = randomFrom(goldMessages.huge);
    }
    const message = template
  .replace("{user}", entry.username)
  .replace("{amount}", entry.amount);

    await axios.post(
      `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
      { message },
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );

    if (!newestDate || entry.date > newestDate) {
      newestDate = entry.date;
    }
  }

  if (newestDate) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastDate: newestDate }, null, 2)
    );
  }
}

checkLedger();