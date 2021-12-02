import requests
from datetime import date, timedelta

def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)

start_date = date(2022, 1, 1)
end_date = date(2023, 1, 1)
url  = r"https://www.dailycalendartamil.com/wp-content/dctimages/daily/2022/{day:02}-{month:02}-2022.jpeg"
for single_date in daterange(start_date, end_date):
    dday = int(single_date.strftime("%Y-%m-%d").split('-')[2])
    mmonth = int(single_date.strftime("%Y-%m-%d").split('-')[1])
    print(url.format(day = dday, month = mmonth))
    response = requests.get(url.format(day = dday, month = mmonth))
    f_name = single_date.strftime("%Y-%m-%d")+".jpeg"
    if response.status_code == 200:
        with open(f_name, 'wb') as f:
            f.write(response.content)



# url = r"https://www.dailycalendartamil.com/wp-content/dctimages/monthly/2022/{month:02}-2022.jpeg"
# url  = r"https://www.dailycalendartamil.com/wp-content/dctimages/daily/2022/{day:02}-{month:02}-2022.jpeg"
# for i in range(12):
#     print(url.format(month = i+1))
#     response = requests.get(url.format(month = i+1))
#     f_name = 'm_'+str(i+1)+".jpeg"
#     if response.status_code == 200:
#         with open(f_name, 'wb') as f:
#             f.write(response.content)
