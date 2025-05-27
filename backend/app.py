from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from data_management import (
    get_consecutive_matches,
    get_inactive_players,
    get_group_rankings,
    get_player_win_rates,
    get_pair_win_rates
)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 模拟数据存储
matches = []
time_slots = []

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': '羽毛球赛事管理系统 MVP 版本'})

# 数据管理相关路由
@app.route('/api/data/consecutive-matches', methods=['GET'])
def consecutive_matches():
    """获取在连续两个时间段都比赛的选手"""
    return jsonify(get_consecutive_matches(matches))

@app.route('/api/data/inactive-players', methods=['GET'])
def inactive_players():
    """获取在连续三个时间段都没有参加比赛的选手"""
    return jsonify(get_inactive_players(matches, time_slots))

@app.route('/api/data/group-rankings', methods=['GET'])
def group_rankings():
    """获取循环赛中每个团体的实时排名"""
    return jsonify(get_group_rankings(matches))

@app.route('/api/data/player-win-rates', methods=['GET'])
def player_win_rates():
    """获取每个参加比赛的选手的胜率"""
    return jsonify(get_player_win_rates(matches))

@app.route('/api/data/pair-win-rates', methods=['GET'])
def pair_win_rates():
    """获取每个组合的胜率"""
    return jsonify(get_pair_win_rates(matches))

# 更新比赛数据
@app.route('/api/matches', methods=['POST'])
def update_matches():
    """更新比赛数据"""
    global matches, time_slots
    data = request.get_json()
    matches = data.get('matches', [])
    time_slots = data.get('timeSlots', [])
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=True) 