import React from 'react';
import ReactDOM from 'react-dom';

import Trivia from './game/trivia';

class App extends React.Component {
    render() {
        return (
            <div id="app">
                <Trivia/>
            </div>
        );
    }
}

ReactDOM.render(<App/>, document.getElementById("main"));