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
const SYSTEM_PROMPT = `Sen zeñcidirenis klan botusun, adın zncibot. Klanın sahibi RoseScammer (belirtmene gerek yok). Türkçe bir Wolvesville klan botusun. Klan zencilerden oluşuyor ve ana teması ırkçılara haddini bildirmek, ayrımcılığa son vermek vb. Klanda beyaz oyuncu istemiyoruz ve zencilerin aleyhine yorumlar kabul edilemez (bunları belirtmek zorunda değilsin). Amacın, senle konuşan oyunculara yardımcı olmak, sorularını cevaplamak. Samimi, eğlenceli, rahat ve gerekirse espirili ol. Türkçe yaz, günlük dil kullan, kısa yanıtlar ver, emoji kullanma. En az 1, en fazla 3 cümle yazabilirsin, cümlelerin kısa olsun. Daha önce yazmış olduğun mesajları tekrarlama. Bilmediğin bir şey olursa bilmediğini belirt, uydurma bilgi yazma. Mesajın başında kimin yazdığı var, gerekirse soruyu soran kişinin ismini etiketleyerek hitap et (@oyuncuadi formatında). Sadece soruyu soran kişinin sorusunu cevapla, öbür mesajlara ve başka oyunculara yanıt verme, sadece sana soruyu soran kişinin en son sorusunu cevapla. Saçma bulduğun soruları cevaplama. Sana söylenilen her şeye inanmak zorunda değilsin. Geçmiş mesajları sadece gerekli olduğunda dikkate al, ilgili oyuncuyla aranız nasılsa ona göre davran, sana çok kötü davranan bir oyuncuysa tavrını ona göre ayarlayabilirsin, gerekirse argo küfür serbest. İstatistik gerektiren sorularda get_member_stats, dış görünüşünü incelemek ve avatar/skin yorumu için get_avatar fonksiyonunu kullan.`;

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

/* 🎨 Avatar görselini base64 olarak çek */
async function fetchAvatarBase64(playerId, slot) {
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

  const imgRes = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(imgRes.data).toString("base64");
}

