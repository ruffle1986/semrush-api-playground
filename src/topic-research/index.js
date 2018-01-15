require('dotenv').config();
const childp = require('child_process');
const fs = require('fs');

const baseUrl = 'https://www.semrush.com/topic-research/api/researches';
const initUrl = `${baseUrl}/launch`;
const pingUrl = `${baseUrl}/status`;
const apiKey = process.env.SEMRUSH_API_KEY;
const debug = !!process.env.DEBUG;

if (!apiKey) {
  throw new Error('The semrush api key must be provided.');
}

// 1. promisify child_process.exec
// 2. build curl command
const exec = (url, params) => {
  const cmd = [
    'curl -H "Content-Type: application/json"',
    `${url}?key=${apiKey}`,
    params ? `-d '${JSON.stringify(params)}'` : undefined,
  ].filter(Boolean).join(' ');
  if (debug) {
    // eslint-disable-next-line no-console
    console.log('running command: ', cmd);
  }
  return new Promise((resolve) => {
    childp.exec(cmd, (err, response) => {
      if (err) {
        throw err;
      }
      resolve(JSON.parse(response));
    });
  });
};

function launch(topic) {
  return exec(initUrl, {
    topic,
    domain: '',
    language: 'en',
    location: 'United States',
    device: 'desktop',
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function ping(options = {}, callNum = 1) {
  const callLimit = options.callLimit || Infinity;
  return new Promise(async (resolve) => {
    const state = await exec(pingUrl);
    if (state.collecting.length > 0 && callNum < callLimit) {
      await sleep(1000);
      await ping({
        ...options,
        originalResolve: options.originalResolve || resolve,
      }, callNum + 1);
    } else if (options.originalResolve) {
      options.originalResolve(state);
    }
  });
}

function getResult(id) {
  return exec(`${baseUrl}/${id}`);
}

(async function run() {
  try {
    // 1.
    await launch(process.argv[2]);

    // 2.
    const { snapshots = [] } = await ping({ callLimit: 3 });

    // 3.
    if (snapshots.length) {
      // it's enough to investigate only the latest snapshot.
      let { cards = [] } = await getResult(snapshots[snapshots.length - 1].id);
      // we need the top five based on keyword difficulty.
      cards = cards.sort((a, b) => b.difficulty - a.difficulty).slice(0, 5);
      fs.writeFileSync('./results.json', JSON.stringify(cards));
      // eslint-disable-next-line no-console
      console.log('done.');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('ERROR:', err);
  }
}());
