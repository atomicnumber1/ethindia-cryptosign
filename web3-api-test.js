let web3ApiModule = require('./web3-api.js');
let web3Api = new web3ApiModule('http://localhost:8545');
console.log('----------web3Api------------');
console.log(web3Api.currentProvider);