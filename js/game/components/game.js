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

            time: 0
        };

        this.nextQuestion = this.nextQuestion.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
    }

    componentDidMount() {
        if(!this.props.gameState.token) {
            throw new Error("No game token found");
        }

        this.nextQuestion();
    }

    startTimer() {
        this.timerInterval = window.setInterval(() => {
            console.log("> timerInterval");
            this.setState({ time: this.state.time - 1 });
        }, 1000);

        this.timerTimeout = window.setTimeout(() => {
            console.log("> timerTimeout");
            this.submitAnswer("");
        }, 10100);
    }

    clearTimer() {
        window.clearInterval(this.timerInterval);
        window.clearTimeout(this.timerTimeout);
    }

    checkForGameOver() {
        if(this.props.gameState.lives <= 0) {
            this.props.setGameState({ gameOverMessage: 'You lost' });
            this.clearTimer();
            this.props.transition();
            return true;
        }
        else if(this.props.gameState.questionCount >= 50) {
            this.props.setGameState({ gameOverMessage: 'You win' });
            this.clearTimer();
            this.props.transition();
            return true;
        }

        return false;
    }

    async nextQuestion() {
        if(!this.checkForGameOver()) {
            let questionResp = await fetch("/next?token=" + this.props.gameState.token);
            let questionJSON = await questionResp.json();

            this.cleanAnswers();

            this.setState({ question: questionJSON.question, time: questionJSON.time });

            this.startTimer();
        }
    }

    async submitAnswer(answer) {
        this.clearTimer();

        let answerResp = await fetch("/submit?token=" + this.props.gameState.token + "&answer=" + answer);
        let answerJSON = await answerResp.json();

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

        this.props.setGameState({ lives: answerJSON.lives, score: answerJSON.score, questionCount: answerJSON.question_count });

        window.setTimeout(this.nextQuestion, 2000);
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
                <div className="stats wrap slim">
                    <div className="stat lives">
                        <strong>Lives</strong>
                        <br/>
                        {this.props.gameState.lives}
                    </div>
                    <div className="stat time">
                        <strong>Time</strong>
                        <br/>
                        {this.state.time}
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

                <h3>{this.state.question.title}</h3>

                <div className="answers wrap slim">
                    {this.listAnswers()}
                </div>
            </div>
        );
    }
}