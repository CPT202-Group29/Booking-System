from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime, timedelta

# ⚠️ 我们的全局密钥，记得保管好，实际部署时可以放到环境变量里
SECRET_KEY = "booking_system_super_secret_key" 

# ==========================================
# 1. 基础门卫：校验 Token 是否有效
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 规范：前端必须在请求头加上 Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({"error": "未提供 Token，请先登录！(Token is missing)"}), 401

        try:
            # 解码 Token，自动校验是否伪造以及是否过期
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # 把解析出来的用户信息打包，传给具体的 API 接口
            current_user = {
                "user_id": data.get("user_id"),
                "role": data.get("role")
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "登录已过期，请重新登录 (Token expired)"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "无效的身份凭证 (Invalid token)"}), 401

        # 将 current_user 作为第一个参数传给被装饰的函数
        return f(current_user, *args, **kwargs)
    
    return decorated

# ==========================================
# 2. 高级门卫：RBAC 角色权限校验
# ==========================================
def role_required(allowed_roles):
    """
    使用前提：必须放在 @token_required 下面
    allowed_roles: 一个列表，比如 ['Admin', 'Specialist']
    """
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user['role'] not in allowed_roles:
                return jsonify({
                    "error": f"权限不足！你的角色是 {current_user['role']}，该接口仅限 {allowed_roles} 访问"
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator