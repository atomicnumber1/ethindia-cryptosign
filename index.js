var express    = require('express');        // call express
var HummusRecipe = require('hummus-recipe');
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require("http");
var request = require('request');
const fileUpload = require('express-fileupload');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage })
//var upload = multer({ dest: 'storag/' })

var mailer = require('./config/mail');
var service = require('./services/commonService');
var config = require('./config/config');

var storagePath = './storage';
let web3HelperModule = require('./web3-helper.js');
//let multer  =   require('multer');
let web3Helper = new web3HelperModule({providerUrl : config.providerUrl});

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

//app use

//api expose path

//app.use(bodyParser.urlencoded({ extended: false }))
//app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
var options = {
    type: 'application/octet-stream',
    limit: '50mb'
  };
app.use(bodyParser.raw(options));
//app.use(bodyParser.json({limit: '50mb'}));
app.use('/api', router);


//serving pages and static files
//e.g. http://localhost:8080/pages/index.html
app.use('/', express.static('static'));
app.use('/storage', express.static('storage'));

//end of app use


//page serves and reading from URL


//home page
app.get('/', function(req, res) {
    res.send('Hey, you are at CryptoSign.');
});

app.get("/viewdocument", function (req, res) {
    console.log("#####req", req.query);
    res.sendFile('static/pages/viewdocument.html', {root: __dirname })
    //res.json({new:req.query});
});

app.get("/upload", function (req, res) {
    console.log("#####req", req.query);
    res.sendFile('static/pages/upload.html', {root: __dirname })
    //res.json({new:req.query});
});

app.get("/verifyDcoument", function (req, res) {
    console.log("#####req", req.query);
    res.sendFile('static/pages/verify.html', {root: __dirname })
    //res.json({new:req.query});
});

//end of page serves



//apis


router.get('/test', function(req, res) {
    //request('http://www.pdf995.com/samples/pdf.pdf').pipe(fs.createWriteStream('doodle.pdf'))
    res.json({ message: 'Node Server is on.'});
});

router.get('/getDetails', function(req, res) {
    //request('http://www.pdf995.com/samples/pdf.pdf').pipe(fs.createWriteStream('doodle.pdf'))
   console.log("###Inside getDetails###", req.query);
   let documentId = req.query.documentId;
   let _getDetailsPromise = web3Helper.getSignDetails(documentId);
   _getDetailsPromise.then(function(_signDetails){
        res.json(_signDetails);
   });
});

/*
call this method from SF and pass on the attachment ID. In background it will take BLOB of attachment and store it on our server's folder with name as attachmentId.pdf
it will also calculate hash, create contract, store hash of original doc in smart contract and finally send an email with link

http://localhost:8080/api/initSignature?attid=abc&email=spomal@apttus.com&recordid=abcrec
//http://localhost:8080/api/initSignature?attid=00P5000000rrUGXEA2&email=apttussigner@apttus.com&recordid=a2Y50000001zGYGEA2
*/

var pdfUpload = upload.fields([{ name: 'documentBody', maxCount: 1 }])

router.post('/initSignature', pdfUpload, function(req, res) {
    console.log("###Inside initSignature###", req.body, req.files);
    // let params = req.query;
    // let name = params.name;
    // let email = params.email;
    // let documentBody = req.body;
    let params = req.body;
    let name = params.name;
    let email = params.email;
    // let documentBody = req.files['documentBody'][0];
    let documentBody = params.documentBody;

    //check if all details received
    if(email && documentBody && name){

        //store PDF in local temporary, may in IFPS in future or just pass on the ByteCode and render PDF on client side
        let documentId = service.getUniqueId();
        let relativePath = '/forsign/'+ documentId + '.pdf';
        let path = storagePath+relativePath;
        service.storeFile(path, documentBody, 'binary');

        //generating SHA256 hash for storing on blockchain, SHA512 to encrypt the data on Blockchain (email)
        //Document ID as uniqui id for each sign request
        let getSHA256ashPromise = service.getHashFromStoredFile(path);
        let getSHA512Promise = service.getHashFromStoredFile(path, 'sha512');

        Promise.all([getSHA256ashPromise, getSHA512Promise]).then(function(hashes) {
            console.log("###hashes 1. SHA 256 2. SHA512 ", hashes);
            let sha256Hash = hashes[0];
            let sha512Hash = hashes[1];

            //function to encrypt the email with SHA Hash and store it on blockchain
            let encryptedEmail = service.encrypt(sha512Hash, email);

            res.json({message: 'success'})

            //create transaction on blockchain and send the email to user for signature
            console.log("#####init sign params ", documentId, sha256Hash, email, encryptedEmail);
            let encryptIdentity = service.initSignatureContract(documentId, sha256Hash, email, encryptedEmail, '');
            encryptIdentity.then(initSignatureResult => {
                res.json({message: 'success'});
            },error => {
                res.json({message: 'Error: '+ error});
            }).catch(err =>{
                console.log("#######err ", err);
            })
        });

    }else{
        res.json({ result: false, message: "Please specify required details!"});
    }
});

