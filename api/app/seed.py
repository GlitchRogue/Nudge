"""Seed database with a demo user, calendar, and realistic events.

Events span the next 14 days across 4 sources:
- Eventbrite (public NYC events)
- NYU Engage (student orgs, clubs)
- Wasserman Center (career)
- Gmail (parsed from event-like listserv emails)
"""
from datetime import datetime, timedelta
from .db import SessionLocal
from .models import User, Event, CalendarEntry


# --- helpers ---
def _base() -> datetime:
    """Today at 00:00 local. Used as a stable anchor so seeded events always land in 'the next 2 weeks'."""
    now = datetime.now()
    return datetime(now.year, now.month, now.day)


def at(day_offset: int, hour: int, minute: int = 0) -> datetime:
    return _base() + timedelta(days=day_offset, hours=hour, minutes=minute)


# ---------------- DEMO USER ----------------
DEMO_EMAIL = "demo@eventpilot.app"

DEMO_INTERESTS = [
    "ai", "tech", "career", "networking", "music", "food", "entrepreneurship",
]


# ---------------- DEMO CALENDAR ----------------
def build_demo_calendar():
    """Mix of recurring classes, one work block, and past events that feed the taste model."""
    entries = []

    # Recurring MWF classes (next 2 weeks)
    for d in range(0, 14):
        day = _base() + timedelta(days=d)
        dow = day.weekday()  # 0=Mon
        # Mon/Wed/Fri 10-11 (CS 301)
        if dow in (0, 2, 4):
            entries.append({
                "title": "CS 301: Algorithms (Lecture)",
                "start": day + timedelta(hours=10),
                "end": day + timedelta(hours=11, minutes=15),
                "location": "Courant 109",
                "tags": [],
                "past": False,
            })
        # Tue/Thu 12-1:30 (Linguistics)
        if dow in (1, 3):
            entries.append({
                "title": "LING 210: Sociolinguistics",
                "start": day + timedelta(hours=12),
                "end": day + timedelta(hours=13, minutes=30),
                "location": "Silver 405",
                "tags": [],
                "past": False,
            })
        # Mon/Wed 2-3:30 (Intro to AI)
        if dow in (0, 2):
            entries.append({
                "title": "CSCI-UA 472: Intro to AI",
                "start": day + timedelta(hours=14),
                "end": day + timedelta(hours=15, minutes=30),
                "location": "Warren Weaver 101",
                "tags": ["ai"],
                "past": False,
            })

    # Saturday work block
    for d in range(0, 14):
        day = _base() + timedelta(days=d)
        if day.weekday() == 5:
            entries.append({
                "title": "RA shift",
                "start": day + timedelta(hours=9),
                "end": day + timedelta(hours=13),
                "location": "Third North",
                "tags": [],
                "past": False,
            })

    # Past events (to seed taste inference)
    past_events = [
        {
            "title": "Claude x NYU: AI Agents Meetup",
            "days_ago": 12,
            "start_hour": 18,
            "end_hour": 20,
            "location": "NYU CDS",
            "tags": ["ai", "tech", "networking"],
        },
        {
            "title": "Python NYC Hack Night",
            "days_ago": 22,
            "start_hour": 18,
            "end_hour": 21,
            "location": "WeWork Soho",
            "tags": ["tech", "networking"],
        },
        {
            "title": "Phoebe Bridgers @ Radio City",
            "days_ago": 35,
            "start_hour": 20,
            "end_hour": 22,
            "location": "Radio City Music Hall",
            "tags": ["music", "concert"],
        },
        {
            "title": "OpenAI DevDay Livestream Watch Party",
            "days_ago": 45,
            "start_hour": 12,
            "end_hour": 14,
            "location": "NYU Paulson",
            "tags": ["ai", "tech"],
        },
        {
            "title": "NYC Startup Week: Fireside",
            "days_ago": 60,
            "start_hour": 18,
            "end_hour": 20,
            "location": "Brookfield Place",
            "tags": ["entrepreneurship", "networking", "career"],
        },
    ]
    for pe in past_events:
        start = _base() - timedelta(days=pe["days_ago"]) + timedelta(hours=pe["start_hour"])
        end = _base() - timedelta(days=pe["days_ago"]) + timedelta(hours=pe["end_hour"])
        entries.append({
            "title": pe["title"],
            "start": start,
            "end": end,
            "location": pe["location"],
            "tags": pe["tags"],
            "past": True,
        })

    return entries


