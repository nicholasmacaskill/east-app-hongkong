const fs = require('fs');

async function fetchEmails() {
    const apiKey = 'process.env.RESEND_API_KEY';
    console.log("Querying Resend API for recent emails sent...");

    const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        console.error('Failed API Response:', response.status, await response.text());
        return;
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
        console.log("No emails sent in Resend outbox.");
        return;
    }

    console.log("Analyzing Resend Email Metadata...");

    const interestingDocs = [];

    for (const email of data.data) {
        // e.g. Subject: "Welcome to the EAST...", or "Booking Confirmed..."
        console.log(`[${email.created_at}] To: ${email.to} | Subject: ${email.subject}`);
        if (email.subject && email.subject.toLowerCase().includes('book')) {
            interestingDocs.push(email);
        }
    }

    // Log potential bookings deeper if Resend allows full GET on the email
    if (interestingDocs.length > 0) {
        console.log("\nFound possible booking receipts. Digging deeper...");
        for (const doc of interestingDocs) {
             const detailRes = await fetch(`https://api.resend.com/emails/${doc.id}`, {
                 headers: { 'Authorization': `Bearer ${apiKey}` }
             });
             const detail = await detailRes.json();
             console.log(`\nEmail Details for ${doc.to}: ${detail.html || detail.text || 'No Body Data'}`);
         }
    } else {
        console.log("No 'Booking' specific subjects found in the last 50 emails.");
    }
}
fetchEmails();