/*
This method is used to sign the pdf document with signature of image
http://localhost:8080/api/sign?attid=00P5000000rrUGXEA2&email=apttussigner@apttus.com&recordid=a2Y50000001zGYGEA2&imageofsignature=stevesig1.jpg
*/


router.get('/sign', function(req, res) {
    console.log("###Sign###", req.query);
    let documentId = req.query.documentId;
    let email = req.query.email;
    let location = req.query.location || 'MLR Conventation Center, Bangalore, Karnataka, India';
    let imageOfSignature = req.query.imageofsignature;

    //pdf code to merge original doc and image of signature
    if(documentId){

        //get original document
        let relativePathOfOriginalDocument = '/forsign/'+ documentId + '.pdf';
        let pathOfOriginalDocument = storagePath+relativePathOfOriginalDocument;

        let relativePathOfSignatureImage = '/signatureimages/'+imageOfSignature || 'img1.jpg';
        let pathOfSignatureImage = storagePath+relativePathOfSignatureImage;

        let relativePathOfSignedDocument = '/signed/'+ documentId + '_' + email + '.pdf';
        let pathOfSignedDocument = storagePath+relativePathOfSignedDocument;

        let signPromise = service.signPdfWithImageAndText(pathOfOriginalDocument, pathOfSignedDocument, pathOfSignatureImage, 'Reference ID : ' + config.contracts.signer3.address );
        signPromise.then(data => {
            //console.log("########signPromise ", data);
            let signedDocumentURL = config.WEBSITE_URL + '/storage' + relativePathOfSignedDocument;
            let signedDocumentURLToSend =  '/storage' + relativePathOfSignedDocument;

            console.log("###sign###signedDocumentURL### ", pathOfSignedDocument);

            let getSHA256ashPromise = service.getHashFromStoredFile(pathOfSignedDocument);
            let getSHA512Promise = service.getHashFromStoredFile(pathOfSignedDocument, 'sha512');

            Promise.all([getSHA256ashPromise, getSHA512Promise]).then(function(hashes) {
                console.log("###hashes 1. SHA 256 2. SHA512 ", hashes);
                let sha256Hash = hashes[0];
                let sha512Hash = hashes[1];

                let encryptedEmail = service.encrypt(sha512Hash, email);

                let signAndSendEmail = service.signAndSendEmail(documentId, sha256Hash, location, signedDocumentURLToSend, email, encryptedEmail);
                signAndSendEmail.then(signResult => {
                    res.json({ result: true, message: 'success', url: signedDocumentURLToSend});
                }, error => {
                    res.json({ result: false, message: 'Error while signing: '+ error, url: signedDocumentURLToSend});
                })

            });

        });
    }else{
        res.json({ result: false, message: 'Please pass salesforce attachmend id'});
    }
});


