from flask import Blueprint, request, jsonify
from google import genai
from tenacity import retry, stop_after_attempt, wait_exponential

from backend.config import Config

chat_bp = Blueprint('chat', __name__, url_prefix='/api')

_client = None

def get_client():
    global _client
    if _client is None:
        if not Config.GEMINI_API_KEY:
            raise ValueError("Cannot find GEMINI_API_KEY, please check .env")
        _client = genai.Client(api_key=Config.GEMINI_API_KEY)
    return _client



@chat_bp.route('/chat', methods=['POST'])
@retry(
    wait=wait_exponential(min=1, max=10),
    stop=stop_after_attempt(3),
    reraise=True,
)
def chat():

    data = request.get_json()
    user_message = data.get("message") if data else None

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    message = user_message.strip()

    try:
        chat_session = get_client().chats.create(
            model="gemini-3.8-flash",
            config={
                "system_instruction": (
                    "You are the MoodTracker assistant. "
                    "You help users reflect on their emotions "
                    "in a friendly and supportive way. "
                    "Keep responses short and simple. "
                    "Do not diagnose mental health conditions."
                )
            },
        )

        response = chat_session.send_message(message)
        return jsonify({"reply": response.text})

    except Exception as e:
        print("Chat API error:", e)
        return jsonify({"error": str(e)}), 500