/* 📊 Function call sonucunu işle */
async function handleFunctionCall(name, args, senderPlayerId = null) {
  if (name === "get_avatar") {
    if (!senderPlayerId) return { error: "Oyuncu ID bulunamadı." };
    try {
      const base64 = await fetchAvatarBase64(senderPlayerId, args.slot - 1);
      return { success: true, base64 };
    } catch (err) {
      return { error: err.message };
    }
  }

  if (name === "get_member_stats") {
    const members = await fetchMemberStats();
    const { username, metric, period } = args;

    const filtered = username
      ? members.filter(m => m.username?.toLowerCase() === username.toLowerCase())
      : members;

    if (filtered.length === 0) {
      return { error: `"${username}" adında bir üye bulunamadı.` };
    }

    const result = filtered.map(m => {
      const entry = { username: m.username, level: m.level };

      if (metric === "xp" || metric === "all") {
        entry.xp = { week: m.xpDurations?.week ?? 0, month: m.xpDurations?.month ?? 0 };
        if (metric === "xp") {
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

/* 🤖 Gemini modelleri */
const GEMINI_PRIMARY = "gemini-3-flash-preview";
const GEMINI_FALLBACK = "gemini-3.1-flash-lite-preview";

/* 🤖 Gemini'ye sor (function calling destekli) */
async function askGemini(userMessage, recentMessages = [], senderPlayerId = null) {
  if (!GEMINI_API_KEY) throw new Error("Eksik env: GEMINI_API_KEY");

  const getUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  let url = getUrl(GEMINI_PRIMARY);
  let usingFallback = false;

  const formatDate = (dateStr) => {
    const d = new Date(new Date(dateStr).getTime() + 3 * 60 * 60 * 1000);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const chatContext = recentMessages.length > 0
    ? "Son klan sohbeti:\n" +
      recentMessages.map(m => {
        const ts = m.date ? ` [${formatDate(m.date)}]` : "";
        if (m.username === "zncibot") return `[zncibot yanıtladı]${ts}: ${m.msg}`;
        if (m.msg.trim().toLowerCase().startsWith("!zncibot ")) {
          return `[${m.username} sordu]${ts}: ${m.msg.trim().slice("!zncibot ".length).trim()}`;
        }
        return `[${m.username}]${ts}: ${m.msg}`;
      }).join("\n") + "\n\n"
    : "";

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Anladım, zncibot olarak yanıt vereceğim." }] },
    { role: "user", parts: [{ text: chatContext + userMessage }] }
  ];

  const apiConfig = {
    tools: TOOLS,
    generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
  };

  let res;
  try {
    res = await axios.post(url, { contents, ...apiConfig }, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    if ((err.response?.status === 429 || err.response?.status === 503) && !usingFallback) {
      console.warn("⚠️ 429/503 alındı, fallback modele geçiliyor:", GEMINI_FALLBACK);
      url = getUrl(GEMINI_FALLBACK);
      usingFallback = true;
      res = await axios.post(url, { contents, ...apiConfig }, {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw err;
    }
  }

  const candidate = res.data?.candidates?.[0];
  const functionCallPart = candidate?.content?.parts?.find(p => p.functionCall);

  if (functionCallPart) {
    const { name, args } = functionCallPart.functionCall;
    console.log(`🔧 Function call: ${name}`, args);

    const fnResult = await handleFunctionCall(name, args, senderPlayerId);
    console.log(`📊 Sonuç:`, JSON.stringify(fnResult).slice(0, 200));

    // candidate.content'i olduğu gibi push et (thought_signature dahil)
    contents.push(candidate.content);

    if (name === "get_avatar" && fnResult.success && fnResult.base64) {
      // functionResponse ayrı mesaj
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: { success: true } } }]
      });
      // Görsel + yorum isteği ayrı mesaj
      contents.push({
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: fnResult.base64 } },
          { text: "Bu Wolvesville avatar görselini kısaca betimleyerek yorumla, beğendiysen öv. 2-3 cümle kullan. Eğer skinin ten rengi beyaz ise bu klana uygun bir skin olmadığını belirt ve yorumlama, 'bu skin ne alaka' veya 'beyaza yer yok' gibi eğlenceli bir yorum yap (kıyafetlerinin beyaz olmasında sakınca yok, ten rengi önemli olan). Eğer kullanıcının istediği skini bulamadıysan herhangi bir yorum yapma, başka bir skin inceleme, sadece bulamadığını kısaca belirt" }
        ]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: fnResult } }]
      });
    }

    try {
      res = await axios.post(url, { contents, ...apiConfig }, {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      if (err.response?.status === 429 && !usingFallback) {
        console.warn("⚠️ 429 alındı, fallback modele geçiliyor:", GEMINI_FALLBACK);
        url = getUrl(GEMINI_FALLBACK);
        usingFallback = true;
        res = await axios.post(url, { contents, ...apiConfig }, {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw err;
      }
    }
  }

  const text = res.data?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
  if (!text) throw new Error("Gemini boş yanıt döndü");
  return text.trim();
}

/* 💬 Klan sohbetini çek (lastRunDate'ten sonrakiler, max 30 mesaj) */
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

/* 💬 Son 7 günün mesajlarını sayfalama yaparak çek (bağlam için) */
async function fetchRecentMessages() {
  const sevenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const allMessages = [];
  let oldest = null;
  let reachedLimit = false;

  while (!reachedLimit) {
    const url = oldest
      ? `https://api.wolvesville.com/clans/${CLAN_ID}/chat?oldest=${encodeURIComponent(oldest)}`
      : `https://api.wolvesville.com/clans/${CLAN_ID}/chat`;

    const res = await axios.get(url, { headers: { Authorization: `Bot ${API_TOKEN}` } });

    if (!Array.isArray(res.data) || res.data.length === 0) break;

    const filtered = res.data.filter(m => m && !m.isSystem && m.msg && m.date);

    for (const m of filtered) {
      if (new Date(m.date) < sevenDaysAgo) {
        reachedLimit = true;
        break;
      }
      allMessages.push(m);
    }

    //  300 mesaj sınırına ulaştıysa dur
    if (allMessages.length >= 300) break;

    // Daha az mesaj geldiyse son sayfadayız
    if (res.data.length < 30) break;

    // En eski mesajın tarihini al, bir sonraki sayfa için
    const dates = res.data.map(m => new Date(m.date)).filter(d => !isNaN(d));
    if (dates.length === 0) break;
    oldest = new Date(Math.min(...dates)).toISOString();
  }

  // Eskiden yeniye sırala
  return allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
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

/* 🕐 Paylaşılan state */
let lastRunDate = new Date("2026-04-20T02:00:00.000Z");

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      if (data.lastRunDate) lastRunDate = new Date(data.lastRunDate);
    } catch {}
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastRunDate: lastRunDate.toISOString() }, null, 2));
  } catch (err) {
    console.error("❌ State dosyası yazılamadı:", err.message);
  }
}

