'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, User, Users, Dumbbell, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type TabId = 'player' | 'parent' | 'coach' | 'admin';

interface FAQItem {
    q: string;
    a: React.ReactNode;
}

interface FAQSection {
    title: string;
    items: FAQItem[];
}

// ─── Player Content ─────────────────────────────────────────────────
const playerSections: FAQSection[] = [
    {
        title: 'Getting Started',
        items: [
            {
                q: 'How do I log in?',
                a: 'Open the app and enter your registered email address and password. Tap LOGIN. If this is your first time, tap JOIN NOW to create a new account with your full name, email, mobile number and a password.'
            },
            {
                q: 'I forgot my password. What do I do?',
                a: 'On the login screen, tap "Forgot Password?" below the login button. Enter your email and we\'ll send you a reset link. Check your spam folder if it doesn\'t arrive within a few minutes.'
            },
            {
                q: 'My account says LOCKED. What does this mean?',
                a: (
                    <span>
                        A <strong>LOCKED</strong> account means you don&apos;t have an active membership. You can still browse the app, but you cannot book sessions. To unlock your account:
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Go to your <strong>Wallet tab</strong> (middle tab in the nav)</li>
                            <li>Tap <strong>&quot;View Membership Options&quot;</strong></li>
                            <li>Choose a plan and complete checkout via Stripe</li>
                        </ol>
                        Once your membership is active, the LOCKED indicator will disappear.
                    </span>
                )
            },
        ]
    },
    {
        title: 'Booking Sessions',
        items: [
            {
                q: 'How do I book a class?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>From the <strong>Home screen</strong>, scroll to the <strong>Classes</strong> section</li>
                            <li>Tap a class tile (e.g. &quot;Inline Hockey&quot;)</li>
                            <li>A booking modal will open — select your preferred date and time slot</li>
                            <li>Tap <strong>&quot;PAY X CREDITS&quot;</strong> to confirm</li>
                            <li>Your credits are deducted and the booking is confirmed</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I book a private lesson?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>From the <strong>Home screen</strong>, scroll to <strong>Private Lessons</strong> or <strong>Our Coaches</strong></li>
                            <li>Tap a coach or lesson type</li>
                            <li>Select your preferred time slot in the modal</li>
                            <li>Tap <strong>&quot;PAY X CREDITS&quot;</strong> to confirm</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I book a facility?',
                a: 'From the Home screen, scroll to Facilities and tap a tile (e.g. "Ice Rink"). Select an available time and confirm with your credits.'
            },
            {
                q: 'How do I see my upcoming bookings?',
                a: 'Tap the Schedule tab (Activity icon) in the bottom navigation. All your confirmed upcoming sessions are listed here by date.'
            },
            {
                q: 'Why can\'t I tap the "PAY CREDITS" button?',
                a: 'There are two possible reasons: (1) Your account is LOCKED — you need an active membership. (2) You don\'t have enough credits — top up your balance first. Both issues can be resolved from the Wallet tab.'
            },
        ]
    },
    {
        title: 'Credits & Payments',
        items: [
            {
                q: 'What are credits?',
                a: 'Credits are the in-app currency used to pay for sessions. Every session type costs a set number of credits. Credits are added to your account when you purchase or top up, and deducted each time you book.'
            },
            {
                q: 'How do I top up my credits?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Tap the <strong>Wallet tab</strong> (middle bottom icon)</li>
                            <li>Tap your credit balance or the <strong>&quot;TOP UP CREDITS&quot;</strong> button</li>
                            <li>Select a top-up package</li>
                            <li>Complete the secure Stripe checkout</li>
                            <li>Credits are added to your balance immediately</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'My top-up payment went through but credits didn\'t appear. What do I do?',
                a: 'Credits are usually added within 30 seconds of a successful payment via Stripe. If they haven\'t appeared after 5 minutes, please contact your admin or support team via the contact details in the app footer.'
            },
            {
                q: 'Do my credits expire?',
                a: 'Credits are tied to your account and do not expire while your membership is active. Please check with your admin for any specific expiry policies.'
            },
        ]
    },
    {
        title: 'Membership',
        items: [
            {
                q: 'What does a membership unlock?',
                a: 'An active membership removes the LOCKED status from your account, allowing you to book sessions. Members also receive bonus credits on purchase, access to priority booking windows, and discounts on facilities, classes, and F&B.'
            },
            {
                q: 'How do I purchase a membership?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Tap the <strong>Wallet tab</strong></li>
                            <li>Tap <strong>&quot;View Membership Options&quot;</strong></li>
                            <li>Choose Monthly or Yearly billing</li>
                            <li>Tap <strong>ACTIVATE</strong> and complete Stripe checkout</li>
                        </ol>
                        Monthly and Yearly plans are available. Yearly gives you bonus credits.
                    </span>
                )
            },
            {
                q: 'How do I cancel my membership?',
                a: 'Tap "Contact us on WhatsApp to cancel" on the membership screen, or reach out to your admin directly. A 30-day advance notice cancellation policy applies.'
            },
        ]
    },
    {
        title: 'Cancellations',
        items: [
            {
                q: 'How do I cancel a booking?',
                a: 'Go to the Schedule tab, find the session you want to cancel, and tap on it. Inside the session detail, tap "CANCEL BOOKING". Your credits will be refunded immediately.'
            },
            {
                q: 'Is there a cancellation penalty?',
                a: 'Cancellations made less than 24 hours before the session start time may be subject to a penalty (e.g., partial credit deduction). Check with your admin for the specific policy.'
            },
        ]
    },
    {
        title: 'QR Wallet & Check-In',
        items: [
            {
                q: 'What is the QR code for?',
                a: 'Your QR code is your digital membership card. When you arrive at the facility, show it to staff or let them scan it to verify your identity and membership status quickly.'
            },
            {
                q: 'Where do I find my QR code?',
                a: 'Tap the Wallet tab (middle icon in the bottom nav). Your unique QR code is displayed prominently at the top of that screen.'
            },
        ]
    },
    {
        title: 'Profile & Stats',
        items: [
            {
                q: 'How do I view my stats?',
                a: 'Tap the Profile tab (person icon). Your season and career stats (Goals, Assists, Games Played, etc.) are displayed on your profile card.'
            },
            {
                q: 'How do I update my profile photo or details?',
                a: 'Tap the Profile tab, then tap the Settings gear icon in the top right corner to open your account settings where you can update your details.'
            },
        ]
    },
];

