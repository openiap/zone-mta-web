const express = require('express');
const path = require('path');
const app = express();
const mailparser = require('mailparser');
app.use(express.json({limit: '50mb'}));

const port = 3000;
console.log("Serving from " + path.join(__dirname, 'dist'));
// Function to set no cache headers
const setNoCache = (res, path) => {
    if (express.static.mime.lookup(path) === 'text/html') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
};

app.use(express.static(path.join(__dirname, 'dist'), { setHeaders: setNoCache }));

const spamhauskey = process.env.spamhaus_key;
const SMTPclient = require("nodemailer").createTransport({
    host: process.env.report_email_host || "127.0.0.1",
    port: 25,
    tls: {rejectUnauthorized: false},
});
const localSMTPclient = require("nodemailer").createTransport({
    host: process.env.repost_email_host || "127.0.0.1",
    port: 25,
    tls: {rejectUnauthorized: false},
});

app.post('/api/report', async (req, res) => {
    console.log('Received emails request');
    let data = req.body;
    try {
        data = JSON.parse(data);
    } catch (error) {        
    }
    if(data.email != null && data.emails == null) {
        data.emails = [data.email];
    }
    console.log("Reporting multiple emails " + data.emails.length);
    if(data.emails.length > 10) {
        res.send('Too many emails');
        return;
    }
    if(data.emails.length < 1) {
        res.send('No emails');
        return;
    }
    const results = [];
    for(let i = 0; i < data.emails.length; i++) {
        const mailoptions = {
            from: process.env.report_email_from,
            to: process.env.report_email_to,
            subject: "Forwarded spam email",
            body: "spam email attached",
            attachments: [{filename: 'email' + i + '.eml', content: data.emails[i]}]
        }
        const info = await SMTPclient.sendMail(mailoptions);
        console.log('Email sent as ' + info.messageId);

        if(process.env.report_email_bcc != null && process.env.report_email_bcc != "") {
            const mailoptions2 = {
                from: process.env.report_email_from,
                to: process.env.report_email_bcc,
                subject: "Forwarded spam email",
                body: "spam email attached",
                attachments: [{filename: 'email' + i + '.eml', content: data.emails[i]}]
            }
            const info2 = await localSMTPclient.sendMail(mailoptions2);
            console.log('Blind copy email sent as ' + info2.messageId);
        }

        results.push(info.messageId);

        if(spamhauskey != null && spamhauskey != "") {
        }
    }
    res.send('Emails sent as ' + results.join(', '));   

    // const mailoptions = {
    //     from: process.env.report_email_from,
    //     to: process.env.report_email_to,
    //     subject: "Forwarded spam emails",
    //     body: "spam email attached",
    //     attachments: []
    //     // raw: data.data
    // }
    // for(let i = 0; i < data.emails.length; i++) {
    //     mailoptions.attachments.push({filename: 'email' + i + '.eml', content: data.emails[i]});
    // }
    // const info = await SMTPclient.sendMail(mailoptions);
    // console.log('Email sent as ' + info.messageId);
    // res.send('Email sent as ' + info.messageId);
});
app.post('/api/resubmit', async (req, res) => {
    console.log('Received emails request');
    let data = req.body;
    try {
        data = JSON.parse(data);
    } catch (error) {        
    }
    if(data.email != null && data.emails == null) {
        data.emails = [data.email];
    }
    console.log("Resubmiting multiple emails " + data.emails.length);
    if(data.emails.length > 10) {
        res.send('Too many emails');
        return;
    }
    if(data.emails.length < 1) {
        res.send('No emails');
        return;
    }
    const results = [];
    for(let i = 0; i < data.emails.length; i++) {
        try {
            const email = await mailparser.simpleParser(data.emails[i]);
            const mailoptions = {
                from: email.from.value[0].address,
                to: email.to?.value.map((to) => to.address).join(', '),
                cc: email.cc?.value.map((cc) => cc.address).join(', '),
                bcc: email.bcc?.value.map((bcc) => bcc.address).join(', '),
                subject: email.subject,
                raw: data.emails[i]
            }
            const info = await localSMTPclient.sendMail(mailoptions);
            console.log('Email sent as ' + info.messageId);
            results.push(info.messageId);
        } catch (error) {
            results.push(error.message);
        }
    }
    res.send('Emails sent as ' + results.join(', '));   
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
});

app.listen(port, () => {
    console.log('Server started on port ' + port);
});
