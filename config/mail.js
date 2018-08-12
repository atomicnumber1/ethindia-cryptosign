var nodemailer = require('nodemailer');
var config = require('./config');


var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD
    }
});


function sendEmail (mailOptions){
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
}
  exports.sendEmail = sendEmail;