// ─── Parent Content ─────────────────────────────────────────────────
const parentSections: FAQSection[] = [
    {
        title: 'Managing Your Family',
        items: [
            {
                q: 'How do I register a child athlete?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Tap the <strong>Profile tab</strong></li>
                            <li>Tap the <strong>Athletes tab</strong> on your profile</li>
                            <li>Tap <strong>&quot;+ Register New Athlete&quot;</strong></li>
                            <li>Enter your child&apos;s name and details</li>
                            <li>Tap Save — your child now appears on your profile</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I switch between children?',
                a: 'On your Profile, tap the Athletes tab and tap on a child\'s card to select them. Their info and stats will update accordingly.'
            },
        ]
    },
    {
        title: 'Booking for Your Child',
        items: [
            {
                q: 'How do I book a session for my child (not myself)?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Tap a session from the Home or Schedule screen</li>
                            <li>In the booking modal, look for the <strong>&quot;WHO IS THIS FOR?&quot;</strong> selector</li>
                            <li>Select your child&apos;s name from the dropdown</li>
                            <li>Tap <strong>&quot;PAY X CREDITS&quot;</strong> to confirm</li>
                        </ol>
                        The booking will be registered under your child&apos;s account. Your credits are used for payment.
                    </span>
                )
            },
            {
                q: 'Can I book for multiple children at once?',
                a: 'Currently each booking is made individually. To book for two children in the same session, complete one booking, then return and repeat the process selecting the second child.'
            },
        ]
    },
    {
        title: 'Credits & Membership',
        items: [
            {
                q: 'Does my membership cover my children?',
                a: 'Family memberships (PRO FAMILY) cover multiple members. When selecting a membership, choose the "Family" plan and the appropriate member count (1, 2, or 3+). Each family member gets access and credits.'
            },
            {
                q: 'How do I top up credits for my family?',
                a: 'Credits are tied to your parent account and shared for family bookings. Top up from your Wallet tab — the top-up amount is added to your balance and used when booking for any of your children.'
            },
        ]
    },
    {
        title: 'Cancellations',
        items: [
            {
                q: 'How do I cancel a booking I made for my child?',
                a: (
                    <span>
                        Go to the <strong>Schedule tab</strong>, find the session, and tap it. You will see the cancellation option. Credits are refunded immediately if the cancellation is made within the allowed window.
                    </span>
                )
            },
        ]
    },
];

// ─── Coach Content ─────────────────────────────────────────────────
const coachSections: FAQSection[] = [
    {
        title: 'Your Profile',
        items: [
            {
                q: 'How do I see my upcoming sessions?',
                a: 'After logging in, your Coach Dashboard shows all upcoming sessions you are assigned to. Tap "My Schedule" to see a full calendar view.'
            },
            {
                q: 'How do I update my availability?',
                a: 'Go to your Profile and tap the Availability section. Toggle time slots on or off to let admin know when you are available for private sessions.'
            },
        ]
    },
    {
        title: 'Sessions & Check-In',
        items: [
            {
                q: 'How do I check in a member at a session?',
                a: 'Use the QR scan tool in the Wallet/QR tab. Point the scanner at the member\'s QR code to verify their booking and membership status.'
            },
        ]
    },
];

