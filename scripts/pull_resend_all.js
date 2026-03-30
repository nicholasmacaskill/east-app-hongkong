const fs = require('fs');

async function extractAllBookingDetails() {
    const apiKey = 'process.env.RESEND_API_KEY';
    console.log("=== COMMENCING DEEP HISTORICAL EMAIL SWEEP ===");

    // Fetch the max amount we can to guarantee we catch anyone who booked weeks ago for today
    // Assuming Resend API allows limit=100 or paginate. If they don't, we fetch the max allowed.
    // Let's just try 100 first.
    let cursor = '';
    let foundCount = 0;
    
    // We'll loop just in case Resend supports it, but standard /emails endpoint usually just returns a list
    const response = await fetch('https://api.resend.com/emails', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    
    // If the user's free tier has old emails, we parse all "Booking Confirmation" ones
    for (const email of data.data || []) {
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
                      console.log(`[HISTORIC BOOKING FOUND] Email: ${toEmail.padEnd(25)} | Slot: ${timeStr.padEnd(25)} | Facility: ${facility}`);
                      foundCount++;
                  }
             }
        }
    }
    
    if (foundCount === 0) {
        console.log("No older bookings were found in the email logs.");
    }
}
extractAllBookingDetails();
