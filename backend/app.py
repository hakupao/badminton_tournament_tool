from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

app = Flask(__name__)
CORS(app)  # 允许跨域请求

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': '羽毛球赛事管理系统 MVP 版本'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=True) 