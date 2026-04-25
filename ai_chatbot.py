from calendar_service import get_today_calendar, find_free_slots, update_schedule
from event_service import recommend_events


def chatbot_start():
    calendar = get_today_calendar()
    free_slots = find_free_slots(calendar)

    return {
        "bot_message": "Google Calendar authorized successfully. Here is your schedule from 8 AM to 10 PM.",
        "calendar": calendar,
        "free_slots": free_slots,
        "next_question": "What is your event preference for today? Example: networking, party, hackathon, career."
    }


def chatbot_recommend(preference):
    calendar = get_today_calendar()
    free_slots = find_free_slots(calendar)
    recommendations = recommend_events(preference, free_slots)

    return {
        "bot_message": f"Based on your free time and preference '{preference}', here are the best event recommendations.",
        "free_slots": free_slots,
        "recommendations": recommendations
    }


def chatbot_schedule_change(old_start, old_end, new_start, new_end, preference):
    updated = update_schedule(old_start, old_end, new_start, new_end)

    calendar = get_today_calendar()
    free_slots = find_free_slots(calendar)
    recommendations = recommend_events(preference, free_slots)

    if updated:
        message = "Your schedule was updated successfully. I recalculated your free time and refreshed the event recommendations."
    else:
        message = "I could not find the exact old schedule, but here is the latest recommendation based on current calendar."

    return {
        "bot_message": message,
        "updated_calendar": calendar,
        "new_free_slots": free_slots,
        "new_recommendations": recommendations
    }