const axios = require("axios");
const fs = require("fs");

function randomFrom(array) {
return array[Math.floor(Math.random() * array.length)];
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
"{user}; para benim için değersiz diyerek {amount} altını znci halkına feda olsun diyerekklana bağışladı."
]
};

const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;
const STATE_FILE = "ledger-state.json";

async function checkLedger() {
console.log("⏳ Ledger kontrol ediliyor...");

// 🔐 Son çalıştırma zamanı
let lastRunDate = null;
if (fs.existsSync(STATE_FILE)) {
lastRunDate = new Date(JSON.parse(fs.readFileSync(STATE_FILE)).lastRunDate);
}

const res = await axios.get(
`https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
{ headers: { Authorization: `Bot ${API_TOKEN}` } }
);

let sentCount = 0;

for (const entry of res.data) {
  console.log("DEBUG:", entry.creationTime, "lastRun:", lastRunDate);
if (!entry.gold || entry.gold < 50) continue;
if (!entry.playerUsername) continue;

const entryDate = new Date(entry.creationTime);  

// ⛔ Script çalışmadan önceyse tamamen yok say  
if (lastRunDate && entryDate <= lastRunDate) continue;  

let template;  
if (entry.gold < 250) template = randomFrom(goldMessages.small);  
else if (entry.gold < 650) template = randomFrom(goldMessages.medium);  
else if (entry.gold < 1000) template = randomFrom(goldMessages.big);  
else template = randomFrom(goldMessages.huge);  

const message = template  
  .replace("{user}", entry.playerUsername)  
  .replace("{amount}", entry.gold);  

await axios.post(  
  `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,  
  { message },  
  { headers: { Authorization: `Bot ${API_TOKEN}` } }
);  

console.log("💬 Gönderildi:", message);  
sentCount++;

}

// 🕒 Scriptin bu çalıştığı anı kaydet
fs.writeFileSync(
STATE_FILE,
JSON.stringify({ lastRunDate: new Date().toISOString() }, null, 2)
);

if (sentCount === 0) {
console.log("🔕 Yeni bağış yok.");
} else {
console.log(`✅ ${sentCount} yeni bağış işlendi.`);
}
}

checkLedger().catch(err => {
console.error(
"❌ HATA:",
err.response?.status,
err.response?.data || err.message
);
});
