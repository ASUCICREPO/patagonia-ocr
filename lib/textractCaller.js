const AWS = require('aws-sdk');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
});

module.exports = async (bill) => {
  console.log(bill);
};

const waitForAsyncExecution = async (jobID) => {
  let exponentialBackoff = 100;

  /*
  while (true) {
    var data = await athena.getAsyncExecution({
      AsyncExecutionId: jobId
    }).promise();
    const state = data.AsyncExecution.Status.State;
    console.log('state: ', state);
    if (state === 'SUCCEEDED') {
      return state;
    } else if (state === 'FAILED' || state === 'CANCELLED') {
      throw Error(`Async ${jobId} failed`);
    } else {
      if(exponentialBackoff <= 51200) { // should retry at least 10 times (total ~100seconds)
        await new Promise(resolve => setTimeout(resolve, exponentialBackoff));
        exponentialBackoff *= 2;
      } else {
        console.log(`TIMEOUT waiting for job ${jobID}`);
        return 'TIMEOUT';
      }
    }
  }
  */
};
