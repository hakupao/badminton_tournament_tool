import json
import random

with open(r'C:\Local\test\badminton_tournament_tool\tournament_data_2025-06-02.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for match in data['matches']:
    if match.get('status') == 'finished':
        continue
    winner = random.choice(['A', 'B'])
    loser_score = random.randint(2, 20)
    if winner == 'A':
        match['scores'] = [{
            'set': 1,
            'teamAScore': 21,
            'teamBScore': loser_score
        }]
        match['winner_TeamId'] = match['teamA_Id']
    else:
        match['scores'] = [{
            'set': 1,
            'teamAScore': loser_score,
            'teamBScore': 21
        }]
        match['winner_TeamId'] = match['teamB_Id']
    match['status'] = 'finished'

with open(r'C:\Local\test\badminton_tournament_tool\tournament_data_2025-06-02.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("已为所有未完成比赛生成随机比分！")