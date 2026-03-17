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

/* 🤖 Botun kendi player ID'si */
const BOT_PLAYER_ID = "b9ab817c-1b51-4dd5-8cc9-ddf6af28ef1c";

/* 🤖 Gemini sistem promptu */
const SYSTEM_PROMPT = `Sen zeñcidirenis klan botusun, adın zncibot. Klanın sahibi RoseScammer. Wolvesville oynayan Türkçe bir klansın. Amacın, senle konuşan oyunculara yardımcı olmak, sorularını cevaplamak. Samimi, eğlenceli ve espirili ol ama kimseye saldırgan olma. Türkçe yaz, günlük dil kullan. 2-3 cümleyi geçme. Mesajın başında kimin yazdığı var, gerekirse ismiyle hitap et. İstatistik gerektiren sorularda get_member_stats, avatar/skin yorumu için get_avatar fonksiyonunu kullan.`;

/* 📊 Function calling tanımları */
const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_member_stats",
        description: "Klan üyelerinin XP ve altın bağış istatistiklerini getirir. Belirli bir üyenin veya tüm üyelerin istatistiklerini döndürür.",
        parameters: {
          type: "OBJECT",
          properties: {
            username: {
              type: "STRING",
              description: "Belirli bir üyenin kullanıcı adı. Boş bırakılırsa tüm üyelerin verisi döner."
            },
            metric: {
              type: "STRING",
              enum: ["xp", "gold", "gems", "all"],
              description: "Hangi metrik isteniyor: xp, gold, gems veya all (hepsi)"
            },
            period: {
              type: "STRING",
              enum: ["week", "month", "year", "allTime"],
              description: "Zaman dilimi: week, month, year veya allTime"
            }
          },
          required: ["metric", "period"]
        }
      },
      {
        name: "get_avatar",
        description: "Komutu yazan oyuncunun belirttiği slot numarasındaki avatar/skin görselini getirir ve yorumlar.",
        parameters: {
          type: "OBJECT",
          properties: {
            slot: {
              type: "NUMBER",
              description: "Avatar slot numarası (örn. 1, 2, 3)"
            }
          },
          required: ["slot"]
        }
      }
    ]
  }
];

/* 🎲 Rastgele seçim */
function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/* 📊 Klan üye istatistiklerini çek */
async function fetchMemberStats() {
  const res = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/members/detailed`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );
  return Array.isArray(res.data) ? res.data : [];
}

/* 🎨 Avatar URL'ini çek (base64 değil, direkt URL) */
async function fetchAvatarUrl(playerId, slot) {
  const slotRes = await axios.get(
    `https://api.wolvesville.com/avatars/sharedAvatarId/${playerId}/${slot}`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );
  const sharedAvatarId = slotRes.data?.sharedAvatarId;
  if (!sharedAvatarId) throw new Error("sharedAvatarId alınamadı");

  const avatarRes = await axios.get(
    `https://api.wolvesville.com/avatars/${sharedAvatarId}`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );
  const url = avatarRes.data?.avatar?.url;
  if (!url) throw new Error("Avatar URL alınamadı");
  return url;
}

/* 📊 Function call sonucunu işle */
async function handleFunctionCall(name, args, senderPlayerId = null) {
  if (name === "get_avatar") {
    if (!senderPlayerId) return { error: "Oyuncu ID bulunamadı." };
    try {
      const url = await fetchAvatarUrl(senderPlayerId, args.slot);
      return { success: true, avatarUrl: url };
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === "get_member_stats") {
    const members = await fetchMemberStats();
    const { username, metric, period } = args;

    // Belirli üye filtresi
    const filtered = username
      ? members.filter(m => m.username?.toLowerCase() === username.toLowerCase())
      : members;

    if (filtered.length === 0) {
      return { error: `"${username}" adında bir üye bulunamadı.` };
    }

    const result = filtered.map(m => {
      const entry = { username: m.username, level: m.level };

      if (metric === "xp" || metric === "all") {
        entry.xp = {
          week: m.xpDurations?.week ?? 0,
          month: m.xpDurations?.month ?? 0
        };
        if (metric === "xp") {
          // Sadece istenen period'u döndür
          entry.xp = { [period]: m.xpDurations?.[period] ?? m.xpDurations?.week ?? 0 };
        }
      }

      if (metric === "gold" || metric === "all") {
        entry.gold = { [period]: m.donated?.gold?.[period] ?? 0 };
      }

      if (metric === "gems" || metric === "all") {
        entry.gems = { [period]: m.donated?.gems?.[period] ?? 0 };
      }

      return entry;
    });

    // Sıralama: tek metrik istendiyse büyükten küçüğe sırala
    if (metric !== "all" && !username) {
      result.sort((a, b) => {
        const valA = metric === "xp" ? (a.xp?.[period] ?? 0) : (a[metric]?.[period] ?? 0);
        const valB = metric === "xp" ? (b.xp?.[period] ?? 0) : (b[metric]?.[period] ?? 0);
        return valB - valA;
      });
    }

    return { members: result, total: result.length };
  }

  return { error: "Bilinmeyen fonksiyon." };
}

/* 🤖 Gemini'ye sor (function calling destekli) */
async function askGemini(userMessage, recentMessages = [], senderPlayerId = null) {
  if (!GEMINI_API_KEY) throw new Error("Eksik env: GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

  const chatContext = recentMessages.length > 0
    ? "Son klan sohbeti:\n" +
      recentMessages.map(m => {
        if (m.username === "zncibot") return `[zncibot yanıtladı]: ${m.msg}`;
        if (m.msg.trim().toLowerCase().startsWith("!zncibot ")) {
          return `[${m.username} sordu]: ${m.msg.trim().slice("!zncibot ".length).trim()}`;
        }
        return `[${m.username}]: ${m.msg}`;
      }).join("\n") + "\n\n"
    : "";

  // İlk istek
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Anladım, zncibot olarak yanıt vereceğim." }] },
    { role: "user", parts: [{ text: chatContext + userMessage }] }
  ];

  const apiConfig = {
    tools: TOOLS,
    generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
    thinkingConfig: { thinkingBudget: 0 }
  };

  let res = await axios.post(url, { contents, ...apiConfig }, {
    headers: { "Content-Type": "application/json" }
  });

  const candidate = res.data?.candidates?.[0];

  // Function call istedi mi?
  const functionCallPart = candidate?.content?.parts?.find(p => p.functionCall);

  if (functionCallPart) {
    const { name, args } = functionCallPart.functionCall;
    console.log(`🔧 Function call: ${name}`, args);

    const fnResult = await handleFunctionCall(name, args, senderPlayerId);
    console.log(`📊 Sonuç:`, JSON.stringify(fnResult).slice(0, 200));

    // Kritik: candidate.content olduğu gibi push et (thought_signature dahil)
    contents.push(candidate.content);

    if (name === "get_avatar" && fnResult.success && fnResult.avatarUrl) {
      // functionResponse + görsel + yorum isteği ayrı mesaj olarak
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: { success: true } } }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Görseli aldım." }]
      });
      contents.push({
        role: "user",
        parts: [
          { fileData: { mimeType: "image/png", fileUri: fnResult.avatarUrl } },
          { text: "Bu Wolvesville avatar görselini yorumla. Eğer skin siyahi değil ise klanın temasına uygun olmadığını belirt ve yorumlama ve 'bu skin ne alaka' gibi yorum yapıp şaşır" }
        ]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: fnResult } }]
      });
    }

    res = await axios.post(url, { contents, ...apiConfig }, {
      headers: { "Content-Type": "application/json" }
    });
  }

  const text = res.data?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
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