// ─── Admin Content ─────────────────────────────────────────────────
const adminSections: FAQSection[] = [
    {
        title: 'Dashboard (/sys-admin)',
        items: [
            {
                q: 'What does the Admin Dashboard show?',
                a: 'The main dashboard shows a high-level summary: total members, active memberships, pending payments, and recent activity. Use it as your daily starting point.'
            },
        ]
    },
    {
        title: 'Schedule (/sys-admin/schedule)',
        items: [
            {
                q: 'How do I create a new session?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <strong>Schedule</strong> in the admin nav</li>
                            <li>Tap <strong>&quot;+ Add Session&quot;</strong></li>
                            <li>Fill in the title, category (Class/Private/Facility), date, time, capacity, credit cost, and instructor</li>
                            <li>Tap Save — the session appears immediately on the member-facing Home screen</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I edit or delete a session?',
                a: 'Find the session in the Schedule list and tap the edit (pencil) icon. Make your changes and save. To delete, tap the trash icon — this also cancels all existing bookings for that session and refunds credits.'
            },
            {
                q: 'How do I view who has booked a session?',
                a: 'Tap any session in the Schedule view to expand it. A list of registered members is shown beneath the session details.'
            },
        ]
    },
    {
        title: 'Directory (/sys-admin/directory)',
        items: [
            {
                q: 'How do I find a specific member?',
                a: 'Use the search bar at the top of the Directory page. You can filter by name, email, or role (Player, Parent, Coach). Tap a member card for their full profile.'
            },
            {
                q: 'How do I manually activate or lock a member\'s account?',
                a: 'Find the member in the Directory, open their profile, and look for the Account Status toggle. You can manually set their status to Active (bypassing Stripe) or Locked.'
            },
            {
                q: 'How do I add credits to a member\'s account?',
                a: 'Open the member\'s profile in the Directory. Use the "Adjust Credits" field to add or subtract credits manually and save. This is useful for comps or corrections.'
            },
            {
                q: 'How do I register a child under a parent?',
                a: 'Go to the Directory and find the parent\'s profile. In their profile, tap "Add Child Athlete" and fill in the child\'s details. The child is then linked to the parent\'s account and can be booked for sessions.'
            },
        ]
    },
    {
        title: 'Services (/sys-admin/services)',
        items: [
            {
                q: 'What is a Service vs a Session?',
                a: 'A Service is a template (e.g. "Inline Hockey Class"). A Session is a specific occurrence of that service at a particular date and time. Managing Services lets you control what appears as tiles on the Home screen.'
            },
            {
                q: 'How do I add a new service type?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <strong>Services</strong> in the admin nav</li>
                            <li>Tap <strong>&quot;Add Service&quot;</strong></li>
                            <li>Set the title, category (Class/Private/Facility), image URL, and description</li>
                            <li>Save — it will appear as a tile on the member Home screen once sessions are linked to it</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I bulk-generate session slots for a service?',
                a: 'On any service card, tap "Generate Slots". Set a start date, end date, days of the week, time, and duration. The system will create individual sessions for every matching slot.'
            },
        ]
    },
    {
        title: 'News & Events (/sys-admin/news)',
        items: [
            {
                q: 'How do I post a news announcement?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <strong>News</strong> in the admin nav</li>
                            <li>Tap <strong>&quot;+ Add Announcement&quot;</strong></li>
                            <li>Set the title, body text, image URL, type (news or event), and publish date</li>
                            <li>Save — it appears immediately in the Breaking News section on the member Home screen</li>
                        </ol>
                    </span>
                )
            },
            {
                q: 'How do I remove an outdated news post?',
                a: 'Find the post in the News list and tap the delete (trash) icon. The post is immediately removed from all member-facing screens.'
            },
        ]
    },
    {
        title: 'Check-In / QR (/sys-admin/qr)',
        items: [
            {
                q: 'How do I scan a member\'s QR code for check-in?',
                a: 'Go to the Check-In section in the admin nav. Grant camera access when prompted. Point the scanner at the member\'s QR code — their name, photo, and membership status will appear instantly. Green = valid, Red = invalid/expired.'
            },
            {
                q: 'What happens if a member doesn\'t have their QR code?',
                a: 'Use the manual search field on the Check-In screen to find them by name or email and verify their status that way.'
            },
        ]
    },
    {
        title: 'Booking Logs (/sys-admin/bookings)',
        items: [
            {
                q: 'How do I see all bookings for a specific session or date?',
                a: 'Use the filter and search tools at the top of the Booking Logs page to narrow by session name, date, or member. Each row shows the member, session, booking time, credit cost, and status.'
            },
            {
                q: 'How do I manually cancel a booking on behalf of a member?',
                a: 'Find the booking in the Booking Logs list and tap the cancel action. The credits are refunded to the member\'s account immediately.'
            },
        ]
    },
    {
        title: 'Transactions (/sys-admin/transactions)',
        items: [
            {
                q: 'How do I see payment history?',
                a: 'The Transactions page shows all Stripe payments — membership purchases and credit top-ups — with the member name, amount, date, and status (paid/failed/refunded).'
            },
        ]
    },
    {
        title: 'Metrics (/sys-admin/metrics)',
        items: [
            {
                q: 'What does the Metrics dashboard show?',
                a: 'Metrics shows key health indicators: Monthly Active Users (MAU), total bookings, revenue trends, member retention, and "at-risk" members who haven\'t booked recently.'
            },
        ]
    },
    {
        title: 'Audit Logs (/sys-admin/audit)',
        items: [
            {
                q: 'What are Audit Logs?',
                a: 'The Audit Logs are a tamper-resistant record of every significant admin action — who created, edited, or deleted a session, member, or booking. Use this to track down changes or investigate discrepancies.'
            },
            {
                q: 'How far back do Audit Logs go?',
                a: 'Logs are retained indefinitely. You can filter by date range, action type, or admin user to narrow your search.'
            },
        ]
    },
    {
        title: 'Coaches (/sys-admin/coaches)',
        items: [
            {
                q: 'How do I manage a coach\'s availability?',
                a: 'Go to the Coaches section, find the coach, and tap their availability card. You can view and edit their available time slots on their behalf — useful if they\'re having trouble with the app.'
            },
            {
                q: 'How do I assign a coach to a session?',
                a: 'When creating or editing a session in the Schedule, select the coach from the Instructor dropdown. All coaches with a "coach" role appear in that list.'
            },
        ]
    },
    {
        title: 'Player Stats (/sys-admin/player-stats)',
        items: [
            {
                q: 'How do I update a player\'s stats?',
                a: (
                    <span>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <strong>Player Stats</strong> in the admin nav</li>
                            <li>Search for the player by name</li>
                            <li>Enter their stats (Goals, Assists, Games Played, PIM, etc.)</li>
                            <li>Save — the stats appear immediately on the player&apos;s profile</li>
                        </ol>
                    </span>
                )
            },
        ]
    },
];

