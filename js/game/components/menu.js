import React from 'react';

export default class Menu extends React.Component {
    async requestNewGame() {
        let tokenResponse = await fetch('/new-game');

        let tokenJSON = await tokenResponse.json();

        if(tokenResponse.ok) {
            let token = tokenJSON.token;
            let lives = tokenJSON.lives;
            let score = tokenJSON.score;
            let multiplier = tokenJSON.multiplier;
            let questionCount = tokenJSON.question_count;

            this.props.setGameState({ token: token, lives: lives, score: score, multiplier: multiplier, questionCount: questionCount });

            this.props.transition();
        }
        else {
            alert("An error occurred when requesting the token, please refer to the server logs");
            throw new Error("Token request error");
        }
    }

    render() {
        return (
            <div>
                <h2>Menu</h2>
                <div className='button' onClick={this.requestNewGame.bind(this)}>New game</div>
            </div>
        );
    }
}