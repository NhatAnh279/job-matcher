import os 
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Login
def login_user(email, password):
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    return response


# Sign up
def register_user(email, password):
    response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })
    return response