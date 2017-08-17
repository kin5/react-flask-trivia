import React from 'react';

export default class Done extends React.Component {
    render() {
        return (
            <div>
                <h1>Game Over</h1>

                <h2>{this.props.gameState.gameOverMessage}</h2>

                <h3>Final score:</h3>
                
                <div className='stats wrap slim'>
                    <div className='stat'>Score: {this.props.gameState.score}</div>
                    <div className='stat'>Questions: {this.props.gameState.questionCount}/50</div>
                </div>

                <div className='button' onClick={this.props.transition}>Play again</div>
            </div>
        );
    }
}