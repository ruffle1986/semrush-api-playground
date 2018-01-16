require('dotenv').config();
const debug = require('debug')('seo-content-template');
const exec = require('../utils/exec')(process.env.SEMRUSH_API_KEY);
const sleep = require('../utils/sleep');

const baseUrl = 'https://www.semrush.com/seoideas/api/sct/checks';
const initUrl = baseUrl;
const pingUrl = `${baseUrl}/status`;
const finalUrl = processId => `${baseUrl}/${processId}/ideas`;

function launch() {
  debug('start collectig ideas.');
  return exec(initUrl, {
    keywords: (process.argv[2] || '').split(',').map(k => k.trim().split('+').join(' ')),
    language: 'en',
    location: 'United States',
    country: 'us',
    device: 'desktop',
  });
}

function ping(options = {}, callNum = 1) {
  debug('ping.');
  const callLimit = options.callLimit || Infinity;
  return new Promise(async (resolve) => {
    const state = await exec(pingUrl);
    if (state.status === 'RUNNING' && callNum < callLimit) {
      await sleep(1000);
      await ping({
        ...options,
        originalResolve: options.originalResolve || resolve,
      }, callNum + 1);
    } else if (options.originalResolve) {
      debug('collecting ideas is done.');
      options.originalResolve(state);
    }
  });
}

async function getResult(processId) {
  debug('start fetching the final result');
  const { ideas, serps } = await exec(finalUrl(processId));
  debug('got the final result');
  const recommendedLength = ideas.content_length[0].items.competitors_length;
  const relatedWords = ideas.related[0].items.slice(0, 5);
  const backlinks = ideas.backlinks[0].items.slice(0, 5);
  const rivals = Object.keys(serps).reduce((acc, keyword) => {
    serps[keyword].forEach((rival) => {
      acc.push(rival.url);
    });
    return acc;
  }, []).slice(0, 5);
  return {
    recommendedLength,
    relatedWords,
    backlinks,
    rivals,
  };
}

(async function run() {
  // 1. start the collecting process
  await launch();

  // 2. ping to check if the process is done
  const { id: processId } = await ping();

  // 3. collect the final result by the process id
  const result = await getResult(processId);

  debug('done %o', JSON.stringify(result));
}());
