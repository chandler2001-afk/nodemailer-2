const express = require("express");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const jokes = require("daddy-jokes");
const cron = require("node-cron");
const {addEmail,getAllMails}=require("./db");
const axios=require("axios");
const {default: LeetCode}=require("leetcode-query");
const leetcode =new LeetCode();
// Creating a Transporter
const oauth = async () => {
    try {
        console.log("Starting OAuth process");
        const oauth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground/"
        );
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN,
        });
        const accessToken = await oauth2Client.getAccessToken();
        console.log("Access token obtained");
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.FROM_MAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
        console.log("Transporter created");
        return transporter;
    } catch (error) {
        console.error("Error in oauth function:", error);
        throw error;
    }
}
// Creating mailOptions
const mailBody = async (to, subject) => {
    try {
        // const fetchQuestion=async()=>{
        //     try {
        //         const response=await axios.get("https://alfa-leetcode-api.onrender.com/daily");
        //         return {
        //             question:response.data.questionLink,
        //             difficulty:response.data.difficulty
        //         }
        //     } catch (error) {
        //         console.error("Error in fetching the details");
        //         throw error;
        //     }
        // }
        const questionData=await fetchQuestion();
        const template='Here is the POTD {{question}} , it is of {{difficulty}} level diffiulty!'
        const content=handlebars.compile(template);
        const emailBody=content(questionData);
        const mailOptions = {
            from: process.env.FROM_MAIL,
            to:to,
            subject:subject,
            html:emailBody
        };
        return mailOptions;
    } catch (error) {
        console.error("Error in mailBody function:", error);
        throw error;
    }
};

const app = express();
app.use(express.json());

//  scheduleMail function
const scheduleMail = async () => {
    cron.schedule("45 18 * * *", async () => {
        console.log("Cron job triggered");
        try {

            const emailTransporter = await oauth();
            if (emailTransporter) {
                const recipients=await getAllMails();
                const subject="POTD!";
                for(const recipient of recipients) {
                    const mailOptions=await mailBody(recipient.email, subject);
                    await emailTransporter.sendMail(mailOptions);
                    console.log("Mail sent to all recipients");
                }
            } else {
                console.error("Email transporter not initialized.");
            }
        } catch (error) {
            console.error("Error sending email:", error);
        }
    });
};

//function invoking to fetch the question
(async() =>{
    try {
        const response=await axios.get("https://alfa-leetcode-api.onrender.com/daily");
        return {
            question:response.data.questionLink,
            difficulty:response.data.difficulty
        }
    } catch (error) {
        console.error("Error in fetching the details");
        throw error;
    }

})();
// Function invoking
// (async () => {
//     try {
//         await scheduleMail();
//         console.log("Email scheduler set up successfully");
//     } catch (error) {
//         console.error("Error in the self-invoking function:", error);
//     }
// })();




app.post("/email",addEmail);
app.get("/emails", async (req, res) => {
    try {
        const emails = await getAllMails();
        console.log("Fetched emails:", emails); 
        res.json(emails); 
    } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ message: "Internal Server Error!", error: error.toString() });
    }
});

app.get("/",async (req,res)=>{
    try {
        const dailyQuestion=await getQuestion();
        res.status(200).json(dailyQuestion);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"internal server error!"})
    }
})

app.post("/user",async (req,res)=>{
    try
    {const {username}=req.body;
    const user=await leetcode.user(username);
    const response=user;
    if(!response)
    {res.status(404).json("user not found");}
    else{
        res.status(200).json({response})
    }
} catch(error){
    console.error(error);
    res.status(500).json({"message":"internal server error"})
}
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});