from calendar_service import time_to_minutes


# Mock events from Eventbrite, Handshake, NYC Meetups, etc.
# Your friend can replace this list with real API results.
mock_events = [
    {
        "event_name": "NYC AI Networking Night",
        "category": "networking",
        "start": "11:00",
        "end": "12:30",
        "source": "Eventbrite"
    },
    {
        "event_name": "Startup Founder Mixer",
        "category": "networking",
        "start": "15:00",
        "end": "16:30",
        "source": "Handshake"
    },
    {
        "event_name": "Evening Hackathon Sprint",
        "category": "hackathon",
        "start": "18:30",
        "end": "21:30",
        "source": "NYC Meetups"
    },
    {
        "event_name": "Tech Career Fair",
        "category": "career",
        "start": "10:45",
        "end": "12:00",
        "source": "Handshake"
    },
    {
        "event_name": "Brooklyn Student Party",
        "category": "party",
        "start": "20:00",
        "end": "22:00",
        "source": "Eventbrite"
    }
]


def event_fits_free_slot(event, free_slot):
    event_start = time_to_minutes(event["start"])
    event_end = time_to_minutes(event["end"])

    slot_start = time_to_minutes(free_slot["start"])
    slot_end = time_to_minutes(free_slot["end"])

    return event_start >= slot_start and event_end <= slot_end


def recommend_events(preference, free_slots):
    preference = preference.lower()

    recommendations = []

    for event in mock_events:
        if preference not in event["category"].lower():
            continue

        for slot in free_slots:
            if event_fits_free_slot(event, slot):
                recommendations.append({
                    "event_name": event["event_name"],
                    "category": event["category"],
                    "start": event["start"],
                    "end": event["end"],
                    "source": event["source"],
                    "reason": f"Matches your preference '{preference}' and fits your free slot from {slot['start']} to {slot['end']}."
                })

    return recommendations