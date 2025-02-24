const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  if (!email) {
    throw new Error("No recipient email defined");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: '"Gradapp" <no-reply@Gradapp.com>',
      to: email,
      subject: subject,
      text: message,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

module.exports = sendEmail;
