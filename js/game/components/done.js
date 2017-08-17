import React from 'react';

export default class Done extends React.Component {
    render() {
        return (
            <div>
                <h2>Game Over</h2>

                <h3>{this.props.gameState.gameOverMessage}</h3>

                <h4>Final score</h4>
                
                <div className='stats wrap slim'>
                    <div className='stat'>Score: {this.props.gameState.score}</div>
                    <div className='stat'>Questions: {this.props.gameState.questionCount}/50</div>
                </div>

                <div className='button' onClick={this.props.transition}>Play again</div>
            </div>
        );
    }
}