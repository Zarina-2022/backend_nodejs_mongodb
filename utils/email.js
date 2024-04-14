// kullaniciya email gonderme (1 den fazla yolu var):
// biz node.js te en popular olan 'nodemailer' kullanacagiz.
const nodemailer = require("nodemailer"); // npm install nodemailer

const sendMail = async (options) => {
  // 1) Transporter - tarayici olustur
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // 2) Emailin icerigini tanimla

  const mailOptions = {
    from: "Zarina Seker <zarinasekerdag@gmail.com>", // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.text, // plain text body
    html: options.html, // html body
  };

  // 3) Emaili gonder
  await transporter.sendMail(mailOptions);
};

module.exports = sendMail
