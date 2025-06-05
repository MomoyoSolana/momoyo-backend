import axios from 'axios';

const TELEGRAM_TOKEN = '7784225762:AAFHUlr-negLRMMOVtETSGt58PWGmQiv4gE'; // Masukkan token bot kamu
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQ73zIriJU4rQF-xNJonhJQdrKZjARE4fI61ECFua0a2lJ_hs61VgoexPg1JJ6AKTL/exec'; // Ganti dengan URL Apps Script kamu

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const message = req.body.message;
  if (!message || !message.chat || !message.text) {
    return res.status(200).end(); // Ignore if not valid
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const [command, ...args] = text.split(' ');
  const userId = String(chatId);

  switch (command) {
    case '/start':
      await sendMessage(chatId, `👋 Selamat datang!\nGunakan /stake, /unstake, /claim, atau /balance.`);
      break;

    case '/stake':
      if (args.length !== 1 || isNaN(args[0])) {
        await sendMessage(chatId, `❌ Format: /stake 100`);
        break;
      }
      await postToBackend(chatId, {
        action: 'submit_staking',
        data: { userId, pool: 'default', amount: args[0] }
      });
      break;

    case '/unstake':
      await postToBackend(chatId, {
        action: 'unstake',
        data: { userId, pool: 'default' }
      });
      break;

    case '/claim':
      await postToBackend(chatId, {
        action: 'claim_staking',
        data: { userId, pool: 'default' }
      });
      break;

    case '/balance':
      await postToBackend(chatId, {
        action: 'get_user_balance',
        data: { userId }
      });
      break;

    default:
      await sendMessage(chatId, `🤖 Perintah tidak dikenali.`);
  }

  res.status(200).end();
}

async function postToBackend(chatId, payload) {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, payload);
    const result = response.data;
    await sendMessage(chatId, `✅ ${JSON.stringify(result)}`);
  } catch (err) {
    console.error(err);
    await sendMessage(chatId, `⚠️ Terjadi kesalahan.`);
  }
}

async function sendMessage(chatId, text) {
  return axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
  });
}
