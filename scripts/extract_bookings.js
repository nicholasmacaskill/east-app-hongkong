const fs = require('fs');

async function extractBookingDetails() {
    const apiKey = 'process.env.RESEND_API_KEY';
    const response = await fetch('https://api.resend.com/emails', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    
    console.log("=== RECOVERED LOST BOOKING RECEIPTS ===\n");

    for (const email of data.data) {
        if (email.subject === 'Booking Confirmation - EAST') {
             const detailRes = await fetch(`https://api.resend.com/emails/${email.id}`, {
                 headers: { 'Authorization': `Bearer ${apiKey}` }
             });
             const detail = await detailRes.json();
             
             // Extract Session and Time with Regex
             const html = detail.html || '';
             const facilityMatch = html.match(/<strong>Session:<\/strong>\s*(.+?)<\/p>/);
             const timeMatch = html.match(/<strong>Time:<\/strong>\s*(.+?)<\/p>/);
             
             if (facilityMatch && timeMatch) {
                  const facility = facilityMatch[1].trim();
                  const timeStr = timeMatch[1].trim();
                  
                  if (facility.includes('Shooting Pad')) {
                      const toEmail = Array.isArray(email.to) ? email.to[0] : email.to;
                      console.log(`[DELETED] Email: ${toEmail.padEnd(30)} | Slot: ${timeStr.padEnd(25)} | Facility: ${facility}`);
                  }
             }
        }
    }
}
extractBookingDetails();
