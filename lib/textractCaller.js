'use strict';

const AWS = require('aws-sdk');
const Textract = new AWS.Textract({
  apiVersion: '2018-06-27'
});

module.exports = async (bill) => {
  console.log(bill);

};

const waitForQueryExecution = async (queryExecutionId) => {

  console.log('\nwait for query: ', queryExecutionId);
  let exponentialBackoff = 100;

  while (true) {
    var data = await athena.getQueryExecution({
      QueryExecutionId: queryExecutionId
    }).promise();
    const state = data.QueryExecution.Status.State;
    console.log('state: ', state);
    if (state === 'SUCCEEDED') {
      return state;
    } else if (state === 'FAILED' || state === 'CANCELLED') {
      throw Error(`Query ${queryExecutionId} failed: ${data.QueryExecution.Status.StateChangeReason}`);
    } else {
      if(exponentialBackoff <= 51200) { // should retry at least 10 times (total ~100seconds)
        await new Promise(resolve => setTimeout(resolve, exponentialBackoff));
        exponentialBackoff *= 2;
      } else {
        console.log(`TIMEOUT waiting for query ${queryExecutionId}`);
        return 'TIMEOUT';
      }
    }
  }
};

