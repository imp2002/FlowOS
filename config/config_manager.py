import logging
import os
import yaml
from typing import Dict, Any, Optional
from utils.decorators import singleton
from dotenv import load_dotenv


# 指定配置文件路径
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

@singleton
class ConfigManager:
    def __init__(self):
        self.model_config: Dict[str, Any] = {}
        self.assistant_config: Dict[str, Any] = {}
        self.rag_config: Dict[str, Any] = {}
        self.app_config: Dict[str, Any] = {}
        load_dotenv()
        self._load_configs()
    
    def _load_configs(self) -> None:
        """Load configurations from YAML files."""
        config_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load model config
        model_path = os.path.join(config_dir, 'model.yaml')
        with open(model_path, 'r', encoding='utf-8') as f:
            # 使用 os.path.expandvars 展开环境变量，注入 api_key
            content = f.read()
            content = os.path.expandvars(content)
            self.model_config = yaml.safe_load(content)
            
        # Load assistant config
        assistant_path = os.path.join(config_dir, 'assistant.yaml')
        with open(assistant_path, 'r', encoding='utf-8') as f:
            self.assistant_config = yaml.safe_load(f)
            
        # Load RAG config
        rag_path = os.path.join(config_dir, 'rag.yaml')
        with open(rag_path, 'r', encoding='utf-8') as f:
            content = f.read()
            content = os.path.expandvars(content)
            self.rag_config = yaml.safe_load(content)
            
        # Load app config
        app_path = os.path.join(config_dir, 'app.yaml')
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
            content = os.path.expandvars(content)
            self.app_config = yaml.safe_load(content)
    
    def get_model_config(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific model."""
        return self.model_config.get(model_name)
    
    def get_assistant_config(self, assistant_type: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific assistant type."""
        return self.assistant_config.get(assistant_type)
    
    def get_rag_config(self) -> Dict[str, Any]:
        """Get RAG configuration."""
        return self.rag_config

    def get_online_api_key(self,model):
        """ 解析配置文件 """
        config = {}
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line:
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip().strip('"')  # 去除引号
        except FileNotFoundError:
            # TODO
            # 文件不存在时返回空配置
            logging.warning(f"Config file {CONFIG_PATH} not found.")
            pass

        if model == "DeepSeek":
            return config.get("DEEPSEEK_API_KEY", "")
        elif model == "阿里云百炼":
            return config.get("ALIYUN_API_KEY", "")
        return ""

    def set_online_api_key(self, online_api_key, model):
        try:
            # 确定键名
            key_name = "DEEPSEEK_API_KEY" if model == "DeepSeek" else "ALIYUN_API_KEY"

            # 读取现有配置
            config_lines = []
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    config_lines = f.readlines()
            except FileNotFoundError:
                pass  # 文件不存在时创建新文件

            # 查找并更新键值
            found = False
            for i in range(len(config_lines)):
                line = config_lines[i].strip()
                if line.startswith(key_name):
                    # 保留原有引号格式
                    if '"' in line:
                        config_lines[i] = f'{key_name}="{online_api_key}"\n'
                    else:
                        config_lines[i] = f"{key_name}={online_api_key}\n"
                    found = True
                    break

            # 未找到则追加新条目
            if not found:
                config_lines.append(f'{key_name}="{online_api_key}"\n')

            # 写入文件
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                f.writelines(config_lines)

            return True
        except Exception as e:
            print(f"Failed to set online_api_key: {e}")
            return False


if __name__ == "__main__":
    config_manager = ConfigManager()
    # test get config
    # print(config_manager.model_config)
    print(config_manager.get_model_config('DeepSeek-V3')['api_key'])
    deepseekConfig = config_manager.get_model_config('DeepSeek-V3')
    print(deepseekConfig['api_key'])

    # test update config
    deepseekConfig['api_key'] = 'test'
    print(config_manager.get_model_config('DeepSeek-V3')['api_key'])
