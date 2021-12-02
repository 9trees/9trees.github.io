from bs4 import BeautifulSoup
i = 0
month = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
mon = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
with open('spcal2022.htm', 'r') as f:
    contents = f.read()
    soup = BeautifulSoup(contents, 'lxml')
    trs = soup.find_all('tr')
    for td in trs[1].find_all('td'):
        i += 1
        # print(td.c)
        m_name = "m_{mon:1}.jpeg"
        n_tag = soup.new_tag("a", href=m_name.format(mon = i))
        n_tag.string = mon[i-1]
        td.string.replace_with(n_tag)
        # print(td)
    for a in range(31):
        n_mon = 0
        if (a + 1 == 29):
            month.remove(2)
        elif (a + 1 > 30):
            month.remove(4)
            month.remove(6)
            month.remove(9)
            month.remove(11)
        for td in trs[a+2]:
            if td.string == str(a+1):
                # print(td)
                dc_f_name = "2022-{monnum:02}-{nday:02}.jpeg"
                # print(dc_f_name.format(monnum = n_mon, nday = a+1))
                n_tag = soup.new_tag("a", href=dc_f_name.format(monnum = month[n_mon], nday = a+1))
                n_tag.string = str(a+1)
                td.string.replace_with(n_tag)
                # print(td)
                n_mon += 1


print(soup.prettify())
    # for tr in soup.find_all('tr'):
    #     i += 1
    #     print("Tr number: {}".format(i))
    #     for td in tr.find_all('td'):
    #         # if td.text == '28':
    #             print(td.text)