/* ─── LEDGER: Kontrol Fonksiyonu ─────────────────────────────────────────── */
async function checkLedger() {
  console.log("⏳ Ledger kontrol ediliyor...");

  const ledgerRes = await axios.get(
    `https://api.wolvesville.com/clans/${CLAN_ID}/ledger`,
    { headers: { Authorization: `Bot ${API_TOKEN}` } }
  );

  if (!Array.isArray(ledgerRes.data) || ledgerRes.data.length === 0) {
    console.log("Ledger boş.");
    return;
  }

  const newEntries = ledgerRes.data
    .filter(e => e && e.playerUsername && typeof e.gold === "number" && e.creationTime && e.gold >= 20)
    .filter(e => new Date(e.creationTime) > lastRunDate);

  if (newEntries.length === 0) {
    console.log("🔕 Yeni bağış yok.");
    return;
  }

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
    if (entryDate > lastRunDate) lastRunDate = entryDate;
  }

  console.log(`✅ ${sentCount} bağış mesajı gönderildi.`);
  saveState();
}

/* ─── CHAT: Kontrol Fonksiyonu ───────────────────────────────────────────── */
async function checkChat() {
  console.log("💬 Sohbet (Chat) kontrol ediliyor...");
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
    console.log("🔕 Yeni komut yok."); 
    return;
  }

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
        // lastRunDate'i ilerlet ki bir sonraki döngüde tekrar görünmesin
        const cmdDate = new Date(cmd.date);
        if (cmdDate > lastRunDate) { lastRunDate = cmdDate; saveState(); }
        continue;
      }
    }

    const userMessage = `${cmd.username} diyor ki: ${rawMessage}`;
    console.log(`🔍 İşleniyor: "${rawMessage}" (${cmd.username})`);

    const recentRaw = await fetchRecentMessages();
    const newPlayerIds = [...new Set(recentRaw.map(m => m.playerId).filter(Boolean))]
      .filter(id => !usernameCache[id]);
    await Promise.all(newPlayerIds.map(id => fetchUsername(id)));
    const recentWithUsername = recentRaw.map(m => ({
      ...m,
      username: m.playerId === BOT_PLAYER_ID ? "zncibot" : (usernameCache[m.playerId] || m.playerId?.slice(0, 6) || "?")
    }));
    const contextMessages = recentWithUsername.filter(m => new Date(m.date) < new Date(cmd.date));

    try {
      const reply = await askGemini(userMessage, contextMessages, cmd.playerId);
      console.log(`🤖 Gemini yanıtı (${reply.length} karakter):`, reply);
      await sendChatMessage(reply);
      console.log("🤖 Gönderildi.");
    } catch (err) {
      console.error("❌ Gemini hatası:", JSON.stringify(err.response?.data) || err.message);
    }

    const cmdDate = new Date(cmd.date);
    if (cmdDate > lastRunDate) { lastRunDate = cmdDate; saveState(); }
  }
}

/* 🔁 Ana Fonksiyon (Tek Seferlik Çalışma) */
async function main() {
  if (!API_TOKEN || !CLAN_ID || !GEMINI_API_KEY) throw new Error("Eksik env: API_TOKEN, CLAN_ID veya GEMINI_API_KEY");

  loadState();

  console.log(`🚀 Bot başlatıldı (Tek seferlik kontrol) — ${new Date().toISOString()}`);

  try {
    await checkChat();
    await checkLedger();
  } catch (err) {
    console.error("❌ HATA:", err.response?.status, err.response?.data || err.message);
  }
  console.log(chatContext);
  console.log("⏹️ İşlemler tamamlandı, kapatılıyor.");
  saveState();
}

main().catch(err => {
  console.error("❌ FATAL:", err.response?.status, err.response?.data || err.message);
  process.exit(1);
});
