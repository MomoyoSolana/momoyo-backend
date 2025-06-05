// 🌐 MOMOYO BACKEND - Google Apps Script

const TELEGRAM_BOT_TOKEN = '7784225762:AAFHUlr-negLRMMOVtETSGt58PWGmQiv4gE';
const ADMIN_CHAT_ID = '6431046364';

function doPost(e) {
  const { action, data } = JSON.parse(e.postData.contents);

  switch (action) {
    case 'submit_transaction':
      return jsonResponse(submitTransaction(data));
    case 'get_transactions':
      return jsonResponse(getTransactions(data.userId));
    case 'submit_staking':
      return jsonResponse(submitStaking(data));
    case 'claim_staking':
      return jsonResponse(claimStaking(data));
    case 'unstake':
      return jsonResponse(unstake(data));
    case 'get_user_balance':
      return jsonResponse(getUserBalance(data.userId));
    default:
      return jsonResponse({ error: 'Invalid action' });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 📥 Submit Buy/Sell/Withdraw
function submitTransaction(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('transactions');
  const id = "tx_" + new Date().getTime();
  const row = [
    id,
    data.userId,
    data.userWallet,
    data.amount,
    data.type,
    data.txHash || '',
    'pending',
    new Date().toISOString()
  ];
  sheet.appendRow(row);

  sendTelegramNotif(`📝 *New ${data.type.toUpperCase()}*
User: ${data.userId}
Amount: ${data.amount}`);

  return { success: true, id };
}

// 📤 Fetch user transactions
function getTransactions(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('transactions');
  const rows = sheet.getDataRange().getValues();
  return rows
    .filter(r => r[1] === userId)
    .map(r => ({
      id: r[0], userId: r[1], userWallet: r[2], amount: r[3],
      type: r[4], txHash: r[5], status: r[6], date: r[7]
    }));
}

// 📥 Submit staking
function submitStaking(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('staking');
  const id = "stake_" + new Date().getTime();
  sheet.appendRow([
    id, data.userId, data.pool, data.amount, new Date().toISOString(), 'active'
  ]);
  sendTelegramNotif(`📥 *New Stake*
User: ${data.userId}
Pool: ${data.pool}
Amount: ${data.amount}`);
  return { success: true, id };
}

// 🎁 Claim staking
function claimStaking(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('staking');
  const rows = sheet.getDataRange().getValues();
  let updated = false;
  for (let i = 1; i < rows.length; i++) {
    const [id, userId, pool, amount, date, status] = rows[i];
    if (userId === data.userId && pool === data.pool && status === 'active') {
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      updated = true;
      break;
    }
  }
  if (updated) {
    sendTelegramNotif(`🎁 *Claim Reward*
User: ${data.userId}
Pool: ${data.pool}`);
  }
  return { success: updated };
}

// 🔁 Unstake
function unstake(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('staking');
  const rows = sheet.getDataRange().getValues();
  let unstakedAmount = 0;
  for (let i = 1; i < rows.length; i++) {
    const [id, userId, pool, amount, date, status] = rows[i];
    if (userId === data.userId && pool === data.pool && status === 'active') {
      sheet.getRange(i + 1, 6).setValue('unstaked');
      unstakedAmount += Number(amount);
    }
  }
  sendTelegramNotif(`🔓 *Unstake*
User: ${data.userId}
Pool: ${data.pool}
Amount: ${unstakedAmount}`);
  return { success: true, unstakedAmount };
}

// 💰 Get user balance
function getUserBalance(userId) {
  const txSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('transactions');
  const tx = txSheet.getDataRange().getValues().filter(row => row[1] === userId && row[6] === 'approved');

  let balance = 0;

  tx.forEach(row => {
    const type = row[4];
    const amount = parseFloat(row[3]);

    if (type === 'buy') {
      balance += amount * 2500000000; // Asumsi nilai tukar
    } else if (type === 'sell' || type === 'withdraw') {
      balance -= amount;
    }
  });

  const stakeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('staking');
  const stakes = stakeSheet.getDataRange().getValues().filter(row => row[1] === userId && row[5] === 'active');

  stakes.forEach(row => {
    const amount = parseFloat(row[3]);
    balance -= amount; // staking aktif dikurangi dari balance
  });

  return { balance };
}

// 🤖 Kirim Notifikasi Telegram
function sendTelegramNotif(msg) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: ADMIN_CHAT_ID,
    text: msg,
    parse_mode: 'Markdown'
  };
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
