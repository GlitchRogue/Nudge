from fastapi import FastAPI, HTTPException
from auth import authenticate_user, create_access_token
from schemas import LoginRequest, PreferenceRequest, ScheduleChangeRequest
from ai_chatbot import chatbot_start, chatbot_recommend, chatbot_schedule_change

app = FastAPI(title="AI Event Recommendation Backend")


current_user_preference = {
    "preference": None
}


@app.get("/")
def root():
    return {
        "message": "AI Event Recommendation Backend is running"
    }


@app.post("/login")
def login(request: LoginRequest):
    valid_user = authenticate_user(request.username, request.password)

    if not valid_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(request.username)

    return {
        "message": "Login successful",
        "access_token": token,
        "next_step": "Authorize Google Calendar"
    }


@app.get("/authorize-google-calendar")
def authorize_google_calendar():
    # In real app, redirect to Google OAuth here.
    return {
        "message": "Google Calendar authorization successful",
        "next_step": "Call /chatbot/start"
    }


@app.get("/chatbot/start")
def start_chatbot():
    return chatbot_start()


@app.post("/chatbot/recommend")
def recommend_events(request: PreferenceRequest):
    current_user_preference["preference"] = request.preference
    return chatbot_recommend(request.preference)


@app.post("/chatbot/schedule-change")
def schedule_change(request: ScheduleChangeRequest):
    preference = current_user_preference["preference"]

    if preference is None:
        preference = "networking"

    return chatbot_schedule_change(
        request.old_start,
        request.old_end,
        request.new_start,
        request.new_end,
        preference
    )