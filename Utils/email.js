const nodemailer = require('nodemailer');

module.exports.sendEmail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let message = {
    from: 'Joshua Mukisa <joshua@programmer.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `<p>${options.message}</p> <a style="text-decoration: none; color:green" href="${options.resetURL}">Click here</a>`,
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};
