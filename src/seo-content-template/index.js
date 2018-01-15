/* eslint-disable no-console */

require('dotenv').config();
const { exec } = require('child_process');

const initUrl = 'https://www.semrush.com/seoideas/api/sct/checks';
const pingUrl = 'https://www.semrush.com/seoideas/api/sct/checks/status';
const keywords = (process.argv[2] || '').split(',').map(k => k.trim().split('+').join(' '));
const apiKey = process.env.SEMRUSH_API_KEY;

if (!apiKey) {
  throw new Error('The semrush api key must be provided.');
}

const params = {
  keywords,
  language: 'en',
  location: 'United States',
  country: 'us',
  device: 'desktop',
};

function ping() {
  exec([

    'curl -H "Content-Type: application/json"',
    `${pingUrl}?key=${apiKey}`,

  ].join(' '), (err, data) => {
    if (err) {
      throw err;
    }
    try {
      const response = JSON.parse(data);
      if (response.status === 'RUNNING') {
        // try it with async/await and while loop
        ping();
      } else {
        console.log('Collecting ideas is done.');
        const pid = response.id;

        /* Get the ideas finally  */
        exec([
          'curl -H "Content-Type: application/json"',
          `https://www.semrush.com/seoideas/api/sct/checks/${pid}/ideas?key=${apiKey}`,
        ].join(' '), (err3, data2) => {
          if (err3) {
            throw err3;
          }
          try {
            const { ideas, serps } = JSON.parse(data2);
            const recommendedLength = ideas.content_length[0].items.competitors_length;
            const relatedWords = ideas.related[0].items.slice(0, 5);
            const backlinks = ideas.backlinks[0].items.slice(0, 5);
            const rivals = Object.keys(serps).reduce((acc, keyword) => {
              serps[keyword].forEach((rival) => {
                acc.push(rival.url);
              });
              return acc;
            }, []).slice(0, 5);

            console.log('the recommended length is:', recommendedLength);
            console.log('the related words are:', relatedWords.join(', '));
            console.log('potential backlink providers: ', backlinks.join(', '));
            console.log('your rivals are: ', rivals.join(', '));
          } catch (err4) {
            throw err4;
          }
        });
      }
    } catch (err2) {
      throw err2;
    }
  });
}

exec([

  'curl -H "Content-Type: application/json"',
  `${initUrl}?key=${apiKey}`,
  `-d '${JSON.stringify(params)}'`,

].join(' '), (err) => {
  if (err) {
    throw err;
  }

  ping();
});
