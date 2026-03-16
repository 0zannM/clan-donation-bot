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
    "@{user}, 'gerekirse soğan ekmek yeriz' diyerek {amount} altın bağışladı.",
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
    "Fazla para beni bozar diyen @{user}, {amount} altınını bağışladı.",
    "@{user}, hiçbir znci yoksulluk içinde olmasın diye {amount} altını hayır kurumuna bağışladı.",
    "Altyapı çalışmalarına fon sağlamak isteyen @{user}, {amount} altın bağışladı.",
    "Bütçeyi zorlayarak {amount} altın bağışlayan @{user}'i tebrik ederiz.",
    "@{user}, ekonomi uçsun diye {amount} altın bağışladı.",
    "@{user}, altın rezervlerini {amount} artırdı.",
    "Cömertliğiyle nam salan @{user}, hazineye {amount} destekte bulundu.",
    "@{user}, inşaat projelerini hızlandırmak adına {amount} altın bağışladı.",
    "@{user} ismiyle bilinen bir hayırsever, klan hazinesine {amount} altın bağışladı.",
    "Evde su kaçağı olduğunu fark eden @{user}, tesisatçıya {amount} ödeme yaptı."
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* 💾 STATE */
const STATE_FILE = path.join(__dirname, "ledger-state.json");

/* 🤖 Gemini sistem promptu */
const SYSTEM_PROMPT = `Sen zeñcidirenis klan botusun, adın zncibot. Wolvesville oynayan Türkçe bir klansın. Amacın, senle konuşan oyunculara yardımcı olmak, sorularını cevaplamak. Samimi, eğlenceli ve espirili ol ama kimseye saldırgan olma. Türkçe yaz, günlük dil kullan. 2-3 cümleyi geçme. Mesajın başında kimin yazdığı var, gerekirse ismiyle hitap et.`;

/* 🎲 Rastgele seçim */
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/* 🤖 Gemini'ye sor */
async function askGemini(userMessage, recentMessages = []) {
  if (!GEMINI_API_KEY) throw new Error("Eksik env: GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

  // Son mesajları username'li formata çevir
  const chatContext = recentMessages.length > 0
    ? "Son klan sohbeti:\n" + recentMessages.map(m => `[${m.username}]: ${m.msg}`).join("\n") + "\n\n"
    : "";

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: "model",
        parts: [{ text: "Anladım, zncibot olarak yanıt vereceğim." }]
      },
      {
        role: "user",
        parts: [{ text: chatContext + userMessage }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.9
    }
  };

  const res = await axios.post(url, body, {
    headers: { "Content-Type": "application/json" }
  });

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini boş yanıt döndü");
  return text.trim();
}

/* 💬 Klan sohbetini çek */
async function fetchChatMessages(since) {
  const res = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  if (!Array.isArray(res.data)) return [];

  return res.data.filter(
    m => m && !m.isSystem && m.msg && m.date && new Date(m.date) > since
  );
}

/* 👤 Player ID → Username önbelleği (aynı çalışmada tekrar istek atmasın) */
const usernameCache = {};

async function fetchUsername(playerId) {
  if (usernameCache[playerId]) return usernameCache[playerId];
  try {
    const res = await axios.get(
      `https://api.wolvesville.com/players/${playerId}`,
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );
    const username = res.data?.username || playerId.slice(0, 6);
    usernameCache[playerId] = username;
    return username;
  } catch {
    // Çekilemezse kısa ID kullan
    usernameCache[playerId] = playerId.slice(0, 6);
    return usernameCache[playerId];
  }
}

