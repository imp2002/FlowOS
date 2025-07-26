import pathlib
import shutil
from pathlib import Path

# --- 1. 设置路径 ---
# 请将这里的路径替换成你自己的实际路径

db_path = Path("chroma/chroma_db")


# 目标目录：需要判断是否为空的目录
target_dir = pathlib.Path("./chroma")

# 源文件夹：如果目标目录非空，需要被移动的文件夹
source_folder = pathlib.Path("./.db")

# --- 2. 核心逻辑 ---
try:
    print(f"正在检查目标目录 '{target_dir}'...")

    if not target_dir.exists():
        # 步骤 2: 如果不存在，则创建它
        print(f"目标目录 '{target_dir}' 不存在，正在创建...")
        target_dir.mkdir(parents=True, exist_ok=True)

    # 确保目标目录和源文件夹都存在，并且是目录
    if not target_dir.is_dir():
        print(f"错误：目标目录 '{target_dir}' 不存在或不是一个目录。")
    elif not source_folder.is_dir():
        print(f"错误：源文件夹 '{source_folder}' 不存在或不是一个目录。")
    else:
        shutil.copytree(str(source_folder), str(target_dir), dirs_exist_ok=True)


except FileNotFoundError:
    print("错误：指定的路径之一不存在。")
except Exception as e:
    print(f"发生了一个未知错误: {e}")

