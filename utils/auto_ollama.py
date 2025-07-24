import subprocess
import sys
import platform
import os

def install_ollama():
    system = platform.system()
    if system == "Windows":
        # 下载 Ollama 安装程序
        subprocess.run(["powershell", "-Command", "Invoke-WebRequest -Uri https://ollama.com/download/OllamaSetup.exe -OutFile OllamaSetup.exe"])
        # 运行安装程序（静默安装）
        subprocess.run(["OllamaSetup.exe", "/S"])
    elif system == "Darwin" or system == "Linux":
        # 安装 Ollama
        subprocess.run(["curl", "-fsSL", "https://ollama.com/install.sh", "|", "sh"], shell=True)
    else:
        sys.exit(1)

def pull_model(model_name="llama3.1"):
    # 下载模型
    subprocess.run(["ollama", "pull", model_name])

def run_model(model_name="llama3.1"):
    # 运行模型
    subprocess.run(["ollama", "run", "llama3.1", "--stream"], shell=True)


if __name__ == "__main__":
    try:
        subprocess.run(["ollama", "--version"], check=True)
    except subprocess.CalledProcessError:
        install_ollama()

    try:
        subprocess.run(["ollama", "run", "llama3.1"], check=True)
    except subprocess.CalledProcessError:
        pull_model()

    run_model()
