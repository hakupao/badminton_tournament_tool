from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db
from scheduler import ScheduleGenerator
from config import Config
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 工具函数
def serialize_datetime(obj):
    """序列化datetime对象"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def serialize_dict(data):
    """递归序列化字典中的datetime对象"""
    if isinstance(data, dict):
        return {k: serialize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_dict(item) for item in data]
    else:
        return serialize_datetime(data)

# API路由

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': '羽毛球赛事管理系统 MVP 版本'})

# 队伍管理
@app.route('/api/teams', methods=['GET'])
def get_teams():
    """获取所有队伍"""
    teams = db.get_all_teams()
    return jsonify(serialize_dict(teams))

@app.route('/api/teams', methods=['POST'])
def create_team():
    """创建队伍"""
    data = request.json
    if not data.get('name'):
        return jsonify({'error': '队伍名称不能为空'}), 400
    
    team = db.create_team(data['name'])
    return jsonify(serialize_dict(team)), 201

@app.route('/api/teams/<team_id>', methods=['GET'])
def get_team(team_id):
    """获取队伍详情"""
    team = db.get_team(team_id)
    if not team:
        return jsonify({'error': '队伍不存在'}), 404
    return jsonify(serialize_dict(team))

@app.route('/api/teams/<team_id>', methods=['DELETE'])
def delete_team(team_id):
    """删除队伍"""
    if db.delete_team(team_id):
        return jsonify({'message': '删除成功'}), 200
    return jsonify({'error': '队伍不存在'}), 404

# 队员管理
@app.route('/api/teams/<team_id>/players', methods=['GET'])
def get_team_players(team_id):
    """获取队伍的所有队员"""
    players = db.get_team_players(team_id)
    return jsonify(serialize_dict(players))

@app.route('/api/players', methods=['POST'])
def create_player():
    """添加队员"""
    data = request.json
    required_fields = ['teamId', 'name', 'gender', 'skillLevel']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'缺少必填字段: {field}'}), 400
    
    # 验证性别
    if data['gender'] not in ['M', 'F']:
        return jsonify({'error': '性别必须是 M 或 F'}), 400
    
    # 验证技术水平
    try:
        skill_level = int(data['skillLevel'])
        if skill_level < 1:
            return jsonify({'error': '技术水平必须大于0'}), 400
    except ValueError:
        return jsonify({'error': '技术水平必须是数字'}), 400
    
    player = db.create_player(
        data['teamId'],
        data['name'],
        data['gender'],
        skill_level
    )
    return jsonify(serialize_dict(player)), 201

@app.route('/api/players/<player_id>', methods=['GET'])
def get_player(player_id):
    """获取队员详情"""
    player = db.get_player(player_id)
    if not player:
        return jsonify({'error': '队员不存在'}), 404
    return jsonify(serialize_dict(player))

@app.route('/api/players/<player_id>', methods=['PUT'])
def update_player(player_id):
    """更新队员信息"""
    data = request.json
    if db.update_player(player_id, data):
        return jsonify({'message': '更新成功'}), 200
    return jsonify({'error': '队员不存在'}), 404

@app.route('/api/players/<player_id>', methods=['DELETE'])
def delete_player(player_id):
    """删除队员"""
    if db.delete_player(player_id):
        return jsonify({'message': '删除成功'}), 200
    return jsonify({'error': '队员不存在'}), 404

# 阵容管理
@app.route('/api/teams/<team_id>/formations', methods=['GET'])
def get_team_formations(team_id):
    """获取队伍的所有阵容"""
    formations = db.get_team_formations(team_id)
    return jsonify(serialize_dict(formations))

@app.route('/api/teams/<team_id>/formations', methods=['POST'])
def create_formation(team_id):
    """配置阵容"""
    data = request.json
    
    if 'type' not in data or 'playerIds' not in data:
        return jsonify({'error': '缺少必填字段: type 或 playerIds'}), 400
    
    # 验证阵容类型
    if data['type'] not in ['MD1', 'MD2', 'XD1']:
        return jsonify({'error': '阵容类型必须是 MD1, MD2 或 XD1'}), 400
    
    # 验证队员数量
    if len(data['playerIds']) != 2:
        return jsonify({'error': '双打必须有2名队员'}), 400
    
    # 验证队员是否属于该队伍
    players = [db.get_player(pid) for pid in data['playerIds']]
    if any(p is None or p['teamId'] != team_id for p in players):
        return jsonify({'error': '队员不存在或不属于该队伍'}), 400
    
    # 验证性别匹配
    if data['type'] in ['MD1', 'MD2']:  # 男双
        if any(p['gender'] != 'M' for p in players):
            return jsonify({'error': '男双必须都是男性队员'}), 400
    elif data['type'] == 'XD1':  # 混双
        genders = [p['gender'] for p in players]
        if sorted(genders) != ['F', 'M']:
            return jsonify({'error': '混双必须是一男一女'}), 400
    
    formation = db.create_formation(team_id, data['type'], data['playerIds'])
    return jsonify(serialize_dict(formation)), 201

# 赛程管理
@app.route('/api/schedules/generate', methods=['POST'])
def generate_schedule():
    """生成赛程 - 核心功能"""
    data = request.json
    
    # 获取参数
    courts_count = data.get('courtsCount', 4)
    
    # 获取所有队伍
    teams = db.get_all_teams()
    if len(teams) < 2:
        return jsonify({'error': '至少需要2支队伍才能生成赛程'}), 400
    
    # 获取所有阵容
    formations = {}
    for team in teams:
        team_formations = db.get_team_formations(team['id'])
        formations[team['id']] = team_formations
        
        # 检查每个队伍是否都配置了完整阵容
        configured_types = {f['type'] for f in team_formations}
        required_types = {'MD1', 'MD2', 'XD1'}
        if configured_types != required_types:
            missing = required_types - configured_types
            return jsonify({
                'error': f'队伍 {team["name"]} 缺少阵容配置: {", ".join(missing)}'
            }), 400
    
    # 生成赛程
    generator = ScheduleGenerator(courts_count)
    matches, total_rounds, total_time_slots = generator.generate_round_robin_schedule(teams, formations)
    
    # 验证赛程
    errors = generator.validate_schedule(matches)
    if errors:
        return jsonify({'error': '赛程生成失败', 'details': errors}), 500
    
    # 保存比赛到数据库
    match_ids = []
    for match in matches:
        saved_match = db.create_match(match)
        match_ids.append(saved_match['id'])
    
    # 保存赛程
    schedule = db.save_schedule(match_ids, total_rounds, total_time_slots, courts_count)
    
    return jsonify({
        'message': '赛程生成成功',
        'schedule': serialize_dict(schedule),
        'matchesCount': len(matches),
        'totalTimeSlots': total_time_slots,
        'totalRounds': total_rounds
    }), 201

@app.route('/api/schedules/current', methods=['GET'])
def get_current_schedule():
    """获取当前赛程"""
    schedule = db.get_current_schedule()
    if not schedule:
        return jsonify({'error': '尚未生成赛程'}), 404
    return jsonify(serialize_dict(schedule))

@app.route('/api/matches', methods=['GET'])
def get_matches():
    """获取所有比赛"""
    matches = db.get_all_matches()
    
    # 添加队伍名称等信息
    for match in matches:
        team_a = db.get_team(match['teamA_Id'])
        team_b = db.get_team(match['teamB_Id'])
        match['teamA_Name'] = team_a['name'] if team_a else 'Unknown'
        match['teamB_Name'] = team_b['name'] if team_b else 'Unknown'
    
    return jsonify(serialize_dict(matches))

@app.route('/api/matches/<match_id>', methods=['GET'])
def get_match(match_id):
    """获取比赛详情"""
    matches = db.get_all_matches()
    match = next((m for m in matches if m.get('id') == match_id), None)
    
    if not match:
        return jsonify({'error': '比赛不存在'}), 404
    
    # 添加详细信息
    team_a = db.get_team(match['teamA_Id'])
    team_b = db.get_team(match['teamB_Id'])
    match['teamA_Name'] = team_a['name'] if team_a else 'Unknown'
    match['teamB_Name'] = team_b['name'] if team_b else 'Unknown'
    
    # 添加队员名称
    match['teamA_PlayerNames'] = []
    match['teamB_PlayerNames'] = []
    
    for player_id in match['teamA_Players']:
        player = db.get_player(player_id)
        if player:
            match['teamA_PlayerNames'].append(player['name'])
    
    for player_id in match['teamB_Players']:
        player = db.get_player(player_id)
        if player:
            match['teamB_PlayerNames'].append(player['name'])
    
    return jsonify(serialize_dict(match))

@app.route('/api/matches/<match_id>/scores', methods=['PUT'])
def update_match_scores(match_id):
    """更新比赛比分"""
    data = request.json
    
    if 'scores' not in data:
        return jsonify({'error': '缺少比分数据'}), 400
    
    # 计算获胜方
    winner_team_id = None
    if data['scores']:
        team_a_wins = sum(1 for s in data['scores'] if s.get('teamAScore', 0) > s.get('teamBScore', 0))
        team_b_wins = sum(1 for s in data['scores'] if s.get('teamBScore', 0) > s.get('teamAScore', 0))
        
        matches = db.get_all_matches()
        match = next((m for m in matches if m.get('id') == match_id), None)
        
        if match:
            if team_a_wins > team_b_wins:
                winner_team_id = match['teamA_Id']
            elif team_b_wins > team_a_wins:
                winner_team_id = match['teamB_Id']
    
    if db.update_match_score(match_id, data['scores'], winner_team_id):
        return jsonify({'message': '比分更新成功'}), 200
    return jsonify({'error': '比赛不存在'}), 404

# 数据管理
@app.route('/api/data/clear', methods=['DELETE'])
def clear_all_data():
    """清空所有数据 - 仅用于测试"""
    db.clear_all_data()
    return jsonify({'message': '所有数据已清空'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=True) 