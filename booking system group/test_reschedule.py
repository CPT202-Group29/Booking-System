import requests

url = "http://127.0.0.1:5000/api/bookings/1/reschedule"

payload = {
    "user_id": 1,
    "new_slot_id": 2
}

response = requests.post(url, json=payload)

print("Status Code:", response.status_code)
print("Response Text:", response.text)  