/* 📨 Klan sohbetine mesaj gönder */
async function sendChatMessage(message) {
  await axios.post(
    `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
    { message },
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );
}

async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  if (!API_TOKEN || !CLAN_ID) {
    throw new Error("Eksik env: API_TOKEN veya CLAN_ID");
  }

  // 🔐 Son işlenen zaman
  let lastRunDate = new Date("2026-02-18T02:00:00.000Z");
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      if (data.lastRunDate) lastRunDate = new Date(data.lastRunDate);
    } catch {
      // okunamazsa başlangıç tarihi kullanılacak
    }
  }

  // ─── 1) LEDGER: Yeni bağışları işle ───────────────────────────────────────
  const ledgerRes = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  let newestDate = lastRunDate;

  if (Array.isArray(ledgerRes.data) && ledgerRes.data.length > 0) {
    const newEntries = ledgerRes.data
      .filter(e => e && e.playerUsername && typeof e.gold === "number" && e.creationTime && e.gold >= 20)
      .filter(e => new Date(e.creationTime) > lastRunDate);

    if (newEntries.length === 0) {
      console.log("🔕 Yeni bağış yok.");
    } else {
      newEntries.sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime));

      let sentCount = 0;
      for (const entry of newEntries) {
        let template;
        if (entry.gold < 50)        template = randomFrom(goldMessages.verysmall);
        else if (entry.gold < 250)  template = randomFrom(goldMessages.small);
        else if (entry.gold < 590)  template = randomFrom(goldMessages.medium);
        else if (entry.gold < 1000) template = randomFrom(goldMessages.big);
        else                        template = randomFrom(goldMessages.huge);

        const message = template
          .replace("{user}", entry.playerUsername)
          .replace("{amount}", entry.gold);

        await sendChatMessage(message);
        console.log("💬 Bağış mesajı gönderildi:", message);
        sentCount++;

        const entryDate = new Date(entry.creationTime);
        if (entryDate > newestDate) newestDate = entryDate;
      }
      console.log(`✅ ${sentCount} bağış mesajı gönderildi.`);
    }
  } else {
    console.log("Ledger boş.");
  }

  // ─── 2) CHAT: !zncibot komutlarını işle ───────────────────────────────────
  console.log("💬 Sohbet kontrol ediliyor...");

  const chatMessages = await fetchChatMessages(lastRunDate);

  // Tüm mesajlardaki benzersiz playerId'leri topla ve username'lerini çek
  const allPlayerIds = [...new Set(chatMessages.map(m => m.playerId).filter(Boolean))];
  await Promise.all(allPlayerIds.map(id => fetchUsername(id)));

  // Mesajlara username ekle
  const messagesWithUsername = chatMessages.map(m => ({
    ...m,
    username: usernameCache[m.playerId] || m.playerId?.slice(0, 6) || "?"
  }));

  const botCommands = messagesWithUsername.filter(m =>
    m.msg.trim().toLowerCase().startsWith("!zncibot ")
  );

  if (botCommands.length === 0) {
    console.log("🔕 Yeni !zncibot komutu yok.");
  } else {
    // Eskiden yeniye sırala
    botCommands.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(`🤖 ${botCommands.length} adet !zncibot komutu bulundu.`);

    for (const cmd of botCommands) {
      // "!zncibot " prefix'ini at, kalan metni al
      const rawMessage = cmd.msg.trim().slice("!zncibot ".length).trim();
      if (!rawMessage) continue;

      // Gemini'ye kimin yazdığını da bildir
      const userMessage = `${cmd.username} diyor ki: ${rawMessage}`;

      console.log(`🔍 İşleniyor: "${rawMessage}" (${cmd.username})`);

      // Komuttan önceki son 10 mesajı context olarak al (!zncibot komutları hariç)
      const contextMessages = messagesWithUsername
        .filter(m => new Date(m.date) < new Date(cmd.date) && !m.msg.trim().toLowerCase().startsWith("!zncibot"))
        .slice(-10);

      try {
        const reply = await askGemini(userMessage, contextMessages);
        console.log(`🤖 Gemini tam yanıt (${reply.length} karakter):`, reply);
        await sendChatMessage(reply);
        console.log("🤖 Gönderildi.");
      } catch (err) {
        console.error("❌ Gemini hatası:", err.message);
      }

      // Mesaj tarihini newestDate ile karşılaştır
      const cmdDate = new Date(cmd.date);
      if (cmdDate > newestDate) newestDate = cmdDate;
    }
  }

  // ─── 3) STATE güncelle ────────────────────────────────────────────────────
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastRunDate: newestDate.toISOString() }, null, 2)
    );
    console.log(`✅ State güncellendi: ${newestDate.toISOString()}`);
  } catch (err) {
    console.error("❌ State dosyası yazılamadı:", err.message);
  }
}

checkLedger().catch(err => {
  console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
});
