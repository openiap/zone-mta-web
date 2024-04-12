const express = require('express');
const path = require('path');
const app = express();
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

const SMTPclient = require("nodemailer").createTransport({
    host: process.env.report_email_host,
    port: 25,
    tls: {rejectUnauthorized: false},
});

app.post('/api/email', async (req, res) => {
    console.log('Received email request');
    let data = req.body;
    try {
        data = JSON.parse(data);
    } catch (error) {        
    }
    const info = await SMTPclient.sendMail({
        from: process.env.report_email_from,
        to: process.env.report_email_to,
        subject: "Forwarded spam email",
        body: "spam email attached",
        attachments: [{filename: 'email.eml', content: data.email}]
        // raw: data.email
    });
    console.log('Email sent as ' + info.messageId);
    
    res.send('Email sent as ' + info.messageId);
});

app.post('/api/emails', async (req, res) => {
    console.log('Received emails request');
    let data = req.body;
    try {
        data = JSON.parse(data);
    } catch (error) {        
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
        results.push(info.messageId);
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
