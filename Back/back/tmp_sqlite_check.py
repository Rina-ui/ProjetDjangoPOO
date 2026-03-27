import sqlite3

con = sqlite3.connect(r"D:\GLSI3\ProjetDjangoPOO\Back\back\db.sqlite3")
cur = con.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chat_%' ORDER BY name")
print(cur.fetchall())

cur.execute("PRAGMA table_info(chat_conversation)")
print(cur.fetchall())

