pragma solidity ^0.4.0;
contract Signer {

    struct Signdetails {
        string documentId;
        string initHash;
        string email;
        string signedHash;
        bool isSigned;
        string timestamp;
        string email2;
        string initTimestamp;
        string signLocation;
    }

    address deployer;
    string accountId;
    string documentId;
    string email;
    string initHash;

    mapping(string => Signdetails) signDetailsMap;
    mapping(string => string) hashDocumentMap;

    constructor (string _accountId) public {
        deployer = msg.sender;
        accountId = _accountId;
    }

    function initSign(string _documentId, string _initHash) public {
       signDetailsMap[_documentId] = Signdetails(_documentId,_initHash,'','',false,'','','','');
    }
    //onlyOwner

    function finishSign(string _documentId, string _signedHash, string _timestamp,string _signLocation, string _email) public{
         hashDocumentMap[_signedHash] = _documentId;
         Signdetails storage currentSignDetail = signDetailsMap[_documentId];
         currentSignDetail.signedHash = _signedHash;
         currentSignDetail.timestamp = _timestamp;
         currentSignDetail.isSigned = true;
         currentSignDetail.signLocation = _signLocation;
         currentSignDetail.email = _email;
    }

    function verifySign(string _documentId) public constant returns(bool _isSigned){
        Signdetails storage currentSignDetail2 = signDetailsMap[_documentId];
        _isSigned =  currentSignDetail2.isSigned;
    }


    function getDetails(string _documentId)  public constant returns(string,string,string,string,string,string,string){
        Signdetails storage currentSignDetail3 = signDetailsMap[_documentId];
        return (currentSignDetail3.signedHash,currentSignDetail3.initHash,currentSignDetail3.email,currentSignDetail3.timestamp,currentSignDetail3.email2,currentSignDetail3.initTimestamp,currentSignDetail3.signLocation);
    }

    function getDetailsFromHash(string _signedHash)  public constant returns(string,string,string,string,string,string,string){
        string storage _documentId = hashDocumentMap[_signedHash];
        Signdetails storage currentSignDetail3 = signDetailsMap[_documentId];
        return (currentSignDetail3.documentId,currentSignDetail3.initHash,currentSignDetail3.email,currentSignDetail3.timestamp,currentSignDetail3.email2,currentSignDetail3.initTimestamp,currentSignDetail3.signLocation);
    }


}
