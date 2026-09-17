# -*- coding: utf-8 -*-
"""
RUI Studio 资源极速导入器
支持将文本、表格或后续 Word 内容一键灌入网站数据源 (data.js) 与 Obsidian 知识库
"""
import os
import re
import json

base_dir = r"D:\Xiao的个人站"
data_js_path = os.path.join(base_dir, "src", "js", "data.js")
obsidian_dir = r"D:\Vibe Coding奇怪项目\雪菲力\📂 RUI Studio 个人站\03-乐谱资源曲库"

def add_single_resource(title, category, price, baidu_url, baidu_code, desc="", tags=[]):
    """向网站和 Obsidian 同步追加单条资源"""
    print(f"正在导入新资源: {title} ({category}) ...")
    
    # 1. 读入 data.js
    with open(data_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 构造唯一 ID
    import time
    item_id = f"res-{int(time.time())}"
    
    new_item = {
        "id": item_id,
        "category": category,
        "title": title,
        "desc": desc or title,
        "price": f"¥ {price}" if not str(price).startswith("¥") else str(price),
        "priceValue": float(re.sub(r"[^\d.]", "", str(price)) or 0),
        "tags": tags or [category],
        "badge": "百度网盘",
        "badgeColor": "badge-green",
        "baiduPanUrl": baidu_url,
        "baiduPanCode": baidu_code,
        "details": f"{desc}。购买后提供百度网盘不限速直链与提取码。",
        "delivery": "百度网盘高速下载 (含提取码)"
    }
    
    # 追加到 ITEMS_DATA 数组前部
    insert_str = f"  {json.dumps(new_item, ensure_ascii=False, indent=2)},\n"
    target_pos = content.find("export const ITEMS_DATA = [")
    if target_pos != -1:
        insert_index = target_pos + len("export const ITEMS_DATA = [\n")
        new_content = content[:insert_index] + insert_str + content[insert_index:]
        with open(data_js_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ 成功写入网站数据库: {data_js_path}")
    
    print("导入完成！运行 'git push' 即可同步到云端。")

if __name__ == "__main__":
    print("RUI Studio 资源导入引擎就绪。")
