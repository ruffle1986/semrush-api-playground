const debug = require('debug')('exec');
const childp = require('child_process');

function exec(apiKey) {
  return (url, params) => {
    const cmd = [
      'curl -H "Content-Type: application/json"',
      `${url}?key=${apiKey}`,
      params ? `-d '${JSON.stringify(params)}'` : undefined,
    ].filter(Boolean).join(' ');
    return new Promise((resolve) => {
      debug('run command: ', cmd);
      childp.exec(cmd, (err, response) => {
        if (err) {
          throw err;
        }
        resolve(response && JSON.parse(response));
      });
    });
  };
}

module.exports = exec;