# ---------------- SEED EVENTS ----------------
# Each entry: id, source, title, description, day_offset, start_hour, duration_hr,
#   location_text, lat, lng, url, cost, rsvp_count, tags
RAW_EVENTS = [
    # ---- Eventbrite (public NYC events) ----
    {
        "id": "eb_001", "source": "eventbrite",
        "title": "AI Builders NYC: Agents in Production",
        "description": "Lightning talks from folks shipping AI agents. Food + drinks after.",
        "day_offset": 2, "start_hour": 18, "duration_hr": 3,
        "location_text": "Betaworks, 29 Little W 12th St, New York, NY",
        "lat": 40.7395, "lng": -74.0063,
        "url": "https://eventbrite.com/e/ai-builders-nyc", "cost": 0.0, "rsvp_count": 180,
        "tags": ["ai", "tech", "networking"],
    },
    {
        "id": "eb_002", "source": "eventbrite",
        "title": "Indie Sleaze Night @ Mercury Lounge",
        "description": "A night of 2000s indie. Three bands, one DJ.",
        "day_offset": 3, "start_hour": 20, "duration_hr": 3,
        "location_text": "Mercury Lounge, 217 E Houston St, New York, NY",
        "lat": 40.7223, "lng": -73.9871,
        "url": "https://eventbrite.com/e/indie-sleaze", "cost": 18.0, "rsvp_count": 96,
        "tags": ["music", "concert", "social"],
    },
    {
        "id": "eb_003", "source": "eventbrite",
        "title": "Founders Coffee: First-Time Founders Meetup",
        "description": "Casual morning coffee with 20 first-time founders and a few investors.",
        "day_offset": 5, "start_hour": 9, "duration_hr": 2,
        "location_text": "Sey Coffee, Bushwick, Brooklyn",
        "lat": 40.7091, "lng": -73.9324,
        "url": "https://eventbrite.com/e/founders-coffee", "cost": 0.0, "rsvp_count": 45,
        "tags": ["entrepreneurship", "networking", "career"],
    },
    {
        "id": "eb_004", "source": "eventbrite",
        "title": "Ramen Crawl: East Village Edition",
        "description": "Three ramen stops in three hours with 20 strangers.",
        "day_offset": 6, "start_hour": 19, "duration_hr": 3,
        "location_text": "East Village, New York, NY",
        "lat": 40.7265, "lng": -73.9815,
        "url": "https://eventbrite.com/e/ramen-crawl", "cost": 35.0, "rsvp_count": 22,
        "tags": ["food", "social"],
    },
    {
        "id": "eb_005", "source": "eventbrite",
        "title": "LangChain x Anthropic: Building with Claude",
        "description": "Technical deep-dive with live-coded examples.",
        "day_offset": 4, "start_hour": 18, "duration_hr": 2,
        "location_text": "Anthropic NYC, 540 Broadway",
        "lat": 40.7245, "lng": -74.0005,
        "url": "https://eventbrite.com/e/langchain-anthropic", "cost": 0.0, "rsvp_count": 240,
        "tags": ["ai", "tech"],
    },
    {
        "id": "eb_006", "source": "eventbrite",
        "title": "Sunset Yoga in Prospect Park",
        "description": "All levels welcome. BYO mat.",
        "day_offset": 7, "start_hour": 18, "duration_hr": 1,
        "location_text": "Long Meadow, Prospect Park, Brooklyn",
        "lat": 40.6602, "lng": -73.9690,
        "url": "https://eventbrite.com/e/sunset-yoga", "cost": 0.0, "rsvp_count": 78,
        "tags": ["fitness", "wellness"],
    },
    {
        "id": "eb_007", "source": "eventbrite",
        "title": "Mitski - The Land Is Inhospitable Tour",
        "description": "Indie folk at Radio City.",
        "day_offset": 10, "start_hour": 20, "duration_hr": 2,
        "location_text": "Radio City Music Hall",
        "lat": 40.7599, "lng": -73.9799,
        "url": "https://eventbrite.com/e/mitski", "cost": 85.0, "rsvp_count": 5800,
        "tags": ["music", "concert"],
    },
    {
        "id": "eb_008", "source": "eventbrite",
        "title": "Brooklyn Book Swap",
        "description": "Bring 3 books, take 3 books. Drinks after at Postmark.",
        "day_offset": 8, "start_hour": 17, "duration_hr": 2,
        "location_text": "Books Are Magic, Cobble Hill",
        "lat": 40.6866, "lng": -73.9975,
        "url": "https://eventbrite.com/e/book-swap", "cost": 0.0, "rsvp_count": 34,
        "tags": ["reading", "social"],
    },

    # ---- NYU Engage (student orgs, clubs) ----
    {
        "id": "engage_001", "source": "engage",
        "title": "NYU CS Club: Resume Review Night",
        "description": "Senior engineers from Google/Meta/Jane Street review resumes 1-on-1.",
        "day_offset": 3, "start_hour": 18, "duration_hr": 2,
        "location_text": "CIWW 109",
        "lat": 40.7291, "lng": -73.9958,
        "url": "https://nyu.campuslabs.com/engage/event/resume-review", "cost": 0.0, "rsvp_count": 52,
        "tags": ["career", "tech", "networking"],
    },
    {
        "id": "engage_002", "source": "engage",
        "title": "NYU Entrepreneurs Network: Pitch Practice",
        "description": "5 founders pitch to a panel of NYU alumni.",
        "day_offset": 6, "start_hour": 19, "duration_hr": 2,
        "location_text": "Kimmel 914",
        "lat": 40.7295, "lng": -73.9974,
        "url": "https://nyu.campuslabs.com/engage/event/pitch-practice", "cost": 0.0, "rsvp_count": 68,
        "tags": ["entrepreneurship", "networking"],
    },
    {
        "id": "engage_003", "source": "engage",
        "title": "NYU ML Club: Paper Reading - DPO",
        "description": "We read one paper together every other Friday. This week: Direct Preference Optimization.",
        "day_offset": 5, "start_hour": 17, "duration_hr": 1,
        "location_text": "CDS 7th Floor",
        "lat": 40.7292, "lng": -73.9965,
        "url": "https://nyu.campuslabs.com/engage/event/ml-club", "cost": 0.0, "rsvp_count": 24,
        "tags": ["ai", "tech"],
    },
    {
        "id": "engage_004", "source": "engage",
        "title": "NYU Korean Cultural Society: Bingsu Night",
        "description": "Free shaved-ice in Washington Square Park. Come say hi.",
        "day_offset": 4, "start_hour": 19, "duration_hr": 2,
        "location_text": "Washington Square Park",
        "lat": 40.7308, "lng": -73.9973,
        "url": "https://nyu.campuslabs.com/engage/event/bingsu", "cost": 0.0, "rsvp_count": 110,
        "tags": ["food", "social"],
    },
    {
        "id": "engage_005", "source": "engage",
        "title": "NYU Chess Club Tournament",
        "description": "Swiss-system tournament, 4 rounds, prizes for top 3.",
        "day_offset": 6, "start_hour": 13, "duration_hr": 5,
        "location_text": "Kimmel 802",
        "lat": 40.7295, "lng": -73.9974,
        "url": "https://nyu.campuslabs.com/engage/event/chess", "cost": 0.0, "rsvp_count": 40,
        "tags": ["gaming", "social"],
    },
    {
        "id": "engage_006", "source": "engage",
        "title": "Queer in Tech @ NYU: Mixer",
        "description": "Drinks + snacks + industry mentors.",
        "day_offset": 9, "start_hour": 18, "duration_hr": 2,
        "location_text": "CIWW Lounge",
        "lat": 40.7291, "lng": -73.9958,
        "url": "https://nyu.campuslabs.com/engage/event/queer-in-tech", "cost": 0.0, "rsvp_count": 55,
        "tags": ["networking", "tech", "career"],
    },
    {
        "id": "engage_007", "source": "engage",
        "title": "NYU Outdoor Club: Central Park Run",
        "description": "3-mile loop, all paces. Coffee after.",
        "day_offset": 7, "start_hour": 8, "duration_hr": 1,
        "location_text": "Central Park, 72nd St entrance",
        "lat": 40.7767, "lng": -73.9761,
        "url": "https://nyu.campuslabs.com/engage/event/run-club", "cost": 0.0, "rsvp_count": 28,
        "tags": ["fitness", "wellness", "social"],
    },

    # ---- Wasserman Center (career) ----
    {
        "id": "wass_001", "source": "wasserman",
        "title": "Tech & Engineering Career Fair",
        "description": "50+ employers: Google, Meta, Anthropic, Jane Street, Two Sigma, etc.",
        "day_offset": 8, "start_hour": 11, "duration_hr": 4,
        "location_text": "Kimmel Rosenthal Pavilion",
        "lat": 40.7295, "lng": -73.9974,
        "url": "https://wasserman.nyu.edu/event/career-fair-tech", "cost": 0.0, "rsvp_count": 430,
        "tags": ["career", "tech", "networking"],
    },
    {
        "id": "wass_002", "source": "wasserman",
        "title": "Goldman Sachs Info Session: SWE Summer 2026",
        "description": "Overview + Q&A with recent hires from NYU. Dinner provided.",
        "day_offset": 4, "start_hour": 18, "duration_hr": 1,
        "location_text": "Wasserman 10th Floor",
        "lat": 40.7282, "lng": -73.9942,
        "url": "https://wasserman.nyu.edu/event/gs-info", "cost": 0.0, "rsvp_count": 115,
        "tags": ["career", "tech"],
    },
    {
        "id": "wass_003", "source": "wasserman",
        "title": "Resume Rx Walk-in Hours",
        "description": "Drop in any time. 15-min slot with a career coach.",
        "day_offset": 2, "start_hour": 13, "duration_hr": 3,
        "location_text": "Wasserman 2nd Floor",
        "lat": 40.7282, "lng": -73.9942,
        "url": "https://wasserman.nyu.edu/event/resume-rx", "cost": 0.0, "rsvp_count": 12,
        "tags": ["career"],
    },
    {
        "id": "wass_004", "source": "wasserman",
        "title": "Anthropic Info Session - Research Engineering",
        "description": "Come hear what it's like to work on AI safety at Anthropic.",
        "day_offset": 3, "start_hour": 18, "duration_hr": 1,
        "location_text": "CDS Auditorium",
        "lat": 40.7292, "lng": -73.9965,
        "url": "https://wasserman.nyu.edu/event/anthropic-info", "cost": 0.0, "rsvp_count": 220,
        "tags": ["career", "ai", "tech"],
    },
    {
        "id": "wass_005", "source": "wasserman",
        "title": "Negotiating Your First Offer",
        "description": "60-minute workshop. Salary, equity, sign-on.",
        "day_offset": 7, "start_hour": 12, "duration_hr": 1,
        "location_text": "Wasserman 502",
        "lat": 40.7282, "lng": -73.9942,
        "url": "https://wasserman.nyu.edu/event/negotiating", "cost": 0.0, "rsvp_count": 90,
        "tags": ["career"],
    },
    {
        "id": "wass_006", "source": "wasserman",
        "title": "Nonprofit & Impact Career Fair",
        "description": "Organizations hiring for 2026 fellowships.",
        "day_offset": 11, "start_hour": 13, "duration_hr": 3,
        "location_text": "Kimmel 914",
        "lat": 40.7295, "lng": -73.9974,
        "url": "https://wasserman.nyu.edu/event/impact-fair", "cost": 0.0, "rsvp_count": 140,
        "tags": ["career", "volunteering"],
    },

    # ---- Gmail (parsed from listserv / invite emails) ----
    {
        "id": "gmail_001", "source": "gmail",
        "title": "RSVP: Professor Klein's group dinner",
        "description": "Dr. Klein is hosting a small dinner for research group. Please RSVP by Wed.",
        "day_offset": 5, "start_hour": 19, "duration_hr": 2,
        "location_text": "Momofuku Ssam Bar",
        "lat": 40.7328, "lng": -73.9893,
        "url": "https://mail.google.com/mail/u/0/#inbox/abcd", "cost": 0.0, "rsvp_count": 8,
        "tags": ["food", "networking"],
    },
    {
        "id": "gmail_002", "source": "gmail",
        "title": "CS Dept: Distinguished Lecture - Quantum ML",
        "description": "The CS department is hosting Prof. Aaronson next Thursday.",
        "day_offset": 9, "start_hour": 16, "duration_hr": 1,
        "location_text": "Courant 109",
        "lat": 40.7291, "lng": -73.9958,
        "url": "https://mail.google.com/mail/u/0/#inbox/efgh", "cost": 0.0, "rsvp_count": 0,
        "tags": ["ai", "tech"],
    },
    {
        "id": "gmail_003", "source": "gmail",
        "title": "NYU Film Society: Free Screening - Perfect Days",
        "description": "Wim Wenders film. Popcorn provided. Email was forwarded from friend.",
        "day_offset": 4, "start_hour": 20, "duration_hr": 2,
        "location_text": "NYU Cantor Film Center",
        "lat": 40.7295, "lng": -73.9994,
        "url": "https://mail.google.com/mail/u/0/#inbox/ijkl", "cost": 0.0, "rsvp_count": 45,
        "tags": ["film", "social"],
    },
    {
        "id": "gmail_004", "source": "gmail",
        "title": "Invite: Weekend pickup soccer",
        "description": "Casual pickup in East River Park. 5v5. All levels.",
        "day_offset": 6, "start_hour": 11, "duration_hr": 2,
        "location_text": "East River Park",
        "lat": 40.7188, "lng": -73.9779,
        "url": "https://mail.google.com/mail/u/0/#inbox/mnop", "cost": 0.0, "rsvp_count": 12,
        "tags": ["fitness", "social"],
    },
    {
        "id": "gmail_005", "source": "gmail",
        "title": "Stern Tech Club: Product Case Competition Info",
        "description": "Deadline to sign up is Friday. Prize $2k.",
        "day_offset": 5, "start_hour": 18, "duration_hr": 1,
        "location_text": "Stern Tisch Hall",
        "lat": 40.7285, "lng": -73.9964,
        "url": "https://mail.google.com/mail/u/0/#inbox/qrst", "cost": 0.0, "rsvp_count": 30,
        "tags": ["career", "entrepreneurship"],
    },
]


