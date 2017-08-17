from flask import Flask, render_template, request, abort
import requests, json, random, html, time

from db import DB

app = Flask(__name__)

TOTAL_TIME = 10
MAX_SCORE = 10
TOTAL_LIVES = 5
QUESTION_LIMIT = 50

@app.route("/")
def index():
    return render_template("index.html")

# New Game
#   - Clears database of all expired game records (older than 30 seconds)
#   - Requests a new token from OpenTDB
#   - Returns the token to the client
@app.route("/new-game")
def new_game():
    # Clear all expired games
    DB.query("DELETE FROM trivia_games WHERE time_stamp<?", (int(time.time()) - 30,))
    
    # Request a new token from OpenTDB
    tokenResp = requests.get("https://opentdb.com/api_token.php?command=request")
    tokenJSON = tokenResp.json()

    # If the response_code is 0 (request successful), create game, return state
    if tokenJSON["response_code"] == 0:
        DB.query("INSERT INTO trivia_games(token, correct_answer, lives, score, question_count, multiplier, time_stamp) VALUES(?, ?, ?, ?, ?, ?, ?)", (tokenJSON["token"], None, 5, 0, 0, 1, int(time.time())))

        return json.dumps({ "token": tokenJSON["token"], "lives": TOTAL_LIVES, "score": 0, "multiplier": 1, "question_count": 0 })
    else:
        return abort(404)

# Next Question
#   - Retrieves a new question from OpenTDB
#   - Updates game record with new question data
#   - Returns question data
@app.route("/next")
def next():
    # Grab our user's token from the url
    token = request.args.get("token")

    # Request a new question from OpenTDB
    questionResp = requests.get("https://opentdb.com/api.php?amount=1&category=9&token={}".format(token))
    questionJSON = questionResp.json()

    # If the response_code is 0 (request successful), update game record, return question
    if questionJSON["response_code"] == 0:
        # Update our user's game record with the new correct answer and time stamp
        DB.query("UPDATE trivia_games SET correct_answer=?, time_stamp=? WHERE token=?", (questionJSON["results"][0]["correct_answer"], int(time.time()), token))

        # Create a list joining the incorrect_answers with the correct_answer from the
        # OpenTDB response
        answers = list(questionJSON["results"][0]["incorrect_answers"])
        answers.append(questionJSON["results"][0]["correct_answer"])

        # Shuffle the list in place to prevent predicitability (knowledge of this system
        # would allow for gaming the system, unless we shuffle the questions)
        random.shuffle(answers)

        # Use map to pass each answer through html.unescape, as all text from OpenTDB
        # comes HTML escaped by default (it was this or base64)
        answers = list(map(html.unescape, answers))

        # Build our question dict
        question = {
            "title": html.unescape(questionJSON["results"][0]["question"]),
            "answers": answers
        }

        # Return a JSON representation of our question data
        return json.dumps({ "question": question, "time": TOTAL_TIME })
    else:
        return abort(404)

# Submit Answer
#   - Checks the submission against the game's record
#   - Determines outcome
#   - Updates game's record with new game state (score, lives, question_count)
#   - Returns new game state
@app.route("/submit")
def submit():
    # Grab the token and answer from the URL
    token = request.args.get("token")
    answer = request.args.get("answer")

    # If the token exists, proceed
    if token:
        # Grab the record from our DB that matches this token
        game_rows = DB.query("SELECT * FROM trivia_games WHERE token=?", (token,))

        # If there were results, proceed
        if game_rows:
            # The result of our query is a list by default, we only expect one record
            game_row = game_rows[0]

            # Calculate the remaining time for a valid submission
            time_left = (game_row[6] + TOTAL_TIME) - int(time.time())

            # If the answer is correct and there is time remaining, track a correct answer
            if answer == game_row[1] and time_left > 0:
                # Calculate points for this answer
                points = (time_left / TOTAL_TIME) * MAX_SCORE * game_row[5]

                # Update the game's record with the new game state
                DB.query("UPDATE trivia_games SET score=?, question_count=?, multiplier=? WHERE token=?", (game_row[3] + points, game_row[4] + 1, game_row[5] + 1, token))

                # If the player has reached our question limit, they win
                if game_row[4] + 1 > QUESTION_LIMIT:
                    # Return the result (correct), and a JSON representation of the new game state (with game win flag)
                    return json.dumps({ "correct": True, "answer": game_row[1], "lives": game_row[2], "score": game_row[3] + points, "multiplier": game_row[5] + 1, "question_count": game_row[4] + 1, "game_over": "win" })

                # Return the result (correct), and a JSON representation of the new game state
                return json.dumps({ "correct": True, "answer": game_row[1], "lives": game_row[2], "score": game_row[3] + points, "multiplier": game_row[5] + 1, "question_count": game_row[4] + 1 })

            # If the answer is incorrect, we reach this line, and update the game's record
            # with an incorrect answer
            DB.query("UPDATE trivia_games SET lives=?, question_count=?, multiplier=? WHERE token=?", (game_row[2] - 1, game_row[4] + 1, 1, token))

            # If the player has lost all of their lives, they lose
            if game_row[2] - 1 <= 0:
                # Return the result (incorrect), and a JSON representation of the new game state (with game lose flag)
                return json.dumps({ "correct": False, "answer": game_row[1], "lives": game_row[2] - 1, "score": game_row[3], "multiplier": 1, "question_count": game_row[4] + 1, "game_over": "lose" })

            # Return the result (incorrect), and a JSON representation of the new game state
            return json.dumps({ "correct": False, "answer": game_row[1], "lives": game_row[2] - 1, "score": game_row[3], "multiplier": 1, "question_count": game_row[4] + 1 })
    else:
        # If there is not token, report an unauthorized action
        return abort(401)

# Run the Flask application if this script is executed on its own
if __name__ == "__main__":
    app.run()