from flask import Flask, render_template, request
import requests, json, random, html, time

from db import DB

app = Flask(__name__)

TOTAL_TIME = 10
MAX_SCORE = 10

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/new-game")
def new_game():
    # Clear all old games
    DB.query("DELETE FROM trivia_games WHERE time_stamp<?", (int(time.time()) - 30,))
    
    tokenResp = requests.get("https://opentdb.com/api_token.php?command=request")
    tokenJSON = tokenResp.json()

    if tokenJSON["response_code"] == 0:
        DB.query("INSERT INTO trivia_games(token, correct_answer, lives, score, question_count, time_stamp) VALUES(?, ?, ?, ?, ?, ?)", (tokenJSON["token"], None, 5, 0, 0, int(time.time())))

        return json.dumps({ "token": tokenJSON["token"], "lives": 5, "score": 0, "question_count": 0 })

@app.route("/next")
def next():
    token = request.args.get("token")

    questionResp = requests.get("https://opentdb.com/api.php?amount=1&token={}".format(token))
    questionJSON = questionResp.json()

    if questionJSON["response_code"] == 0:
        DB.query("UPDATE trivia_games SET correct_answer=?, time_stamp=? WHERE token=?", (questionJSON["results"][0]["correct_answer"], int(time.time()), token))

        answers = list(questionJSON["results"][0]["incorrect_answers"])
        answers.append(questionJSON["results"][0]["correct_answer"])

        random.shuffle(answers)

        answers = list(map(html.unescape, answers))

        question = {
            "title": html.unescape(questionJSON["results"][0]["question"]),
            "answers": answers
        }

        return json.dumps({ "question": question, "time": TOTAL_TIME })

@app.route("/submit")
def submit():
    token = request.args.get("token")
    answer = request.args.get("answer")

    if token:
        game_rows = DB.query("SELECT * FROM trivia_games WHERE token=?", (token,), 1)

        if game_rows:
            game_row = game_rows[0]

            time_left = (game_row[5] + TOTAL_TIME) - int(time.time())

            # Evaluate the answer
            if answer == game_row[1] and time_left > 0:
                points = (time_left / TOTAL_TIME) * MAX_SCORE

                DB.query("UPDATE trivia_games SET score=?, question_count=? WHERE token=?", (game_row[3] + points, game_row[4] + 1, token))

                return json.dumps({ "correct": True, "answer": game_row[1], "lives": game_row[2], "score": game_row[3] + points, "question_count": game_row[4] + 1 })

            DB.query("UPDATE trivia_games SET lives=?, question_count=? WHERE token=?", (game_row[2] - 1, game_row[4] + 1, token))

            return json.dumps({ "correct": False, "answer": game_row[1], "lives": game_row[2] - 1, "score": game_row[3], "question_count": game_row[4] + 1 })

if __name__ == "__main__":
    app.run()