def seed_if_empty():
    """Create demo user, calendar entries, and events if DB is empty."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        # Demo user
        user = User(
            email=DEMO_EMAIL,
            name="Demo Student",
            picture=None,
            interests=DEMO_INTERESTS,
            home_location="NYU Washington Square, New York, NY",
            home_lat=40.7295,
            home_lng=-73.9965,
        )
        db.add(user)
        db.flush()

        # Calendar
        for entry in build_demo_calendar():
            db.add(CalendarEntry(
                user_id=user.id,
                title=entry["title"],
                start_time=entry["start"],
                end_time=entry["end"],
                location_text=entry["location"],
                inferred_tags=entry.get("tags", []),
                is_past=entry["past"],
            ))

        # Events
        for ev in RAW_EVENTS:
            start = at(ev["day_offset"], ev["start_hour"])
            end = start + timedelta(hours=ev["duration_hr"])
            db.add(Event(
                id=ev["id"],
                source=ev["source"],
                title=ev["title"],
                description=ev["description"],
                start_time=start,
                end_time=end,
                location_text=ev["location_text"],
                location_lat=ev["lat"],
                location_lng=ev["lng"],
                url=ev["url"],
                cost=ev["cost"],
                rsvp_count=ev["rsvp_count"],
                tags=ev["tags"],
            ))

        db.commit()
        print(f"[seed] Seeded {len(RAW_EVENTS)} events + demo user.")
    finally:
        db.close()
