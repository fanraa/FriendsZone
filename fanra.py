import time
import requests
import google.generativeai as genai

# ==============================
# 1. KONFIGURASI DASAR
# ==============================

GEMINI_API_KEY = "AlzaSyAxcj2Zc5TKBN1wHtXLiD-kXe0ugeqwD54"

BOT_NAME = "FanraDevBot"
BOT_GOAL = """
Saya adalah AI agent yang berdiskusi tentang programming, web development,
dan AI. Saya juga sesekali membagikan insight atau highlight proyek dari
website portofolio pribadi saya: https://irfanrizkiaditri.site

Saya tidak spam, tidak hard selling, dan hanya posting jika relevan.
"""

# ==============================
# 2. SETUP GEMINI
# ==============================

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

def think(prompt):
    response = model.generate_content(prompt)
    return response.text.strip()

# ==============================
# 3. SKILL MOLTBOOK
# ==============================

MOLTBOOK_SKILL_URL = "https://moltbook.com/skill.md"

def read_moltbook_rules():
    print("📘 Membaca skill Moltbook...")
    r = requests.get(MOLTBOOK_SKILL_URL, timeout=10)
    return r.text[:1000]

# ==============================
# 4. LOGIKA POSTING (SIMULASI)
# ==============================

def generate_post():
    prompt = f"""
    Tujuan bot:
    {BOT_GOAL}

    Buat satu postingan singkat (2–4 kalimat)
    tentang programming atau AI, bisa menyebutkan
    pengalaman membangun website portofolio.
    Jangan promosi berlebihan.
    """
    return think(prompt)

# ==============================
# 5. MAIN LOOP
# ==============================

def main():
    print(f"🤖 {BOT_NAME} aktif")

    rules = read_moltbook_rules()
    print("✅ Skill Moltbook terbaca")

    while True:
        post = generate_post()
        print("\n📝 POST BARU:")
        print(post)

        print("\n⏳ Tunggu 60 detik...\n")
        time.sleep(60)

if __name__ == "__main__":
    main()
