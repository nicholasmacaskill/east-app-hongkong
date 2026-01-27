#!/bin/bash

# Configuration Map (Key=Value)
# These are the TEST Keys generated from the previous step

add_key() {
    local key=$1
    local value=$2
    echo "Processing $key..."
    # Add to Development
    printf "%s" "$value" | vercel env add "$key" development --force
    # Add to Preview
    printf "%s" "$value" | vercel env add "$key" preview --force
}

echo "🚀 Adding Test Environment Variables to Vercel (Development & Preview)..."

add_key "NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER" "price_1StdqA1xd62IoClxWRqNYylQ"
add_key "NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD" "price_1StdqB1xd62IoClx3rTIGCm7"
add_key "NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO" "price_1StdqB1xd62IoClx5iJ7wl92"
add_key "NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE" "price_1StdqB1xd62IoClxfzEYRt8H"
add_key "NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE" "price_1StdqB1xd62IoClxthlgrX5T"

add_key "NEXT_PUBLIC_STRIPE_PRICE_MONTHLY" "price_1StdqC1xd62IoClxekt5HCs6"
add_key "NEXT_PUBLIC_STRIPE_PRICE_YEARLY" "price_1StdqC1xd62IoClxS0PkOZyg"

add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY" "price_1StdqC1xd62IoClxvJuTSItu"
add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY" "price_1StdqC1xd62IoClxhTO63BTh"

add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY" "price_1StdqD1xd62IoClx8KzeALYX"
add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY" "price_1StdqD1xd62IoClxFkSNdSoS"

add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY" "price_1StdqD1xd62IoClxRJqOBxXw"
add_key "NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY" "price_1StdqD1xd62IoClxylDGLJkB"

echo "✅ All keys added!"
