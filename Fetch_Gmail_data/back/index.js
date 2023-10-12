require("dotenv").config();
const cors = require("cors");
const express = require("express");
const PORT = 8000;
const { google } = require("googleapis");
const axios = require("axios");
const nodemailer = require("nodemailer");
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/inboxdata", async (req, res) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });
    const userId = req.body.email;
    const inboxUrl = `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages?labelIds=INBOX&q=in:inbox&orderBy=internalDate&maxResults=5`;
    const { token } = await oAuth2Client.getAccessToken();
    const { data: messageList } = await axios.get(inboxUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const messageIds = messageList.messages.map((message) => message.id);
    const messageDetails = [];
    for (let i = 0; i < 5 && i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/${userId}/messages/${messageId}`;
      const { data: messageData } = await axios.get(messageUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      messageDetails.push(messageData);
    }
    return res.status(200).json({
      message: "Message details retrieved successfully",
      data: messageDetails,
      success: true,
    });
  } catch (error) {
    return res.status(401).json({
      message: `${error.message}`,
      success: false,
    });
  }
});

app.post("/compose/mail", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "extraemailsh1207@gmail.com",
        pass: process.env.MAIL_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: "extraemailsh1207@gmail.com",
      to: req.body.to,
      subject: req.body.subject,
      html: `<b>${req.body.message}</b>`,
    });
    return res.status(200).json({
      message: "Message Send successfully",
      success: true,
    });
  } catch (error) {
    return res.status(401).json({
      message: `${error.message}`,
      success: false,
    });
  }
});

app.listen(PORT, () => console.log(" SERVER STARTED", PORT));
