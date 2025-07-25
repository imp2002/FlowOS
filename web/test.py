import requests
import json

# 接口地址
url = "https://advx.up.railway.app/chat-assistant"

# 请求数据
payload = {
    "session_id": "test",
    "messages": ["给我找一些后端工程师"]
}

# 请求头
headers = {
    "Content-Type": "application/json"
}

# 发起 POST 请求
response = requests.post(url, headers=headers, data=json.dumps(payload))

# 打印响应内容
print("状态码:", response.status_code)
print("返回数据:")
print(response.text)
