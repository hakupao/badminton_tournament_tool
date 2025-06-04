import json
import random
import sys
from pathlib import Path


def main(file_path: str) -> None:
    data_path = Path(file_path)
    if not data_path.is_file():
        raise FileNotFoundError(f"数据文件不存在: {data_path}")

    with data_path.open('r', encoding='utf-8') as f:
        data = json.load(f)

    for match in data.get('matches', []):
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

    with data_path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("已为所有未完成比赛生成随机比分！")


if __name__ == "__main__":
    default_file = 'badminton_data_2025-06-03.json'
    path = sys.argv[1] if len(sys.argv) > 1 else default_file
    main(path)
