const puppeteer = require('puppeteer-core');
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInN1YiI6IjljODU4OTAxLThhNTctNDc5MS04MWZlLTRjNDU1YjA5OWJjOSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGVzIjpbInVzZXIiXSwic2Vzc2lvbl9pZCI6ImIzYzFmOWUwLTRhMmQtNGUzZi05YzFhLTJiM2M0ZDVlNmY3YSIsImlzcyI6ImF1dGgtc2VydmljZSIsImF1ZCI6InNvY2lhbC1hcHAiLCJpYXQiOjE3ODkzMDY4MDIsImV4cCI6MTc4OTM5MzIwMn0.-268HNQvfBBOe1ofulBlQ-USjR60-pbSUlLqegF6NeQ";

async function openChat(browser, chatId) {
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  const loginTextarea = await page.$('textarea');
  if (loginTextarea) {
    await page.type('textarea', token);
    await page.click('button.primary');
    await page.waitForSelector('.new-chat');
  }
  await page.goto(`http://localhost:5173/chats/${chatId}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('.status')?.textContent.trim() === 'connected', { timeout: 5000 });
  return page;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

  const tabA = await openChat(browser, 17);
  const tabB = await openChat(browser, 17);
  console.log('both tabs connected to chat 17');

  const uniqueText = 'realtime-' + Date.now();
  await tabA.type('.composer input', uniqueText);
  await tabA.click('.composer button.primary');

  await tabB.waitForFunction(
    (txt) => Array.from(document.querySelectorAll('.bubble .text')).some(el => el.textContent === txt),
    { timeout: 5000 },
    uniqueText,
  );
  console.log('tab B received the message in real time WITHOUT reload:', uniqueText);

  const tabAHasIt = await tabA.evaluate(
    (txt) => Array.from(document.querySelectorAll('.bubble .text')).some(el => el.textContent === txt),
    uniqueText,
  );
  console.log('tab A also shows it (server echo, no dup):', tabAHasIt);

  const tabACount = await tabA.$$eval('.bubble', els => els.length);
  console.log('tab A total bubbles (checking no duplicate rendering):', tabACount);

  await browser.close();
})();
