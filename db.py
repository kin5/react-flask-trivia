import sqlite3

class DB:

    def query(query, data=None, limit=None):
        conn = sqlite3.connect("trivia-game.db")

        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS trivia_games (
                token PRIMARY KEY,
                correct_answer,
                lives,
                score,
                question_count,
                time_stamp
            );
        """)

        if type(data) == list:
            cur.executemany(query, data)
        else:
            cur.execute(query, data)

        result = cur.fetchall()

        if limit is not None:
            result = result[:limit]

        conn.commit()
        conn.close()

        return result