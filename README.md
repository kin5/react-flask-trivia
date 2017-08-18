# React Python Trivia
A small trivia game made with React, Flask, and SQLite.

Leveraging the amazing [OpenTDB](https://opentdb.com/).

## Prerequisites
+ Node
+ NPM
+ Python 3

## Install
Clone the repo, and navigate to the root directory. Run
```
npm install
```
To grab all of the NPM packages.

Then, build the distribution bundle using Webpack like so
```
npm run build
```

After that, grab the Python dependencies
```
pip install -r requirements.txt
```

## Run
Navigate to the project's root directory and run the server file
```
python server.py
```

Open your web browser and navigate to
```
http://127.0.0.1:5000
```

Enjoy!
