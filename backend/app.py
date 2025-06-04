from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = Config.DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

db = SQLAlchemy(app)

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)

class Match(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    data = db.Column(db.JSON, nullable=False)

@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Return health status."""
    return jsonify({'status': 'ok', 'message': '羽毛球赛事管理系统 增强版'})

@app.route('/api/players', methods=['GET', 'POST'])
def players():
    if request.method == 'POST':
        info = request.json
        player = Player(code=info['code'], name=info['name'])
        db.session.add(player)
        db.session.commit()
        return jsonify({'status': 'ok', 'id': player.id})
    else:
        all_players = Player.query.all()
        result = [{'id': p.id, 'code': p.code, 'name': p.name} for p in all_players]
        return jsonify(result)

@app.route('/api/matches', methods=['GET', 'POST'])
def matches():
    if request.method == 'POST':
        data = request.json
        match = Match(id=data['id'], data=data)
        db.session.add(match)
        db.session.commit()
        return jsonify({'status': 'ok'})
    else:
        all_matches = Match.query.all()
        result = [m.data for m in all_matches]
        return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=True)
