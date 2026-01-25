const axios = require("axios");
const fs = require("fs");
const path = require("path");

/* 🔔 MESAJ HAVUZLARI */
const goldMessages = {
  verysmall: [
    "@{user}, geçen seneden kalma montunun cebinden bulduğu {amount} kuruşu hazineye bağışladı.",
    "@{user}, ekonomik sıkıntılarına rağmen zar zor biriktirdiği {amount} altını hazineye bağışladı.",
    "Vergilerini tam ödemediğini fark eden @{user}, kalan {amount} dinarı geç olmadan hazineye aktardı.",
    "@{user}, bugünkü simit parasını feda edip {amount} altın bağışladı.",
    "@{user}, küçük adımlarla büyük hayallere diyerek {amount} altınını feda etti.",
    "@{user}, mütevazı bir destek olarak {amount} altın bağışladı.",
    "@{user}, ‘gerekirse soğan ekmek yeriz’ diyerek {amount} altın bağışladı.",
    "@{user}, vergiler azaltılsın diye şikayet ede ede {amount} altın ödeme yaptı.",
    "@{user}, imkânları sınırlı olsa da {amount} altınla katkı sundu.",
    "@{user}, dengeleri sarsacak ölçekteki {amount} kuruşu hazineye bağışladı.",
    "@{user}, hazineye katkı olsun diye {amount} altın bıraktı.",
    "@{user}, hesapladığından {amount} fazla altın biriktirince 'gerisi hazinenin olsun' dedi.",
    "@{user}, gönüllü olarak {amount} altını hazineye bağışladı.",
    "@{user}, dönerciyle olan borçlarını kapatmak adına {amount} altın ödedi.",
    "@{user}, altın sayacını kıpırdamaya tenezzül ettirmeyen {amount} altını hazineye bağışladı.",
    "@{user}, bir yerden başlamak lazım diyerek {amount} altını verdi."
  ],
  small: [
    "@{user}, zeñci imparatorluğuna olan bağlılığını {amount} altınla gösterdi.",
    "@{user}, bütçe açığını kapatmaya yardım olmak için {amount} altın bağışladı.",
    "@{user}, {amount} altın sadaka verdi, tebrik ederiz.",
    "@{user} evsizlere umut olmak adına {amount} altın bağışladı.",
    "@{user}, çiftçimize mazot olsun diyip {amount} altın bağış yaptı.",
    "Gerekirse bu ay kemer sıkmayı göze alan @{user}, hazineye {amount} altın bağışta bulundu",
    "@{user}, zeñcilere refah dolu bir yaşam sunmaya katkı sağlamak için {amount} altını gözden çıkardı"
  ],
  medium: [
    "@{user}, znciler daha iyi bir yaşamı hak ediyor diye düşünüp {amount} altın bağışladı.",
    "@{user}, klanı {amount} altınla güçlendirdi!",
    "@{user}, {amount} altınla klana destek oldu!",
    "@{user}, {amount} altın bağışlayarak döner sosu üretim merkezlerine fon sağladı"
  ],
  big: [
    "@{user}, klanın refahı için {amount} altın bağışladı.",
    "@{user}, hiçbir znci yoksulluk içinde olmasın diye {amount} altını hayır kurumuna bağışladı.",
    "Altyapı çalışmalarına fon sağlamak isteyen @{user}, {amount} altın bağışladı.",
    "Bütçeyi zorlayarak {amount} altın bağışlayan @{user}'i tebrik ederiz.",
    "@{user}, ekonomi uçsun diye {amount} altın bağışladı."
  ],
  huge: [
    "@{user}, klan tarihine geçecek bir bağış yaptı: {amount} altın.",
    "@{user}, klanın geleceği için {amount} altınlık dev bir fedakârlık yaptı.",
    "@{user} cömert gününde. Klana yaptığı {amount} altın bağışla tarih yazdı!",
    "@{user}, büyük emeklerle kazandığı {amount} altını klan hazinesine bağışladı.",
    "@{user}, büyük bir hayırseverlik yapıp dönercinin veresiye defterini kapatmak için {amount} altın bağışladı"
  ]
};

/* 🔐 ENV */
const API_TOKEN = process.env.API_TOKEN;
const CLAN_ID = process.env.CLAN_ID;

/* 💾 STATE */
const STATE_FILE = path.join(__dirname, "ledger-state.json");

/* 🎲 Rastgele seçim */
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  if (!API_TOKEN || !CLAN_ID) {
    throw new Error("Eksik env: API_TOKEN veya CLAN_ID");
  }

  // 🔐 Son işlenen bağış zamanı
  let lastRunDate = new Date("2026-01-18T02:00:00.000Z"); // başlangıç tarihi (istersen değiştir)
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
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

  if (!Array.isArray(res.data) || res.data.length === 0) {
    console.log("Ledger boş.");
    return;
  }

  // 🔹 lastRunDate’ten sonraki TÜM yeni bağışları al
  const newEntries = res.data
    .filter(e => e && e.playerUsername && typeof e.gold === "number" && e.creationTime && e.gold > 0)
    .filter(e => new Date(e.creationTime) > lastRunDate);

  if (newEntries.length === 0) {
    console.log("🔕 Yeni bağış yok.");
    return;
  }

  // Eskiden yeniye sırala
  newEntries.sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime));

  let newestDate = lastRunDate;
  let sentCount = 0;

  for (const entry of newEntries) {
    let template;
    if (entry.gold < 50) template = randomFrom(goldMessages.verysmall);
    else if (entry.gold < 250) template = randomFrom(goldMessages.small);
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

    const entryDate = new Date(entry.creationTime);
    if (!newestDate || entryDate > newestDate) newestDate = entryDate;
  }

  // 💾 State güncelle (en yeni bağışın zamanı)
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastRunDate: newestDate.toISOString() }, null, 2)
    );
    console.log(`✅ State güncellendi: ${newestDate.toISOString()} | Mesaj sayısı: ${sentCount}`);
  } catch (err) {
    console.error("❌ State dosyası yazılamadı:", err.message);
  }
}

checkLedger().catch(err => {
  console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
});