router.get('/sign', function(req, res) {
    console.log("###Sign###", req.query);
    let attId = req.query.attid;
    let email = req.query.email;
    let recordId = req.query.recordId;
    let location = req.query.location || 'Makarba, Ahmedabad, Gujarat, India';
    let imageOfSignature = req.query.imageofsignature;

    //pdf code to merge original doc and image of signature
    if(attId){

        //get original document
        let relativePathOfOriginalDocument = '/forsign/'+ attId +'.pdf';
        let pathOfOriginalDocument = storagePath+relativePathOfOriginalDocument;

        let relativePathOfSignatureImage = '/signatureimages/'+imageOfSignature;
        let pathOfSignatureImage = storagePath+relativePathOfSignatureImage;

        let relativePathOfSignedDocument = '/signed/'+ attId + '_' + email + '.pdf';
        let pathOfSignedDocument = storagePath+relativePathOfSignedDocument;

        let signPromise = service.signPdfWithImageAndText(pathOfOriginalDocument, pathOfSignedDocument, pathOfSignatureImage, 'Reference ID : ' + config.contracts.signer3.address );
        signPromise.then(data => {
            //console.log("########signPromise ", data);
            let signedDocumentURL = config.WEBSITE_URL + '/storage' + relativePathOfSignedDocument;
            let signedDocumentURLToSend =  '/storage' + relativePathOfSignedDocument;

            console.log("###sign###signedDocumentURL### ", pathOfSignedDocument);
            let getHashOfSignedDocumentPromise = service.getHashFromStoredFile(pathOfSignedDocument);
            getHashOfSignedDocumentPromise.then(data =>{
                console.log("###sign###hash### ", data);
                let signedDocumentHash = data;
                //create contract, store hash and send for email
                let signedHash = data;
                    let finishSignPromise = web3Helper.finishSign(attId,signedHash,location);

                    finishSignPromise.then(function(_finishSignDetails){
                        if(!_finishSignDetails){
                            console.log('###Sign####_finishSignDetails is undefined');
                            res.json({  message: 'There is some problem while processing.'});
                        }
                        else{
                            let contractAddress = _finishSignDetails.contractAddress;
                            let transactionHash = _finishSignDetails.transactionHash;
                            let accountAddress = _finishSignDetails.from;

                            console.log('###Sign#### : Transaction completed with blockNumber :', _finishSignDetails.blockNumber);
                            let signedDocumentURL = config.WEBSITE_URL +  '/viewdocument?attid='+ attId +'&email='+email+'&recordid='+recordId+'&contractAddress='+contractAddress;
                            console.log("###Sign####signedDocumentURL###", signedDocumentURL);
                            //send email
                            let _pdfURL  = config.WEBSITE_URL + signedDocumentURLToSend;

                            let emailParams = {
                                attachmentId  : attId,
                                email : email,
                                recordId : recordId,
                                pdfURL : _pdfURL,
                                contractAddress : contractAddress,
                                transactionHash : transactionHash,
                                accountAddress : accountAddress
                            };
                            service.sendEmailForFinishSign(emailParams);
                            let _attachmentRecord = {
                                        Name : 'SignedDocument.pdf',
                                        ContentType : 'application/pdf',
                                        Description : 'Signed Document from CryptoSign',
                                        ParentId : recordId,
                                        attachment: {
                                          fileName: 'SignedDocument.pdf',
                                          body: fs.readFileSync(pathOfSignedDocument)
                                        }
                                    };
                                    //console.log('_attachmentRecord:', _attachmentRecord);
                                    let attachmentSavePromise = salesforce.createAttachment('Attachment', _attachmentRecord);

                                    attachmentSavePromise.then(function(_recordId){
                                        console.log('_recordId : ',_recordId);
                                    });

                            console.log("###Sign####completednode ###")
                            //res.json({ result: true, message: 'success', url: signedDocumentURL});
                            res.json({ result: true, message: 'success', url: signedDocumentURLToSend});
                        }
                    });
            });
        });



    }else{
        res.json({ result: false, message: 'Please pass salesforce attachmend id'});
    }
});

/*
This method is used to verify the pdf
http://localhost:8080/api/sign?attid=abc&email=spomal@apttus.com&recordid=abcrec&imageOfSignature=stevesig1.jpg
*/

router.post('/verify', function(req, res) {
    let body = req.body;
    let bodyStr = body.toString();
    let body64 = 'data:application/pdf;base64,'+bodyStr;
    let _timestamp = new Date().getTime();
    let relativePathForVerifyingDocument = './storage/verify/v'+ _timestamp + '-' +  parseInt(Math.random()*100000) +'.pdf';
    fs.writeFile(relativePathForVerifyingDocument, bodyStr, {encoding: 'base64'}, function(err) {
        console.log('File created'+relativePathForVerifyingDocument);

        let getSHA256ashPromise = service.getHashFromStoredFile(relativePathForVerifyingDocument);
        let getSHA512Promise = service.getHashFromStoredFile(relativePathForVerifyingDocument, 'sha512');

        Promise.all([getSHA256ashPromise, getSHA512Promise]).then(function(hashes) {
            console.log("###hashes 1. SHA 256 2. SHA512 ", hashes);
            let sha256Hash = hashes[0];
            let sha512Hash = hashes[1];

            //function to encrypt the email with SHA Hash and store it on blockchain
            //let encryptedEmail = service.encrypt(sha512Hash, email);

            let _signDetailsPromise = web3Helper.getSignDetailsFromHash(sha256Hash);
            _signDetailsPromise.then(function(_signDetails){
                //decrypt email
                console.log("#####sign details", _signDetails);
                let encryptedEmail = _signDetails.email;

                let decryptedEmail = service.decrypt(sha512Hash, encryptedEmail);
                //console.log("#####sign details", encryptedEmail, sha512Hash, );
                _signDetails.email += ' (Decrypted: ) '+ decryptedEmail;
                res.json(_signDetails);
            });

        });
    });
});


router.post('/postTest', function(req, res) {
    console.log('***inside : postTest ***', req.query);
    var datajson = '';
    //console.log('===req.BODY',JSON.stringify(req.body));
    datajson.message = 'Message From Server';
    res.json(datajson);
});


function storeFile(path, blobData, type){
    fs.writeFileSync(path, blobData, type);
}


//tail
app.listen(port);
exports.app = app;
console.log('Magic happens on port ' + port);