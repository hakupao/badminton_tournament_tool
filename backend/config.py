import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv('PORT', 5000))
    DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///badminton.db')
