let web3ApiModule = require('./web3-api.js');
let config = require('./config/config.js');
let parseParam =  function(param){
    if(param!=undefined){
        var _val = param.value;
        if(_val==undefined){
            return undefined;
        }
        else if(param.type == 'uint' || param.type == 'uint256' || param.type == 'uint8'){
            if(typeof _val == 'number'){
                return _val;
            }
            else if(typeof _val == 'string'){
                return parseInt(_val);
            }
        }
        else if(param.type == 'string'){
            if(typeof _val == 'number'){
                return ''+_val;
            }
            else if(typeof _val == 'string'){
                return _val;
            }
        }
        else if(param.type == 'address'){
                return ""+_val;
        }
        console.warn('param does not match with any type');
        return undefined;

    }
}

let getArguments = function(constructorParam){
    if(!constructorParam){
        return [];
    }
    var _count = constructorParam.count;
    var paramMap = constructorParam.args;
    var arguments = [];
    if(paramMap!=undefined){
        for(var i=0;i<_count;i++){
            arguments.push(parseParam(paramMap[i]));
        }
    }
    return arguments;
}

let web3HelperModule = function(web3Config){
let self = this;
let web3Api = new web3ApiModule(web3Config);

/*
var inputParams  = {
    abi : abi,
    methodArgs : _methodArgs,
    from : fromAddress,
    data:byteData,
    address : _address,
    methodName : _methodName,
    privateKey : newPrivateKey
}

let callbackImpl = function(error, transactionHash){

}

let completionCallback = function(error,transactionObj){

}

sendTransaction(inputParams, callbackImpl, completionCallback);
*/
self.sendTransaction = function(params,callbackImpl, completionCallback, mine){
    let _args = getArguments(params.methodArgs);
    //console.log('****params.methodArgs****',params.methodArgs);
    //console.log('****_args****',_args);
    params.args = _args;
    web3Api.sendTransaction(params, callbackImpl, completionCallback, mine);
}

self.createContract = function(abi,contractNewData,privateKey,callbackImpl,callBackFnWithContractInstance,methodArgs){
    let _args = getArguments(methodArgs);
    web3Api.createContractNew(abi,contractNewData,privateKey,callbackImpl,callBackFnWithContractInstance,_args);
}

/*
{
        abi : abi,
        args : _args,
        from : fromAddress,
        data:byteData,
        address : _address,
        methodName : _methodName
    }

    callbackFn : function(error,result){
            console.log('@@@@In Call',error,result);
            if(result)
                res.send(result);
        }
*/
self.call = function(reqObj, callbackFn){
    //console.log('reqObj.methodArgs:',reqObj.methodArgs);
    let _args = getArguments(reqObj.methodArgs);
    //console.log('_args:',_args);
    reqObj.args  = _args;
    reqObj.callbackFn = callbackFn;
    web3Api.call(reqObj, callbackFn);
}

self.initSign = function(documentId, initHash, emailId,email2, mine){
    console.log("###mine ", mine);
    let _contract = config.contracts.signer3;
    let _account1 = config.account1;
    let _privateKey1 = config.privateKey1;
    let _timestampSec = new Date().getTime();
    let _timestamp = ''+ _timestampSec;

    var inputParams  = {
        abi : _contract.abi,
        methodArgs : {
            count : 5,
            args :
                {
                 "0" : {type : 'string', value : documentId},
                 "1" : {type : 'string', value : initHash}
                }
            },
        from : _account1,
        data:_contract.data,
        address : _contract.address,
        methodName : 'initSign',
        privateKey : _privateKey1,
        gasLimit : 3000000000000
    }

    let callbackImpl = function(error, transactionHash){
     console.log('transactionHash:',transactionHash);
    }

    return new Promise(function(resolve, reject){
        let completionCallback = function(error,transactionObj){
            console.log("#####incompleteCallBack", transactionObj);
             if(!error){
                resolve(transactionObj);
             }else{
                resolve(undefined);
             }
        }

        self.sendTransaction(inputParams, callbackImpl, completionCallback);
    });

}

self.finishSign = function(documentId, signHash, signLocation, email, mine, encryptedEmail){

    console.log("####finishSign", documentId, signHash, signLocation, email, mine, encryptedEmail);

    let _timestampSec = new Date().getTime();
    let _timestamp = ''+ _timestampSec;
    let _contract = config.contracts.signer3;
    let _account1 = config.account1;
    let _privateKey1 = config.privateKey1;

    var inputParams  = {
        abi : _contract.abi,
        methodArgs : {
            count : 5,
            args :
                {
                 "0" : {type : 'string', value : documentId},
                 "1" : {type : 'string', value : signHash},
                 "2" : {type : 'string', value : _timestamp},
                 "3" : {type : 'string', value : signLocation},
                 "4" : {type : 'string', value : encryptedEmail}
                }
            },
        from : _account1,
        data:_contract.data,
        address : _contract.address,
        methodName : 'finishSign',
        privateKey : _privateKey1,
        gasLimit : 3000000000000
    }

    let callbackImpl = function(error, transactionHash){
     console.log('transactionHash:',transactionHash);
    }

    return new Promise(function(resolve, reject){
        let completionCallback = function(error,transactionObj){
             if(!error){
                resolve(transactionObj);
             }else{
                resolve(undefined);
             }
        }

        self.sendTransaction(inputParams, callbackImpl, completionCallback, mine);
    });


}

/*
Output :
{ documentId: 'document4',
  initHash: 'hash4',
  email: 'email4@abc.com',
  signedHash: 'signedhash4',
  isSigned: true,
  timestamp: '1511509100831' }
*/
self.getSignDetails = function(documentId){
    let _contract = config.contracts.signer3;
    let _account1 = config.account1;

    return new Promise(function(resolve, reject){
        self.call({
            abi : _contract.abi,
            methodArgs : { count : 1, args : {"0" : {type : 'string', value : documentId}}},
            from : _account1,
            data:_contract.data,
            address : _contract.address,
            methodName : 'getDetails'
        }, function(error,_signDetailsArr){

                //console.log('_signDetailsArr:',_signDetailsArr);
                let _signDetails = {};
                if(!error && _signDetailsArr && _signDetailsArr.length > 0){
                    _signDetails.signedHash = _signDetailsArr[0];
                    _signDetails.initHash = _signDetailsArr[1];
                    _signDetails.email = _signDetailsArr[2];
                    _signDetails.timestamp = _signDetailsArr[3];
                    _signDetails.email2 = _signDetailsArr[4];
                    _signDetails.initTimestamp = _signDetailsArr[5];
                    _signDetails.signLocation = _signDetailsArr[6];
                     _signDetails.documentId = documentId;

                    resolve(_signDetails);
                    //console.log('_signDetails:',_signDetails);
                }
                else{
                    resolve(_signDetails);
                }
           }
        );
    });

}

self.getSignDetailsFromHash = function(documentId){
    let _contract = config.contracts.signer3;
    let _account1 = config.account1;

    return new Promise(function(resolve, reject){
        self.call({
            abi : _contract.abi,
            methodArgs : { count : 1, args : {"0" : {type : 'string', value : documentId}}},
            from : _account1,
            data:_contract.data,
            address : _contract.address,
            methodName : 'getDetailsFromHash'
        }, function(error,_signDetailsArr){
                let _signDetails = {};
                if(!error && _signDetailsArr && _signDetailsArr.length > 0){
                     _signDetails.documentId = _signDetailsArr[0];
                    _signDetails.initHash = _signDetailsArr[1];
                    _signDetails.email = _signDetailsArr[2];
                    _signDetails.timestamp = _signDetailsArr[3];
                    _signDetails.email2 = _signDetailsArr[4];
                    _signDetails.initTimestamp = _signDetailsArr[5];
                    _signDetails.signLocation = _signDetailsArr[6];
                    if(_signDetails.email && _signDetails.email!=''){
                        _signDetails.signedHash = documentId;
                    }else{
                        _signDetails.signedHash = '';
                    }
                    resolve(_signDetails);
                    //console.log('_signDetails:',_signDetails);
                }
                else{
                    resolve(_signDetails);
                }
           }
        );
    });

}



}

if(module!=undefined && module.exports!=undefined){
    module.exports = web3HelperModule;
}
else{
    window.web3HelperModule = web3HelperModule;
}