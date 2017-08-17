import React from 'react';

export default class Game extends React.Component {
    constructor(props) {
        super(props);

        this.timerInterval = null;
        this.timerTimeout = null;

        this.state = {
            question: {
                title: "",
                answers: []
            },

            time: 0,

            locked: true
        };

        this.nextQuestion = this.nextQuestion.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
    }

    componentDidMount() {
        if(!this.props.gameState.token) {
            alert("No game token was found, please make sure you followed proper procedure for starting a game");
            throw new Error("No game token found");
        }

        this.nextQuestion();
    }

    startTimer() {
        this.clearTimer();
        
        this.timerInterval = window.setInterval(() => {
            this.setState({ time: this.state.time - 1 });
        }, 1000);

        this.timerTimeout = window.setTimeout(() => {
            this.submitAnswer("");
        }, 10100);
    }

    clearTimer() {
        window.clearInterval(this.timerInterval);
        window.clearTimeout(this.timerTimeout);
    }

    setLock(state) {
        this.setState({ locked: state });
    }

    async nextQuestion() {
        if(this.state.locked) {
            this.setLock(false);

            let questionResp = await fetch("/next?token=" + this.props.gameState.token);
            let questionJSON = await questionResp.json();

            if(questionResp.ok) {
                this.cleanAnswers();

                this.setState({ question: questionJSON.question, time: questionJSON.time });

                this.startTimer();
            }
            else {
                alert("An error occurred when requesting a new question, please refer to the server logs");
                throw new Error("Question request error");
            }
        }
    }

    async submitAnswer(answer) {
        if(!this.state.locked) {
            this.setLock(true);
            this.clearTimer();

            let answerResp = await fetch("/submit?token=" + this.props.gameState.token + "&answer=" + answer);
            let answerJSON = await answerResp.json();

            if(answerResp.ok) {
                let answers = document.getElementsByClassName('answer');

                for(let i=0; i<answers.length; i++) {
                    if(answers[i].getAttribute('data-answer') == answerJSON.answer) {
                        answers[i].classList.add('correct');
                    }
                    else if(answers[i].getAttribute('data-answer') == answer) {
                        answers[i].classList.add('incorrect');
                    }
                    else {
                        answers[i].classList.add('invalid');
                    }
                }

                this.props.setGameState({ lives: answerJSON.lives, score: answerJSON.score, multiplier: answerJSON.multiplier, questionCount: answerJSON.question_count });

                if(answerJSON.game_over) {
                    window.setTimeout(() => {
                        this.props.setGameState({ gameOverMessage: answerJSON.game_over == 'win' ? 'You win' : 'You lost' });
                        this.clearTimer();
                        this.props.transition();
                    }, 2000);
                }
                else {
                    window.setTimeout(this.nextQuestion, 2000);
                }
            }
            else {
                alert("An error occurred when submitting your answer, please refer to the server logs");
                throw new Error("Answer submit error");
            }
        }
        else {
            console.log("Submission locked!");
        }
    }

    listAnswers() {
        return this.state.question.answers.map((answer, index) => {
            return (
                <div className='button answer' data-answer={answer} key={index} onClick={() => { this.submitAnswer(answer); }}>
                    <span>{answer}</span>
                </div>
            );
        });
    }

    cleanAnswers() {
        let answers = document.getElementsByClassName('answer');

        for(let i=0; i<answers.length; i++) {
            answers[i].className = 'button answer';
        }
    }

    render() {
        return (
            <div>
                <div className="stats wrap">
                    <div className="stat lives">
                        <strong>Lives</strong>
                        <br/>
                        {this.props.gameState.lives}
                    </div>
                    <div className="stat multiplier">
                        <strong>Multiplier</strong>
                        <br/>
                        {this.props.gameState.multiplier}
                    </div>
                    <div className="stat count">
                        <strong>Question</strong>
                        <br/>
                        {this.props.gameState.questionCount}/50
                    </div>
                    <div className="stat score">
                        <strong>Score</strong>
                        <br/>
                        {this.props.gameState.score}
                    </div>
                </div>

                <div className="stats wrap">
                    <div className="stat time">
                        <strong>Time</strong>
                        <br/>
                        {this.state.time}
                    </div>
                </div>

                <h3>{this.state.question.title}</h3>

                <div className="answers wrap slim">
                    {this.listAnswers()}
                </div>
            </div>
        );
    }
}