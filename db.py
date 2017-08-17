import sqlite3

class DB:

    def query(query, data=None):
        conn = sqlite3.connect("trivia-game.db")

        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS trivia_games (
                token PRIMARY KEY,
                correct_answer,
                lives,
                score,
                question_count,
                multiplier,
                time_stamp
            );
        """)

        if type(data) == list:
            cur.executemany(query, data)
        else:
            cur.execute(query, data)

        result = cur.fetchall()

        conn.commit()
        conn.close()

        return result