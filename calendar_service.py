from datetime import datetime, timedelta


# Mock Google Calendar data
# Later replace this with actual Google Calendar API response
calendar_events = [
    {
        "title": "Deep Learning Class",
        "start": "09:00",
        "end": "10:30"
    },
    {
        "title": "Data Science Lecture",
        "start": "13:00",
        "end": "14:30"
    },
    {
        "title": "Project Meeting",
        "start": "17:00",
        "end": "18:00"
    }
]


def get_today_calendar():
    return sorted(calendar_events, key=lambda x: x["start"])


def time_to_minutes(time_str):
    hour, minute = map(int, time_str.split(":"))
    return hour * 60 + minute


def minutes_to_time(minutes):
    hour = minutes // 60
    minute = minutes % 60
    return f"{hour:02d}:{minute:02d}"


def find_free_slots(events):
    day_start = time_to_minutes("08:00")
    day_end = time_to_minutes("22:00")

    busy_slots = []

    for event in events:
        busy_slots.append({
            "start": time_to_minutes(event["start"]),
            "end": time_to_minutes(event["end"])
        })

    busy_slots.sort(key=lambda x: x["start"])

    free_slots = []
    current_time = day_start

    for slot in busy_slots:
        if current_time < slot["start"]:
            free_slots.append({
                "start": minutes_to_time(current_time),
                "end": minutes_to_time(slot["start"]),
                "duration_hours": round((slot["start"] - current_time) / 60, 2)
            })

        current_time = max(current_time, slot["end"])

    if current_time < day_end:
        free_slots.append({
            "start": minutes_to_time(current_time),
            "end": minutes_to_time(day_end),
            "duration_hours": round((day_end - current_time) / 60, 2)
        })

    return free_slots


def update_schedule(old_start, old_end, new_start, new_end):
    for event in calendar_events:
        if event["start"] == old_start and event["end"] == old_end:
            event["start"] = new_start
            event["end"] = new_end
            return True

    return False