/* 👤 Player ID → Username önbelleği */
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
    } catch {}
  }

  // ─── 1) LEDGER ───────────────────────────────────────────────────────────
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

  // ─── 2) CHAT ─────────────────────────────────────────────────────────────
  console.log("💬 Sohbet kontrol ediliyor...");

  const chatMessages = await fetchChatMessages(lastRunDate);

  const allPlayerIds = [...new Set(chatMessages.map(m => m.playerId).filter(Boolean))];
  await Promise.all(allPlayerIds.map(id => fetchUsername(id)));

  const messagesWithUsername = chatMessages.map(m => ({
    ...m,
    username: m.playerId === BOT_PLAYER_ID ? "zncibot" : (usernameCache[m.playerId] || m.playerId?.slice(0, 6) || "?")
  }));

  const botCommands = messagesWithUsername.filter(m =>
    m.msg.trim().toLowerCase().startsWith("!zncibot ")
  );

  if (botCommands.length === 0) {
    console.log("🔕 Yeni !zncibot komutu yok.");
  } else {
    botCommands.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(`🤖 ${botCommands.length} adet !zncibot komutu bulundu.`);

    const fullChatRes = await axios.get(
      `https://api.wolvesville.com/clans/${CLAN_ID}/chat`,
      { headers: { Authorization: `Bot ${API_TOKEN}` } }
    );
    const fullChat = Array.isArray(fullChatRes.data) ? fullChatRes.data : [];

    for (const cmd of botCommands) {
      const rawMessage = cmd.msg.trim().slice("!zncibot ".length).trim();
      if (!rawMessage) continue;

      // Zaten yanıtlandı mı?
      const botReplyAfterCmd = fullChat.find(
        m => m.playerId === BOT_PLAYER_ID && new Date(m.date) > new Date(cmd.date)
      );
      if (botReplyAfterCmd) {
        const newCmdAfterReply = fullChat.some(
          m => m.playerId !== BOT_PLAYER_ID &&
          m.msg?.trim().toLowerCase().startsWith("!zncibot ") &&
          new Date(m.date) > new Date(botReplyAfterCmd.date)
        );
        if (!newCmdAfterReply) {
          console.log(`⏭️  Zaten yanıtlandı, atlanıyor: "${rawMessage}"`);
          continue;
        }
      }

      const userMessage = `${cmd.username} diyor ki: ${rawMessage}`;
      console.log(`🔍 İşleniyor: "${rawMessage}" (${cmd.username})`);

      const contextMessages = messagesWithUsername
        .filter(m => new Date(m.date) < new Date(cmd.date))
        .slice(-15);

      try {
        const reply = await askGemini(userMessage, contextMessages, cmd.playerId);
        console.log(`🤖 Gemini yanıtı (${reply.length} karakter):`, reply);
        await sendChatMessage(reply);
        console.log("🤖 Gönderildi.");
      } catch (err) {
        console.error("❌ Gemini hatası:", err.message);
      }

      const cmdDate = new Date(cmd.date);
      if (cmdDate > newestDate) newestDate = cmdDate;
    }
  }

  // ─── 3) STATE ─────────────────────────────────────────────────────────────
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