// ─── Tab Configuration ─────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: typeof User; sections: FAQSection[] }[] = [
    { id: 'player', label: 'Player', icon: User, sections: playerSections },
    { id: 'parent', label: 'Parent', icon: Users, sections: parentSections },
    { id: 'coach', label: 'Coach', icon: Dumbbell, sections: coachSections },
    { id: 'admin', label: 'Admin', icon: Shield, sections: adminSections },
];

// ─── Accordion Item ────────────────────────────────────────────────
function AccordionItem({ item }: { item: FAQItem }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-white/8 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-bold text-sm text-white/90 leading-snug">{item.q}</span>
                {open
                    ? <ChevronUp size={16} className="text-east-light shrink-0" />
                    : <ChevronDown size={16} className="text-gray-500 shrink-0" />
                }
            </button>
            {open && (
                <div className="px-5 pb-5 text-sm text-gray-400 font-opensans leading-relaxed border-t border-white/5">
                    <div className="pt-4">{item.a}</div>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────
function HelpCenterContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as TabId | null;
    const [activeTab, setActiveTab] = useState<TabId>(tabParam || 'player');

    useEffect(() => {
        if (tabParam && TABS.find(t => t.id === tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const activeSections = TABS.find(t => t.id === activeTab)?.sections || [];

    return (
        <div className="min-h-screen bg-black text-white font-montserrat pb-24 animate-fadeIn">
            <div className="max-w-2xl mx-auto px-5 pt-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1">
                        <ChevronLeft size={26} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <HelpCircle size={22} className="text-east-light" />
                        <h1 className="text-2xl font-black italic uppercase tracking-tight">Help Centre</h1>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="grid grid-cols-4 gap-1.5 bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/8">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${isActive
                                    ? 'bg-east-light text-black shadow-lg'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Section Content */}
                <div className="space-y-8">
                    {activeSections.map((section, si) => (
                        <div key={si}>
                            <h2 className="text-east-light font-black italic text-xs uppercase tracking-[0.2em] mb-3 px-1">
                                {section.title}
                            </h2>
                            <div className="space-y-2">
                                {section.items.map((item, ii) => (
                                    <AccordionItem key={ii} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Still need help?</p>
                    <a
                        href="https://wa.link/b2y0sa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#25D366] text-black font-black italic text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors uppercase tracking-wider"
                    >
                        Contact us on WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function HelpCenterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-east-light border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <HelpCenterContent />
        </Suspense>
    );
}
