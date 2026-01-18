
function testRefundLogic(startTimeStr, description) {
    const now = new Date();
    const startTime = new Date(startTimeStr);
    const msUntilStart = startTime.getTime() - now.getTime();
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    let refundMultiplier = 1;
    let policyMessage = "Standard cancellation policy applied.";

    if (hoursUntilStart < 24) {
        refundMultiplier = 0;
        policyMessage = "Cancelled within 24 hours of start time. No credits refunded.";
    } else if (hoursUntilStart < 48) {
        refundMultiplier = 0.5;
        policyMessage = "Cancelled between 24-48 hours of start time. 50% credits refunded.";
    } else {
        policyMessage = "Cancelled more than 48 hours in advance. Full refund.";
    }

    console.log(`--- Test Case: ${description} ---`);
    console.log(`Hours until start: ${hoursUntilStart.toFixed(2)}`);
    console.log(`Refund Multiplier: ${refundMultiplier}`);
    console.log(`Message: ${policyMessage}`);
    console.log("--------------------------------\n");
}

const now = new Date();

// Case 1: > 48 hours (e.g., 50 hours from now)
const timePlus50h = new Date(now.getTime() + 50 * 60 * 60 * 1000);
testRefundLogic(timePlus50h.toISOString(), "50 hours in advance (> 48h)");

// Case 2: 24 - 48 hours (e.g., 30 hours from now)
const timePlus30h = new Date(now.getTime() + 30 * 60 * 60 * 1000);
testRefundLogic(timePlus30h.toISOString(), "30 hours in advance (24-48h)");

// Case 3: < 24 hours (e.g., 10 hours from now)
const timePlus10h = new Date(now.getTime() + 10 * 60 * 60 * 1000);
testRefundLogic(timePlus10h.toISOString(), "10 hours in advance (< 24h)");

// Case 4: Exactly 24 hours (edge case)
// Note: Logic is `hoursUntilStart < 24`. So exactly 24 should fall into the `else if` (24-48h) block because it's not < 24.
const timePlus24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
testRefundLogic(timePlus24h.toISOString(), "Exactly 24 hours in advance");

// Case 5: Exactly 48 hours (edge case)
// Note: Logic is `hoursUntilStart < 48`. So exactly 48 should fall into the `else` (> 48h) block.
const timePlus48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
testRefundLogic(timePlus48h.toISOString(), "Exactly 48 hours in advance");
