import mysql.connector
from datetime import datetime, timedelta

print("🔧 正在为您布置改期测试场地...")

try:
    db = mysql.connector.connect(host="localhost", user="root", password="123456", database="booking_system")
    cursor = db.cursor()

    # 1. 治愈旧订单：把它恢复成 Confirmed，并重新绑定在 slot_id=1 上
    cursor.execute("UPDATE Bookings SET status = 'Confirmed', slot_id = 1 WHERE booking_id = 1")
    cursor.execute("UPDATE Time_Slots SET is_available = FALSE WHERE slot_id = 1")

    # 2. 增加新座位：为专家安排一个 5 天后的新可用时间槽 (slot_id = 2)
    start_time = datetime.now() + timedelta(days=5)
    end_time = start_time + timedelta(hours=1)
    
    # 强行插入2号座位，如果有了就更新它
    cursor.execute("""
        INSERT IGNORE INTO Time_Slots (slot_id, specialist_id, start_time, end_time, is_available) 
        VALUES (2, 1, %s, %s, TRUE)
    """, (start_time, end_time))
    cursor.execute("UPDATE Time_Slots SET is_available = TRUE WHERE slot_id = 2")

    db.commit()
    print("✅ 准备完毕！订单1已满血复活，全新的 2号空闲座位 已就绪！")

except Exception as e:
    print(f"❌ 发生错误: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'db' in locals(): db.close()
    