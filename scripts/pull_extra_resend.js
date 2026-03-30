const fs = require('fs');

async function extractExtraBookingDetails() {
    const apiKey = 'process.env.RESEND_API_KEY';
    console.log("=== CHECKING FOR VINCENT AND DICKSON'S OLDER EMAILS ===\n");
    
    let allEmails = [];
    const response = await fetch('https://api.resend.com/emails', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    allEmails = data.data || [];
    
    console.log(`Pulled ${allEmails.length} recent emails.`);
    let oldBookingsFound = 0;

    for (const email of allEmails) {
        if (email.subject === 'Booking Confirmation - EAST') {
             const detailRes = await fetch(`https://api.resend.com/emails/${email.id}`, {
                 headers: { 'Authorization': `Bearer ${apiKey}` }
             });
             const detail = await detailRes.json();
             
             const html = detail.html || '';
             const facilityMatch = html.match(/<strong>Session:<\/strong>\s*(.+?)<\/p>/);
             const timeMatch = html.match(/<strong>Time:<\/strong>\s*(.+?)<\/p>/);
             
             if (facilityMatch && timeMatch) {
                  const facility = facilityMatch[1].trim();
                  const timeStr = timeMatch[1].trim();
                  
                  if (facility.includes('Shooting Pad') && timeStr.includes('Mar 29')) {
                      const toEmail = Array.isArray(email.to) ? email.to[0] : email.to;
                      console.log(`[TODAY'S BOOKING] Email: ${toEmail.padEnd(25)} | Slot: ${timeStr.padEnd(25)} | Facility: ${facility}`);
                      oldBookingsFound++;
                  }
             }
        }
    }
    
    if (oldBookingsFound === 0) {
        console.log("No further bookings found for today in the email stack.");
    }
}
extractExtraBookingDetails();
