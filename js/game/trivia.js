import React from 'react';

import Menu from './components/menu';
import Game from './components/game';
import Done from './components/done';

const states = [
    {
        name: "Menu",
        component: Menu
    },

    {
        name: "Game",
        component: Game
    },

    {
        name: "Game Over",
        component: Done
    }
];

export default class Trivia extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentIndex: 0,
            gameState: {}
        };

        this.transition = this.transition.bind(this);
        this.setGameState = this.setGameState.bind(this);
    }

    transition(index) {
        let nextIndex = this.state.currentIndex + 1;

        if(index && Number(index)) {
            nextIndex = index;
        }

        if(nextIndex >= states.length) {
            nextIndex = 0;
        }

        this.setState({ currentIndex: nextIndex });
    }

    setGameState(state) {
        let newState = Object.assign({}, this.state.gameState);

        newState = Object.assign(newState, state);

        this.setState({ gameState: newState });
    }

    render() {
        const CurrentState = states[this.state.currentIndex].component;

        return (
            <div>
                <h1>Trivia</h1>
                <CurrentState transition={this.transition} gameState={this.state.gameState} setGameState={this.setGameState}/>
            </div>
        );
    }
}