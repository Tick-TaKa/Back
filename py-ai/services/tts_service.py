import requests
import uuid
import os
import sys
import urllib.request

CLOVA_API_URL = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"
CLIENT_ID = os.getenv("CLOVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("CLOVA_CLIENT_SECRET")

# encText = urllib.parse.quote("반갑습니다 네이버")

def text_to_speech(text: str) -> str:
    # headers = {
    #     "x-ncp-apigw-api-key-id": CLIENT_ID,
    #     "x-ncp-apigw-api-key": CLIENT_SECRET,
    #     "Content-Type": 'application/x-www-form-urlencoded'
    # }

    data = "speaker=njiyun&volume=0&speed=0&pitch=0&format=mp3&text=" + text;
    request = urllib.request.Request(CLOVA_API_URL)
    request.add_header("X-NCP-APIGW-API-KEY-ID",CLIENT_ID)
    request.add_header("X-NCP-APIGW-API-KEY",CLIENT_SECRET)
    response = urllib.request.urlopen(request, data=data.encode('utf-8'))
    rescode = response.getcode()
    if(rescode==200):
        print("TTS mp3 저장")
        filename = f"tts_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        response_body = response.read()
        with open(filepath, 'wb') as f:
            f.write(response_body)
        return f"http://127.0.0.1:8000/static/{filename}"
    else:
        print("Error Code:" + rescode)
        return ""
    # response = requests.post(CLOVA_API_URL, headers=headers, data=data)
    # if response.status_code == 200:
    #     filename = f"tts_{uuid.uuid4()}.mp3"
    #     filepath = os.path.join("static", filename)
    #     with open(filepath, "wb") as f:
    #         f.write(response.content)
    #     return f"http://127.0.0.1:8000/static/{filename}"
    # else:
    #     print("TTS Error:", response.text)
    #     return ""
